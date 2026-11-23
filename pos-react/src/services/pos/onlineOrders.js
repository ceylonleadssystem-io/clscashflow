/**
 * Online orders (Shopify): the connected stores, and taking new orders from the inbox into open orders (Orders > Online orders).
 * The store's secret goes to `shopify-store` once and is never shown again; new orders come from `shopify-inbox`.
 */
import { T } from "../../db/tables";
import { env, isAppwrite } from "../../config/env";
import { printHtmlInFrame } from "../printing/printDocument";
import { packingSlipHtml } from "../printing/packingSlip";
import { canAccept, canDecline, canFulfill, canPack, canTrack, cleanTracking, declineReasonOf, stateOf, trackingError } from "../../domain/onlineFlow";
import { markSent } from "../../domain/deleteApproval";
import { firstShortIngredient, saleStockNeeds, stockProblem } from "../../domain/inventory";
import { completeSale } from "./sales";
import { nowIso } from "../../domain/format";
import { formatOrderNumber, nextSequence } from "../../domain/orders";
import { inboxToOpenOrder, openOrderIdOf } from "../../domain/shopifyOrder";
import { thirdPartyList } from "../../domain/thirdPartyPayments";
import { ensureOnlineCustomer } from "./customers";
import { kitchenMode, newId, stamp } from "./common";
import { queueKitchenTicket } from "./printing";
import { createLogger } from "../../utils/logger";

const log = createLogger("onlineOrders");

async function call(url, body, fallback) {
	if (!isAppwrite()) throw new Error("Online orders need the cloud version of the POS.");
	const { getAppwriteCompat } = await import("../appwrite/appwriteCompat");
	const user = getAppwriteCompat().auth().currentUser;
	if (!user) throw new Error("Please sign in again.");
	const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await user.getIdToken()) }, body: JSON.stringify(body) });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw Object.assign(new Error(json.error || fallback), { code: json.code });
	return json;
}

const CHANNEL = "Shopify"; // the order channel and the payment type name of these orders
const alerted = new Set(); // orders already reported as not saved, so the same message is not shown every half minute

// the stores this device knows about (only used to decide whether to look for orders); the other online settings stay as they are
const rememberShops = (ctx, shops) => {
	const cur = ctx.data().settings.onlineStore || {};
	return ctx.store.write((tx) => tx.setSetting("onlineStore", { ...cur, shops: shops.map((s) => ({ shop: s.shop, locationId: s.locationId })) }));
};

/** Settings of the online orders: { autoKitchen } (send an order to the kitchen when it is accepted). */
export async function saveOnlineOptions(ctx, options) {
	const cur = ctx.data().settings.onlineStore || {};
	await ctx.store.write((tx) => tx.setSetting("onlineStore", { ...cur, autoKitchen: !!options.autoKitchen }));
	ctx.ui.notice("Online order settings saved.");
}

// a "Shopify" payment type, so a prepaid web order is not taken as cash
const ensureShopifyPayment = async (ctx) => {
	const list = thirdPartyList(ctx.data().settings);
	if (list.some((t) => t.name.toLowerCase() === CHANNEL.toLowerCase())) return;
	await ctx.store.write((tx) => tx.setSetting("thirdPartyPayments", [...list, { id: newId("tp"), name: CHANNEL, active: true }]));
};

/** The connected stores and the webhook address to give Shopify. */
export async function loadOnlineStore(ctx) {
	const out = await call(env.shopifyStoreUrl, { action: "status" }, "Could not load the online store.");
	await rememberShops(ctx, out.shops || []);
	return out;
}

/** Connects a store ({ shop, secret, locationId }). */
export async function saveOnlineStore(ctx, form) {
	const out = await call(env.shopifyStoreUrl, { action: "save", ...form }, "Could not connect the store.");
	await rememberShops(ctx, out.shops || []);
	await ensureShopifyPayment(ctx);
	ctx.ui.notice("Store connected.");
	return out;
}

/** The address of Shopify's approval page, where the store owner lets the POS accept, decline and fulfil orders. */
export async function onlineStoreAccessUrl(ctx, shop) {
	return (await call(env.shopifyStoreUrl, { action: "access", shop }, "Could not start the Shopify approval.")).url;
}

