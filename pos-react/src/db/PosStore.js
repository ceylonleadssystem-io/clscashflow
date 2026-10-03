/**
 * Data-access facade over WatermelonDB: reads plain snapshots, observe() streams live changes to React,
 * write() runs atomic multi-table transactions with updatedAt bookkeeping, and replaceAll() applies a cloud snapshot by diffing.
 */
import { Q } from "@nozbe/watermelondb";
import { createLogger } from "../utils/logger";
import { T, TABLE_LIST } from "./tables";
import {
	comparable,
	exactly,
	lineRowId,
	lineToRowPlain,
	plainToRaw,
	rawToPlain,
	rowPlainToLine,
	sortBySeq,
} from "./rowMapper";

/**
 * Data-access facade over WatermelonDB.
 *
 *  - `observe(cb)` pushes an always-up-to-date plain snapshot (the same shape as
 *    the legacy `db` object) whenever any table changes. React binds to it.
 *  - `write(fn)` runs an atomic multi-table transaction (single
 *    `database.write` + `database.batch`), maintaining `updatedAt` metadata for
 *    cloud merges exactly like the legacy `prepareSyncMetadata()`.
 *  - `readSnapshot()` returns a fresh snapshot (used by cloud sync).
 */

const LEGACY_ARRAY_TABLES = TABLE_LIST.filter(
	(t) => t.legacyKey && t !== T.sales && t !== T.categories,
);

const log = createLogger("db");

export const EMPTY_SNAPSHOT = () => {
	const s = {
		categories: [],
		sales: [],
		settings: {},
		settingsUpdatedAt: {},
		meta: {},
	};
	for (const t of LEGACY_ARRAY_TABLES) s[t.legacyKey] = [];
	return s;
};

export const categoryId = (name) => "cat:" + String(name).trim().toLowerCase();

let seqClock = 0;
const nextSeq = () => {
	seqClock = Math.max(seqClock + 1, Date.now() * 1000);
	return seqClock;
};

const nowIso = () => new Date().toISOString();

export class PosStore {
	constructor(database) {
		this.db = database;
		this._writeListeners = new Set();
		/** Incremented on every committed write (cheap change detection). */
		this.version = 0;
	}

	/** Notified after every committed write: cb({ origin }) - used to trigger cloud sync. */
	onWrite(cb) {
		this._writeListeners.add(cb);
		return () => this._writeListeners.delete(cb);
	}

	spec(keyOrSpec) {
		if (typeof keyOrSpec === "object") return keyOrSpec;
		return (
			T[keyOrSpec] ||
			TABLE_LIST.find((t) => t.name === keyOrSpec || t.legacyKey === keyOrSpec)
		);
	}

	collection(spec) {
		return this.db.get(spec.name);
	}

	// ------------------------------------------------------------------ reads
	async _rows(spec) {
		const records = await this.collection(spec).query().fetch();
		return records.map((r) => ({ seq: Number(r._raw.seq) || 0, plain: rawToPlain(spec, r._raw) }));
	}

	async all(keyOrSpec) {
		const spec = this.spec(keyOrSpec);
		if (spec === T.sales) return (await this.readSnapshot()).sales;
		return sortBySeq(spec, await this._rows(spec));
	}

	async get(keyOrSpec, id) {
		const spec = this.spec(keyOrSpec);
		try {
			const rec = await this.collection(spec).find(String(id));
			return rawToPlain(spec, rec._raw);
		} catch {
			return null;
		}
	}

	async _lines(saleId) {
		const records = await this.collection(T.saleLines)
			.query(Q.where("sale_id", saleId))
			.fetch();
		return records
			.map((r) => rawToPlain(T.saleLines, r._raw))
			.sort((a, b) => (a.lineIndex || 0) - (b.lineIndex || 0))
			.map(rowPlainToLine);
	}

	async getSale(id) {
		const header = await this.get(T.sales, id);
		if (!header) return null;
		return { ...header, lines: await this._lines(id) };
	}

	/** Fresh, fully materialised snapshot of every table. */
	async readSnapshot() {
		const snap = EMPTY_SNAPSHOT();
		for (const t of LEGACY_ARRAY_TABLES)
			snap[t.legacyKey] = sortBySeq(t, await this._rows(t));
		const cats = await this._rows(T.categories);
		snap.categories = cats
			.sort((a, b) => a.seq - b.seq)
			.map((r) => r.plain.name);
		const sales = sortBySeq(T.sales, await this._rows(T.sales));
		const lines = await this._rows(T.saleLines);
		snap.sales = attachLines(sales, lines.map((l) => l.plain));
		const settings = await this._rows(T.settings);
		for (const { plain } of settings) {
			snap.settings[plain.id] = plain.value;
			if (plain.updatedAt) snap.settingsUpdatedAt[plain.id] = plain.updatedAt;
		}
		const meta = await this._rows(T.appMeta);
		for (const { plain } of meta) snap.meta[plain.id] = plain.value;
		return snap;
	}

