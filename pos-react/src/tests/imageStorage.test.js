import { afterEach, describe, expect, it, vi } from "vitest";

const user = { current: { getIdToken: async () => "jwt" } };
vi.mock("../config/env", () => ({ env: { imagesFunctionUrl: "/f" }, isAppwrite: () => true }));
vi.mock("../services/appwrite/appwriteCompat", () => ({ getAppwriteCompat: () => ({ auth: () => ({ get currentUser() { return user.current; } }) }) }));
const { storeImage, isDataImage } = await import("../services/imageStorage");

const PNG = "data:image/png;base64,aGVsbG8=";
const reply = (status, json) => vi.fn(async () => ({ ok: status < 400, status, json: async () => json }));
afterEach(() => {
	vi.unstubAllGlobals();
	user.current = { getIdToken: async () => "jwt" };
});

describe("cloud image storage", () => {
	it("recognises data-URL images only", () => {
		expect(isDataImage(PNG)).toBe(true);
		expect(isDataImage("https://x/y.png")).toBe(false);
		expect(isDataImage("")).toBe(false);
	});

	it("uploads a data-URL with the user's token and returns the file URL", async () => {
		const fetch = reply(200, { ok: true, url: "https://a/storage/buckets/b/files/f1/view?project=p" });
		vi.stubGlobal("fetch", fetch);
		expect(await storeImage(PNG, "logo")).toBe("https://a/storage/buckets/b/files/f1/view?project=p");
		const [url, init] = fetch.mock.calls[0];
		expect(url).toBe("/f");
		expect(init.headers.Authorization).toBe("Bearer jwt");
		expect(JSON.parse(init.body)).toEqual({ action: "upload", kind: "logo", data: PNG });
	});

	it("keeps the image when it is already a link, or the upload cannot happen", async () => {
		const fetch = reply(200, { ok: true, url: "u" });
		vi.stubGlobal("fetch", fetch);
		expect(await storeImage("https://a/storage/buckets/b/files/f1/view", "product")).toBe("https://a/storage/buckets/b/files/f1/view");
		expect(await storeImage("", "product")).toBe("");
		user.current = null; // not signed in to the cloud
		expect(await storeImage(PNG, "product")).toBe(PNG);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("falls back to the data-URL when the server refuses or the network fails", async () => {
		vi.stubGlobal("fetch", reply(500, { ok: false, error: "x" }));
		expect(await storeImage(PNG, "product")).toBe(PNG);
		vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
		expect(await storeImage(PNG, "product")).toBe(PNG);
	});
});
