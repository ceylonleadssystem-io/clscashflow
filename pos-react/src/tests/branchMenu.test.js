/**
 * Tests for branch-specific menus: an item added while signed in to a branch belongs to that branch, items and categories can be limited to
 * chosen locations, and the register shows only what the branch sells.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { itemsAt } from "../domain/menuLocation";
import { addProduct, createHarness } from "./harness";

const place = (n) => ({ name: "Branch " + n, code: "B" + n, address: "", phone: "", email: "", openingHours: "", active: true, receiptHeader: "", receiptFooter: "" });

describe("branch menus", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));
	const addBranch = async () => {
		await h.svc.locations.saveLocation(place(2));
		return h.data().locations.find((l) => l.name === "Branch 2");
	};

	it("with one location an item sells everywhere (no limits)", async () => {
		const p = await addProduct(h, { name: "Tea", price: 200, cost: 80 });
		expect(h.data().products.find((x) => x.id === p.id).locationIds).toEqual([]);
	});

	it("an item added while signed in to one branch of several belongs to that branch only", async () => {
		const second = await addBranch();
		const p = await addProduct(h, { name: "Tea", price: 200, cost: 80 });
		expect(h.data().products.find((x) => x.id === p.id).locationIds).toEqual(["loc-main"]);
		h.session.locationId = second.id;
		const q = await addProduct(h, { name: "Cake", price: 400, cost: 150 });
		expect(h.data().products.find((x) => x.id === q.id).locationIds).toEqual([second.id]);
		const mainMenu = itemsAt(h.data().products, h.data().settings, "loc-main", h.data().locations.map((l) => l.id));
		expect(mainMenu.map((x) => x.name)).toEqual(["Tea"]);
	});

	it("All locations adds an item for every branch, and editing an item keeps its locations unless they are changed", async () => {
		const second = await addBranch();
		h.session.locationId = "all";
		const p = await addProduct(h, { name: "Soup", price: 300, cost: 100 });
		expect(h.data().products.find((x) => x.id === p.id).locationIds).toEqual([]);
		await h.svc.catalog.saveProduct({ ...p, id: p.id, category: p.category, locationIds: [second.id], cost: String(p.cost), price: String(p.price), code: p.code, type: p.type });
		expect(h.data().products.find((x) => x.id === p.id).locationIds).toEqual([second.id]);
		const { locationIds: _omitted, ...withoutLocations } = p;
		await h.svc.catalog.saveProduct({ ...withoutLocations, id: p.id, category: p.category, cost: String(p.cost), price: String(p.price), code: p.code, type: p.type });
		expect(h.data().products.find((x) => x.id === p.id).locationIds).toEqual([second.id]);
	});

	it("a category limited to a branch hides all its items from the other branches once published", async () => {
		const second = await addBranch();
		h.session.locationId = "all";
		const p = await addProduct(h, { name: "Brownie", price: 350, cost: 120, category: "Desserts" });
		await h.svc.settings.saveMenuEntity("categorySettings", { name: "Desserts", description: "", deleteApprovalOn: false, graceSeconds: 60, locationIds: [second.id] });
		expect(h.data().settings.menuDraft?.categorySettings?.[0]?.locationIds).toEqual([second.id]);
		await h.svc.settings.publishMenu();
		const settings = h.data().settings;
		const ids = h.data().locations.map((l) => l.id);
		expect(itemsAt(h.data().products, settings, second.id, ids).map((x) => x.id)).toContain(p.id);
		expect(itemsAt(h.data().products, settings, "loc-main", ids).map((x) => x.id)).not.toContain(p.id);
		expect(itemsAt(h.data().products, settings, "all", ids).map((x) => x.id)).toContain(p.id);
	});
});

describe("branch menus: imports and the location picker", () => {
	it("items imported while signed in to one branch of several belong to that branch", async () => {
		const h = await createHarness();
		await h.svc.locations.saveLocation(place(2));
		await h.svc.catalog.importCatalogue([{ include: true, rowNumber: 1, name: "Imported Tea", category: "Drinks", subcategory: "", code: "IMP-1", price: 200, cost: 80, type: "Product", description: "", stock: 0, unit: "each", supplier: "" }], "add");
		expect(h.data().products.find((p) => p.code === "IMP-1").locationIds).toEqual(["loc-main"]);
	});
});
