/**
 * Online orders (Shopify): the connected stores, and taking new orders from the inbox into open orders (Orders > Online orders).
 * The store's secret goes to `shopify-store` once and is never shown again; new orders come from `shopify-inbox`.
 */
import { T } from "../../db/tables";
import { env, isAppwrite } from "../../config/env";
import { nowIso } from "../../domain/format";
import { formatOrderNumber, nextSequence } from "../../domain/orders";
import { inboxToOpenOrder, openOrderIdOf } from "../../domain/shopifyOrder";
import { thirdPartyList } from "../../domain/thirdPartyPayments";
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
	if (!res.ok || json.ok === false) throw new Error(json.error || fallback);
	return json;
}

const CHANNEL = "Shopify"; // the order channel and the payment type name of these orders
const alerted = new Set(); // orders already reported as not saved, so the same message is not shown every half minute

// the stores this device knows about (only used to decide whether to look for orders); the other online settings stay as they are
const rememberShops = (ctx, shops) => {
	const cur = ctx.data().settings.onlineStore || {};
	return ctx.store.write((tx) => tx.setSetting("onlineStore", { ...cur, shops: shops.map((s) => ({ shop: s.shop, locationId: s.locationId })) }));
};

/** Settings of the online orders: { autoKitchen } (send each new order to the kitchen as it arrives). */
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
	const autoKitchen = !!d.settings.onlineStore?.autoKitchen && kitchenMode(d.settings);
	let seq = nextSequence(d.meta, d.sales, d.openOrders);
	const fresh = [];
	for (const row of rows) {
		if (have.has(openOrderIdOf(row.id))) continue;
		const rate = row.rate === undefined ? 1 : Number(row.rate); // 0 = the order is in a currency the store has no rate for
		if (!(rate > 0)) {
			if (!alerted.has(row.id)) {
				alerted.add(row.id);
				await ctx.ui.alert(`Online order ${row.order?.name || ""} is in ${row.order?.currency || "another currency"} and was not saved. Set the exchange rate for this store in Settings > Online Store, then it will arrive.`);
			}
			continue;
		}
		fresh.push(stamp(inboxToOpenOrder(row, { products: d.products, number: formatOrderNumber(seq), staffId: s.userId, now: nowIso(), rate, autoKitchen }), s));
		seq += 1;
	}
	if (!fresh.length) return [];
	await ctx.store.write((tx) => {
		fresh.forEach((o) => tx.put(T.openOrders, o));
		tx.setMeta("nextOrderSequence", seq);
	});
	// the kitchen gets its ticket once the order is saved
	if (autoKitchen) for (const o of fresh) await queueKitchenTicket(ctx, { ...o, receipt: o.orderNumber });
	return fresh.map((o) => o.orderNumber);
}

/** Takes the new online orders for this device's location. Returns how many arrived. Quiet when there is nothing or the device is offline. */
export async function pullOnlineOrders(ctx) {
	const locationId = ctx.session().locationId;
	if (!isAppwrite() || (typeof navigator !== "undefined" && navigator.onLine === false) || !locationId || locationId === "all") return 0;
	try {
		const out = await call(env.shopifyInboxUrl, { action: "pull", locationId }, "Could not check online orders.");
		const orders = out.orders || [];
		const numbers = await storeOnlineOrders(ctx, orders);
		const done = orders.filter((o) => o.rate === undefined || Number(o.rate) > 0); // an order waiting for an exchange rate stays in the inbox
		if (done.length || (out.cancelled || []).length) await call(env.shopifyInboxUrl, { action: "ack", ids: done.map((o) => o.id), cancelledIds: (out.cancelled || []).map((c) => c.id) }, "Could not confirm online orders.");
		if (numbers.length) ctx.ui.notice(numbers.length === 1 ? `New online order ${numbers[0]}.` : `${numbers.length} new online orders.`);
		if ((out.cancelled || []).length) await ctx.ui.alert(`Shopify cancelled ${out.cancelled.map((c) => c.name || "an order").join(", ")}. Check it before preparing it.`);
		return numbers.length;
	} catch (e) {
		log.warn("online orders not checked", e);
		return 0;
	}
}