	// ------------------------------------------------------------ observation
	/**
	 * Subscribe to every table. `cb(snapshot)` is invoked (coalesced) whenever
	 * something changes, starting with the initial load.
	 */
	observe(cb) {
		const rows = {};
		let snapshot = EMPTY_SNAPSHOT();
		let scheduled = false;
		let ready = false;
		const dirty = new Set();

		const rebuild = () => {
			scheduled = false;
			const next = { ...snapshot };
			for (const name of dirty) {
				const spec = this.spec(name);
				if (spec === T.saleLines || spec === T.sales) {
					next.sales = attachLines(
						sortBySeq(T.sales, rows[T.sales.name] || []),
						(rows[T.saleLines.name] || []).map((r) => r.plain),
					);
				} else if (spec === T.categories) {
					next.categories = (rows[spec.name] || [])
						.slice()
						.sort((a, b) => a.seq - b.seq)
						.map((r) => r.plain.name);
				} else if (spec === T.settings) {
					const settings = {};
					const times = {};
					for (const { plain } of rows[spec.name] || []) {
						settings[plain.id] = plain.value;
						if (plain.updatedAt) times[plain.id] = plain.updatedAt;
					}
					next.settings = settings;
					next.settingsUpdatedAt = times;
				} else if (spec === T.appMeta) {
					const meta = {};
					for (const { plain } of rows[spec.name] || []) meta[plain.id] = plain.value;
					next.meta = meta;
				} else if (spec.legacyKey) {
					next[spec.legacyKey] = sortBySeq(spec, rows[spec.name] || []);
				}
			}
			dirty.clear();
			snapshot = next;
			cb(snapshot, ready);
		};
		const schedule = () => {
			if (scheduled) return;
			scheduled = true;
			// microtask: runs right after the batch that changed the tables, before the
			// awaiting caller resumes, so `data()` is always fresh after `await write()`.
			queueMicrotask(rebuild);
		};

		const loaded = new Set();
		const subs = TABLE_LIST.map((spec) => {
			const cols = [...spec.columns.map((c) => c.column), "extra"];
			return this.collection(spec)
				.query()
				.observeWithColumns(cols)
				.subscribe((records) => {
					rows[spec.name] = records.map((r) => ({
						seq: Number(r._raw.seq) || 0,
						plain: rawToPlain(spec, r._raw),
					}));
					dirty.add(spec.name);
					if (!ready) {
						loaded.add(spec.name);
						if (loaded.size === TABLE_LIST.length) {
							ready = true;
							schedule();
						}
					} else schedule();
				});
		});
		return () => subs.forEach((s) => s.unsubscribe());
	}

