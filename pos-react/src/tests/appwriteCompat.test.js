import { afterEach, describe, expect, it, vi } from "vitest";

let jwtCalls = 0;
vi.mock("appwrite", () => ({
	Client: class {
		setEndpoint() {
			return this;
		}
		setProject() {
			return this;
		}
	},
	ID: { unique: () => "id" },
	Account: class {
		async get() {
			return { $id: "u1", email: "o@x.lk", name: "Owner", prefs: {}, emailVerification: true };
		}
		async createJWT() {
			jwtCalls++;
			return { jwt: "token-" + jwtCalls };
		}
	},
}));
const { getAppwriteCompat } = await import("../services/appwrite/appwriteCompat");

afterEach(() => vi.unstubAllGlobals());

describe("Appwrite compat layer", () => {
	it("reuses one sign-in token for many requests and gets a fresh one if the server refuses it", async () => {
		const seen = [];
		let refuseOnce = false;
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url, init) => {
				seen.push(init.headers.Authorization);
				const body = JSON.parse(init.body);
				if (refuseOnce) {
					refuseOnce = false;
					return { ok: false, status: 401, json: async () => ({ ok: false, error: "Please sign in again." }) };
				}
				return { ok: true, status: 200, json: async () => (body.action === "stamp" ? { ok: true, exists: true, stamp: "w1" } : { ok: true, exists: true, doc: { id: "main", data: { a: 1 } }, stamp: "w1" }) };
			}),
		);
		const fb = getAppwriteCompat();
		const ref = fb.firestore().collection("users/u1/pos").doc("main");
		await ref.get();
		await ref.get();
		expect(await ref.stamp()).toEqual({ exists: true, stamp: "w1" });
		expect(jwtCalls).toBe(1); // one token for three requests
		expect(new Set(seen).size).toBe(1);

		refuseOnce = true;
		const snap = await ref.get(); // refused once -> new token -> works
		expect(snap.stamp).toBe("w1");
		expect(jwtCalls).toBe(2);
		expect(seen.at(-1)).toBe("Bearer token-2");
	});
});
