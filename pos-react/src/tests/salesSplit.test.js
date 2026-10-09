/**
 * Sales history split: sales live in monthly cloud documents, the main document keeps the rest. A server stand-in with the
 * same rules as netlify/functions/appwrite-docs (write stamps, row union for months, `sales` dropped from the main document
 * when it is marked salesSplit) lets two devices share one business.
 */
import { describe, expect, it } from "vitest";
import { createDatabase } from "../db/database";
import { PosStore } from "../db/PosStore";
import { T } from "../db/tables";
import { env } from "../config/env";
import { CloudSyncService } from "../services/cloud.service";
import { groupByMonth, hashRows, salesMonth } from "../services/sync/salesSplit";

function serverStandIn() {
	const docs = new Map(); // "path/id" -> data
	const stamps = new Map();
	const calls = { monthGets: 0, monthSets: [], mainGets: 0, stamps: 0 };
	let tick = 0;
	const key = (path, id) => path + "/" + id;
	const docRef = (path, id) => ({
		path,
		id,
		collection: (n) => collectionRef(key(path, id) + "/" + n),
		get: async function () {
			const isMonth = /\/main\/sales$/.test(path);
			if (isMonth) calls.monthGets++;
			else if (path.endsWith("/pos")) calls.mainGets++;
			const k = key(path, id);
			return { id, exists: docs.has(k), stamp: stamps.get(k) || "", data: () => (docs.has(k) ? JSON.parse(JSON.stringify(docs.get(k))) : undefined) };
		},
		stamp: async function () {
			calls.stamps++;
			const k = key(path, id);
			return { exists: docs.has(k), stamp: stamps.get(k) || "" };
		},
		set: async function (data, opt) {
			const k = key(path, id);
			const current = docs.get(k);
			data = JSON.parse(JSON.stringify(data));
			if (/\/main\/sales$/.test(path)) {
				calls.monthSets.push(id);
				if (current?.rows) {
					const rows = new Map(current.rows.map((r) => [r.id, r]));
					data.rows.forEach((r) => rows.set(r.id, r));
					data.rows = [...rows.values()];
				}
			}
			if (path.endsWith("/pos") && data.payload) {
				if (current?.payload) data.payload = { ...current.payload, ...data.payload }; // stand-in for the server's payload merge (other tests cover the real one)
				if (data.payload.salesSplit) delete data.payload.sales;
			}
			this.lastPreviousStamp = stamps.get(k) || "";
			docs.set(k, opt?.merge ? { ...(current || {}), ...data } : data);
			stamps.set(k, "w" + ++tick);
			this.lastStamp = stamps.get(k);
			return this;
		},
	});
	const collectionRef = (path) => ({
		path,
		doc: (id) => docRef(path, id),
		stamps: async () => {
			calls.stamps++;
			const out = {};
			for (const [k, v] of stamps) if (k.startsWith(path + "/") && !k.slice(path.length + 1).includes("/")) out[k.slice(path.length + 1)] = v;
			return out;
		},
	});
	return {
		docs,
		calls,
		firestore: Object.assign(() => ({ collection: (n) => collectionRef(n) }), { FieldValue: { serverTimestamp: () => new Date().toISOString() } }),
	};
}

let n = 0;
const ctxFor = (fb, uid) => ({ user: { uid, email: "o@x.lk", displayName: "Owner" }, userRef: fb.firestore().collection("users").doc(uid), profile: { name: "Owner", posBusinessName: "Cafe", posEnabled: true }, profileKey: "profile-" + uid, workspaceUid: uid, workspaceUser: { uid, email: "o@x.lk", displayName: "Owner" } });
const device = async (fb, uid) => {
	const svc = new CloudSyncService({ clsBackend: fb, onStatus: () => {} });
	const store = new PosStore(createDatabase("split-" + ++n));
	await svc.attach(store, ctxFor(fb, uid), { dbName: "split-" + n });
	return { svc, store };
};
const sale = (id, createdAt) => ({ id, receipt: "R-" + id, createdAt, date: createdAt.slice(0, 10), total: 100, cost: 40, profit: 60, status: "completed", payment: "Cash", lines: [], updatedAt: createdAt });
const addSale = (store, s) => store.write((tx) => tx.put(T.sales, s));
const names = async (store) => (await store.readSnapshot()).sales.map((s) => s.id).sort();
const settle = async (...svcs) => {
	for (const s of svcs) {
		s.markPending();
		await s.syncNow();
	}
};