	// ----------------------------------------------------------------- writes
	/**
	 * Run `fn(tx)` as one atomic write. `tx` API:
	 *   put(table, plain)       upsert a row (id required)
	 *   putSale(sale)           upsert a sale header + replace its lines
	 *   remove(table, id)       hard delete
	 *   removeSale(id)          delete sale + lines
	 *   addCategory(name) / removeCategory(name)
	 *   setSetting(key, value) / removeSetting(key)
	 *   setMeta(key, value)
	 * Options: { preserveTimestamps } keeps incoming `updatedAt` values (sync).
	 */
	async write(fn, options = {}) {
		const pending = new Map();
		const store = this;
		const tx = {
			put(table, plain, hint) {
				const spec = store.spec(table);
				if (!plain || plain.id == null) throw new Error("put() needs an id");
				pending.set(spec.name + ":" + plain.id, { spec, id: String(plain.id), op: "put", plain: { ...plain, id: String(plain.id) }, seq: hint?.seq });
			},
			putSale(sale, hint) {
				const id = String(sale.id);
				pending.set("sales:" + id, { spec: T.sales, id, op: "putSale", plain: { ...sale, id }, seq: hint?.seq });
			},
			remove(table, id) {
				const spec = store.spec(table);
				pending.set(spec.name + ":" + id, { spec, id: String(id), op: "remove" });
			},
			removeSale(id) {
				pending.set("sales:" + id, { spec: T.sales, id: String(id), op: "removeSale" });
			},
			addCategory(name) {
				const n = String(name).trim();
				if (n) tx.put(T.categories, { id: categoryId(n), name: n });
			},
			removeCategory(name) {
				tx.remove(T.categories, categoryId(name));
			},
			setSetting(key, value) {
				tx.put(T.settings, { id: key, value });
			},
			removeSetting(key) {
				tx.remove(T.settings, key);
			},
			setMeta(key, value) {
				tx.put(T.appMeta, { id: key, value });
			},
			/** Fresh reads inside a transaction. */
			all: (table) => store.all(table),
			/** Read-your-writes: a row queued earlier in this transaction wins over the stored one. */
			get: (table, id) => {
				const queued = pending.get(store.spec(table).name + ":" + id);
				if (queued?.op === "put") return Promise.resolve({ ...queued.plain });
				if (queued?.op === "remove") return Promise.resolve(null);
				return store.get(table, id);
			},
			getSale: (id) => store.getSale(id),
			snapshot: () => store.readSnapshot(),
		};
		let result;
		try {
			result = await this.db.write(async () => {
				const out = await fn(tx);
				await this._flush(pending, options);
				return out;
			});
		} catch (error) {
			// The transaction is atomic, so nothing was persisted; the caller still receives the error.
			log.error("database write failed", error, { rows: pending.size, origin: options.origin || "local" });
			throw error;
		}
		if (options.origin === "sync" && pending.size) log.info("bulk write committed", { rows: pending.size });
		if (pending.size) this.version++;
		if (pending.size) this._writeListeners.forEach((cb) => cb({ origin: options.origin || "local" }));
		return result;
	}

	async _find(spec, id) {
		try {
			return await this.collection(spec).find(id);
		} catch {
			return null;
		}
	}

	async _flush(pending, { preserveTimestamps = false } = {}) {
		const now = nowIso();
		const prepared = [];
		const prepareUpsert = async (spec, plain, existing, forceSeq) => {
			const raw = plainToRaw(spec, plain);
			if (existing) {
				prepared.push(
					existing.prepareUpdate((r) => {
						for (const [col, value] of Object.entries(raw)) r._setRaw(col, value);
					}),
				);
			} else {
				prepared.push(
					this.collection(spec).prepareCreate((r) => {
						r._raw.id = plain.id;
						for (const [col, value] of Object.entries(raw)) r._setRaw(col, value);
						r._setRaw("seq", forceSeq ?? nextSeq());
						if (forceSeq != null) seqClock = Math.max(seqClock, forceSeq);
					}),
				);
			}
		};
		for (const entry of pending.values()) {
			const { spec, id } = entry;
			if (entry.op === "remove") {
				const rec = await this._find(spec, id);
				if (rec) prepared.push(rec.prepareDestroyPermanently());
			} else if (entry.op === "removeSale") {
				const rec = await this._find(T.sales, id);
				if (rec) prepared.push(rec.prepareDestroyPermanently());
				const lines = await this.collection(T.saleLines).query(Q.where("sale_id", id)).fetch();
				lines.forEach((l) => prepared.push(l.prepareDestroyPermanently()));
			} else if (entry.op === "put") {
				const existing = await this._find(spec, id);
				let plain = entry.plain;
				if (!preserveTimestamps && spec.fields.updatedAt) {
					const prev = existing ? rawToPlain(spec, existing._raw) : null;
					plain = {
						...plain,
						updatedAt:
							prev && comparable(prev) === comparable(plain) ? prev.updatedAt : now,
					};
				}
				await prepareUpsert(spec, plain, existing, entry.seq);
			} else if (entry.op === "putSale") {
				const { lines = [], ...header } = entry.plain;
				const existing = await this._find(T.sales, id);
				let headerPlain = header;
				if (!preserveTimestamps) {
					const prev = existing
						? { ...rawToPlain(T.sales, existing._raw), lines: await this._lines(id) }
						: null;
					headerPlain = {
						...header,
						updatedAt:
							prev && comparable(prev) === comparable({ ...header, lines })
								? prev.updatedAt
								: now,
					};
				}
				await prepareUpsert(T.sales, headerPlain, existing, entry.seq);
				const oldLines = await this.collection(T.saleLines)
					.query(Q.where("sale_id", id))
					.fetch();
				const keep = new Set();
				for (let i = 0; i < lines.length; i++) {
					const rowPlain = lineToRowPlain(id, lines[i], i);
					keep.add(rowPlain.id);
					const current = oldLines.find((r) => r.id === rowPlain.id) || null;
					await prepareUpsert(T.saleLines, rowPlain, current);
				}
				oldLines.filter((r) => !keep.has(r.id)).forEach((r) => prepared.push(r.prepareDestroyPermanently()));
			}
		}
		if (prepared.length) await this.db.batch(...prepared);
	}

