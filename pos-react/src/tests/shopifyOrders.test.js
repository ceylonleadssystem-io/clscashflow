import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import shopify from "../../../netlify/lib/shopify.js";
import { inboxToOpenOrder, onlineLines, openOrderIdOf } from "../domain/shopifyOrder";
import { orderTotal } from "../domain/orders";
import { openOnlineOrders } from "../domain/onlineOrders";
import { addProduct, createHarness } from "./harness";
import { storeOnlineOrders } from "../services/pos/onlineOrders";

const { normalizeShop, shopKey, verifySignature, sanitizeOrder } = shopify;

const raw = { id: 450789469, name: "#1001", created_at: "2026-11-19T10:00:00+05:30", currency: "LKR", financial_status: "paid", total_price: "1400.00", total_discounts: "50.00", total_tax: "0.00", total_shipping_price_set: { shop_money: { amount: "200.00" } }, customer: { first_name: "Nimal", last_name: "Perera", phone: "+94771234567", email: "n@x.lk" }, shipping_address: { address1: "12 Lake Rd", city: "Galle", zip: "80000" }, shipping_lines: [{ title: "Standard", price: "200.00" }], line_items: [{ title: "Latte", variant_title: "Large", sku: "LAT-1", quantity: 2, price: "600.00", properties: [{ name: "secret", value: "x" }] }, { title: "Gift card", sku: "", quantity: 1, price: "50.00" }] };

describe("Shopify webhook helpers", () => {
	it("accepts only a genuine signature over the exact body", () => {
		const body = Buffer.from(JSON.stringify(raw));
		const good = createHmac("sha256", "s3cret-signing-key").update(body).digest("base64");
		expect(verifySignature(body, good, "s3cret-signing-key")).toBe(true);
		expect(verifySignature(body, good, "another-secret-key!")).toBe(false);
		expect(verifySignature(Buffer.from(JSON.stringify({ ...raw, id: 1 })), good, "s3cret-signing-key")).toBe(false);
		expect(verifySignature(body, "", "s3cret-signing-key")).toBe(false);
		expect(verifySignature(body, "AAAA", "s3cret-signing-key")).toBe(false);
	});

	it("recognises Shopify store addresses only", () => {
		expect(normalizeShop("My-Shop.myshopify.com")).toBe("my-shop.myshopify.com");
		expect(normalizeShop("https://my-shop.myshopify.com/admin")).toBe("my-shop.myshopify.com");
		expect(normalizeShop("evil.com")).toBe("");
		expect(normalizeShop("my-shop.myshopify.com.evil.com")).toBe("");
		expect(shopKey("my-shop.myshopify.com")).toBe("my-shop_myshopify_com");
	});

	it("keeps only what the POS needs from an order", () => {
		const o = sanitizeOrder(raw);
		expect(o).toMatchObject({ id: "450789469", name: "#1001", total: 1400, discount: 50, shipping: 200, customer: { name: "Nimal Perera", phone: "+94771234567" }, delivery: { address: "12 Lake Rd, Galle, 80000" } });
		expect(o.lines[0]).toEqual({ title: "Latte", variant: "Large", sku: "LAT-1", qty: 2, price: 600 });
		expect(JSON.stringify(o)).not.toContain("secret");
		expect(sanitizeOrder(null).lines).toEqual([]);
	});
});

describe("Shopify order to open order", () => {
	const order = sanitizeOrder(raw);
	const products = [{ id: "p1", name: "Latte", code: "lat-1", price: 550, recipe: [] }];

	it("matches items by SKU = item code, keeps the rest as plain lines and adds delivery", () => {
		const lines = onlineLines(order, products);
		expect(lines[0]).toMatchObject({ productId: "p1", name: "Latte", price: 600, qty: 2 });
		expect(lines[1]).toMatchObject({ productId: "", name: "Gift card", price: 50, unmatched: true });
		expect(lines[2]).toMatchObject({ name: "Delivery", price: 200 });
	});

	it("becomes a Shopify open order whose total is Shopify's total", () => {
		const o = inboxToOpenOrder({ id: "o450789469", order }, { products, number: "ORD-0007", now: "2026-11-19T05:00:00Z" });
		expect(o).toMatchObject({ id: openOrderIdOf("o450789469"), orderChannel: "Shopify", platformOrderId: "#1001", status: "open", orderNumber: "ORD-0007" });
		expect(o.orderReference).toBe("Shopify #1001 · Nimal Perera · +94771234567");
		expect(orderTotal(o)).toBe(order.total); // 2 x 600 + 50 + 200 delivery - 50 discount = 1400
	});
});

