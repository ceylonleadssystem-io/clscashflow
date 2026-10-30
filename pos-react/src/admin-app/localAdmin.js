/**
 * Local development back end for the admin portal (VITE_AUTH_PROVIDER=local): a dev admin login plus
 * an adminApi stand-in that reads and writes this browser's POS database and stores invoices in localStorage.
 */
import { createDatabase, databaseNameFor } from "../db/database";
import { PosStore } from "../db/PosStore";
import { payloadToSnapshot, snapshotToPayload } from "../services/sync/payload";
import { rollup } from "../domain/adminAnalytics";
import { applyConfig } from "../domain/assistConfig";
import { resolveFeatures } from "../config/features";
import { flagsWithPlan, subscriptionOf } from "../config/subscription";

/**
 * Local development back end for the admin portal (VITE_AUTH_PROVIDER=local).
 * Instead of the Netlify function it reads/writes the POS database of this
 * browser (WatermelonDB "ceylonry-pos-v1"), so feature switches, tier, welcome
 * message etc. apply to the local POS after reloading it.
 */
export const DEV_ADMIN = {
	email: import.meta.env.VITE_DEV_ADMIN_EMAIL || "admin@ceylonry.local",
	password: import.meta.env.VITE_DEV_ADMIN_PASSWORD || "Admin#12345",
};
const SESSION = "ceylonry-dev-admin";
export const localAdminSession = {
	get: () => sessionStorage.getItem(SESSION) === "1",
	signIn(email, password) {
		if (email.toLowerCase() !== DEV_ADMIN.email.toLowerCase() || password !== DEV_ADMIN.password) throw new Error("Incorrect administrator email or password.");
		sessionStorage.setItem(SESSION, "1");
	},
	signOut: () => sessionStorage.removeItem(SESSION),
};

let store;
const getStore = () => (store ||= new PosStore(createDatabase(databaseNameFor(""))));
const INV = "ceylonry-dev-invoices";
const invoices = () => JSON.parse(localStorage.getItem(INV) || "[]");

