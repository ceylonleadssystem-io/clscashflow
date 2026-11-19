/**
 * Shopify order to POS open order (pure). The order arrives cut down by the server (netlify/lib/shopify.js sanitizeOrder).
 * Items are matched to POS items by SKU = item code; an item that does not match is kept as a plain line at Shopify's price, so no order is
 * ever lost. The open order id is fixed by the Shopify order id, so two devices taking the same order write the same row, never two.
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
import { markSent } from "./deleteApproval";

const code = (v) => String(v || "").trim().toUpperCase();

export const openOrderIdOf = (inboxId) => "shp" + inboxId;

export function onlineLines(order, products = [], rate = 1) {
	const money = (v) => round(v * rate);
	const lines = (order.lines || []).map((l, i) => {
		const product = l.sku ? products.find((p) => code(p.code) === code(l.sku)) : null;
		if (product) return { ...product, productId: product.id, key: product.id + "|", basePrice: Number(product.price) || 0, price: money(l.price), modifiers: [], qty: l.qty };
		const key = "shp-" + order.id + "-" + i;
		return { id: key, productId: "", key, name: l.variant ? `${l.title} (${l.variant})` : l.title, basePrice: money(l.price), price: money(l.price), modifiers: [], qty: l.qty, unmatched: true };
	});
	if (order.shipping > 0) lines.push({ id: "shp-" + order.id + "-delivery", productId: "", key: "shp-" + order.id + "-delivery", name: "Delivery", basePrice: money(order.shipping), price: money(order.shipping), modifiers: [], qty: 1 });
	return lines;
}

/** The open order for one inbox row. `number` is the POS order number it gets. */
export function inboxToOpenOrder(row, { products, number, staffId = "", now, rate = 1, autoKitchen = false }) {
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
		lines: autoKitchen ? markSent(onlineLines(o, products, rate), now) : onlineLines(o, products, rate), // sent to the kitchen on arrival when the business chose that
		discount: { type: "amount", value: round((o.discount || 0) * rate), amount: round((o.discount || 0) * rate) },
		kitchenSentAt: autoKitchen ? now : "",
		kitchenSendCount: autoKitchen ? 1 : 0,
	};
}
