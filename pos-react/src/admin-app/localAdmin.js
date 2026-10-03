/**
 * Local development back end for the admin portal (VITE_AUTH_PROVIDER=local): a dev admin login plus
 * an adminApi stand-in that reads and writes this browser's POS database and stores invoices in localStorage.
 */
import { createDatabase, databaseNameFor } from "../db/database";
import { PosStore } from "../db/PosStore";
import { snapshotToPayload } from "../services/sync/payload";

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
	const payment = { paid: false, status: profile.posAccountPaused ? "paused" : "trial", billingCycle: "monthly", trialEnd: "", nextPaymentDue: "" };
	const account = { id: "local", name: profile.name, email: profile.email || "owner@local", business: snap.settings.business || "My Business", setupStatus: "local", payment, paused: profile.posAccountPaused };
	const action = body?.action || "list";
	if (action === "list") return { ok: true, users: [account], stats: { realCustomers: 1, testAccounts: 0, revenueThisMonth: 0 } };
	if (action === "get") return { ok: true, user: { id: "local", profile, payment }, workspace: snapshotToPayload(snap) };
	if (action === "setAccess") {
		await s.write((tx) => tx.setSetting("devAccountPaused", body.paused === true));
		return { ok: true };
	}
	if (action === "saveSettings") {
		await s.write((tx) => {
			for (const k of ["features", "locationFeatures", "welcome", "plan"]) if (body.settings && k in body.settings) tx.setSetting(k, body.settings[k]);
		});
		return { ok: true };
	}
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