/** Disconnects a store. */
export async function removeOnlineStore(ctx, shop) {
	const out = await call(env.shopifyStoreUrl, { action: "remove", shop }, "Could not remove the store.");
	await rememberShops(ctx, out.shops || []);
	ctx.ui.notice("Store removed.");
	return out;
}

/** Saves inbox orders as open orders (those already here are skipped). Returns the new order numbers. */
export async function storeOnlineOrders(ctx, rows) {
	const d = ctx.data();
	const s = ctx.session();
	const have = new Set(d.openOrders.map((o) => o.id));
	let seq = nextSequence(d.meta, d.sales, d.openOrders);
	const fresh = [];
	for (const row of rows) {
		if (have.has(openOrderIdOf(row.id))) continue;
		const past = !!row.imported && (row.history === "fulfilled" || row.history === "cancelled"); // past orders keep their own number and use none of the POS sequence
		const rate = row.rate === undefined ? 1 : Number(row.rate); // 0 = the order is in a currency the store has no rate for
		if (!(rate > 0)) {
			if (!alerted.has(row.id)) {
				alerted.add(row.id);
				await ctx.ui.alert(`Online order ${row.order?.name || ""} is in ${row.order?.currency || "another currency"} and was not saved. Set the exchange rate for this store in Settings > Online Store, then it will arrive.`);
			}
			continue;
		}
		const who = row.order?.customer || {};
		const customer = await ensureOnlineCustomer(ctx, { name: who.name, phone: who.phone, email: who.email, address: row.order?.delivery?.address, orderName: row.order?.name }); // the CRM customer, when Shopify shared enough to make one
		fresh.push(stamp(inboxToOpenOrder(row, { products: d.products, inventory: ctx.data().inventory, number: past ? "" : formatOrderNumber(seq), staffId: s.userId, now: nowIso(), customerId: customer?.id || "", rate }), s));
		if (!past) seq += 1;
	}
	if (!fresh.length) return [];
	await ctx.store.write((tx) => {
		fresh.forEach((o) => tx.put(T.openOrders, o));
		tx.setMeta("nextOrderSequence", seq);
	});
	return fresh.map((o) => o.orderNumber);
}

/** One look in the inbox for this device's location: { rows, created } (rows found, orders saved). Errors are thrown. */
async function pullBatch(ctx, { quiet = false } = {}) {
	const locationId = ctx.session().locationId;
	if (!isAppwrite() || (typeof navigator !== "undefined" && navigator.onLine === false) || !locationId || locationId === "all") return { rows: 0, created: 0 };
	{
		const out = await call(env.shopifyInboxUrl, { action: "pull", locationId }, "Could not check online orders.");
		const orders = out.orders || [];
		const numbers = await storeOnlineOrders(ctx, orders);
		const done = orders.filter((o) => o.rate === undefined || Number(o.rate) > 0); // an order waiting for an exchange rate stays in the inbox
		if (done.length || (out.cancelled || []).length) await call(env.shopifyInboxUrl, { action: "ack", ids: done.map((o) => o.id), cancelledIds: (out.cancelled || []).map((c) => c.id) }, "Could not confirm online orders.");
		const arrived = orders.filter((o) => !o.imported || o.history === "open").length; // past orders pulled in bulk are not announced
		if (!quiet && arrived && numbers.length) ctx.ui.notice(arrived === 1 ? `New online order ${numbers[0]}.` : `${arrived} new online orders.`);
		if ((out.cancelled || []).length) await cancelledInShopify(ctx, out.cancelled);
		return { rows: orders.length, created: numbers.length };
	}
}

/** Takes the new online orders for this device's location. Returns how many arrived. Quiet when there is nothing or the device is offline. */
export async function pullOnlineOrders(ctx) {
	try {
		return (await pullBatch(ctx)).created;
	} catch (e) {
		log.warn("online orders not checked", e);
		return 0;
	}
}

/**
 * Pulls a store's past orders (created since `since`, YYYY-MM-DD) into the POS: first into the inbox, a page at a time, then onto this device.
 * `onProgress({ imported, skipped, saved })` is called as it goes. Past fulfilled and cancelled orders become history (no sale, no stock, no kitchen).
 * Must be done on a device signed in to the store's location, because that is where its orders are kept.
 */
