import { beforeEach, describe, expect, it, vi } from "vitest";
import { addProduct, createHarness, openShift } from "./harness";

// the cloud is "on" and every call to a Netlify function is recorded and answered by `reply`
const calls = [];
let reply = () => ({ ok: true });
const printed = [];
vi.mock("../config/env", async (orig) => ({ ...(await orig()), isAppwrite: () => true }));
vi.mock("../services/appwrite/appwriteCompat", () => ({ getAppwriteCompat: () => ({ auth: () => ({ currentUser: { getIdToken: async () => "jwt" } }) }) }));
vi.mock("../services/printing/printDocument", async (orig) => ({ ...(await orig()), printHtmlInFrame: (html, title) => printed.push({ html, title }) }));
globalThis.fetch = async (url, init) => {
	const body = JSON.parse(init.body);
	calls.push({ url, body });
	const r = reply(url, body);
	return { ok: r.status ? r.status < 400 : r.ok !== false, status: r.status || 200, json: async () => r };
};

const { storeOnlineOrders, acceptOnlineOrder, declineOnlineOrder, fulfillOnlineOrder, saveOnlineTracking, printOnlinePackingSlip, retryOnlineShopify, pullOnlineOrders, importPastOrders } = await import("../services/pos/onlineOrders");
const shopify = (await import("../../../netlify/lib/shopify.js")).default;

const raw = { id: 777, name: "#1007", currency: "LKR", financial_status: "paid", total_price: "1400.00", customer: { first_name: "Nimal", last_name: "Perera", phone: "+94771234567", email: "n@x.lk" }, shipping_address: { address1: "12 Lake Rd", city: "Galle" }, note: "Ring the bell", line_items: [{ title: "Latte", sku: "LAT-1", quantity: 2, price: "700.00" }] };
const row = (id = "o777", extra = {}) => ({ id, shop: "my-shop.myshopify.com", order: shopify.sanitizeOrder({ ...raw, id: Number(id.slice(1)), ...extra }) });
const shopifyCalls = () => calls.filter((c) => /shopify-order-action/.test(c.url));

let h;
const online = () => h.data().openOrders.find((o) => o.id === "shpo777");
const setup = async (settings = {}) => {
	h = await createHarness({ settings });
	await openShift(h);
	await addProduct(h, { name: "Latte", code: "LAT-1", type: "Product", price: "700", stock: "10" });
	await storeOnlineOrders(h.ctx, [row()]);
	await h.refresh();
};

beforeEach(() => {
	calls.length = 0;
	printed.length = 0;
	reply = () => ({ ok: true });
});

describe("accepting an online order", () => {
	it("keeps it on the Online Orders page, marks it accepted and tells the store", async () => {
		await setup();
		await acceptOnlineOrder(h.ctx, "shpo777");
		await h.refresh();
		expect(online()).toMatchObject({ status: "open", online: { state: "accepted", shopify: { status: "done", lastAction: "accept" } } });
		expect(shopifyCalls()[0].body).toMatchObject({ action: "accept", shop: "my-shop.myshopify.com", orderId: "777" });
	});

	it("sends it to the kitchen then, when the business chose that", async () => {
		await setup({ businessType: "restaurant", onlineStore: { autoKitchen: true } });
		await acceptOnlineOrder(h.ctx, "shpo777");
		await h.refresh();
		expect(online().kitchenSentAt).toBeTruthy();
		expect(h.data().kitchenTickets.length).toBeGreaterThan(0);
	});

	it("asks first when an item is short on stock, and does nothing if staff say no", async () => {
		await setup();
		const row0 = h.data().inventory.find((i) => i.name === "Latte" || i.productId);
		await h.svc.inventory.saveInventoryItem({ ...row0, qty: "1" });
		await h.refresh();
		const answers = h.answers;
		answers.confirm = false;
		expect(await acceptOnlineOrder(h.ctx, "shpo777")).toBe(null);
		await h.refresh();
		expect(online().online.state).toBe("new");
		expect(shopifyCalls()).toHaveLength(0);
	});

	it("says so when the store cannot be updated, keeps the work done here and lets staff try again", async () => {
		await setup();
		reply = () => ({ ok: false, status: 503, error: "Shopify is busy" });
		await acceptOnlineOrder(h.ctx, "shpo777");
		await h.refresh();
		expect(online().online).toMatchObject({ state: "accepted", shopify: { status: "failed", error: "Shopify is busy" } });
		reply = () => ({ ok: true });
		await retryOnlineShopify(h.ctx, "shpo777");
		await h.refresh();
		expect(online().online.shopify.status).toBe("done");
		expect(shopifyCalls()).toHaveLength(2);
	});

	it("marks the store as not connected when it has no Shopify access", async () => {
		await setup();
		reply = () => ({ ok: false, status: 409, code: "no_access", error: "Shopify access is not connected." });
		await acceptOnlineOrder(h.ctx, "shpo777");
		await h.refresh();
		expect(online().online.shopify.status).toBe("none");
	});
});

