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
