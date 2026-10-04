/**
 * Tests for the admin portal: dev administrator sign-in, the local admin API (access, per-location features,
 * welcome message, plan, invoices), feature switches per location, plan tiers, invoice billing and the welcome message.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { ADDITIONAL_FEATURES, PLANS, PLAN_FEATURE_OFF } from "../config/plans";
import { FEATURES, resolveFeatures } from "../config/features";
import { DEFAULT_WELCOME, resolveWelcome } from "../config/welcome";
import { buildInvoiceLines } from "../admin-app/billing";
import { DEV_ADMIN, localAdminApi, localAdminSession } from "../admin-app/localAdmin";
import { createHarness } from "./harness";

describe("administrator sign-in (local dev instance)", () => {
	it("accepts the dev credentials and rejects anything else", () => {
		localAdminSession.signOut();
		expect(localAdminSession.get()).toBe(false);
		expect(() => localAdminSession.signIn("x@y.lk", "nope")).toThrow(/Incorrect/);
		expect(() => localAdminSession.signIn(DEV_ADMIN.email, "wrong")).toThrow();
		localAdminSession.signIn(DEV_ADMIN.email.toUpperCase(), DEV_ADMIN.password);
		expect(localAdminSession.get()).toBe(true);
		localAdminSession.signOut();
		expect(localAdminSession.get()).toBe(false);
	});
});

describe("admin dashboard API (local)", () => {
	beforeAll(() => localStorage.clear());
	it("lists the account and fetches its workspace", async () => {
		const list = await localAdminApi({ action: "list" });
		expect(list.users).toHaveLength(1);
		const got = await localAdminApi({ action: "get" });
		expect(got.workspace.settings).toBeDefined();
	});
	it("enables/disables the account for non-payment", async () => {
		await localAdminApi({ action: "setAccess", paused: true });
		expect((await localAdminApi({ action: "list" })).users[0]).toMatchObject({ paused: true });
		await localAdminApi({ action: "setAccess", paused: false });
		expect((await localAdminApi({ action: "list" })).users[0].paused).toBe(false);
	});
	it("sets account status and subscription type", async () => {
		expect((await localAdminApi({ action: "list" })).users[0]).toMatchObject({ status: "trial", subscriptionType: "monthly" });
		await localAdminApi({ action: "setAccountStatus", status: "live" });
		await localAdminApi({ action: "setSubscriptionType", subscriptionType: "annual" });
		const list = await localAdminApi({ action: "list" });
		expect(list.users[0]).toMatchObject({ status: "live", subscriptionType: "annual" });
		expect(list.stats).toMatchObject({ liveAccounts: 1, trialAccounts: 0, testAccounts: 0 });
		await expect(localAdminApi({ action: "setAccountStatus", status: "bogus" })).rejects.toThrow();
		await expect(localAdminApi({ action: "setSubscriptionType", subscriptionType: "weekly" })).rejects.toThrow();
		await localAdminApi({ action: "setAccountStatus", status: "trial" });
		await localAdminApi({ action: "setSubscriptionType", subscriptionType: "monthly" });
	});
	it("saves per-location features, welcome message and plan", async () => {
		await localAdminApi({
			action: "saveSettings",
			settings: { features: { "checkout.discounts": false }, locationFeatures: { "loc-main": { "view.reports": false } }, welcome: { title: "Hi", version: 2 }, plan: { tier: "pro" } },
		});
		const { workspace } = await localAdminApi({ action: "get" });
		expect(workspace.settings.features["checkout.discounts"]).toBe(false);
		expect(workspace.settings.locationFeatures["loc-main"]["view.reports"]).toBe(false);
		expect(workspace.settings.welcome.title).toBe("Hi");
		expect(workspace.settings.plan.tier).toBe("pro");
	});
	it("creates, lists and updates invoices", async () => {
		const out = await localAdminApi({ action: "saveInvoice", invoice: { lines: [{ desc: "POS", qty: 1, price: 7500 }, { desc: "x", qty: 2, price: 5500 }] } });
		expect(out.invoice.amount).toBe(18500);
		expect(out.invoice.number).toMatch(/^INV-POS-/);
		expect(out.invoice.status).toBe("unpaid");
		await localAdminApi({ action: "saveInvoice", invoice: { ...out.invoice, status: "paid" } });
		const { invoices } = await localAdminApi({ action: "listInvoices" });
		expect(invoices).toHaveLength(1);
		expect(invoices[0].status).toBe("paid");
	});
});

describe("feature switches per location", () => {
	const merged = (settings, loc) => resolveFeatures({ ...(settings.features || {}), ...(loc && loc !== "all" ? settings.locationFeatures?.[loc] || {} : {}) }).enabled;
	it("applies business-wide switches, then the location override", () => {
		const s = { features: { "checkout.splitBill": false }, locationFeatures: { galle: { "checkout.splitBill": true, "view.reports": false } } };
		expect(merged(s, "")["checkout.splitBill"]).toBe(false);
		expect(merged(s, "loc-main")["checkout.splitBill"]).toBe(false);
		expect(merged(s, "galle")["checkout.splitBill"]).toBe(true);
		expect(merged(s, "galle")["view.reports"]).toBe(false);
		expect(merged(s, "all")["view.reports"]).toBe(true);
	});
	it("core features cannot be disabled and dependants follow their requirement", () => {
		const r = resolveFeatures({ "view.checkout": false, "view.customers": false });
		expect(r.enabled["view.checkout"]).toBe(true);
		expect(r.enabled["view.crm"]).toBe(false);
	});
	it("a disabled feature stops its service (discounts off => no discount)", async () => {
		const h = await createHarness({ features: { "checkout.discounts": false } });
		expect(h.flags["checkout.discounts"]).toBe(false);
	});
});

describe("tiers", () => {
	it("match the pricing sheet", () => {
		const price = Object.fromEntries(PLANS.map((p) => [p.id, p.price]));
		expect(price).toMatchObject({ starter: 5500, business: 7500, pro: 15500, enterprise: 150000 });
		expect(PLANS.find((p) => p.id === "enterprise").term).toMatch(/one-time/);
		expect(ADDITIONAL_FEATURES).toMatchObject({ freeCount: 2, pricePerFeature: 5500 });
	});
	it("every tier preset only references real features", () => {
		const ids = new Set(FEATURES.map((f) => f.id));
		Object.values(PLAN_FEATURE_OFF).flat().forEach((id) => expect(ids.has(id)).toBe(true));
	});
});

describe("invoice billing", () => {
	const off = (ids) => Object.fromEntries(FEATURES.map((f) => [f.id, !ids.includes(f.id)]));
	it("base price only when nothing extra is on", () => {
		const inv = buildInvoiceLines({ tier: "business", flags: off(PLAN_FEATURE_OFF.business) });
		expect(inv.total).toBe(7500);
	});
	it("a fixed-amount exception replaces the computed total", () => {
		const inv = buildInvoiceLines({ tier: "pro", flags: {}, exceptionAmount: 12000, exceptionNote: "legacy deal" });
		expect(inv).toMatchObject({ exception: true, total: 12000 });
		expect(inv.lines[0].desc).toContain("legacy deal");
	});
	it("enterprise is a one-time charge", () => {
		const inv = buildInvoiceLines({ tier: "enterprise", flags: {}, period: "2026-10" });
		expect(inv.total).toBe(150000);
		expect(inv.lines[0].desc).toContain("one-time");
	});
});

describe("first-login welcome message", () => {
	it("defaults to enabled, version 1, and merges admin edits", () => {
		expect(resolveWelcome({})).toEqual(DEFAULT_WELCOME);
		expect(resolveWelcome({ welcome: { title: "Hi", version: 3 } })).toMatchObject({ title: "Hi", version: 3, enabled: true });
	});
	it("is due for a user until they have seen the current version", () => {
		const due = (user, settings) => resolveWelcome(settings).enabled && user.welcomeSeenVersion !== resolveWelcome(settings).version;
		expect(due({}, {})).toBe(true);
		expect(due({ welcomeSeenVersion: 1 }, {})).toBe(false);
		expect(due({ welcomeSeenVersion: 1 }, { welcome: { version: 2 } })).toBe(true);
		expect(due({}, { welcome: { enabled: false } })).toBe(false);
	});
});