describe("declining an online order", () => {
	it("cancels it here (voided, with the reason) and in the store with the chosen options", async () => {
		await setup();
		await declineOnlineOrder(h.ctx, "shpo777", { reason: "out_of_stock", note: "No milk", refund: true, restock: false, notify: true });
		await h.refresh();
		expect(online()).toMatchObject({ status: "voided", voidReason: "Out of stock: No milk", online: { state: "declined", declineReason: "out_of_stock" } });
		expect(shopifyCalls()[0].body).toMatchObject({ action: "decline", options: { reason: "INVENTORY", note: "No milk", refund: true, restock: false, notify: true } });
	});

	it("cannot be done to an order that is already fulfilled or declined", async () => {
		await setup();
		await declineOnlineOrder(h.ctx, "shpo777", { reason: "closed" });
		await h.refresh();
		expect(await declineOnlineOrder(h.ctx, "shpo777", { reason: "closed" })).toBe(null);
		expect(shopifyCalls()).toHaveLength(1);
	});
});

describe("fulfilling an online order", () => {
	it("needs the order to be accepted first", async () => {
		await setup();
		expect(await fulfillOnlineOrder(h.ctx, "shpo777", {})).toBe(null);
		expect(h.data().sales).toHaveLength(0);
	});

	it("records the paid sale on the Shopify payment type, takes the stock, keeps the tracking and tells the store", async () => {
		await setup();
		await acceptOnlineOrder(h.ctx, "shpo777");
		await h.refresh();
		calls.length = 0;
		await fulfillOnlineOrder(h.ctx, "shpo777", { tracking: { company: " DHL ", number: " 123456 ", url: "https://dhl.test/t/123456" }, notify: true });
		await h.refresh();
		const sale = h.data().sales[0];
		expect(sale).toMatchObject({ payment: "Shopify", orderChannel: "Shopify", platformOrderId: "#1007" });
		expect(online()).toMatchObject({ status: "paid", saleId: sale.id, online: { state: "fulfilled", tracking: { company: "DHL", number: "123456", url: "https://dhl.test/t/123456" }, shopify: { status: "done", lastAction: "fulfill" } } });
		expect(h.data().inventory.find((i) => i.productId).qty).toBe(8);
		expect(shopifyCalls()[0].body).toMatchObject({ action: "fulfill", orderId: "777", options: { tracking: { company: "DHL", number: "123456" }, notify: true } });
	});

	it("is not stopped by stock that ran short, because the order is already paid", async () => {
		await setup();
		await acceptOnlineOrder(h.ctx, "shpo777");
		const inv = h.data().inventory.find((i) => i.productId);
		await h.svc.inventory.saveInventoryItem({ ...inv, qty: "1" });
		await h.refresh();
		await fulfillOnlineOrder(h.ctx, "shpo777", {});
		await h.refresh();
		expect(h.data().sales).toHaveLength(1);
	});

	it("asks for the delivery company when a tracking number is given without one", async () => {
		await setup();
		await acceptOnlineOrder(h.ctx, "shpo777");
		await h.refresh();
		expect(await fulfillOnlineOrder(h.ctx, "shpo777", { tracking: { number: "123" } })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/delivery company/);
		expect(h.data().sales).toHaveLength(0);
	});
});