export async function importPastOrders(ctx, { shop, since, onProgress = () => {} }) {
	let cursor = "";
	let imported = 0;
	let skipped = 0;
	for (let page = 0; page < 400; page += 1) {
		const out = await call(env.shopifyImportUrl, { shop, since, cursor }, "Could not import past orders.");
		imported += out.imported || 0;
		skipped += out.skipped || 0;
		onProgress({ imported, skipped, saved: 0 });
		if (!out.hasMore) break;
		cursor = out.cursor;
	}
	let saved = 0;
	for (let round = 0; round < 400; round += 1) {
		const got = await pullBatch(ctx, { quiet: true });
		if (!got.rows || !got.created) break; // nothing left, or nothing more can be saved (an order waiting for an exchange rate stays in the inbox)
		saved += got.created;
		onProgress({ imported, skipped, saved });
	}
	return { imported, skipped, saved };
}

// ------------------------------------------------------------------------------------------------ the flow ----
const findOrder = (ctx, id) => ctx.data().openOrders.find((o) => o.id === id);
const put = (ctx, order) => ctx.store.write((tx) => tx.put(T.openOrders, order));

/** Tells the Shopify store what staff did ("accept", "decline", "fulfill", "tracking") and records whether it worked on the order. */
async function tellShopify(ctx, order, action, options = {}) {
	const o = order.online || {};
	let shopify;
	try {
		await call(env.shopifyActionUrl, { action, shop: o.shop, orderId: o.shopifyOrderId, options }, "Shopify could not be updated.");
		shopify = { status: "done", at: nowIso(), lastAction: action, options };
	} catch (e) {
		const none = e.code === "no_access" || /cloud version/i.test(e.message);
		shopify = { status: none ? "none" : "failed", error: none ? "Shopify access is not connected, so only the POS was updated." : e.message, at: nowIso(), lastAction: action, options };
		log.warn("Shopify not updated", e, { action });
	}
	const next = { ...order, online: { ...o, shopify } };
	await put(ctx, next);
	return next;
}

/** Why an order might not be possible to prepare: items short of stock or ingredients (staff can still accept). */
const shortage = (ctx, order) => {
	const d = ctx.data();
	const lines = (order.lines || []).filter((l) => l.productId || l.stockItemId);
	const stock = stockProblem(lines.filter((l) => l.productId), d.products, d.inventory, ctx.session().locationId);
	if (stock) return `${stock.name} is short on stock`;
	const short = firstShortIngredient(saleStockNeeds(lines, d.products), d.inventory);
	return short ? `${short.i.name} is short for this order` : "";
};

/** Staff accept the order; it is sent to the kitchen when the business chose that, and the store is told. */
export async function acceptOnlineOrder(ctx, id) {
	const order = findOrder(ctx, id);
	if (!order || !canAccept(order)) return null;
	const problem = shortage(ctx, order);
	if (problem && !(await ctx.ui.confirm(`${problem}. Accept ${order.platformOrderId || order.orderNumber} anyway?`))) return null;
	const now = nowIso();
	const kitchen = !!ctx.data().settings.onlineStore?.autoKitchen && kitchenMode(ctx.data().settings) && !order.kitchenSentAt;
	let next = { ...order, updatedAt: now, online: { ...order.online, state: "accepted", acceptedAt: now, acceptedBy: ctx.session().userId } };
	if (kitchen) next = { ...next, lines: markSent(next.lines, now), kitchenSentAt: now, kitchenSendCount: (order.kitchenSendCount || 0) + 1 };
	await put(ctx, next);
	if (kitchen) await queueKitchenTicket(ctx, { ...next, receipt: next.orderNumber });
	ctx.ui.notice(`${order.platformOrderId || order.orderNumber} accepted${kitchen ? " and sent to the kitchen" : ""}.`);
	return tellShopify(ctx, next, "accept");
}

/** Staff decline the order: it is cancelled here and in Shopify ({ reason, note, refund, restock, notify }). */
export async function declineOnlineOrder(ctx, id, form = {}) {
	const order = findOrder(ctx, id);
	if (!order || !canDecline(order)) return null;
	const r = declineReasonOf(form.reason);
	const options = { reason: r.shopify, note: String(form.note || "").trim().slice(0, 300), refund: form.refund !== false, restock: form.restock !== false, notify: form.notify !== false };
	const now = nowIso();
	const next = { ...order, status: "voided", voidedAt: now, voidedBy: ctx.session().userId, voidReason: r.label + (options.note ? ": " + options.note : ""), updatedAt: now, online: { ...order.online, state: "declined", declinedAt: now, declinedBy: ctx.session().userId, declineReason: r.value, declineNote: options.note } };
	await put(ctx, next);
	ctx.ui.notice(`${order.platformOrderId || order.orderNumber} declined.`);
	return tellShopify(ctx, next, "decline", options);
}

