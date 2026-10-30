import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, addProduct, line, noDiscount, openShift } from "./harness";
import { cartTotals } from "../domain/cart";
import { buildReport, saleFigures } from "../domain/reportBuilders";
import { calculateTaxes, cleanTax, cleanTaxRules, partsOf, previewTax, round2, taxError, taxUses } from "../domain/taxes";

const vat = cleanTax({ id: "vat", name: "VAT", rate: 18 });
const levy = cleanTax({ id: "levy", name: "Levy", rate: 2.5 });
const both = cleanTax({ id: "both", name: "VAT + Levy", isGroup: true, memberTaxIds: ["vat", "levy"] });
const taxes = [vat, levy, both];
const item = (price, qty = 1, category = "Food") => ({ productId: "p", name: "X", price, qty, category, modifiers: [] });

describe("tax maths", () => {
	it("rounds half-up to the cent", () => {
		expect(round2(0.125)).toBe(0.13);
		expect(round2(1.005)).toBe(1.01);
		expect(round2(2.499)).toBe(2.5);
	});
	it("adds nothing until an active tax exists", () => {
		expect(calculateTaxes({ cart: [item(100)], taxes: [] })).toEqual({ amount: 0, rows: [] });
		expect(calculateTaxes({ cart: [item(100)], taxes: [{ ...vat, status: "inactive" }], rules: cleanTaxRules({ defaultTaxId: "vat" }) }).amount).toBe(0);
		expect(calculateTaxes({ cart: [item(100)], taxes }).amount).toBe(0); // no default and no category tax: nothing to apply
	});
	it("taxes each line on the default tax, rounding per line", () => {
		const rules = cleanTaxRules({ defaultTaxId: "vat" });
		const r = calculateTaxes({ cart: [item(10.25), item(10.25)], taxes, rules });
		expect(r.rows).toEqual([{ id: "vat", name: "VAT", rate: 18, base: 20.5, amount: 3.7 }]); // 1.845 -> 1.85 each, not 3.69
	});
	it("a category tax beats the default, and a group applies each member separately", () => {
		const rules = cleanTaxRules({ defaultTaxId: "vat", categoryTaxes: { drinks: { tax: "both" } } });
		const r = calculateTaxes({ cart: [item(100, 1, "Drinks"), item(100, 1, "Food")], taxes, rules });
		expect(r.rows.map((x) => [x.id, x.base, x.amount])).toEqual([["vat", 200, 36], ["levy", 100, 2.5]]);
		expect(r.amount).toBe(38.5);
	});
	it("takes the discount off the amount taxed, shared across the lines", () => {
		const rules = cleanTaxRules({ defaultTaxId: "vat" });
		const r = calculateTaxes({ cart: [item(100), item(300)], discount: 40, taxes, rules }); // 10% off each
		expect(r.rows[0]).toMatchObject({ base: 360, amount: 64.8 });
	});
	it("uses the takeaway tax only on takeaway orders and only when switched on", () => {
		const cats = { food: { tax: "vat", takeaway: "levy" } };
		const cart = [item(100)];
		expect(calculateTaxes({ cart, taxes, channel: "Takeaway", rules: cleanTaxRules({ categoryTaxes: cats, takeawayOn: true }) }).rows[0].id).toBe("levy");
		expect(calculateTaxes({ cart, taxes, channel: "Dine-in", rules: cleanTaxRules({ categoryTaxes: cats, takeawayOn: true }) }).rows[0].id).toBe("vat");
		expect(calculateTaxes({ cart, taxes, channel: "Takeaway", rules: cleanTaxRules({ categoryTaxes: cats }) }).rows[0].id).toBe("vat");
	});
	it("taxes the service charge when asked", () => {
		const rules = cleanTaxRules({ serviceTaxOn: true, serviceTaxId: "vat" });
		expect(calculateTaxes({ cart: [item(100)], service: 10, taxes, rules }).rows[0]).toMatchObject({ base: 10, amount: 1.8 });
		expect(calculateTaxes({ cart: [item(100)], service: 10, taxes, rules: cleanTaxRules({ defaultTaxId: "vat" }) }).rows[0].base).toBe(100);
	});
	it("groups ignore inactive and missing members", () => {
		expect(partsOf("both", [vat, { ...levy, status: "inactive" }, both]).map((p) => p.id)).toEqual(["vat"]);
		expect(partsOf("nope", taxes)).toEqual([]);
	});
	it("previews and validates", () => {
		expect(previewTax(vat, taxes)).toEqual({ amount: 1000, tax: 180, total: 1180 });
		expect(previewTax(both, taxes).tax).toBe(205);
		expect(taxError(cleanTax({ id: "x", name: "" }), [])).toMatch(/name/);
		expect(taxError(cleanTax({ id: "x", name: "vat", rate: 1 }), [vat])).toMatch(/already/);
		expect(taxError(cleanTax({ id: "x", name: "A", rate: 101 }), [])).toMatch(/0 to 100/);
		expect(taxError(cleanTax({ id: "x", name: "G", isGroup: true }), [vat])).toMatch(/Choose/);
		expect(taxError(cleanTax({ id: "x", name: "G", isGroup: true, memberTaxIds: ["both"] }), taxes)).toMatch(/single/);
		expect(taxError(cleanTax({ id: "x", name: "A", rate: 12.3456 }), [])).toBe("");
		expect(cleanTax({ rate: 12.3456 }).rate).toBe(12.346);
		const rules = cleanTaxRules({ defaultTaxId: "vat", categoryTaxes: { food: { tax: "vat" } }, serviceTaxOn: true, serviceTaxId: "levy" });
		expect(taxUses("vat", taxes, rules)).toEqual(["the group VAT + Levy", "the default tax", "1 category"]);
		expect(taxUses("levy", taxes, rules)).toEqual(["the group VAT + Levy", "the service charge"]);
	});
});