	/** Write helpers for single-row convenience. */
	put(table, plain, options) {
		return this.write((tx) => tx.put(table, plain), options);
	}
	remove(table, id) {
		return this.write((tx) => tx.remove(table, id));
	}

	// ---------------------------------------------------------- bulk replace
	/**
	 * Replace the whole dataset with `snapshot` (shape of readSnapshot()).
	 * Only changed rows are written. Local-only settings listed in `keepSettings`
	 * (e.g. ownerAuth) are never deleted.
	 */
	// Used when pulling cloud data: diffing keeps IndexedDB churn (and observer re-renders) small.
	async replaceAll(snapshot, { keepSettings = ["ownerAuth"], preserveTimestamps = true } = {}) {
		const current = await this.readSnapshot();
		return this.write(async (tx) => {
			const now = nowIso();
			for (const spec of LEGACY_ARRAY_TABLES) {
				const incoming = snapshot[spec.legacyKey] || [];
				const existing = new Map((current[spec.legacyKey] || []).map((r) => [String(r.id), r]));
				const incomingIds = new Set();
				incoming.forEach((item, index) => {
					if (!item || item.id == null) return;
					const id = String(item.id);
					incomingIds.add(id);
					const old = existing.get(id);
					if (old && exactly(old) === exactly({ ...item, id })) return;
					tx.put(spec, { ...item, id }, { seq: hintSeq(spec, incoming.length, index) });
				});
				for (const id of existing.keys()) if (!incomingIds.has(id)) tx.remove(spec, id);
			}
			// categories
			const incomingCats = (snapshot.categories || []).map((c) => String(c));
			const incomingCatIds = new Set(incomingCats.map(categoryId));
			incomingCats.forEach((name, index) => {
				if (!(current.categories || []).some((c) => categoryId(c) === categoryId(name)))
					tx.put(T.categories, { id: categoryId(name), name }, { seq: Date.now() * 1000 + index });
			});
			(current.categories || []).forEach((name) => {
				if (!incomingCatIds.has(categoryId(name))) tx.removeCategory(name);
			});
			// sales
			const existingSales = new Map((current.sales || []).map((s) => [String(s.id), s]));
			const salesIn = new Set();
			let salesIndex = 0;
			(snapshot.sales || []).forEach((sale) => {
				if (!sale || sale.id == null) return;
				const id = String(sale.id);
				salesIn.add(id);
				const old = existingSales.get(id);
				if (old && exactly(old) === exactly({ ...sale, id })) return;
				tx.putSale({ ...sale, id }, { seq: hintSeq(T.sales, (snapshot.sales || []).length, salesIndex++) });
			});
			for (const id of existingSales.keys()) if (!salesIn.has(id)) tx.removeSale(id);
			// settings
			const inSettings = snapshot.settings || {};
			const times = snapshot.settingsUpdatedAt || {};
			for (const [key, value] of Object.entries(inSettings)) {
				if (exactly(current.settings[key]) === exactly(value) &&
					(current.settingsUpdatedAt[key] || "") === (times[key] || "")) continue;
				tx.put(T.settings, { id: key, value, updatedAt: times[key] || now });
			}
			for (const key of Object.keys(current.settings))
				if (!(key in inSettings) && !keepSettings.includes(key)) tx.removeSetting(key);
			// meta
			for (const [key, value] of Object.entries(snapshot.meta || {}))
				if (exactly(current.meta[key]) !== exactly(value)) tx.setMeta(key, value);
		}, { preserveTimestamps, origin: "sync" });
	}
}

/** Preserve legacy array order for rows created from an imported payload. */
function hintSeq(spec, length, index) {
	const base = Date.now() * 1000;
	return spec.order === "newest" ? base + (length - index) : base + index;
}

function attachLines(salesPlain, linePlains) {
	const byId = new Map();
	for (const row of linePlains) {
		const list = byId.get(row.saleId) || [];
		list.push(row);
		byId.set(row.saleId, list);
	}
	return salesPlain.map((sale) => ({
		...sale,
		lines: (byId.get(sale.id) || [])
			.sort((a, b) => (a.lineIndex || 0) - (b.lineIndex || 0))
			.map(rowPlainToLine),
	}));
}

export { lineRowId };