describe("sales history split", () => {
	it("groups sales by month and fingerprints a month's rows", () => {
		expect(salesMonth({ createdAt: "2026-10-09T08:00:00.000Z" })).toBe("2026-10");
		expect(salesMonth({ date: "2026-01-02" })).toBe("2026-01");
		expect(salesMonth({})).toBe("undated");
		const by = groupByMonth([{ id: "a", createdAt: "2026-10-01" }, { id: "b", createdAt: "2026-10-30" }, { id: "c", createdAt: "2026-11-01" }]);
		expect([...by].map(([m, r]) => m + ":" + r.length)).toEqual(["2026-10:2", "2026-11:1"]);
		expect(hashRows([{ id: "a", x: 1 }, { id: "b" }])).toBe(hashRows([{ id: "b" }, { id: "a", x: 1 }])); // order does not matter
		expect(hashRows([{ id: "a", updatedAt: "t1" }])).not.toBe(hashRows([{ id: "a", updatedAt: "t2" }])); // a newer version counts as a change
		expect(hashRows([{ id: "a", updatedAt: "t1", extra: 1 }])).toBe(hashRows([{ id: "a", updatedAt: "t1" }])); // how a device stores it does not matter
	});

	it("moves the sales of an existing business into month documents and keeps them in the app", async () => {
		const fb = serverStandIn();
		env.salesSplit = false; // the business starts out the old way: every sale inside the main document
		const old = await device(fb, "ua");
		await addSale(old.store, sale("s1", "2026-09-15T10:00:00.000Z"));
		await addSale(old.store, sale("s2", "2026-10-02T10:00:00.000Z"));
		await settle(old.svc);
		expect(fb.docs.get("users/ua/pos/main").payload.sales.map((s) => s.id).sort()).toEqual(["s1", "s2"]);
		old.svc.stop();

		env.salesSplit = true;
		try {
			const dev = await device(fb, "ua");
			expect(await names(dev.store)).toEqual(["s1", "s2"]); // came down with the old document
			await addSale(dev.store, sale("s3", "2026-10-09T10:00:00.000Z"));
			await settle(dev.svc);
			const main = fb.docs.get("users/ua/pos/main").payload;
			expect(main.sales).toBeUndefined(); // gone from the main document
			expect(main.salesSplit).toBe(1);
			expect(fb.docs.get("users/ua/pos/main/sales/2026-09").rows.map((r) => r.id)).toEqual(["s1"]);
			expect(fb.docs.get("users/ua/pos/main/sales/2026-10").rows.map((r) => r.id).sort()).toEqual(["s2", "s3"]);
			expect(await names(dev.store)).toEqual(["s1", "s2", "s3"]); // nothing lost locally
			dev.svc.stop();
		} finally {
			env.salesSplit = false;
		}
	});

	it("shares sales between two devices without losing any, and uploads only the month that changed", async () => {
		const fb = serverStandIn();
		env.salesSplit = true;
		try {
			const a = await device(fb, "ub");
			await addSale(a.store, sale("a1", "2026-09-10T10:00:00.000Z"));
			await addSale(a.store, sale("a2", "2026-10-03T10:00:00.000Z"));
			await settle(a.svc);
			const b = await device(fb, "ub");
			expect(await names(b.store)).toEqual(["a1", "a2"]); // a new device receives the history from the months

			// both devices sell in October at the same time
			await addSale(a.store, sale("a3", "2026-10-09T09:00:00.000Z"));
			await addSale(b.store, sale("b1", "2026-10-09T09:05:00.000Z"));
			fb.calls.monthSets.length = 0;
			await settle(a.svc, b.svc);
			expect([...new Set(fb.calls.monthSets)]).toEqual(["2026-10"]); // September was not uploaded again
			expect(fb.docs.get("users/ub/pos/main/sales/2026-10").rows.map((r) => r.id).sort()).toEqual(["a2", "a3", "b1"]);
			await a.svc.pull();
			await b.svc.pull();
			expect(await names(a.store)).toEqual(["a1", "a2", "a3", "b1"]);
			expect(await names(b.store)).toEqual(["a1", "a2", "a3", "b1"]);
			a.svc.stop();
			b.svc.stop();
		} finally {
			env.salesSplit = false;
		}
	});

	it("polls with stamps only: no document is downloaded while nothing changed", async () => {
		const fb = serverStandIn();
		env.salesSplit = true;
		try {
			const a = await device(fb, "uc");
			await addSale(a.store, sale("c1", "2026-10-01T10:00:00.000Z"));
			await settle(a.svc);
			const before = { month: fb.calls.monthGets, main: fb.calls.mainGets };
			for (let i = 0; i < 4; i++) await a.svc.pull();
			expect(fb.calls.monthGets).toBe(before.month);
			expect(fb.calls.mainGets).toBe(before.main);
			// a sale from another device arrives: only that month is downloaded
			const b = await device(fb, "uc");
			await addSale(b.store, sale("c2", "2026-10-05T10:00:00.000Z"));
			await settle(b.svc);
			const m0 = fb.calls.monthGets;
			await a.svc.pull();
			expect(fb.calls.monthGets - m0).toBe(1);
			expect(await names(a.store)).toEqual(["c1", "c2"]);
			a.svc.stop();
			b.svc.stop();
		} finally {
			env.salesSplit = false;
		}
	});
});
