/**
 * Generic repository over one table: reads return plain objects, writes go through PosStore. Offers
 * all, byId, count, where, first, save, saveMany, remove and observe.
 */
import { Q } from "@nozbe/watermelondb";
import { rawToPlain, sortBySeq } from "../rowMapper";

/**
 * Repository over one WatermelonDB table. Reads return plain legacy-shaped
 * objects (not Model instances) so they can be passed to React, the domain
 * functions and the cloud payload unchanged. Writes go through PosStore so
 * `updatedAt` bookkeeping, ordering and change notification stay in one place.
 */
export class BaseRepository {
	constructor(store, spec) {
		this.store = store;
		this.spec = spec;
	}

	get collection() {
		return this.store.db.get(this.spec.name);
	}

	/** Every row, in legacy order (newest first for unshift-style tables). */
	all() {
		return this.store.all(this.spec);
	}

	byId(id) {
		return this.store.get(this.spec, id);
	}

	async count() {
		return this.collection.query().fetchCount();
	}

	/** Rows matching an indexed equality filter, e.g. `where("code", "BRG-1")`. */
	async where(column, value) {
		const col = this.spec.columns.find((c) => c.key === column)?.column || column;
		const records = await this.collection.query(Q.where(col, value)).fetch();
		return sortBySeq(
			this.spec,
			records.map((r) => ({ seq: Number(r._raw.seq) || 0, plain: rawToPlain(this.spec, r._raw) })),
		);
	}

	async first(column, value) {
		return (await this.where(column, value))[0] || null;
	}

	save(plain, options) {
		return this.store.put(this.spec, plain, options);
	}

	saveMany(list, options) {
		return this.store.write((tx) => list.forEach((item) => tx.put(this.spec, item)), options);
	}

	remove(id) {
		return this.store.remove(this.spec, id);
	}

	/** Live stream of the table (plain rows); returns an unsubscribe function. */
	observe(cb) {
		const cols = [...this.spec.columns.map((c) => c.column), "extra"];
		const sub = this.collection
			.query()
			.observeWithColumns(cols)
			.subscribe((records) =>
				cb(
					sortBySeq(
						this.spec,
						records.map((r) => ({ seq: Number(r._raw.seq) || 0, plain: rawToPlain(this.spec, r._raw) })),
					),
				),
			);
		return () => sub.unsubscribe();
	}
}