/**
 * Staff mark the order fulfilled: the sale is recorded (paid through Shopify, so no cash), stock goes down, and the store is told with the
 * tracking ({ tracking: { company, number, url }, notify }). Stays on the Online Orders page.
 */
export async function fulfillOnlineOrder(ctx, id, form = {}) {
	const order = findOrder(ctx, id);
	if (!order || !canFulfill(order)) return null;
	const tracking = cleanTracking(form.tracking);
	const problem = trackingError(form.tracking);
	if (problem) return void (await ctx.ui.alert(problem));
	await ensureShopifyPayment(ctx);
	// already paid and accepted by staff: stock that ran short is not a reason to stop now
	const cart = (order.lines || []).map((l) => (l.isDiscount || l.isServiceCharge ? l : { ...l, stockOverride: "Shopify order" }));
	const res = await completeSale(ctx, { cart, discount: order.discount, payment: CHANNEL, customerId: order.customerId || "", orderChannel: order.orderChannel, platformOrderId: order.platformOrderId, orderReference: order.orderReference, openOrderId: order.id, printAfter: false });
	if (!res?.sale) return null;
	const now = nowIso();
	const next = { ...order, status: "paid", closedAt: now, saleId: res.sale.id, updatedAt: now, online: { ...order.online, state: "fulfilled", fulfilledAt: now, fulfilledBy: ctx.session().userId, tracking } };
	await put(ctx, next);
	ctx.ui.notice(`${order.platformOrderId || order.orderNumber} fulfilled.`);
	return tellShopify(ctx, next, "fulfill", { tracking, notify: form.notify !== false });
}

/** Adds or changes the tracking of an order (before or after it is fulfilled); once fulfilled the store gets the update. */
export async function saveOnlineTracking(ctx, id, form = {}) {
	const order = findOrder(ctx, id);
	if (!order || !canTrack(order)) return null;
	const problem = trackingError(form.tracking);
	if (problem) return void (await ctx.ui.alert(problem));
	const next = { ...order, updatedAt: nowIso(), online: { ...order.online, tracking: cleanTracking(form.tracking) } };
	await put(ctx, next);
	ctx.ui.notice("Tracking saved.");
	return stateOf(order) === "fulfilled" ? tellShopify(ctx, next, "tracking", { tracking: next.online.tracking, notify: form.notify !== false }) : next;
}

/** Prints the packing label. */
export async function printOnlinePackingSlip(ctx, id) {
	const order = findOrder(ctx, id);
	if (!order || !canPack(order)) return null;
	const d = ctx.data();
	printHtmlInFrame(packingSlipHtml(order, { business: d.settings.business || "", products: d.products }), "Packing " + (order.platformOrderId || order.orderNumber));
	const next = { ...order, online: { ...order.online, packingPrintedAt: nowIso() } };
	await put(ctx, next);
	return next;
}

/** Sends the last action to the store again (after it failed or before access was connected). */
export async function retryOnlineShopify(ctx, id) {
	const order = findOrder(ctx, id);
	const last = order?.online?.shopify;
	if (!order || !last?.lastAction) return null;
	return tellShopify(ctx, order, last.lastAction, last.options || {});
}

/** Orders cancelled in Shopify by the customer: those not yet fulfilled are voided here, so nobody prepares them. */
async function cancelledInShopify(ctx, cancelled) {
	const names = [];
	for (const c of cancelled) {
		const order = findOrder(ctx, openOrderIdOf(c.id));
		names.push(c.name || order?.platformOrderId || "an order");
		if (!order || order.status !== "open") continue;
		const now = nowIso();
		await put(ctx, { ...order, status: "voided", voidedAt: now, voidedBy: "shopify", voidReason: "Cancelled in Shopify", updatedAt: now, online: { ...order.online, state: "declined", declinedAt: now, declineReason: "customer_asked", declineNote: "Cancelled in Shopify", shopify: { status: "done", at: now, lastAction: "cancelled" } } });
	}
	await ctx.ui.alert(`Shopify cancelled ${names.join(", ")}. Orders that were not fulfilled have been cancelled here too.`);
}
