import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", async (original) => ({ env: { ...(await original()).env, authProvider: "appwrite" } }));

import { restoreAdmin, signInAdmin, signOutAdmin } from "../admin-app/adminSignIn";

const memory = () => {
	const m = new Map();
	return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

describe("administrator sign-in (cloud)", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("keeps the session for the tab and forgets it on sign out", async () => {
		vi.stubGlobal("sessionStorage", memory());
		vi.stubGlobal("fetch", async () => ({ ok: true, status: 200, json: async () => ({ ok: true, token: "t", expiresAt: new Date(Date.now() + 60000).toISOString(), email: "a@ceylonrylabs.io" }) }));
		expect(await signInAdmin("a@ceylonrylabs.io", "x")).toEqual({ email: "a@ceylonrylabs.io", role: "admin" });
		expect(restoreAdmin()).toEqual({ email: "a@ceylonrylabs.io", role: "admin" });
		signOutAdmin();
		expect(restoreAdmin()).toBeNull();
	});

	it("shows the server's reason when sign-in is refused", async () => {
		vi.stubGlobal("sessionStorage", memory());
		vi.stubGlobal("fetch", async () => ({ ok: false, status: 401, json: async () => ({ ok: false, error: "Incorrect email or password." }) }));
		await expect(signInAdmin("a@ceylonrylabs.io", "x")).rejects.toThrow("Incorrect email or password.");
		expect(restoreAdmin()).toBeNull();
	});
});