export async function localAdminApi(body) {
	const s = getStore();
	const snap = await s.readSnapshot();
	const owner = snap.users.find((u) => u.role === "owner") || {};
	const profile = { name: owner.name || "Owner", email: snap.settings.email || "", posAccountPaused: snap.settings.devAccountPaused === true, posPaid: false };
	const status = snap.settings.devAccountStatus || "trial";
	const cycle = snap.settings.devBillingCycle || "monthly";
	const payment = { paid: false, status: profile.posAccountPaused ? "paused" : "trial", billingCycle: cycle, trialEnd: "", nextPaymentDue: "" };
	const account = { businessType: snap.settings.businessType || "", analytics: rollup(snap.sales || [], new Date(), { cashShifts: snap.cashShifts, kitchenTickets: snap.kitchenTickets }), id: "local", name: profile.name, email: profile.email || "owner@local", business: snap.settings.business || "My Business", setupStatus: "local", products: (snap.products || []).length, payment, paused: profile.posAccountPaused, status, subscriptionType: cycle, isTestAccount: status === "test" };
	const enabled = resolveFeatures(flagsWithPlan(snap.settings.features || {}, subscriptionOf(snap.settings))).enabled;
	account.apps = ["POS", ...(enabled["view.guestManager"] ? ["GM"] : []), ...(enabled["checkout.kds"] ? ["KDS"] : [])];
	const action = body?.action || "list";
	if (action === "list") return { ok: true, users: [account], stats: { realCustomers: status === "test" ? 0 : 1, testAccounts: status === "test" ? 1 : 0, trialAccounts: status === "trial" ? 1 : 0, liveAccounts: status === "live" ? 1 : 0, revenueThisMonth: 0 } };
	if (action === "get") return { ok: true, user: { id: "local", profile, payment }, workspace: snapshotToPayload(snap) };
	if (action === "setAccess") {
		await s.write((tx) => tx.setSetting("devAccountPaused", body.paused === true));
		return { ok: true };
	}
	if (action === "setAccountStatus") {
		if (!["trial", "test", "live"].includes(body.status)) throw new Error("Status must be trial, test or live.");
		await s.write((tx) => tx.setSetting("devAccountStatus", body.status));
		return { ok: true, status: body.status };
	}
	if (action === "setSubscriptionType") {
		if (!["monthly", "annual"].includes(body.subscriptionType)) throw new Error("Subscription type must be monthly or annual.");
		await s.write((tx) => tx.setSetting("devBillingCycle", body.subscriptionType));
		return { ok: true, subscriptionType: body.subscriptionType };
	}
	if (action === "saveSettings") {
		await s.write((tx) => {
			for (const k of ["features", "locationFeatures", "welcome", "plan", "invoiceExtras", "invoiceTax", "businessCategory", "subscription", "businessType", "businessTypeLocked"]) if (body.settings && k in body.settings) tx.setSetting(k, body.settings[k]);
		});
		return { ok: true };
	}
	if (action === "saveCatalog") {
		const incoming = body.products || [];
		if (!incoming.length) throw new Error("The import contains no valid products.");
		const now = new Date().toISOString();
		const payload = snapshotToPayload(snap);
		const key = (p) => String(p.code || p.name || "").toLowerCase();
		const byKey = new Map((body.mode === "replace" ? [] : payload.products).map((p) => [key(p), p]));
		let skipped = 0;
		incoming.forEach((p, i) => {
			const known = byKey.get(key(p));
			if (known && body.mode === "add") return void skipped++;
			byKey.set(key(p), { id: "p-import-" + Date.now() + "-" + i, modifierIds: [], image: "", ...(known || {}), ...p, createdAt: known?.createdAt || now, updatedAt: now });
		});
		const subs = [...(payload.subcategories || [])];
		(body.subcategories || []).forEach((x, i) => !subs.some((y) => y.parent === x.parent && y.name === x.name) && subs.push({ id: "sub-import-" + Date.now() + "-" + i, parent: x.parent, name: x.name, updatedAt: now }));
		const categories = [...new Set([...(body.mode === "replace" ? [] : payload.categories), ...(body.categories || [])])].sort();
		await s.replaceAll(payloadToSnapshot({ ...payload, products: [...byKey.values()], subcategories: subs, categories }), { preserveTimestamps: true });
		return { ok: true, imported: incoming.length - skipped, skipped, backupId: "local-dev" };
	}
	if (action === "openPos") return { ok: true, local: true };
	if (action === "saveConfig") {
		const cfg = body.config || {};
		const full = { rows: { products: [], modifiers: [], subcategories: [], locations: [], ...(cfg.rows || {}) }, deleted: { products: [], modifiers: [], subcategories: [], ...(cfg.deleted || {}) }, categories: { add: [], remove: [], ...(cfg.categories || {}) }, settings: cfg.settings || {} };
		await s.replaceAll(payloadToSnapshot(applyConfig(snapshotToPayload(snap), full, new Date().toISOString())), { preserveTimestamps: true });
		return { ok: true, backupId: "local-dev", summary: {} };
	}
	const FOUNDERS = "ceylonry-dev-founders";
	if (action === "getFounders") return { ok: true, founders: JSON.parse(localStorage.getItem(FOUNDERS) || "[]") };
	if (action === "saveFounders") {
		localStorage.setItem(FOUNDERS, JSON.stringify(body.founders || []));
		return { ok: true, founders: body.founders || [] };
	}
	if (action === "previewDeleteAccount") {
		const c = snap;
		return { ok: true, check: { business: account.business, keepPayments: body.keepPayments === true, stores: [], warnings: [{ code: "local", text: "Local development mode: nothing can be deleted from here." }], counts: { staffUsers: c.users.length, locations: c.locations.length, products: c.products.length, customers: c.customers.length, sales: c.sales.length, invoices: invoices().length, paymentRecords: 0, images: 0, databaseRows: 0 } } };
	}
	if (action === "deleteAccount") throw new Error("Deleting an account is not available in local development mode.");
	if (action === "listInvoices") return { ok: true, invoices: invoices() };
	if (action === "saveInvoice") {
		const inv = body.invoice;
		const number = inv.number || "INV-POS-" + Date.now().toString().slice(-8);
		const doc = { ...inv, id: number, number, createdAtUtc: inv.createdAtUtc || new Date().toISOString(), amount: (inv.lines || []).reduce((t, l) => t + l.qty * l.price, 0), status: inv.status || "unpaid" };
		localStorage.setItem(INV, JSON.stringify([doc, ...invoices().filter((i) => i.number !== number)]));
		return { ok: true, invoice: doc };
	}
	return { ok: true };
}
