/**
 * Tests for the inventory workflow: stock item validation and opening stock, adjustments by reason, deleting
 * stock rows, branch stock counts and count-sheet import.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { availableProductStock } from "../domain/inventory";
import { addProduct, createHarness, line, noDiscount } from "./harness";

const item = (o = {}) => ({ name: "Sugar", sku: "", type: "Ingredient", unit: "kg", qty: "10", reorder: "2", cost: "180", supplier: "", ...o });

describe("inventory workflow", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("validates a stock item", async () => {
		await h.svc.inventory.saveInventoryItem(item({ name: "" }));
		expect(h.lastAlert()).toMatch(/valid item name/);
		await h.svc.inventory.saveInventoryItem(item({ qty: "-1" }));
		expect(h.data().inventory).toHaveLength(0);
	});

	it("creates an item with opening stock + movement and seeds every active location", async () => {
		await h.svc.locations.saveLocation({ name: "Galle", code: "GAL", address: "", phone: "", email: "", openingHours: "", active: true, receiptHeader: "", receiptFooter: "" });
		const i = await h.svc.inventory.saveInventoryItem(item());
		const row = h.data().inventory.find((x) => x.id === i.id);
		expect(row.qty).toBe(10);
		expect(Object.keys(row.locationQuantities)).toHaveLength(2);
		expect(row.locationQuantities["loc-main"]).toBe(10);
		expect(h.data().stockMovements[0]).toMatchObject({ reason: "Opening stock", change: 10 });
	});

	it("a count correction on edit records the difference", async () => {
		const i = await h.svc.inventory.saveInventoryItem(item());
		await h.svc.inventory.saveInventoryItem(item({ id: i.id, qty: "7" }));
		expect(h.data().inventory[0].qty).toBe(7);
		expect(h.data().stockMovements.find((m) => m.reason === "Stock count correction").change).toBe(-3);
	});

	describe("adjustments follow the reason", () => {
		let id;
		beforeEach(async () => (id = (await h.svc.inventory.saveInventoryItem(item())).id));
		const qty = () => h.data().inventory.find((x) => x.id === id).qty;

		it("Stock received adds", async () => {
			await h.svc.inventory.adjustStock(id, 5, "Stock received", "");
			expect(qty()).toBe(15);
		});
		it.each(["Wastage", "Damaged", "Internal use", "Return to supplier"])("%s subtracts", async (reason) => {
			await h.svc.inventory.adjustStock(id, 4, reason, "note");
			expect(qty()).toBe(6);
			expect(h.data().stockMovements.find((m) => m.reason === reason).change).toBe(-4);
		});
		it("Stock count correction replaces the quantity", async () => {
			await h.svc.inventory.adjustStock(id, 3, "Stock count correction", "");
			expect(qty()).toBe(3);
		});
		it("a count equal to current stock changes nothing", async () => {
			await h.svc.inventory.adjustStock(id, 10, "Stock count correction", "");
			expect(h.lastAlert()).toMatch(/matches the current stock/);
		});
		it("cannot go negative or use a zero / invalid amount", async () => {
			await h.svc.inventory.adjustStock(id, 11, "Wastage", "");
			expect(h.lastAlert()).toMatch(/negative/);
			await h.svc.inventory.adjustStock(id, 0, "Stock received", "");
			expect(h.lastAlert()).toMatch(/greater than zero/);
			expect(qty()).toBe(10);
		});
	});

	it("deleting a product's stock row makes the product always available", async () => {
		const p = await addProduct(h, { name: "Bun", type: "Product" });
		const row = h.data().inventory.find((i) => i.productId === p.id);
		expect(availableProductStock(h.data().products[0], h.data().inventory, "loc-main")).toBe(0);
		await h.svc.inventory.deleteInventoryItem(row.id);
		expect(h.data().inventory).toHaveLength(0);
		const product = h.data().products[0];
		expect(product.trackStock).toBe(false);
		expect(availableProductStock(product, h.data().inventory, "loc-main")).toBe(Infinity);
		// ...and it can be sold with no stock row, and the row is not recreated
		const sale = await h.svc.sales.completeSale({ cart: [line(product, 50)], discount: noDiscount, payment: "Card" });
		expect(sale.sale).toBeTruthy();
		await h.svc.catalog.saveProduct({ id: product.id, name: "Bun", category: "Drinks", cost: "1", price: "5", type: "Product", code: "", image: "" });
		expect(h.data().inventory).toHaveLength(0);
	});

	it("re-adding stock for a product turns tracking back on", async () => {
		const p = await addProduct(h, { name: "Bun", type: "Product" });
		await h.svc.inventory.deleteInventoryItem(h.data().inventory[0].id);
		await h.svc.inventory.saveInventoryItem(item({ name: "Bun", type: "Sellable Product", unit: "each", qty: "4", productId: p.id }));
		expect(h.data().products[0].trackStock).toBe(true);
		expect(availableProductStock(h.data().products[0], h.data().inventory, "loc-main")).toBe(4);
	});

	it("deleting an ingredient removes it from recipes and keeps history", async () => {
		const milk = await h.svc.inventory.saveInventoryItem(item({ name: "Milk" }));
		await addProduct(h, { name: "Latte", recipe: [{ itemId: milk.id, qty: 1 }] });
		await h.svc.inventory.deleteInventoryItem(milk.id);
		expect(h.data().products[0].recipe).toEqual([]);
		expect(h.data().stockMovements.every((m) => m.itemName === "Milk")).toBe(true);
		expect(h.data().meta.deletedIds.inventory).toContain(milk.id);
	});
	it("keeps the item when delete is declined", async () => {
		const i = await h.svc.inventory.saveInventoryItem(item());
		h.answers.confirm = false;
		await h.svc.inventory.deleteInventoryItem(i.id);
		expect(h.data().inventory).toHaveLength(1);
	});

	describe("branch stock counts", () => {
		it("saves per-location counts and the active location's quantity", async () => {
			const loc = await h.svc.locations.saveLocation({ name: "Galle", code: "GAL", address: "", phone: "", email: "", openingHours: "", active: true, receiptHeader: "", receiptFooter: "" });
			const i = await h.svc.inventory.saveInventoryItem(item());
			expect(await h.svc.inventory.saveBranchStockCounts(i.id, { "loc-main": 12, [loc.id]: 5, bad: -1 })).toBe(2);
			const row = h.data().inventory[0];
			expect(row.locationQuantities["loc-main"]).toBe(12);
			expect(row.locationQuantities[loc.id]).toBe(5);
			expect(row.qty).toBe(12);
		});
		it("bulk counts for one location skip invalid values", async () => {
			const a = await h.svc.inventory.saveInventoryItem(item({ name: "A" }));
			const b = await h.svc.inventory.saveInventoryItem(item({ name: "B" }));
			await h.svc.inventory.saveBulkBranchStockCounts("loc-main", { [a.id]: 3, [b.id]: "x" }, "Main");
			expect(h.data().inventory.find((i) => i.id === a.id).locationQuantities["loc-main"]).toBe(3);
			expect(h.data().inventory.find((i) => i.id === b.id).locationQuantities["loc-main"]).toBe(10);
			await h.svc.inventory.saveBulkBranchStockCounts("", {}, "");
			expect(h.lastAlert()).toMatch(/Choose a location/);
		});
		it("importStockCountFile needs a file", async () => {
			await h.svc.inventory.importStockCountFile(null);
			expect(h.lastAlert()).toMatch(/Choose a CSV/);
		});
	});
});
