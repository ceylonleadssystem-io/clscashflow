/**
 * Test for cloud sync: bootstraps a fresh workspace against an in-memory fake backend, pushes local edits and
 * lets a second device pull them.
 */
import { describe, expect, it } from "vitest";
import { createDatabase } from "../db/database";
import { PosStore } from "../db/PosStore";
import { T } from "../db/tables";
import { CloudSyncService } from "../services/cloud.service";

/** In-memory stand-in for the legacy-style Appwrite facade. */
function fakeBackend() {
	const docs = new Map();
	const ref = (path) => ({
		get: async () => ({ exists: docs.has(path), data: () => (docs.has(path) ? JSON.parse(JSON.stringify(docs.get(path))) : undefined) }),
		set: async (data, opt) => {
			docs.set(path, opt?.merge ? { ...(docs.get(path) || {}), ...JSON.parse(JSON.stringify(data)) } : JSON.parse(JSON.stringify(data)));
		},
	});
	const coll = (path) => ({ doc: (id) => ({ ...ref(path + "/" + id), collection: (n) => coll(path + "/" + id + "/" + n) }) });
	return {
		docs,
		firestore: Object.assign(() => ({ collection: (n) => coll(n) }), { FieldValue: { serverTimestamp: () => new Date().toISOString() } }),
	};
}

const user = { uid: "u1", email: "o@x.lk", displayName: "Owner" };
const ctxFor = (fb) => ({ user, userRef: fb.firestore().collection("users").doc("u1"), profile: { name: "Owner", posBusinessName: "Cafe", posEnabled: true }, profileKey: "profile-u1", workspaceUid: "u1", workspaceUser: user });

describe("CloudSyncService", () => {
	it("bootstraps a fresh workspace, pushes edits and lets a second device pull them", async () => {
		const fb = fakeBackend();
		const statuses = [];
		const a = new CloudSyncService({ clsBackend: fb, onStatus: (s) => statuses.push(s.state) });
		const storeA = new PosStore(createDatabase("cloud-a"));
		await a.attach(storeA, ctxFor(fb), { dbName: "cloud-a" });
		const remote1 = fb.docs.get("users/u1/pos/main");
		expect(remote1.ownerUid).toBe("u1");
		expect(remote1.payload.settings.business).toBe("Cafe");
		expect(remote1.payload.users[0].pin).toBe("1234");

		// local edit -> cloud
		a.store.write((tx) => tx.put(T.products, { id: "p9", name: "Latte", price: 500, cost: 200, type: "Product", category: "Coffee" }));
		await new Promise((r) => setTimeout(r, 10));
		a.markPending();
		await a.syncNow();
		expect(fb.docs.get("users/u1/pos/main").payload.products.map((p) => p.name)).toEqual(["Latte"]);
		expect(statuses.at(-1)).toBe("saved");

		// second device starts empty and receives the catalogue
		const b = new CloudSyncService({ clsBackend: fb, onStatus: () => {} });
		const storeB = new PosStore(createDatabase("cloud-b"));
		await b.attach(storeB, ctxFor(fb), { dbName: "cloud-b" });
		expect((await storeB.readSnapshot()).products.map((p) => p.name)).toEqual(["Latte"]);

		// device B edits, device A pulls
		await storeB.write((tx) => tx.put(T.products, { id: "p9", name: "Latte Large", price: 600, cost: 200, type: "Product", category: "Coffee" }));
		await b.syncNow();
		await a.pull();
		expect((await storeA.readSnapshot()).products[0].name).toBe("Latte Large");
		a.stop();
		b.stop();
	});
});