describe("tracking and the packing label", () => {
	it("tracking added after fulfilment goes to the store as an update", async () => {
		await setup();
		await acceptOnlineOrder(h.ctx, "shpo777");
		await h.refresh();
		await fulfillOnlineOrder(h.ctx, "shpo777", {});
		await h.refresh();
		calls.length = 0;
		await saveOnlineTracking(h.ctx, "shpo777", { tracking: { company: "Aramex", number: "AR9", url: "" }, notify: false });
		await h.refresh();
		expect(online().online.tracking).toMatchObject({ company: "Aramex", number: "AR9" });
		expect(shopifyCalls()[0].body).toMatchObject({ action: "tracking", options: { notify: false } });
	});

	it("tracking added before fulfilment is only kept until the order is fulfilled", async () => {
		await setup();
		await saveOnlineTracking(h.ctx, "shpo777", { tracking: { company: "DHL", number: "1" } });
		await h.refresh();
		expect(online().online.tracking.number).toBe("1");
		expect(shopifyCalls()).toHaveLength(0);
	});

	it("prints a label with the customer, address, items, note and tracking", async () => {
		await setup();
		await saveOnlineTracking(h.ctx, "shpo777", { tracking: { company: "DHL", number: "TRK1" } });
		await h.refresh();
		await printOnlinePackingSlip(h.ctx, "shpo777");
		await h.refresh();
		const html = printed[0].html;
		for (const text of ["#1007", "Nimal Perera", "12 Lake Rd", "+94771234567", "2 x", "Latte", "SKU LAT-1", "Ring the bell", "DHL TRK1"]) expect(html).toContain(text);
		expect(online().online.packingPrintedAt).toBeTruthy();
	});

	it("escapes anything a customer typed", async () => {
		await setup();
		await storeOnlineOrders(h.ctx, [row("o778", { note: "<script>alert(1)</script>" })]);
		await h.refresh();
		await printOnlinePackingSlip(h.ctx, "shpo778");
		expect(printed[0].html).not.toContain("<script>alert(1)");
		expect(printed[0].html).toContain("&lt;script&gt;alert(1)");
	});
});

