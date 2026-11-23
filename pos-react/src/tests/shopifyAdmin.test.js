import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import admin from "../../../netlify/lib/shopify-admin.js";
import oauth from "../../../netlify/lib/shopify-oauth.js";

const SHOP = "my-shop.myshopify.com";
let sent;
const reply = (...datas) => {
	let i = 0;
	return async (url, init) => {
		const body = init.body ? JSON.parse(init.body) : {};
		sent.push({ url, headers: init.headers, body });
		const data = datas[Math.min(i++, datas.length - 1)];
		return { ok: true, status: 200, json: async () => (data && data.__status ? data.__body : { data }) };
	};
};
beforeEach(() => {
	sent = [];
	process.env.SHOPIFY_CLIENT_ID = "client-id";
	process.env.SHOPIFY_CLIENT_SECRET = "client-secret";
	process.env.CEYLO_KEY_SECRET = "x".repeat(40);
	delete process.env.SHOPIFY_API_VERSION;
});

describe("Shopify Admin API calls", () => {
	it("tags an accepted order, with the store's token, on the pinned API version", async () => {
		await admin.acceptOrder(SHOP, "tok", "777", reply({ tagsAdd: { userErrors: [] } }));
		expect(sent[0].url).toBe(`https://${SHOP}/admin/api/2026-01/graphql.json`);
		expect(sent[0].headers["X-Shopify-Access-Token"]).toBe("tok");
		expect(sent[0].body.variables).toEqual({ id: "gid://shopify/Order/777", tags: ["pos-accepted"] });
	});

	it("cancels with the chosen reason and options, and trims the staff note", async () => {
		await admin.cancelOrder(SHOP, "tok", "777", { reason: "INVENTORY", refund: true, restock: false, notify: true, note: "n".repeat(400) }, reply({ orderCancel: { job: { id: "gid://shopify/Job/1" }, userErrors: [], orderCancelUserErrors: [] } }));
		expect(sent[0].body.query).toContain("orderCancel(");
		expect(sent[0].body.variables).toMatchObject({ orderId: "gid://shopify/Order/777", reason: "INVENTORY", refund: true, restock: false, notifyCustomer: true });
		expect(sent[0].body.variables.staffNote).toHaveLength(255);
	});

	it("falls back to the 'other' reason for anything Shopify does not know", async () => {
		await admin.cancelOrder(SHOP, "tok", "777", { reason: "bogus" }, reply({ orderCancel: { userErrors: [] } }));
		expect(sent[0].body.variables.reason).toBe("OTHER");
	});

	it("fulfils every open fulfilment order with the tracking and the e-mail choice", async () => {
		const lookup = { order: { fulfillmentOrders: { nodes: [{ id: "fo1", status: "OPEN" }, { id: "fo2", status: "CLOSED" }, { id: "fo3", status: "IN_PROGRESS" }] }, fulfillments: [] } };
		const out = await admin.fulfillOrder(SHOP, "tok", "777", { tracking: { company: "DHL", number: "123", url: "" }, notify: false }, reply(lookup, { fulfillmentCreate: { fulfillment: { id: "gid://shopify/Fulfillment/9" }, userErrors: [] } }));
		expect(out.fulfillmentId).toBe("gid://shopify/Fulfillment/9");
		expect(sent[1].body.variables.fulfillment).toEqual({ notifyCustomer: false, trackingInfo: { company: "DHL", number: "123" }, lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: "fo1" }, { fulfillmentOrderId: "fo3" }] });
	});

	it("fulfils without tracking, and treats an order Shopify already fulfilled as done", async () => {
		await admin.fulfillOrder(SHOP, "tok", "777", {}, reply({ order: { fulfillmentOrders: { nodes: [{ id: "fo1", status: "OPEN" }] }, fulfillments: [] } }, { fulfillmentCreate: { fulfillment: { id: "f" }, userErrors: [] } }));
		expect(sent[1].body.variables.fulfillment.trackingInfo).toBeUndefined();
		expect(sent[1].body.variables.fulfillment.notifyCustomer).toBe(true);
		const done = await admin.fulfillOrder(SHOP, "tok", "777", {}, reply({ order: { fulfillmentOrders: { nodes: [{ id: "fo1", status: "CLOSED" }] }, fulfillments: [{ id: "gid://shopify/Fulfillment/5" }] } }));
		expect(done).toEqual({ already: true, fulfillmentId: "gid://shopify/Fulfillment/5" });
	});

	it("explains when there is nothing to fulfil, and surfaces Shopify's own error text", async () => {
		await expect(admin.fulfillOrder(SHOP, "tok", "777", {}, reply({ order: { fulfillmentOrders: { nodes: [] }, fulfillments: [] } }))).rejects.toThrow(/nothing left to fulfil/);
		await expect(admin.cancelOrder(SHOP, "tok", "777", {}, reply({ orderCancel: { userErrors: [{ message: "Order already cancelled" }] } }))).rejects.toThrow("Order already cancelled");
	});

	it("updates the tracking of the existing shipment", async () => {
		await admin.updateTracking(SHOP, "tok", "777", { tracking: { company: "Aramex", number: "AR9" }, notify: true }, reply({ order: { fulfillments: [{ id: "gid://shopify/Fulfillment/5" }] } }, { fulfillmentTrackingInfoUpdate: { fulfillment: { id: "x" }, userErrors: [] } }));
		expect(sent[1].body.variables).toEqual({ fulfillmentId: "gid://shopify/Fulfillment/5", trackingInfoInput: { company: "Aramex", number: "AR9" }, notifyCustomer: true });
		await expect(admin.updateTracking(SHOP, "tok", "777", { tracking: {} }, reply({}))).rejects.toThrow(/tracking number or link/);
	});

	it("shows the same permission error once, not once per order", async () => {
		const many = async () => ({ ok: true, status: 200, json: async () => ({ errors: Array.from({ length: 25 }, () => ({ message: "Access denied for customer field. Required access: `read_customers` access scope." })) }) });
		await expect(admin.listOrders(SHOP, "tok", {}, many)).rejects.toThrow(/^Shopify access is missing a permission: Access denied for customer field\. Required access: `read_customers` access scope\.$/);
	});

	it("reports a refused token or missing permission as 'no access' so the POS can say Shopify access is not connected", async () => {
		const status = (n) => async () => ({ ok: false, status: n, json: async () => ({}) });
		await expect(admin.acceptOrder(SHOP, "tok", "777", status(401))).rejects.toMatchObject({ code: "no_access" });
		const denied = async () => ({ ok: true, status: 200, json: async () => ({ errors: [{ message: "Access denied for tagsAdd field. Required access: write_orders" }] }) });
		await expect(admin.acceptOrder(SHOP, "tok", "777", denied)).rejects.toMatchObject({ code: "no_access" });
	});
});

