import { beforeEach, describe, expect, it } from "vitest";
import { cartTotals, serviceChargeAmount, serviceChargeAuto } from "../domain/cart";
import { FIELDS, defaultsFor, resolveOptions, validateOptions } from "../domain/systemOptions";
import { PERMISSION_KEYS, can } from "../domain/access";
import { addProduct, createHarness, line, noDiscount, openShift } from "./harness";

const biz = { serviceChargeEnabled: true, serviceChargeRate: 10 };
const cart = (price, qty = 1) => [{ key: "a", name: "Item", price, qty, productId: "a" }];
const rules = (o = {}) => ({ ...defaultsFor("serviceCharge"), ...o });
const nodisc = { type: "percent", value: 0 };

describe("service charge rules (domain)", () => {
	it("without rules it behaves as before: on whenever the business has it on", () => {
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true)).toBe(100);
		expect(serviceChargeAuto(cart(1000), { serviceChargeEnabled: false }, undefined)).toBe(false);
	});
	it("auto-apply off starts orders without the charge", () => {
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true, { rules: rules({ autoApply: false }), channel: "Dine-in" })).toBe(0);
	});
	it("a minimum order total adds it only above the amount, comparing the items before any discount", () => {
		const r = rules({ minOn: true, minTotal: 5000 });
		expect(serviceChargeAmount(cart(5000), nodisc, biz, true, { rules: r, channel: "Dine-in" })).toBe(0); // equal is not above
		expect(serviceChargeAmount(cart(5001), nodisc, biz, true, { rules: r, channel: "Dine-in" })).toBeCloseTo(500.1);
		expect(serviceChargeAmount(cart(6000), { type: "percent", value: 50 }, biz, true, { rules: r, channel: "Dine-in" })).toBe(300); // the discount lowers the charge, not the comparison
	});
	it("only the chosen order types get it automatically; other kinds of order are not limited", () => {
		const r = rules({ orderTypes: ["Dine-in"] });
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true, { rules: r, channel: "Dine-in" })).toBe(100);
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true, { rules: r, channel: "Takeaway" })).toBe(0);
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true, { rules: r, channel: "Retail" })).toBe(100);
	});
	it("a maximum caps the charge, even when staff switch it on", () => {
		const r = rules({ maxOn: true, maxCharge: 150 });
		expect(serviceChargeAmount(cart(10000), nodisc, biz, true, { rules: r, channel: "Dine-in" })).toBe(150);
		expect(serviceChargeAmount(cart(10000), nodisc, biz, true, { rules: r, channel: "Dine-in", override: true })).toBe(150);
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true, { rules: r, channel: "Dine-in" })).toBe(100);
	});
	it("the order's own choice beats the rules: on adds it, off removes it", () => {
		const r = rules({ autoApply: false });
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true, { rules: r, channel: "Dine-in", override: true })).toBe(100);
		expect(serviceChargeAmount(cart(1000), nodisc, biz, true, { rules: rules(), channel: "Dine-in", override: false })).toBe(0);
		expect(serviceChargeAmount(cart(1000), nodisc, { serviceChargeEnabled: false }, true, { override: true })).toBe(0); // the business has none
	});
	it("the order total includes the charge that applies", () => {
		expect(cartTotals(cart(1000), nodisc, biz, true, "Dine-in", { rules: rules({ orderTypes: ["Takeaway"] }) }).total).toBe(1000);
		expect(cartTotals(cart(1000), nodisc, biz, true, "Dine-in", { rules: rules() })).toMatchObject({ service: 100, total: 1100 });
	});
});

describe("service charge settings", () => {
	it("start as today: auto-apply on, every order type, no minimum, no maximum", () => {
		expect(defaultsFor("serviceCharge")).toMatchObject({ autoApply: true, minOn: false, maxOn: false });
		expect(defaultsFor("serviceCharge").orderTypes).toHaveLength(4);
		expect(Object.values(FIELDS.serviceCharge).every((f) => f.scope === "location")).toBe(true);
	});
	it("a location overrides the business default", () => {
		const s = { systemOptions: { org: { serviceCharge: { minOn: true, minTotal: 5000 } }, locations: { galle: { serviceCharge: { minTotal: 8000 } } } } };
		expect(resolveOptions(s, "serviceCharge", "main").minTotal).toBe(5000);
		expect(resolveOptions(s, "serviceCharge", "galle").minTotal).toBe(8000);
	});
	it("checks the amounts and the order types", () => {
		expect(validateOptions("serviceCharge", rules({ minOn: true, minTotal: 0 })).minTotal).toBeTruthy();
		expect(validateOptions("serviceCharge", rules({ maxOn: true, maxCharge: "" })).maxCharge).toBeTruthy();
		expect(validateOptions("serviceCharge", rules({ orderTypes: [] })).orderTypes).toBeTruthy();
		expect(validateOptions("serviceCharge", rules())).toEqual({});
	});
});

