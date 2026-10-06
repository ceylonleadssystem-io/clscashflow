/**
 * Sizes: stock counted per size, deducted/restored per size on sales and refunds, size barcodes ("<code>-<size>"),
 * what a scan means, and the sales-by-modifier report.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createHarness, line, noDiscount, productForm } from "./harness";
import { availableProductStock, hasSizedStock, lineSize, stockProblem, stockRowForLine } from "../domain/inventory";
import { reportData } from "../domain/analytics";
import { sizedBarcode, sizeSlug } from "../services/printing/barcode";
import { findScannedItem } from "../services/printing/scanner";

const sizeLine = (p, size, qty = 1, group = { id: "mg", name: "Size" }) => ({
	...line(p, qty),
	key: p.id + "|" + size,
	modifiers: [{ groupId: group.id, groupName: group.name, optionName: size, price: 0 }],
});

describe("size barcodes", () => {
	it("builds <code>-<size> and keeps it within 32 characters", () => {
		expect(sizedBarcode("pos-07666", "M")).toBe("POS-07666-M");
		expect(sizedBarcode("POS-07666", "2XL")).toBe("POS-07666-2XL");
		expect(sizedBarcode("POS-07666", "")).toBe("POS-07666");
		expect(sizeSlug("Extra Large")).toBe("EXTRALARGE");
		const long = sizedBarcode("A".repeat(40), "2XL");
		expect(long.length).toBeLessThanOrEqual(32);
		expect(long.endsWith("-2XL")).toBe(true);
	});
	it("a scan finds the item and its size; a plain code finds the item only", () => {
		const group = { id: "mg", name: "Size", options: [{ name: "S" }, { name: "M" }, { name: "2XL" }] };
		const top = { id: "p1", name: "Island Top", code: "POS-07666", modifierIds: ["mg"] };
		const other = { id: "p2", name: "Mug", code: "MUG-1", modifierIds: [] };
		const products = [top, other];
		expect(findScannedItem(products, [group], "POS-07666-M")).toEqual({ product: top, size: "M" });
		expect(findScannedItem(products, [group], "pos-07666-2xl")).toEqual({ product: top, size: "2XL" });
		expect(findScannedItem(products, [group], "POS-07666")).toEqual({ product: top, size: "" });
		expect(findScannedItem(products, [group], "POS-07666-XL")).toBeUndefined(); // not one of its sizes
		expect(findScannedItem(products, [group], "MUG-1-M")).toBeUndefined(); // Mug has no Size group
		expect(findScannedItem(products, [group], "NOPE")).toBeUndefined();
	});
});

describe("stock counted per size", () => {
	let h, group, top;
	beforeEach(async () => {
		h = await createHarness({ role: "owner" });
		group = await h.svc.catalog.saveModifier({ name: "Size", mode: "single", required: true, options: [{ name: "S", price: 0 }, { name: "M", price: 0 }, { name: "XL", price: 0 }] });
		top = await h.svc.catalog.saveProduct(productForm({ name: "Island Top", type: "Product", modifierIds: [group.id], sizeStock: { S: "3", M: "5", XL: "" } }));
	});
	const rows = () => h.data().inventory.filter((i) => i.productId === top.id);
	const qtyOf = (size) => rows().find((i) => i.sizeName === size)?.qty;

	it("creates one stock row per counted size and none for a blank size", () => {
		expect(rows().map((r) => r.sizeName).sort()).toEqual(["M", "S"]);
		expect(rows().every((r) => r.autoProductStock && r.productId === top.id)).toBe(true);
		const p = h.data().products.find((x) => x.id === top.id);
		expect(p.trackStock).toBe(true);
		expect(p.sizedStock.sort()).toEqual(["M", "S"]);
		expect(hasSizedStock(h.data().inventory, top.id)).toBe(true);
		expect(h.data().inventory.some((i) => i.productId === top.id && !i.sizeName)).toBe(false); // no single row
	});
	it("an item with no counts at all stays always available", async () => {
		const free = await h.svc.catalog.saveProduct(productForm({ name: "Free", type: "Product", modifierIds: [group.id], sizeStock: { S: "", M: "", XL: "" } }));
		expect(h.data().products.find((x) => x.id === free.id).trackStock).toBe(false);
		expect(availableProductStock(free, h.data().inventory, "loc-main", "M")).toBe(Infinity);
	});
	it("rejects a negative count", async () => {
		expect(await h.svc.catalog.saveProduct(productForm({ name: "Bad", modifierIds: [group.id], sizeStock: { S: "-1" } }))).toBeNull();
		expect(h.lastAlert()).toMatch(/Stock counts/);
	});
	it("reports stock per size, Infinity for an uncounted size, and the total without a size", () => {
		const p = h.data().products.find((x) => x.id === top.id);
		const inv = h.data().inventory;
		expect(availableProductStock(p, inv, "loc-main", "S")).toBe(3);
		expect(availableProductStock(p, inv, "loc-main", "M")).toBe(5);
		expect(availableProductStock(p, inv, "loc-main", "XL")).toBe(Infinity);
		expect(availableProductStock(p, inv, "loc-main")).toBe(8);
	});
	it("blocks selling more of a size than it has, counting only that size", () => {
		const p = h.data().products.find((x) => x.id === top.id);
		const inv = h.data().inventory;
		expect(stockProblem([sizeLine(p, "S", 4)], h.data().products, inv, "loc-main")).toBeTruthy();
		expect(stockProblem([sizeLine(p, "S", 3), sizeLine(p, "M", 5)], h.data().products, inv, "loc-main")).toBeFalsy();
		expect(stockProblem([sizeLine(p, "XL", 50)], h.data().products, inv, "loc-main")).toBeFalsy();
	});
	it("takes a sale from the size's row and gives it back on a void", async () => {
		const p = h.data().products.find((x) => x.id === top.id);
		const sale = (await h.svc.sales.completeSale({ cart: [sizeLine(p, "S", 2), sizeLine(p, "M", 1)], discount: noDiscount, payment: "Card" })).sale;
		expect(qtyOf("S")).toBe(1);
		expect(qtyOf("M")).toBe(4);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "void", reason: "mistake" });
		expect(qtyOf("S")).toBe(3);
		expect(qtyOf("M")).toBe(5);
	});
	it("a size that is not counted takes nothing off any row", async () => {
		const p = h.data().products.find((x) => x.id === top.id);
		await h.svc.sales.completeSale({ cart: [sizeLine(p, "XL", 2)], discount: noDiscount, payment: "Card" });
		expect(qtyOf("S")).toBe(3);
		expect(qtyOf("M")).toBe(5);
	});
	it("the right row is chosen for a line", () => {
		const rowsNow = h.data().inventory;
		const p = h.data().products.find((x) => x.id === top.id);
		expect(stockRowForLine(rowsNow, sizeLine(p, "M")).sizeName).toBe("M");
		expect(stockRowForLine(rowsNow, sizeLine(p, "XL"))).toBeNull();
		expect(lineSize(sizeLine(p, "M"))).toBe("M");
		expect(lineSize({ modifiers: [{ groupName: "Add-ons", optionName: "Cheese" }] })).toBe("");
	});
	it("deleting one size's count leaves the other sizes counted", async () => {
		const row = rows().find((r) => r.sizeName === "S");
		await h.svc.inventory.deleteInventoryItem(row.id);
		const p = h.data().products.find((x) => x.id === top.id);
		expect(p.trackStock).toBe(true);
		expect(p.sizedStock).toEqual(["M"]);
		expect(availableProductStock(p, h.data().inventory, "loc-main", "S")).toBe(Infinity);
		expect(availableProductStock(p, h.data().inventory, "loc-main", "M")).toBe(5);
	});
});

describe("receipt", () => {
	it("prints the size of a scanned size barcode line on the receipt", async () => {
		const { receiptText } = await import("../services/printing/documents");
		const text = receiptText({ receipt: "ORD-1", lines: [{ name: "Polo Shirt", qty: 1, price: 4500, modifiers: [{ groupName: "Size", optionName: "M", price: 0 }] }], total: 4500, payment: "Card" });
		expect(text).toMatch(/Polo Shirt[\s\S]*\n {2}Size: M\n/);
	});
});

describe("sales by modifier report", () => {
	it("counts units and sales per modifier option and ignores refunded quantity", () => {
		const mk = (id, lines, total, refunds = []) => ({ id, status: "completed", date: "2026-10-05", total, lines, refunds });
		const m = (group, option, price = 0) => ({ groupName: group, optionName: option, price });
		const sales = [
			mk("a", [{ name: "Top", qty: 2, price: 100, modifiers: [m("Size", "M")] }], 200),
			mk("b", [{ name: "Top", qty: 1, price: 100, modifiers: [m("Size", "S")] }, { name: "Pizza", qty: 1, price: 50, modifiers: [m("Add-ons", "Cheese", 10)] }], 150),
			mk("c", [{ name: "Top", qty: 3, price: 100, modifiers: [m("Size", "M")] }], 300, [{ lines: [{ lineIndex: 0, qty: 1 }] }]),
		];
		const r = reportData(sales, { from: "2026-10-01", to: "2026-10-31" });
		const get = (g, o) => r.modifiers.find((x) => x.group === g && x.option === o);
		expect(get("Size", "M")).toMatchObject({ qty: 4 }); // 2 + (3 - 1 refunded)
		expect(get("Size", "S")).toMatchObject({ qty: 1 });
		expect(get("Add-ons", "Cheese")).toMatchObject({ qty: 1, extra: 10 });
		expect(r.modifiers.map((x) => x.group)).toEqual(["Add-ons", "Size", "Size"]); // sorted by group
	});
});
