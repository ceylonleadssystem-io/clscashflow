import { afterEach, describe, expect, it, vi } from "vitest";
import { rememberedUser } from "../services/appwrite/appwriteCompat";

const store = (value) => vi.stubGlobal("localStorage", { getItem: () => value, setItem() {}, removeItem() {} });
afterEach(() => vi.unstubAllGlobals());

describe("offline start: the account last confirmed online", () => {
	const kept = (at) => JSON.stringify({ $id: "u1", email: "a@b.c", name: "A", at });
	it("is used for two weeks after it was last confirmed", () => {
		store(kept(Date.now() - 13 * 86400000));
		expect(rememberedUser()?.$id).toBe("u1");
	});
	it("is dropped after that, or when nothing is stored or the value is damaged", () => {
		store(kept(Date.now() - 15 * 86400000));
		expect(rememberedUser()).toBeNull();
		store(null);
		expect(rememberedUser()).toBeNull();
		store("{not json");
		expect(rememberedUser()).toBeNull();
	});
});