describe("removing the service charge from an order", () => {
	it("has its own permission, held by owners and managers but not cashiers", () => {
		expect(PERMISSION_KEYS).toContain("pos.serviceCharge.toggle");
		expect(can({ id: "m", role: "manager" }, "pos.serviceCharge.toggle", {})).toBe(true);
		expect(can({ id: "c", role: "cashier" }, "pos.serviceCharge.toggle", {})).toBe(false);
	});

	let h;
	beforeEach(async () => {
		h = await createHarness({ settings: { ...biz, businessType: "restaurant" } });
	});
	it("the owner approves without a PIN, a PIN of someone who may approves, a wrong PIN does not, and it is logged", async () => {
		expect((await h.svc.sales.serviceChargeRemoval({ detail: "Service charge removed" })).name).toBe("Owner");
		expect((await h.svc.sales.serviceChargeRemoval({ pin: "1234", detail: "x" })).name).toBe("Owner");
		expect(await h.svc.sales.serviceChargeRemoval({ pin: "9999", detail: "x" })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/PIN of a manager or owner/);
		expect(h.data().locationAudit.filter((a) => a.action === "service-charge-removed")).toHaveLength(2);
	});
	it("a cashier cannot remove it without a manager's PIN", async () => {
		const c = await createHarness({ role: "cashier", settings: { ...biz, businessType: "restaurant" } });
		expect(await c.svc.sales.serviceChargeRemoval({ detail: "x" })).toBeUndefined();
		expect(c.lastAlert()).toMatch(/PIN of a manager or owner/);
	});
});

describe("service charge when an order is paid", () => {
	const settings = (rulesPatch = {}) => ({ ...biz, businessType: "restaurant", systemOptions: { org: { serviceCharge: rulesPatch } } });
	const pay = async (h, p, qty, extra = {}) => (await h.svc.sales.completeSale({ cart: [line(p, qty)], discount: noDiscount, payment: "Card", orderChannel: "Dine-in", ...extra }))?.sale;
	const serviceOf = (sale) => (sale?.lines || []).find((l) => l.isServiceCharge && l.code === "SERVICE")?.price || 0;

	it("follows the rules: a small order is under the minimum and gets none, a large one gets it", async () => {
		const h = await createHarness({ settings: settings({ minOn: true, minTotal: 1000 }) });
		await openShift(h);
		const p = await addProduct(h, { name: "Roti", price: "400", cost: "10", type: "Service" });
		expect(serviceOf(await pay(h, p, 2))).toBe(0); // 800
		expect(serviceOf(await pay(h, p, 3))).toBe(120); // 1,200 at 10%
	});
	it("the order's own choice wins, and the cap still applies", async () => {
		const h = await createHarness({ settings: settings({ minOn: true, minTotal: 1000, maxOn: true, maxCharge: 50 }) });
		await openShift(h);
		const p = await addProduct(h, { name: "Roti", price: "400", cost: "10", type: "Service" });
		expect(serviceOf(await pay(h, p, 2, { serviceOverride: true }))).toBe(50); // switched on below the minimum, capped
		expect(serviceOf(await pay(h, p, 3, { serviceOverride: false }))).toBe(0); // switched off above it
	});
	it("an open order keeps the choice made for it", async () => {
		const h = await createHarness({ settings: settings() });
		const p = await addProduct(h, { name: "Roti", price: "400", cost: "10", type: "Service" });
		const order = await h.svc.sales.saveOpenOrder({ cart: [line(p)], discount: noDiscount, orderChannel: "Dine-in", serviceOverride: false });
		expect(h.data().openOrders.find((o) => o.id === order.id).serviceOverride).toBe(false);
	});
});