describe("cart totals with tax", () => {
	it("are unchanged when no tax is published", () => {
		const t = cartTotals([item(100, 2)], { type: "percent", value: 10 }, { serviceChargeEnabled: true, serviceChargeRate: 10 }, true);
		expect(t).toMatchObject({ subtotal: 200, discount: 20, service: 18, tax: 0, taxRows: [], total: 198 });
	});
	it("add the tax on top of the discounted subtotal and service charge", () => {
		const settings = { taxes, taxRules: [cleanTaxRules({ defaultTaxId: "vat", serviceTaxOn: true, serviceTaxId: "vat" })], serviceChargeEnabled: true, serviceChargeRate: 10 };
		const t = cartTotals([item(100, 2)], { type: "percent", value: 10 }, settings, true);
		expect(t).toMatchObject({ discount: 20, service: 18, tax: 35.64 }); // 180 x 18% = 32.40, plus 18 x 18% = 3.24 on the service charge
		expect(t.total).toBe(180 + 18 + t.tax);
	});
});

describe("a sale with tax", () => {
	let h;
	beforeEach(async () => {
		h = await createHarness();
		await h.svc.settings.saveMenuEntity("taxes", { name: "VAT", rate: 18 });
		const [t] = h.data().settings.menuDraft.taxes;
		await h.svc.settings.saveMenuEntity("taxRules", { defaultTaxId: t.id });
		await h.svc.settings.publishMenu();
		await addProduct(h, { name: "Tea", price: "1000", cost: "100" });
		await openShift(h);
	});
	it("is drafted until published and then charged, as its own line", async () => {
		const tea = h.data().products.find((p) => p.name === "Tea");
		const sale = await h.svc.sales.completeSale({ cart: [line(tea, 2)], discount: noDiscount, payment: "Card" });
		const s = h.data().sales[0];
		expect(sale).toBeTruthy();
		expect(s.total).toBe(2360);
		const taxLine = s.lines.find((l) => l.code === "TAX");
		expect(taxLine).toMatchObject({ name: "VAT (18%)", price: 360, basePrice: 2000, isServiceCharge: true });
		expect(saleFigures(s)).toMatchObject({ item: 2000, tax: 360, tips: 0, net: 2000, gross: 2360, total: 2360 });
	});
	it("shows in the Taxes report and in the Sales overview", async () => {
		const tea = h.data().products.find((p) => p.name === "Tea");
		await h.svc.sales.completeSale({ cart: [line(tea, 1)], discount: noDiscount, payment: "Card" });
		const s = h.data().sales[0];
		const range = { from: s.date, to: s.date };
		const r = buildReport("taxes", "", { range, sales: h.data().sales, users: [] });
		expect(r.rows).toEqual([{ name: "VAT", rate: 18, sold: 1000, amount: 180 }]);
		expect(r.totals).toMatchObject({ sold: 1000, amount: 180 });
		expect(buildReport("taxes", "", { range, sales: [], users: [] }).note).toMatch(/Menu Admin/);
	});
	it("a full refund returns the tax too", async () => {
		const tea = h.data().products.find((p) => p.name === "Tea");
		await h.svc.sales.completeSale({ cart: [line(tea, 1)], discount: noDiscount, payment: "Card" });
		const s = h.data().sales[0];
		expect(s.total).toBe(1180);
		const { calculateRefundAmount } = await import("../domain/sales");
		expect(calculateRefundAmount(s, "full", [])).toBe(1180);
	});
	it("a business without taxes sells exactly as before", async () => {
		const h2 = await createHarness();
		await addProduct(h2, { name: "Tea", price: "1000", cost: "100" });
		await openShift(h2);
		await h2.svc.sales.completeSale({ cart: [line(h2.data().products[0], 1)], discount: noDiscount, payment: "Card" });
		const s = h2.data().sales[0];
		expect(s.total).toBe(1000);
		expect(s.lines.some((l) => l.code === "TAX")).toBe(false);
	});
});

describe("refunds with tax", () => {
	it("a partial refund returns the tax with the items and reports split it", async () => {
		const h = await createHarness();
		await h.svc.settings.saveMenuEntity("taxes", { name: "VAT", rate: 18 });
		await h.svc.settings.saveMenuEntity("taxRules", { defaultTaxId: h.data().settings.menuDraft.taxes[0].id });
		await h.svc.settings.publishMenu();
		await addProduct(h, { name: "Tea", price: "1000", cost: "100" });
		await openShift(h);
		await h.svc.sales.completeSale({ cart: [line(h.data().products[0], 2)], discount: noDiscount, payment: "Card" });
		const { refundableLines, calculateRefundAmount, applyReversal } = await import("../domain/sales");
		const sale = h.data().sales[0];
		expect(sale.total).toBe(2360);
		expect(refundableLines(sale).map((x) => x.line.name)).toEqual(["Tea"]); // the tax line is not offered on its own
		const lines = [{ lineIndex: 0, qty: 1, unitPrice: 1000 }];
		expect(calculateRefundAmount(sale, "partial", lines)).toBe(1180);
		const { sale: after } = applyReversal(sale, { type: "refund", reason: "x", userId: "u", refundType: "partial", refundLines: lines });
		expect(after.total).toBe(1180);
		expect(saleFigures(after)).toMatchObject({ item: 2000, refunds: 1000, tax: 180, net: 1000, gross: 1180 });
	});
});
