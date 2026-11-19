/**
 * Shopify order to POS open order (pure). The order arrives cut down by the server (netlify/lib/shopify.js sanitizeOrder).
 * Items are matched to POS items by SKU = item code; an item that does not match is kept as a plain line at Shopify's price, so no order is
 * ever lost. The open order id is fixed by the Shopify order id, so two devices taking the same order write the same row, never two.
 * Shopify's discount and delivery charge become a discount and a "Delivery" line; the POS works out tax with its own tax settings.
 */
const code = (v) => String(v || "").trim().toUpperCase();

export const openOrderIdOf = (inboxId) => "shp" + inboxId;

export function onlineLines(order, products = []) {
	const lines = (order.lines || []).map((l, i) => {
		const product = l.sku ? products.find((p) => code(p.code) === code(l.sku)) : null;
		if (product) return { ...product, productId: product.id, key: product.id + "|", basePrice: Number(product.price) || 0, price: l.price, modifiers: [], qty: l.qty };
		const key = "shp-" + order.id + "-" + i;
		return { id: key, productId: "", key, name: l.variant ? `${l.title} (${l.variant})` : l.title, basePrice: l.price, price: l.price, modifiers: [], qty: l.qty, unmatched: true };
	});
	if (order.shipping > 0) lines.push({ id: "shp-" + order.id + "-delivery", productId: "", key: "shp-" + order.id + "-delivery", name: "Delivery", basePrice: order.shipping, price: order.shipping, modifiers: [], qty: 1 });
	return lines;
}

/** The open order for one inbox row. `number` is the POS order number it gets. */
export function inboxToOpenOrder(row, { products, number, staffId = "", now }) {
	const o = row.order || {};
	const who = [o.customer?.name, o.customer?.phone].filter(Boolean).join(" · ");
	return {
		id: openOrderIdOf(row.id),
		orderNumber: number,
		openedAt: now,
		createdAt: now,
		updatedAt: now,
		status: "open",
		staffId,
		customerId: "",
		orderReference: ["Shopify " + o.name, who].filter(Boolean).join(" · "),
		orderChannel: "Shopify",
		platformOrderId: o.name || "",
		lines: onlineLines(o, products),
		discount: { type: "amount", value: o.discount || 0, amount: o.discount || 0 },
		kitchenSentAt: "",
		kitchenSendCount: 0,
	};
}