describe("connecting Shopify access", () => {
	it("builds the approval address with the scopes, the return address and a signed state", () => {
		const url = new URL(oauth.authorizeUrl(SHOP, "owner-1", "https://ceylonrylabs.io/.netlify/functions/shopify-oauth"));
		expect(url.origin + url.pathname).toBe(`https://${SHOP}/admin/oauth/authorize`);
		expect(url.searchParams.get("client_id")).toBe("client-id");
		expect(url.searchParams.get("scope")).toBe(admin.SCOPES.join(","));
		expect(oauth.readState(url.searchParams.get("state"))).toEqual({ ownerUid: "owner-1", shop: SHOP });
	});

	it("rejects a state that was changed, that is old, or that is not ours", () => {
		const state = oauth.makeState("owner-1", SHOP, 1000);
		expect(oauth.readState(state, 1000 + 60000)).toEqual({ ownerUid: "owner-1", shop: SHOP });
		expect(oauth.readState(state, 1000 + oauth.STATE_TTL_MS + 1)).toBe(null);
		const [body, sig] = state.split(".");
		const forged = Buffer.from(JSON.stringify({ o: "owner-2", s: SHOP, t: 1000, n: "x" })).toString("base64url") + "." + sig;
		expect(oauth.readState(forged, 2000)).toBe(null);
		expect(oauth.readState(body, 2000)).toBe(null);
		expect(oauth.readState("", 2000)).toBe(null);
	});

	it("accepts only a return signed by Shopify with the app's secret", () => {
		const params = { code: "abc", shop: SHOP, state: "s", timestamp: "1700000000" };
		const hmac = createHmac("sha256", "client-secret").update("code=abc&shop=" + SHOP + "&state=s&timestamp=1700000000").digest("hex");
		expect(oauth.verifyReturn({ ...params, hmac })).toBe(true);
		expect(oauth.verifyReturn({ ...params, code: "other", hmac })).toBe(false);
		expect(oauth.verifyReturn({ ...params, hmac: "00" })).toBe(false);
	});

	it("exchanges the code for the token, and fails clearly when Shopify refuses", async () => {
		const ok = async (url, init) => ({ ok: true, status: 200, json: async () => ({ access_token: "shpat_x", scope: "read_orders,write_orders" }) });
		expect(await oauth.exchangeCode(SHOP, "abc", ok)).toEqual({ token: "shpat_x", scope: "read_orders,write_orders" });
		const no = async () => ({ ok: false, status: 400, json: async () => ({}) });
		await expect(oauth.exchangeCode(SHOP, "abc", no)).rejects.toThrow(/did not give access/);
	});

	it("says what is missing when the app's credentials are not set", () => {
		delete process.env.SHOPIFY_CLIENT_ID;
		expect(() => oauth.authorizeUrl(SHOP, "o", "https://x")).toThrow(/SHOPIFY_CLIENT_ID/);
	});
});

