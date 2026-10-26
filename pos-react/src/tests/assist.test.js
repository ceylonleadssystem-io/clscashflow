import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { T } from "../db/tables";
import { applyConfig, countConfig, describeConfig, diffConfig, isEmptyConfig } from "../domain/assistConfig";
import { assistInfo, assistStore, beginAssist, endAssist, markSent, pendingConfig, prepareAssist } from "../services/assist";

const NOW = "2026-10-27T10:00:00.000Z";
const clientPayload = () => ({
	accountUid: "client-1",
	products: [
		{ id: "p1", name: "Tea", type: "Product", code: "T1", category: "Drinks", price: 300, cost: 100, stock: 40, modifierIds: [], updatedAt: "2026-10-01T00:00:00Z" },
		{ id: "p2", name: "Cake", type: "Product", code: "C1", category: "Food", price: 500, cost: 200, stock: 9, modifierIds: [] },
	],
	modifiers: [{ id: "m1", name: "Size", mode: "single", required: false, options: [{ name: "Large", price: 50 }] }],
	subcategories: [],
	locations: [{ id: "loc-main", name: "Main Location", code: "MAIN", active: true }],
	categories: ["Drinks", "Food"],
	sales: [{ id: "s1", receipt: "ORD-0001", total: 300, status: "Completed", date: "2026-10-26", lines: [] }],
	customers: [{ id: "c1", name: "Nimal", phone: "0771234567" }],
	users: [{ id: "u1", name: "Owner", role: "owner", pin: "8826", active: true, locationAccess: "all", locationIds: [] }],
	cashShifts: [{ id: "cs1", userId: "u1", status: "open", openedAt: "2026-10-27T05:00:00Z" }],
	settings: { business: "Lotus", kotPrinter: "", supportCode: "123456", ownerAuth: { h: 1 } },
	syncMeta: { settings: {} },
	deletedIds: {},
});

describe("assist config rules", () => {
	it("diffs by field, lists removals and category changes, ignores blocked settings, and applies like the server", () => {
		const base = clientPayload();
		const work = JSON.parse(JSON.stringify(base));
		work.products[0].price = 350;
		work.products[0].updatedAt = "2026-10-27T09:00:00Z"; // timestamps alone never count
		work.products = work.products.filter((p) => p.id !== "p2");
		work.products.push({ id: "p9", name: "Latte", price: 450, category: "Drinks" });
		work.categories = ["Drinks", "Bakery"];
		work.settings.kotPrinter = "Kitchen";
		work.settings.features = { "view.sales": false }; // blocked
		const cfg = diffConfig(base, work);
		expect(cfg.rows.products).toEqual([{ id: "p1", price: 350 }, { id: "p9", name: "Latte", price: 450, category: "Drinks" }]);
		expect(cfg.deleted.products).toEqual(["p2"]);
		expect(cfg.categories).toEqual({ add: ["Bakery"], remove: ["Food"] });
		expect(cfg.settings).toEqual({ kotPrinter: "Kitchen" });
		expect(countConfig(cfg)).toEqual({ rows: 2, deleted: 1, categories: 2, settings: 1 });
		expect(describeConfig(cfg)).toEqual(["2 items added or changed", "1 item removed", "2 category changes", "Settings changed: kotPrinter"]);
		const out = applyConfig(base, cfg, NOW);
		expect(out.products.find((p) => p.id === "p1")).toMatchObject({ price: 350, stock: 40, updatedAt: NOW });
		expect(out.sales).toEqual(base.sales);
		expect(out.deletedIds.products).toEqual(["p2"]);
		expect(isEmptyConfig(diffConfig(base, base))).toBe(true);
	});
});

describe("saving the Settings page", () => {
	it("does not send values the business never set that are empty or the default, only real changes", () => {
		const base = { settings: { business: "Lotus", kotPrinter: "" } };
		const work = { settings: { business: "Lotus", kotPrinter: "Kitchen", posUsers: 1, printerType: "system", printerAddress: "", autoPrint: false, serviceChargeRate: 0, receiptSocials: { instagram: "", website: "" }, receiptFooter: "Thank you for your purchase", orderChannels: ["Dine-in", "Takeaway", "PickMe", "Uber Eats"], feedbackLink: "https://g.page/r/x" } };
		expect(diffConfig(base, work).settings).toEqual({ kotPrinter: "Kitchen", feedbackLink: "https://g.page/r/x" });
	});
});

describe("assist copy", () => {
	afterEach(() => vi.unstubAllGlobals());
	beforeEach(() => localStorage.clear());

	it("copies only configuration (no sales, customers, PINs or support code), then sends only what changed", async () => {
		// the admin tab only says which business; the assist tab builds the copy from the server
		beginAssist({ accountId: "client-1", business: "Lotus" });
		vi.stubGlobal("location", { search: "" });
		expect(assistInfo()).toBeNull(); // not in an assist tab (?assist=1 missing)
		vi.stubGlobal("location", { search: "?assist=1" });
		expect(assistInfo()?.accountId).toBe("client-1");
		const started = JSON.parse(localStorage.getItem("ceylonry-pos-assist"));
		expect(started).toMatchObject({ accountId: "client-1", business: "Lotus", ready: false });
		let fetched = 0;
		const info = await prepareAssist(started, async () => (fetched++, clientPayload()));
		expect(fetched).toBe(1);
		expect(JSON.parse(localStorage.getItem("ceylonry-pos-assist")).ready).toBe(true);
		const work = assistStore(info.dbName);
		const snap = await work.readSnapshot();
		expect(snap.products.map((p) => p.name).sort()).toEqual(["Cake", "Tea"]);
		expect(snap.sales).toEqual([]);
		expect(snap.customers).toEqual([]);
		expect(JSON.stringify(snap)).not.toMatch(/8826|123456|0771234567/);
		// a reload of the assist tab keeps the copy (and unsent work): nothing is fetched again
		await prepareAssist(JSON.parse(localStorage.getItem("ceylonry-pos-assist")), async () => (fetched++, clientPayload()));
		expect(fetched).toBe(1);
		expect(await pendingConfig(info)).toMatchObject({ rows: { products: [] }, settings: {} });

		// the administrator configures the copy through the POS database
		await work.write((tx) => {
			tx.put(T.products, { ...snap.products.find((p) => p.id === "p1"), price: 360, modifierIds: ["m1"] });
			tx.setSetting("kotPrinter", "Kitchen");
			tx.addCategory("Bakery");
		});
		const cfg = await pendingConfig(info);
		expect(cfg.rows.products).toEqual([{ id: "p1", price: 360, modifierIds: ["m1"] }]);
		expect(cfg.settings).toEqual({ kotPrinter: "Kitchen" });
		expect(cfg.categories.add).toEqual(["Bakery"]);

		// the client's real data keeps its sales, staff and stock while taking the change
		const real = applyConfig(clientPayload(), cfg, NOW);
		expect(real.products.find((p) => p.id === "p1")).toMatchObject({ price: 360, stock: 40, modifierIds: ["m1"] });
		expect(real.users[0].pin).toBe("8826");
		expect(real.sales).toHaveLength(1);

		await markSent(info);
		expect(isEmptyConfig(await pendingConfig(info))).toBe(true); // nothing left to send until the next change
		await endAssist(info);
		expect(localStorage.getItem("ceylonry-pos-assist")).toBeNull();
		expect((await assistStore(info.dbName).readSnapshot()).products).toEqual([]);
	});
});
