/**
 * Sales history split. The business' cloud document used to carry every sale ever made, so it grew without limit and every
 * device downloaded all of it. With the split on, sales live in one cloud document per month
 * (`users/{uid}/pos/main/sales/2026-10`, the sales of that month) and the main document keeps everything else.
 *
 * SplitRef wraps the main document reference and offers the same get / stamp / set interface as before, so the sync code does
 * not change: get() puts the sales back into the payload (downloading only the months whose write stamp changed), set() writes
 * the changed months first and the main document last (without `sales`, marked `salesSplit`). The server unions the rows of a
 * month, so two devices saving the same month never lose each other's sales.
 */
import { mergeList } from "./merge";

/** Month a sale belongs to: the year-month of its timestamp ("2026-10"), or "undated". */
export const salesMonth = (sale) => {
	const m = String(sale?.createdAt || sale?.date || "").slice(0, 7);
	return /^\d{4}-\d{2}$/.test(m) ? m : "undated";
};

export function groupByMonth(sales) {
	const by = new Map();
	for (const sale of sales || []) {
		const m = salesMonth(sale);
		if (!by.has(m)) by.set(m, []);
		by.get(m).push(sale);
	}
	return by;
}

const djb2 = (text) => {
	let h = 5381;
	for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
	return (h >>> 0).toString(36);
};
/**
 * Fingerprint of a month's rows (which sales, and at which version), so an unchanged month is not uploaded again. It uses the same
 * id + updatedAt that the merge rules go by, so the same sale written by two devices counts as equal however each stores it.
 */
export const hashRows = (rows) =>
	rows.length + ":" + djb2(rows.map((r) => r.id + "@" + (r.updatedAt || r.createdAt || "")).sort().join("|"));
const digest = (stamps) => {
	const keys = Object.keys(stamps).sort();
	return keys.length + ":" + djb2(keys.map((k) => k + "=" + stamps[k]).join(";"));
};
const combine = (mainStamp, monthStamps) => mainStamp + "|" + digest(monthStamps);

export class SplitRef {
	constructor(main, salesCollection) {
		this.main = main;
		this.sales = salesCollection;
		this.path = main.path;
		this.id = main.id;
		this.months = new Map(); // month -> { stamp, rows, hash } as last seen / written by this device
		this.mainStamp = "";
		this.lastCombined = "";
	}

	_monthStamps() {
		return Object.fromEntries([...this.months].map(([m, v]) => [m, v.stamp]));
	}

	/** Downloads the months whose stamp differs from the one this device has. */
	async _refresh(list) {
		const changed = Object.keys(list).filter((m) => this.months.get(m)?.stamp !== list[m]);
		for (let i = 0; i < changed.length; i += 4)
			await Promise.all(
				changed.slice(i, i + 4).map(async (m) => {
					const snap = await this.sales.doc(m).get();
					const rows = snap.exists ? snap.data()?.rows || [] : [];
					this.months.set(m, { stamp: snap.stamp || list[m], rows, hash: hashRows(rows) });
				}),
			);
	}

	/** The main document with the sales of every month put back into its payload. */
	async get() {
		const [snap, list] = await Promise.all([this.main.get(), this.sales.stamps()]);
		await this._refresh(list);
		this.mainStamp = snap.stamp || "";
		this.lastCombined = combine(this.mainStamp, this._monthStamps());
		if (!snap.exists) return snap;
		const data = snap.data();
		const payload = data?.payload ? { ...data.payload } : null;
		if (payload) {
			let sales = payload.sales || []; // a document written before the split still carries its sales
			for (const { rows } of this.months.values()) sales = mergeList(sales, rows);
			payload.sales = sales;
		}
		return { id: snap.id, exists: true, stamp: this.lastCombined, data: () => ({ ...data, payload }) };
	}

	/** One stamp for the main document plus all months: changes when any of them is written. */
	async stamp() {
		const [head, list] = await Promise.all([this.main.stamp(), this.sales.stamps()]);
		return { exists: head.exists, stamp: head.exists ? combine(head.stamp, list) : "" };
	}

	async set(data, opt) {
		const payload = data.payload || {};
		const before = this.lastCombined;
		let foreign = false;
		for (const [month, rows] of groupByMonth(payload.sales)) {
			const known = this.months.get(month);
			const hash = hashRows(rows);
			if (known && known.hash === hash) continue;
			const ref = this.sales.doc(month);
			await ref.set({ ownerUid: data.ownerUid, month, rows, updatedAt: data.updatedAt }, { merge: true });
			// the server replaced the version this device last saw: nobody else wrote this month in between
			const unchanged = (ref.lastPreviousStamp || "") === (known?.stamp || "");
			if (!unchanged) foreign = true;
			this.months.set(month, { stamp: unchanged ? ref.lastStamp : "", rows, hash });
		}
		const mainPayload = { ...payload, salesSplit: 1 };
		delete mainPayload.sales;
		await this.main.set({ ...data, payload: mainPayload }, opt);
		if ((this.main.lastPreviousStamp || "") !== this.mainStamp) foreign = true;
		this.mainStamp = this.main.lastStamp || "";
		this.lastStamp = combine(this.mainStamp, this._monthStamps());
		this.lastPreviousStamp = foreign || !before ? "changed-elsewhere" : before;
		this.lastCombined = this.lastStamp;
		return this;
	}
}