describe("an order cancelled in Shopify", () => {
	it("is cancelled here too if it was not fulfilled, and staff are told", async () => {
		await setup();
		reply = (url, body) => (/inbox/.test(url) && body.action === "pull" ? { ok: true, orders: [], cancelled: [{ id: "o777", name: "#1007" }] } : { ok: true });
		await pullOnlineOrders(h.ctx);
		await h.refresh();
		expect(online()).toMatchObject({ status: "voided", voidReason: "Cancelled in Shopify", online: { state: "declined" } });
		expect(h.lastAlert()).toMatch(/Shopify cancelled #1007/);
	});
});

describe("past orders pulled from the store", () => {
	const past = (id, history, extra = {}) => ({ id, shop: "my-shop.myshopify.com", order: shopify.sanitizeOrder({ ...raw, id: Number(id.slice(1)), name: "#" + id.slice(1) }), imported: true, history, tracking: { company: "DHL", number: "T" + id, url: "" }, ...extra });
	const ids = () => h.data().openOrders.map((o) => o.id).sort();

	it("are kept as history: fulfilled as paid and fulfilled, cancelled as declined, with their own number and no sale, stock or kitchen", async () => {
		h = await createHarness({ settings: { businessType: "restaurant", onlineStore: { autoKitchen: true } } });
		await addProduct(h, { name: "Latte", code: "LAT-1", type: "Product", price: "700", stock: "10" });
		const before = h.data().inventory.find((i) => i.productId).qty;
		const numbers = await storeOnlineOrders(h.ctx, [past("o801", "fulfilled"), past("o802", "cancelled")]);
		await h.refresh();
		const done = h.data().openOrders.find((o) => o.id === "shpo801");
		const cancelled = h.data().openOrders.find((o) => o.id === "shpo802");
		expect(done).toMatchObject({ status: "paid", orderNumber: "SHP801", platformOrderId: "#801", online: { state: "fulfilled", imported: true, tracking: { company: "DHL", number: "To801" }, shopify: { status: "done" } } });
		expect(cancelled).toMatchObject({ status: "voided", voidReason: "Cancelled in Shopify", online: { state: "declined", imported: true } });
		expect(numbers).toHaveLength(2);
		expect(h.data().sales).toHaveLength(0);
		expect(h.data().kitchenTickets).toHaveLength(0);
		expect(h.data().inventory.find((i) => i.productId).qty).toBe(before);
	});

	it("do not use up POS order numbers, and a past order that is still open arrives as New like any other", async () => {
		await setup();
		await storeOnlineOrders(h.ctx, [past("o801", "fulfilled"), past("o803", "open")]);
		await h.refresh();
		const open = h.data().openOrders.find((o) => o.id === "shpo803");
		expect(open).toMatchObject({ status: "open", online: { state: "new", imported: true } });
		expect(open.orderNumber).toMatch(/^ORD-\d{4}$/);
		const next = await storeOnlineOrders(h.ctx, [row("o804")]);
		const used = (n) => Number(String(n).replace(/\D/g, ""));
		expect(used(next[0])).toBe(used(open.orderNumber) + 1); // the history order took no number in between
	});

	it("add their customers to the CRM", async () => {
		await setup();
		await storeOnlineOrders(h.ctx, [past("o801", "fulfilled")]);
		await h.refresh();
		expect(h.data().customers.some((c) => c.name === "Nimal Perera" && /Shopify/.test(c.tags))).toBe(true);
	});

	it("are listed under Online Orders with the others, in every state", async () => {
		await setup();
		await storeOnlineOrders(h.ctx, [past("o801", "fulfilled"), past("o802", "cancelled")]);
		await h.refresh();
		expect(ids()).toEqual(["shpo777", "shpo801", "shpo802"]);
	});
});

describe("importing past orders", () => {
	it("asks the server page by page, brings the orders onto this device and reports progress", async () => {
		await setup();
		const pages = [{ ok: true, imported: 2, skipped: 0, hasMore: true, cursor: "c1" }, { ok: true, imported: 1, skipped: 1, hasMore: false, cursor: "" }];
		const inbox = [[{ ...row("o901"), imported: true, history: "fulfilled" }, { ...row("o902"), imported: true, history: "cancelled" }, { ...row("o903"), imported: true, history: "fulfilled" }], []];
		reply = (url, body) => (/orders-import/.test(url) ? pages.shift() : /inbox/.test(url) && body.action === "pull" ? { ok: true, orders: inbox.shift() || [], cancelled: [] } : { ok: true });
		const progress = [];
		const out = await importPastOrders(h.ctx, { shop: "my-shop.myshopify.com", since: "2026-09-01", onProgress: (p) => progress.push(p) });
		await h.refresh();
		expect(out).toEqual({ imported: 3, skipped: 1, saved: 3 });
		const importCalls = calls.filter((c) => /orders-import/.test(c.url)).map((c) => c.body);
		expect(importCalls).toEqual([{ shop: "my-shop.myshopify.com", since: "2026-09-01", cursor: "" }, { shop: "my-shop.myshopify.com", since: "2026-09-01", cursor: "c1" }]);
		expect(progress.at(-1)).toEqual({ imported: 3, skipped: 1, saved: 3 });
		expect(h.data().openOrders.filter((o) => o.online?.imported)).toHaveLength(3);
	});

	it("stops with Shopify's message when the server refuses", async () => {
		await setup();
		reply = () => ({ ok: false, status: 409, code: "no_access", error: "Connect Shopify access for this store first." });
		await expect(importPastOrders(h.ctx, { shop: "my-shop.myshopify.com", since: "2026-09-01" })).rejects.toThrow("Connect Shopify access for this store first.");
	});
});
