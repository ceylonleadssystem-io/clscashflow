import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", async (orig) => ({ ...(await orig()), isAppwrite: () => true }));
const uploads = [];
let fail = false;
vi.mock("../services/imageStorage", () => ({
	isDataImage: (v) => /^data:image\//.test(String(v || "")),
	storeImage: async (image, kind) => {
		if (!/^data:image\//.test(image || "") || fail) return image;
		uploads.push(kind);
		return "https://cloud/files/" + uploads.length + "/view";
	},
}));
const { createHarness, productForm } = await import("./harness");

const DATA = (n) => "data:image/jpeg;base64,AAAA" + n;

describe("moving saved images to cloud storage", () => {
	let h;
	beforeEach(async () => {
		uploads.length = 0;
		fail = false;
		h = await createHarness();
	});

	it("saving a product with a new photo stores the cloud link, not the data", async () => {
		const p = await h.svc.catalog.saveProduct(productForm({ image: DATA(1) }));
		expect(p.image).toMatch(/^https:\/\/cloud\//);
		expect(uploads).toEqual(["product"]);
	});

	it("uploads identical images once and moves products, logo and QR", async () => {
		fail = true; // saved before cloud storage existed: the photos stay as data
		const a = await h.svc.catalog.saveProduct(productForm({ name: "A", code: "A1", image: DATA(1) }));
		const b = await h.svc.catalog.saveProduct(productForm({ name: "B", code: "B1", image: DATA(1) }));
		const c = await h.svc.catalog.saveProduct(productForm({ name: "C", code: "C1", image: DATA(2) }));
		await h.svc.settings.patchSettings({ logo: DATA(3), receiptSocialQr: DATA(4) });
		fail = false;
		await h.svc.settings.moveImagesToCloud();
		const d = h.data();
		expect(uploads.sort()).toEqual(["logo", "product", "product", "qr"]); // A and B share one upload
		expect(d.products.find((x) => x.id === a.id).image).toBe(d.products.find((x) => x.id === b.id).image);
		expect(d.products.find((x) => x.id === c.id).image).toMatch(/^https:\/\/cloud\//);
		expect(d.settings.logo).toMatch(/^https:\/\/cloud\//);
		expect(d.settings.receiptSocialQr).toMatch(/^https:\/\/cloud\//);
	});

	it("leaves an image untouched when its upload fails, and says nothing needs moving when all are links", async () => {
		fail = true;
		const p = await h.svc.catalog.saveProduct(productForm({ image: DATA(9) }));
		await h.svc.settings.moveImagesToCloud();
		expect(h.data().products.find((x) => x.id === p.id).image).toBe(DATA(9));
		fail = false;
		await h.svc.settings.moveImagesToCloud();
		expect(h.data().products.find((x) => x.id === p.id).image).toMatch(/^https:\/\/cloud\//);
		const before = uploads.length;
		await h.svc.settings.moveImagesToCloud(); // nothing left to move: no new uploads
		expect(uploads.length).toBe(before);
	});
});