describe("saving online orders in the POS", () => {
	it("creates each order once, numbered in the POS sequence, even when two devices take it", async () => {
		const h = await createHarness();
		await addProduct(h, { name: "Latte", code: "LAT-1" });
		const rows = [{ id: "o450789469", order: sanitizeOrder(raw) }, { id: "o450789470", order: sanitizeOrder({ ...raw, id: 450789470, name: "#1002" }) }];
		const numbers = await storeOnlineOrders(h.ctx, rows);
		await h.refresh();
		expect(numbers).toHaveLength(2);
		const saved = openOnlineOrders(h.data().openOrders);
		expect(saved).toHaveLength(2);
		expect(saved.every((o) => o.locationId === "loc-main")).toBe(true);
		expect(saved.find((o) => o.platformOrderId === "#1001").lines[0].productId).toBeTruthy(); // matched the Latte by SKU
		expect(await storeOnlineOrders(h.ctx, rows)).toEqual([]); // the same orders again change nothing
		await h.refresh();
		expect(h.data().openOrders).toHaveLength(2);
		const next = await storeOnlineOrders(h.ctx, [{ id: "o450789471", order: sanitizeOrder({ ...raw, id: 450789471, name: "#1003" }) }]);
		expect(next[0]).not.toBe(numbers[0]);
		expect(next[0]).not.toBe(numbers[1]);
	});
});

import { rateFor } from "../domain/shopifyOrder";
import { FEATURE_MAP, defaultFeatureFlags, resolveFeatures, VIEW_FEATURE } from "../config/features";
import { FEATURE_PRESETS, presetFlags } from "../config/featurePresets";
import { FEATURES } from "../config/features";
import { line, noDiscount, openShift } from "./harness";

describe("exchange rate", () => {
	it("is 1 for LKR, the store's rate for its own currency and unknown (0) otherwise", () => {
		expect(rateFor({ currency: "LKR" }, { currency: "LKR", rate: 1 })).toBe(1);
		expect(rateFor({ currency: "USD" }, { currency: "USD", rate: 300 })).toBe(300);
		expect(rateFor({ currency: "USD" }, { currency: "EUR", rate: 330 })).toBe(0);
		expect(rateFor({ currency: "USD" }, { currency: "USD" })).toBe(0);
		expect(rateFor({}, undefined)).toBe(1);
	});

	it("converts every amount of the order", () => {
		const order = sanitizeOrder({ ...raw, currency: "USD", total_price: "4.67" });
		const o = inboxToOpenOrder({ id: "o1", order }, { products: [], number: "ORD-0001", now: "2026-11-19T05:00:00Z", rate: 300 });
		expect(o.lines.map((l) => l.price)).toEqual([180000, 15000, 60000]); // 600, 50 and 200 USD at 300
		expect(o.discount.amount).toBe(15000);
	});
});

describe("online orders switch (admin Features tab)", () => {
	it("is a feature that is off until an admin turns it on, in every business category", () => {
		expect(FEATURE_MAP["online.shopify"].default).toBe(false);
		expect(defaultFeatureFlags()["online.shopify"]).toBe(false);
		expect(resolveFeatures({})["online.shopify"] ?? resolveFeatures({}).enabled?.["online.shopify"]).toBeFalsy();
		for (const p of FEATURE_PRESETS) expect(presetFlags(p, FEATURES)["online.shopify"]).toBe(false);
		expect(VIEW_FEATURE.online).toBe("online.shopify");
	});
});

describe("online orders in the POS", () => {
	it("are sent to the kitchen on arrival when the business chose that", async () => {
		const h = await createHarness({ settings: { businessType: "restaurant", onlineStore: { autoKitchen: true } } });
		const numbers = await storeOnlineOrders(h.ctx, [{ id: "o1", order: sanitizeOrder(raw) }]);
		await h.refresh();
		const saved = h.data().openOrders.find((o) => o.platformOrderId === "#1001");
		expect(numbers).toHaveLength(1);
		expect(saved.kitchenSentAt).toBeTruthy();
		expect(saved.kitchenSendCount).toBe(1);
		expect(h.data().kitchenTickets.length).toBeGreaterThan(0);
	});

	it("wait for staff when that is off", async () => {
		const h = await createHarness({ settings: { businessType: "restaurant" } });
		await storeOnlineOrders(h.ctx, [{ id: "o1", order: sanitizeOrder(raw) }]);
		await h.refresh();
		expect(h.data().openOrders[0].kitchenSentAt).toBeFalsy();
		expect(h.data().kitchenTickets).toHaveLength(0);
	});

	it("are not saved when the store has no rate for their currency, and arrive once it has one", async () => {
		const h = await createHarness();
		const usd = { id: "o9", order: sanitizeOrder({ ...raw, id: 9, currency: "USD" }), rate: 0 };
		expect(await storeOnlineOrders(h.ctx, [usd])).toEqual([]);
		expect(h.lastAlert()).toMatch(/exchange rate/);
		expect(await storeOnlineOrders(h.ctx, [{ ...usd, rate: 300 }])).toHaveLength(1);
	});

	it("keep the Shopify channel and order number when they are paid, in a shop with no kitchen too", async () => {
		const h = await createHarness({ settings: { businessType: "retail", thirdPartyPayments: [{ id: "tp1", name: "Shopify", active: true }] } });
		await openShift(h);
		const tea = await addProduct(h, { name: "Tea" });
		const res = await h.svc.sales.completeSale({ cart: [line(tea, 1)], discount: noDiscount, payment: "Shopify", orderChannel: "Shopify", platformOrderId: "#1001" });
		expect(res.sale).toMatchObject({ orderChannel: "Shopify", platformOrderId: "#1001", payment: "Shopify" });
	});
});