describe("one app for every merchant, a dedicated app for a store that has one", () => {
	it("uses the POS's own app unless the store is listed in SHOPIFY_CUSTOM_APPS", () => {
		process.env.SHOPIFY_CLIENT_ID = "shared-id";
		process.env.SHOPIFY_CLIENT_SECRET = "shared-secret";
		process.env.SHOPIFY_CUSTOM_APPS = JSON.stringify({ [SHOP]: { id: "own-id", secret: "own-secret" } });
		expect(oauth.credentials(SHOP)).toEqual({ id: "own-id", secret: "own-secret" });
		expect(oauth.credentials("other.myshopify.com")).toEqual({ id: "shared-id", secret: "shared-secret" });
		expect(new URL(oauth.authorizeUrl(SHOP, "o", "https://x")).searchParams.get("client_id")).toBe("own-id");
		expect(new URL(oauth.authorizeUrl("other.myshopify.com", "o", "https://x")).searchParams.get("client_id")).toBe("shared-id");
		expect(oauth.appWebhookSecret("other.myshopify.com")).toBe("shared-secret");
		delete process.env.SHOPIFY_CUSTOM_APPS;
	});

	it("checks a return with the secret of the app that store uses", () => {
		process.env.SHOPIFY_CUSTOM_APPS = JSON.stringify({ [SHOP]: { id: "own-id", secret: "own-secret" } });
		const sign = (params, secret) => createHmac("sha256", secret).update(Object.keys(params).sort().map((k) => k + "=" + params[k]).join("&")).digest("hex");
		const mine = { shop: SHOP, timestamp: "1" };
		expect(oauth.verifyReturn({ ...mine, hmac: sign(mine, "own-secret") })).toBe(true);
		expect(oauth.verifyReturn({ ...mine, hmac: sign(mine, "shared-secret") })).toBe(false);
		const theirs = { shop: "other.myshopify.com", timestamp: "1" };
		expect(oauth.verifyReturn({ ...theirs, hmac: sign(theirs, "client-secret") })).toBe(true);
		delete process.env.SHOPIFY_CUSTOM_APPS;
	});

	it("ignores a broken SHOPIFY_CUSTOM_APPS and falls back to the shared app", () => {
		process.env.SHOPIFY_CUSTOM_APPS = "{not json";
		expect(oauth.credentials(SHOP)).toEqual({ id: "client-id", secret: "client-secret" });
		delete process.env.SHOPIFY_CUSTOM_APPS;
	});
});

