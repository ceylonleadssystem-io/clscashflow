/**
 * Online order flow (pure): what staff do with an order from an online store after it arrives.
 * The step an order is at lives on the open order as `order.online` (kept with the order, synced like any other detail of it):
 *   { shop, shopifyOrderId, state, customer, delivery, note, financialStatus, currency,
 *     acceptedAt, acceptedBy, declinedAt, declinedBy, declineReason, declineNote, fulfilledAt, fulfilledBy,
 *     tracking: { company, number, url }, packingPrintedAt, shopify: { status, error, at, lastAction } }
 * state: new (just arrived) > accepted (staff took it) > fulfilled (packed and handed over, paid), or declined at any step before fulfilled.
 * `shopify.status` says whether the Shopify store was told: "none" (store access not connected), "pending", "done" or "failed".
 */
export const STATES = [
	{ value: "new", label: "New" },
	{ value: "accepted", label: "Accepted" },
	{ value: "fulfilled", label: "Fulfilled" },
	{ value: "declined", label: "Declined" },
];

export const stateOf = (order) => order?.online?.state || "new";
const isOpen = (order) => order?.status === "open";

export const canAccept = (o) => isOpen(o) && stateOf(o) === "new";
export const canDecline = (o) => isOpen(o) && (stateOf(o) === "new" || stateOf(o) === "accepted");
export const canFulfill = (o) => isOpen(o) && stateOf(o) === "accepted";
/** Tracking can be added or changed until the order is declined; after fulfilment it goes to Shopify as an update. */
export const canTrack = (o) => stateOf(o) !== "declined";
export const canPack = (o) => stateOf(o) !== "declined";

/** The state a list row belongs to ("fulfilled" and "declined" are kept even after the open order is paid or voided). */
export const filterOf = (o) => stateOf(o);

/** Declining: the reasons offered, each with the reason Shopify records for the cancellation. */
export const DECLINE_REASONS = [
	{ value: "out_of_stock", label: "Out of stock", shopify: "INVENTORY" },
	{ value: "cannot_deliver", label: "Cannot deliver there", shopify: "DECLINED" },
	{ value: "closed", label: "We are closed", shopify: "DECLINED" },
	{ value: "customer_asked", label: "Customer asked to cancel", shopify: "CUSTOMER" },
	{ value: "other", label: "Other", shopify: "OTHER" },
];
export const declineReasonOf = (value) => DECLINE_REASONS.find((r) => r.value === value) || DECLINE_REASONS[DECLINE_REASONS.length - 1];

/** Common carriers offered in the tracking form (Shopify makes the tracking link itself for the ones it knows; anything else needs a link). */
export const CARRIERS = ["DHL", "FedEx", "UPS", "Aramex", "Sri Lanka Post", "Pronto", "Domex", "Own delivery", "Other"];

/** Clean the tracking form: company and number trimmed, link only when it is a web address. */
export function cleanTracking(t = {}) {
	const url = String(t.url || "").trim();
	return { company: String(t.company || "").trim().slice(0, 60), number: String(t.number || "").trim().slice(0, 80), url: /^https?:\/\/\S+$/i.test(url) ? url.slice(0, 400) : "" };
}
export const hasTracking = (t) => !!(t && (t.number || t.url));

/** "Add the details Shopify needs" problems with a tracking form ("" when fine). */
export function trackingError(t = {}) {
	const c = cleanTracking(t);
	if (!c.number && !c.url) return "";
	if (!c.company) return "Choose the delivery company.";
	if (String(t.url || "").trim() && !c.url) return "The tracking link must start with http:// or https://.";
	return "";
}

/** The Shopify admin page of the order, for "Open in Shopify". */
export function shopifyAdminUrl(order) {
	const shop = String(order?.online?.shop || "");
	const id = String(order?.online?.shopifyOrderId || "");
	return shop.endsWith(".myshopify.com") && /^\d+$/.test(id) ? `https://admin.shopify.com/store/${shop.replace(/\.myshopify\.com$/, "")}/orders/${id}` : "";
}

/** The message to the customer for WhatsApp: what stage the order is at, with the tracking when there is some. */
export function customerMessage(order, business = "") {
	const o = order.online || {};
	const hi = `Hi ${o.customer?.name || "there"},`;
	const ref = `your order ${order.platformOrderId || order.orderNumber}`;
	const sign = business ? `\nThank you, ${business}` : "";
	if (stateOf(order) === "declined") return `${hi}\nSorry, we could not accept ${ref}${o.declineReason ? " (" + declineReasonOf(o.declineReason).label.toLowerCase() + ")" : ""}. It has been cancelled${o.shopify?.refund === false ? "" : " and you will be refunded"}.${sign}`;
	if (stateOf(order) === "fulfilled") {
		const t = o.tracking || {};
		return `${hi}\n${ref[0].toUpperCase() + ref.slice(1)} is on its way.${t.company ? "\nDelivery: " + t.company : ""}${t.number ? "\nTracking number: " + t.number : ""}${t.url ? "\nTrack it: " + t.url : ""}${sign}`;
	}
	if (stateOf(order) === "accepted") return `${hi}\nWe have accepted ${ref} and are preparing it.${sign}`;
	return `${hi}\nWe have received ${ref}.${sign}`;
}

/** Items of the order as packing lines: { qty, name, sku }, leaving out the delivery charge and discount lines. */
export const packingLines = (order, products = []) =>
	(order.lines || [])
		.filter((l) => !l.isDiscount && !l.isServiceCharge && !(l.productId === "" && /^delivery$/i.test(l.name || "")))
		.map((l) => ({ qty: Number(l.qty) || 0, name: l.name || "Item", sku: String(l.code || products.find((p) => p.id === l.productId)?.code || "").trim(), unmatched: !!l.unmatched }));
