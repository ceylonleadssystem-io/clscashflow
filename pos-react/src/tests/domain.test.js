/**
 * Tests for the pure domain logic: cart maths, refunds and cash drawer, analytics, catalogue parsing, order
 * numbering, inventory, feature flags, sync merge, formatting, stock reasons, invoices and validators.
 */
import { describe, expect, it } from "vitest";
import { addConfiguredLine, cartTotals, changeQty, equalSplit, productModifiers } from "../domain/cart";
import { applyReversal, calculateRefundAmount, expectedCash, refundableLines, selectedRefundLines } from "../domain/sales";
import { dashboardData, reportData, customerSegment } from "../domain/analytics";
import { parseCatalogueRows, visibleProductCategories } from "../domain/catalog";
import { formatOrderNumber, migrateOrderNumbers, nextSequence } from "../domain/orders";
import { ensureProductInventory, stockProblem } from "../domain/inventory";
import { FEATURES, dependentsOf, resolveFeatures } from "../config/features";
import { mergePayload } from "../services/sync/merge";
import { groupedValue, whatsappPhone } from "../domain/format";

const product = { id: "p1", name: "Burger", price: 1000, cost: 400, modifierIds: ["m1"], modifierRules: { m1: false } };
const modifiers = [{ id: "m1", name: "Size", mode: "single", required: true, options: [{ name: "Large", price: 150 }] }];

describe("cart", () => {
	it("merges identical configured lines and prices modifiers", () => {
		const sel = [{ groupId: "m1", groupName: "Size", optionName: "Large", price: 150 }];
		let cart = addConfiguredLine([], product, sel);
		cart = addConfiguredLine(cart, product, sel);
		expect(cart).toHaveLength(1);
		expect(cart[0].qty).toBe(2);
		expect(cart[0].price).toBe(1150);
		expect(changeQty(cart, cart[0].key, -2)).toHaveLength(0);
	});
	it("applies per-product modifier overrides", () => {
		expect(productModifiers(product, modifiers)[0].required).toBe(false);
	});
	it("computes discount then service charge", () => {
		const cart = [{ price: 1000, qty: 2 }];
		const t = cartTotals(cart, { type: "percent", value: 10 }, { serviceChargeEnabled: true, serviceChargeRate: 10 }, true);
		expect(t.subtotal).toBe(2000);
		expect(t.discount).toBe(200);
		expect(t.service).toBeCloseTo(180);
		expect(t.total).toBeCloseTo(1980);
		// service charge is ignored when the business type does not support it
		expect(cartTotals(cart, { type: "fixed", value: 0 }, { serviceChargeEnabled: true, serviceChargeRate: 10 }, false).service).toBe(0);
	});
	it("splits equally with the remainder on the last share", () => {
		const shares = equalSplit(100, 3);
		expect(shares.map((s) => s.amount)).toEqual([33.33, 33.33, 33.34]);
	});
});

describe("refunds & cash drawer", () => {
	const sale = {
		id: "s1",
		payment: "Cash",
		total: 900,
		cost: 400,
		profit: 500,
		cashShiftId: "cs1",
		lines: [
			{ name: "A", price: 500, qty: 2, cost: 200 },
			{ name: "Order Discount", price: -100, qty: 1, isDiscount: true },
		],
	};
	it("refunds proportionally to what was paid", () => {
		const lines = selectedRefundLines(sale, "partial", { 0: 1 });
		expect(refundableLines(sale)).toHaveLength(1);
		expect(calculateRefundAmount(sale, "partial", lines)).toBeCloseTo(450);
		const { sale: next } = applyReversal(sale, { type: "refund", reason: "x", userId: "u", cashShiftId: "cs1", refundType: "partial", refundLines: lines });
		expect(next.status).toBe("partially_refunded");
		expect(next.total).toBeCloseTo(450);
		expect(next.originalTotal).toBe(900);
		expect(expectedCash({ id: "cs1", openingCash: 1000 }, [next])).toBeCloseTo(1000 + 900 - 450);
	});
	it("voids to zero and counts the cash back out", () => {
		const { sale: voided } = applyReversal(sale, { type: "void", reason: "x", userId: "u", cashShiftId: "cs1" });
		expect(voided.status).toBe("voided");
		expect(voided.total).toBe(0);
		expect(expectedCash({ id: "cs1", openingCash: 0 }, [voided])).toBe(0);
	});
});

describe("analytics", () => {
	const sales = [
		{ id: "1", date: "2026-10-01", total: 300, cost: 100, payment: "Cash", customerId: "c1", lines: [{ name: "Tea", qty: 2, price: 150, cost: 50 }] },
		{ id: "2", date: "2026-10-01", total: 200, cost: 50, payment: "Card", status: "voided", lines: [] },
	];
	it("ignores reversed sales", () => {
		const d = dashboardData(sales, { from: "2026-10-01", to: "2026-10-31" });
		expect(d.revenue).toBe(300);
		expect(d.payments).toEqual({ Cash: 300 });
		expect(reportData(sales, { from: "2026-10-01", to: "2026-10-31" }).items[0].revenue).toBeCloseTo(300);
	});
	it("segments customers", () => {
		expect(customerSegment({ spent: 20000, visits: 1, daysSince: 0 })).toBe("VIP");
		expect(customerSegment({ spent: 10, visits: 1, daysSince: 0 })).toBe("New");
	});
});