describe("webhooks the app subscribes to, and past orders", () => {
	it("subscribes to order creation and cancellation, and accepts a subscription that already exists", async () => {
		await admin.subscribeOrderWebhooks(SHOP, "tok", "https://ceylonrylabs.io/.netlify/functions/shopify-webhook", reply({ webhookSubscriptionCreate: { webhookSubscription: { id: "w" }, userErrors: [] } }));
		expect(sent.map((c) => c.body.variables.topic)).toEqual(["ORDERS_CREATE", "ORDERS_CANCELLED"]);
		expect(sent[0].body.variables.webhookSubscription).toEqual({ callbackUrl: "https://ceylonrylabs.io/.netlify/functions/shopify-webhook", format: "JSON" });
		sent = [];
		await expect(admin.subscribeOrderWebhooks(SHOP, "tok", "https://x", reply({ webhookSubscriptionCreate: { userErrors: [{ message: "Address for this topic has already been taken" }] } }))).resolves.toBeTruthy();
		await expect(admin.subscribeOrderWebhooks(SHOP, "tok", "https://x", reply({ webhookSubscriptionCreate: { userErrors: [{ message: "Invalid address" }] } }))).rejects.toThrow("Invalid address");
	});

	const node = (extra = {}) => ({ legacyResourceId: "1001", name: "#1001", createdAt: "2026-10-01T10:00:00Z", cancelledAt: null, displayFulfillmentStatus: "FULFILLED", displayFinancialStatus: "PAID", currencyCode: "LKR", note: "n", email: "n@x.lk", phone: "+94771234567", billingAddress: { name: "Nimal Perera", phone: "+94771234567" }, shippingAddress: { name: "Nimal Perera", address1: "12 Lake Rd", city: "Galle", zip: "80000" }, shippingLines: { nodes: [{ title: "Standard" }] }, totalDiscountsSet: { shopMoney: { amount: "50.0" } }, totalShippingPriceSet: { shopMoney: { amount: "200.0" } }, totalTaxSet: { shopMoney: { amount: "0.0" } }, totalPriceSet: { shopMoney: { amount: "1400.0" } }, lineItems: { nodes: [{ title: "Latte", variantTitle: "Large", sku: "LAT-1", quantity: 2, originalUnitPriceSet: { shopMoney: { amount: "600.0" } } }] }, fulfillments: [{ trackingInfo: [{ company: "DHL", number: "123", url: "https://dhl.test/123" }] }], ...extra });

	it("turns an Admin API order into the webhook's order shape, with how far it got and its tracking", () => {
		const done = admin.orderFromAdmin(node());
		expect(done.history).toBe("fulfilled");
		expect(done.tracking).toEqual({ company: "DHL", number: "123", url: "https://dhl.test/123" });
		expect(done.order).toMatchObject({ id: "1001", name: "#1001", currency: "LKR", financial_status: "paid", total_price: "1400.0", customer: { first_name: "Nimal Perera", phone: "+94771234567", email: "n@x.lk" }, line_items: [{ title: "Latte", variant_title: "Large", sku: "LAT-1", quantity: 2, price: "600.0" }] });
		expect(admin.orderFromAdmin(node({ cancelledAt: "2026-10-02T00:00:00Z" })).history).toBe("cancelled");
		expect(admin.orderFromAdmin(node({ displayFulfillmentStatus: "UNFULFILLED", fulfillments: [] })).history).toBe("open");
		expect(admin.orderFromAdmin(node({ displayFulfillmentStatus: "PARTIALLY_FULFILLED" })).history).toBe("open");
		expect(admin.orderFromAdmin({}).order.line_items).toEqual([]);
		// no shipping address (collection): the name falls back to the billing address, and the order's own phone and e-mail are used
		const pickup = admin.orderFromAdmin(node({ shippingAddress: null, phone: null }));
		expect(pickup.order.shipping_address).toBe(null);
		expect(pickup.order.customer).toEqual({ first_name: "Nimal Perera", phone: "+94771234567", email: "n@x.lk" });
	});

	it("asks for one page of orders since a date, oldest first, and says whether there is more", async () => {
		const out = await admin.listOrders(SHOP, "tok", { since: "2026-09-01", cursor: "abc", pageSize: 25 }, reply({ orders: { pageInfo: { hasNextPage: true, endCursor: "next" }, nodes: [node(), node({ legacyResourceId: "1002", name: "#1002" })] } }));
		expect(sent[0].body.variables).toEqual({ first: 25, after: "abc", query: "created_at:>=2026-09-01" });
		expect(sent[0].body.query).not.toMatch(/customer\s*\{/); // the separate customer record needs read_customers, which the app does not have
		expect(sent[0].body.query).toContain("sortKey: CREATED_AT");
		expect(out).toMatchObject({ hasMore: true, cursor: "next" });
		expect(out.orders.map((o) => o.order.name)).toEqual(["#1001", "#1002"]);
		sent = [];
		await admin.listOrders(SHOP, "tok", { since: "not a date", pageSize: 500 }, reply({ orders: { pageInfo: {}, nodes: [] } }));
		expect(sent[0].body.variables).toEqual({ first: 50, after: null, query: null });
	});
});
