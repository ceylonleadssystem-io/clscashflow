/**
 * Tests for the catalogue workflow: product validation, categories and subcategories, modifier groups and
 * catalogue import modes.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { addProduct, createHarness, productForm } from "./harness";

describe("catalogue workflow", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("validates product fields", async () => {
		expect(await h.svc.catalog.saveProduct(productForm({ name: "" }))).toBeNull();
		expect(await h.svc.catalog.saveProduct(productForm({ price: "0" }))).toBeNull();
		expect(await h.svc.catalog.saveProduct(productForm({ cost: "-1" }))).toBeNull();
		expect(h.data().products).toHaveLength(0);
	});
	it("creates a product, its category, and edits it", async () => {
		const p = await addProduct(h);
		expect(h.data().categories).toContain("Drinks");
		await h.svc.catalog.saveProduct(productForm({ id: p.id, price: "300" }));
		expect(h.data().products).toHaveLength(1);
		expect(h.data().products[0].price).toBe(300);
	});
	it("creates a new category from the product form", async () => {
		await addProduct(h, { category: "__new__", newCategory: "Cakes" });
		expect(h.data().categories).toContain("Cakes");
	});
	it("gives a sellable product an auto stock row, services none", async () => {
		const p = await addProduct(h, { type: "Product" });
		expect(h.data().inventory.some((i) => i.productId === p.id)).toBe(true);
		await addProduct(h, { name: "Haircut", type: "Service" });
		expect(h.data().inventory).toHaveLength(1);
	});
	it("deletes a product together with its stock row", async () => {
		const p = await addProduct(h, { type: "Product" });
		await h.svc.catalog.deleteProduct(p.id);
		expect(h.data().products).toHaveLength(0);
		expect(h.data().inventory).toHaveLength(0);
		expect(h.data().meta.deletedIds.products).toContain(p.id);
	});
	it("keeps the product when delete is declined", async () => {
		const p = await addProduct(h);
		h.answers.confirm = false;
		expect(await h.svc.catalog.deleteProduct(p.id)).toBeNull();
		expect(h.data().products).toHaveLength(1);
	});

	describe("categories", () => {
		it("adds, rejects duplicates and blank names", async () => {
			await h.svc.catalog.addCategory("Snacks");
			await h.svc.catalog.addCategory("snacks");
			expect(h.lastAlert()).toMatch(/already exists/);
			await h.svc.catalog.addCategory("  ");
			expect(h.lastAlert()).toMatch(/Enter a category name/);
		});
		it("renames and cascades to products", async () => {
			await addProduct(h);
			h.answers.prompt = "Beverages";
			await h.svc.catalog.renameCategory("Drinks");
			expect(h.data().products[0].category).toBe("Beverages");
			expect(h.data().categories).not.toContain("Drinks");
		});
		it("moves products to Uncategorized when a category is deleted", async () => {
			await addProduct(h);
			await h.svc.catalog.deleteCategory("Drinks");
			expect(h.data().products[0].category).toBe("Uncategorized");
		});
		it("manages subcategories", async () => {
			h.answers.prompt = "Hot";
			await h.svc.catalog.addSubcategory("Drinks");
			expect(h.data().subcategories[0]).toMatchObject({ name: "Hot", parent: "Drinks" });
			await addProduct(h, { subcategory: "Hot" });
			h.answers.prompt = "Warm";
			await h.svc.catalog.renameSubcategory(h.data().subcategories[0].id);
			expect(h.data().products[0].subcategory).toBe("Warm");
			await h.svc.catalog.deleteSubcategory(h.data().subcategories[0].id);
			expect(h.data().subcategories).toHaveLength(0);
			expect(h.data().products[0].subcategory).toBe("");
		});
	});

	describe("modifiers", () => {
		const form = { name: "Size", mode: "single", required: true, options: [{ name: "Large", price: "50" }, { name: "", price: "0" }] };
		it("needs a name and one option", async () => {
			await h.svc.catalog.saveModifier({ ...form, name: "" });
			expect(h.lastAlert()).toMatch(/group name/);
		});
		it("saves and drops blank options", async () => {
			const m = await h.svc.catalog.saveModifier(form);
			expect(m.options).toEqual([{ name: "Large", price: 50 }]);
		});
		it("unlinks the group from products on delete", async () => {
			const m = await h.svc.catalog.saveModifier(form);
			await addProduct(h, { modifierIds: [m.id], modifierRules: { [m.id]: {} } });
			await h.svc.catalog.deleteModifier(m.id);
			expect(h.data().products[0].modifierIds).toEqual([]);
			expect(h.data().modifiers).toHaveLength(0);
		});
		it("adds common modifier presets once", async () => {
			await h.svc.catalog.addCommonModifiers();
			const n = h.data().modifiers.length;
			expect(n).toBeGreaterThan(0);
			await h.svc.catalog.addCommonModifiers();
			expect(h.data().modifiers).toHaveLength(n);
		});
	});

	describe("import", () => {
		const row = (o = {}) => ({ include: true, rowNumber: 2, name: "Roll", code: "R1", subcategory: "", category: "Bakery", price: 120, cost: 60, type: "Product", ...o });
		it("rejects invalid rows and an empty selection", async () => {
			await h.svc.catalog.importCatalogue([], "merge");
			expect(h.lastAlert()).toMatch(/Select at least one row/);
			await h.svc.catalog.importCatalogue([row({ price: 0 })], "merge");
			expect(h.lastAlert()).toMatch(/Row 2 needs/);
		});
		it("imports in merge mode and does not duplicate on re-import", async () => {
			await h.svc.catalog.importCatalogue([row()], "merge");
			await h.svc.catalog.importCatalogue([row({ price: 150 })], "merge");
			expect(h.data().products).toHaveLength(1);
			expect(h.data().products[0].price).toBe(150);
		});
		it("replace mode swaps the catalogue", async () => {
			await addProduct(h);
			await h.svc.catalog.importCatalogue([row()], "replace");
			expect(h.data().products.map((p) => p.name)).toEqual(["Roll"]);
		});
	});
});