/** Fake backend that behaves like the new server: every save gets a write stamp, and the stamp can be read on its own. */
function stampedBackend() {
	const docs = new Map();
	const stamps = new Map();
	const calls = { get: 0, stamp: 0, set: 0 };
	const ref = (path) => ({
		get: async () => {
			calls.get++;
			return { exists: docs.has(path), stamp: stamps.get(path) || "", data: () => (docs.has(path) ? JSON.parse(JSON.stringify(docs.get(path))) : undefined) };
		},
		stamp: async () => {
			calls.stamp++;
			return { exists: docs.has(path), stamp: stamps.get(path) || "" };
		},
		set: async function (data, opt) {
			calls.set++;
			this.lastPreviousStamp = stamps.get(path) || "";
			docs.set(path, opt?.merge ? { ...(docs.get(path) || {}), ...JSON.parse(JSON.stringify(data)) } : JSON.parse(JSON.stringify(data)));
			stamps.set(path, "w" + (Number((stamps.get(path) || "w0").slice(1)) + 1));
			this.lastStamp = stamps.get(path);
		},
	});
	const coll = (path) => ({ doc: (id) => ({ ...ref(path + "/" + id), collection: (n) => coll(path + "/" + id + "/" + n) }) });
	return {
		docs,
		calls,
		bump: (path) => stamps.set(path, "w" + (Number((stamps.get(path) || "w0").slice(1)) + 1)),
		firestore: Object.assign(() => ({ collection: (n) => coll(n) }), { FieldValue: { serverTimestamp: () => new Date().toISOString() } }),
	};
}

// each test gets its own account so the shared test storage never leaks one test's data into the next
const ctxFor2 = (fb, uid) => ({ user: { ...user, uid }, userRef: fb.firestore().collection("users").doc(uid), profile: { name: "Owner", posBusinessName: "Cafe", posEnabled: true }, profileKey: "profile-" + uid, workspaceUid: uid, workspaceUser: { ...user, uid } });

describe("CloudSyncService: cheap polling", () => {
	it("checks only the write stamp while nothing changed, and downloads when it did", async () => {
		const fb = stampedBackend();
		const a = new CloudSyncService({ clsBackend: fb, onStatus: () => {} });
		await a.attach(new PosStore(createDatabase("cloud-stamp-a")), ctxFor2(fb, "u2"), { dbName: "cloud-stamp-a" });
		await a.syncNow();
		const before = { ...fb.calls };
		for (let i = 0; i < 5; i++) await a.pull();
		expect(fb.calls.get).toBe(before.get); // no document downloads
		expect(fb.calls.stamp).toBe(before.stamp + 5);
		// another device saves: the next pull sees a new stamp and downloads the document
		fb.bump("users/u2/pos/main");
		await a.pull();
		expect(fb.calls.get).toBe(before.get + 1);
		await a.pull();
		expect(fb.calls.get).toBe(before.get + 1); // and it is quiet again
		a.stop();
	});

	it("skips the read-back after a save when nobody else wrote in between, and reads back when someone did", async () => {
		const fb = stampedBackend();
		const a = new CloudSyncService({ clsBackend: fb, onStatus: () => {} });
		const store = new PosStore(createDatabase("cloud-stamp-b"));
		await a.attach(store, ctxFor2(fb, "u3"), { dbName: "cloud-stamp-b" });
		await a.syncNow();
		const edit = (name) => store.write((tx) => tx.put(T.products, { id: "p1", name, price: 100, cost: 50, type: "Product", category: "Tea" }));

		await edit("Tea 1");
		a.markPending();
		const g0 = fb.calls.get;
		await a.syncNow();
		expect(fb.calls.get - g0).toBe(1); // one read before the save, none after
		expect(fb.docs.get("users/u3/pos/main").payload.products[0].name).toBe("Tea 1");

		// another device writes between our read and our save: we must read the result back
		await edit("Tea 2");
		a.markPending();
		const realGet = a.ref.get;
		a.ref.get = async function () {
			const snap = await realGet.call(this);
			fb.bump("users/u3/pos/main"); // someone saved right after our read
			return snap;
		};
		const g1 = fb.calls.get;
		await a.syncNow();
		expect(fb.calls.get - g1).toBeGreaterThanOrEqual(2); // read before + read-back after
		a.stop();
	});
});
