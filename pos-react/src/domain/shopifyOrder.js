/**
 * Shopify order to POS open order (pure). The order arrives cut down by the server (netlify/lib/shopify.js sanitizeOrder).
 * Items are matched by SKU: first an item whose code is the SKU, then a stock item (Inventory) whose SKU it is, which leads to the item it counts
 * (a stock item that counts no item is drawn from directly, see stockRowForLine). An item that does not match is kept as a plain line at
 * Shopify's price, so no order is ever lost. The open order id is fixed by the Shopify order id, so two devices taking the same order write the same row, never two.
 * Shopify's discount and delivery charge become a discount and a "Delivery" line; the POS works out tax with its own tax settings.
 * The POS counts in LKR. A store in another currency has an exchange rate (LKR per 1 unit of its currency) and every amount is converted with it.
 */
export const POS_CURRENCY = "LKR";
const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** The rate to use for an order: 1 for an LKR order, the store's rate for its own currency, 0 (unknown: do not save) otherwise. */
export function rateFor(order, shop) {
	const cur = String(order?.currency || shop?.currency || POS_CURRENCY).toUpperCase();
	if (cur === POS_CURRENCY) return 1;
	return cur === String(shop?.currency || "").toUpperCase() && Number(shop?.rate) > 0 ? Number(shop.rate) : 0;
}
const code = (v) => String(v || "").trim().toUpperCase();

export const openOrderIdOf = (inboxId) => "shp" + inboxId;

/**
 * What a Shopify SKU stands for: { product, row } where `product` is the POS item to sell and `row` the stock row it came through (null when
 * the item's code matched), or { stock } for a stock item that counts no item, or null.
 */
export function matchSku(sku, products = [], inventory = []) {
	if (!code(sku)) return null;
	const byCode = products.find((p) => code(p.code) === code(sku));
	if (byCode) return { product: byCode, row: null };
	const row = inventory.find((i) => code(i.sku) === code(sku));
	if (!row) return null;
	const product = row.productId ? products.find((p) => String(p.id) === String(row.productId)) : null;
	return product ? { product, row } : { stock: row };
}

export function onlineLines(order, products = [], rate = 1, inventory = []) {
	const money = (v) => round(v * rate);
	const lines = (order.lines || []).map((l, i) => {
		const hit = matchSku(l.sku, products, inventory);
		const product = hit?.product;
		if (product) {
			const size = hit.row?.sizeName; // the SKU belongs to one size of the item: the line carries that size so its own stock row is used
			const modifiers = size ? [{ groupId: "size", groupName: "Size", optionName: size, price: 0 }] : [];
			return { ...product, productId: product.id, key: product.id + "|" + modifiers.map((m) => m.groupId + ":" + m.optionName).join("|"), basePrice: Number(product.price) || 0, price: money(l.price), modifiers, qty: l.qty };
		}
		if (hit?.stock) return { id: "shp-" + order.id + "-" + i, productId: "", stockItemId: hit.stock.id, key: "shp-" + order.id + "-" + i, name: hit.stock.name || l.title, basePrice: money(l.price), price: money(l.price), modifiers: [], qty: l.qty };
		const key = "shp-" + order.id + "-" + i;
		return { id: key, productId: "", key, name: l.variant ? `${l.title} (${l.variant})` : l.title, basePrice: money(l.price), price: money(l.price), modifiers: [], qty: l.qty, unmatched: true };
	});
	if (order.shipping > 0) lines.push({ id: "shp-" + order.id + "-delivery", productId: "", key: "shp-" + order.id + "-delivery", name: "Delivery", basePrice: money(order.shipping), price: money(order.shipping), modifiers: [], qty: 1 });
	return lines;
}

/**
 * The open order for one inbox row. `number` is the POS order number it gets. A past order pulled from the store (`row.imported`) is kept as it was:
 * "fulfilled" ones are shown as paid and fulfilled, "cancelled" ones as declined; neither makes a sale, takes stock or reaches the kitchen, and they
 * do not use up POS order numbers. Past orders that are still open arrive as New like any other.
 */
export function inboxToOpenOrder(row, { products, inventory = [], number, staffId = "", now, customerId = "", rate = 1 }) {
	const o = row.order || {};
	const past = row.imported && (row.history === "fulfilled" || row.history === "cancelled") ? row.history : "";
	const when = o.createdAt || now;
	const who = [o.customer?.name, o.customer?.phone].filter(Boolean).join(" · ");
	return {
		id: openOrderIdOf(row.id),
		orderNumber: past ? "SHP" + String(o.name || "").replace(/^#/, "") : number,
		openedAt: past ? when : now,
		createdAt: past ? when : now,
		updatedAt: past ? when : now,
		status: past === "fulfilled" ? "paid" : past === "cancelled" ? "voided" : "open",
		...(past === "fulfilled" ? { closedAt: when } : {}),
		...(past === "cancelled" ? { voidedAt: when, voidedBy: "shopify", voidReason: "Cancelled in Shopify" } : {}),
		staffId,
		customerId,
		orderReference: ["Shopify " + o.name, who].filter(Boolean).join(" · "),
		orderChannel: "Shopify",
		platformOrderId: o.name || "",
		lines: onlineLines(o, products, rate, inventory),
		discount: { type: "amount", value: round((o.discount || 0) * rate), amount: round((o.discount || 0) * rate) },
		kitchenSentAt: "",
		kitchenSendCount: 0,
		// where the order is in the online flow (accept, decline, fulfil): see domain/onlineFlow.js
		online: { shop: row.shop || "", shopifyOrderId: String(o.id || ""), state: past === "fulfilled" ? "fulfilled" : past === "cancelled" ? "declined" : "new", ...(row.imported ? { imported: true } : {}), ...(past === "fulfilled" ? { fulfilledAt: when } : {}), ...(past === "cancelled" ? { declinedAt: when, declineReason: "customer_asked", declineNote: "Cancelled in Shopify" } : {}), receivedAt: now, customer: { name: o.customer?.name || "", phone: o.customer?.phone || "", email: o.customer?.email || "" }, delivery: { address: o.delivery?.address || "", method: o.delivery?.method || "" }, note: o.note || "", financialStatus: o.financialStatus || "", currency: o.currency || "", tracking: { company: row.tracking?.company || "", number: row.tracking?.number || "", url: row.tracking?.url || "" }, shopify: past ? { status: "done", lastAction: "imported" } : { status: "none" } },
	};
}