describe("catalogue + orders + inventory", () => {
	it("parses a Ceylonry / Square style sheet", () => {
		const rows = parseCatalogueRows([
			["Name", "SKU", "Category", "Selling Price", "Cost"],
			["Latte", "CF-1", "Coffee > Hot", "550", "200"],
			["", "", "", "", ""],
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ name: "Latte", code: "CF-1", category: "Coffee", subcategory: "Hot", price: 550 });
	});
	it("hides empty preset categories but keeps custom ones", () => {
		expect(visibleProductCategories(["Drinks", "My Special"], [], [])).toEqual(["My Special"]);
	});
	it("migrates and sequences order numbers", () => {
		const m = migrateOrderNumbers([{ id: "a", receipt: "X1", createdAt: "2026-01-02" }, { id: "b", receipt: "X2", createdAt: "2026-01-01" }], [], {});
		expect(m.sales.map((s) => s.receipt)).toEqual(["ORD-0002", "ORD-0001"]);
		expect(formatOrderNumber(nextSequence({ nextOrderSequence: 1 }, m.sales, []))).toBe("ORD-0003");
	});
	it("creates sellable stock rows and blocks oversell", () => {
		const { inventory } = ensureProductInventory([{ id: "p1", name: "Pen", code: "PEN", type: "Product", stock: 3, cost: 5 }], [], [{ id: "loc", active: true }]);
		expect(inventory[0].locationQuantities.loc).toBe(3);
		const cart = [{ productId: "p1", key: "k", qty: 4, name: "Pen" }];
		expect(stockProblem(cart, [{ id: "p1", type: "Product" }], inventory, "loc")?.name).toBe("Pen");
	});
});

describe("feature flags", () => {
	it("applies defaults, core switches and dependencies", () => {
		const r = resolveFeatures({ "view.customers": false, "view.checkout": false });
		expect(r.enabled["view.checkout"]).toBe(true); // core
		expect(r.enabled["view.customers"]).toBe(false);
		expect(r.enabled["view.crm"]).toBe(false); // requires customers
		expect(r.blockedBy["view.crm"]).toContain("view.customers");
		expect(r.enabled["industry.tools"]).toBe(false); // off by default
	});
	it("knows every dependency target", () => {
		const ids = new Set(FEATURES.map((f) => f.id));
		FEATURES.forEach((f) => f.requires.forEach((d) => expect(ids.has(d)).toBe(true)));
		expect(dependentsOf("view.customers")).toContain("view.crm");
	});
});

describe("sync merge", () => {
	it("keeps the newer row, honours tombstones and per-setting timestamps", () => {
		const remote = { products: [{ id: "p1", name: "old", updatedAt: "2026-01-01T00:00:00Z" }, { id: "gone", updatedAt: "2026-01-01T00:00:00Z" }], settings: { a: 1 }, syncMeta: { settings: { a: "2026-01-01T00:00:00Z" } }, deletedIds: { products: ["gone"] } };
		const local = { products: [{ id: "p1", name: "new", updatedAt: "2026-02-01T00:00:00Z" }], settings: { a: 2 }, syncMeta: { settings: { a: "2026-02-01T00:00:00Z" } } };
		const merged = mergePayload(remote, local, true);
		expect(merged.products.map((p) => p.name)).toEqual(["new"]);
		expect(merged.settings.a).toBe(2);
	});
});

describe("format", () => {
	it("groups digits and normalises Sri Lankan numbers", () => {
		expect(groupedValue("1234567.891")).toBe("1,234,567.89");
		expect(whatsappPhone("0771234567")).toBe("94771234567");
	});
});

import { adjustmentChange, availableProductStock, ensureProductInventory } from "../domain/inventory";
import { buildInvoiceLines } from "../admin-app/billing";
import { emailError, phoneError } from "../domain/validators";
import { defaultFeatureFlags } from "../config/features";

describe("stock reasons", () => {
	it("adds or removes according to the reason", () => {
		expect(adjustmentChange("Stock received", 5, 10)).toBe(5);
		expect(adjustmentChange("Wastage", 3, 10)).toBe(-3);
		expect(adjustmentChange("Damaged", -3, 10)).toBe(-3);
		expect(adjustmentChange("Stock count correction", 8, 10)).toBe(-2);
	});
	it("deleted stock rows leave the product always available", () => {
		const p = { id: "p", type: "Product", trackStock: false, stock: 0 };
		expect(availableProductStock(p, [], "x")).toBe(Infinity);
		expect(ensureProductInventory([p], [], [{ id: "x", active: true }]).inventory).toHaveLength(0);
	});
});

describe("invoices", () => {
	const flags = { ...defaultFeatureFlags() };
	it("charges tier price plus additional features beyond the free ones", () => {
		const r = buildInvoiceLines({ tier: "starter", flags, period: "2026-10" });
		// starter excludes 9 features that are all on in `flags` -> 9 extras, 2 free
		expect(r.extras.length).toBeGreaterThan(2);
		expect(r.total).toBe(5500 + (r.extras.length - 2) * 5500);
	});
	it("uses the fixed-amount exception when set", () => {
		const r = buildInvoiceLines({ tier: "business", flags, exceptionAmount: 6000, exceptionNote: "legacy deal" });
		expect(r.exception).toBe(true);
		expect(r.total).toBe(6000);
		expect(r.lines).toHaveLength(1);
	});
});

describe("validators", () => {
	it("validates email and phone", () => {
		expect(emailError("a@b.co")).toBe("");
		expect(emailError("bad")).not.toBe("");
		expect(phoneError("077 123 4567")).toBe("");
		expect(phoneError("12ab")).not.toBe("");
		expect(phoneError("123")).not.toBe("");
	});
});
