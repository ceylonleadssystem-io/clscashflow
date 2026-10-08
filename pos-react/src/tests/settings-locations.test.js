/**
 * Tests for locations and business settings: location validation and stock buckets, saving settings, service
 * charge limits, support codes, POS setup presets and themes.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createHarness } from "./harness";
import { loginLocationChoices } from "../services/pos/locations";

const loc = (o = {}) => ({ name: "Galle", code: "gal", address: "", phone: "", email: "", openingHours: "", active: true, receiptHeader: "", receiptFooter: "", ...o });
const settingsForm = (o = {}) => ({
	business: "Test Cafe", email: "a@b.lk", address: "", businessType: "cafe", feedbackLink: "", feedbackDelay: 2, posUsers: 3,
	printerType: "browser", printerAddress: "", autoPrint: false, autoPrintKot: false, kotPrinter: "", receiptFooter: "Thanks",
	supportEnabled: false, serviceChargeEnabled: false, serviceChargeRate: 0, orderChannels: ["Dine-in"], socials: {}, ...o,
});

describe("locations", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("requires name and code, uppercases the code", async () => {
		await h.svc.locations.saveLocation(loc({ name: "" }));
		expect(h.lastAlert()).toMatch(/name and code/);
		const l = await h.svc.locations.saveLocation(loc());
		expect(l.code).toBe("GAL");
	});
	it("rejects duplicate codes but allows editing itself", async () => {
		const l = await h.svc.locations.saveLocation(loc());
		await h.svc.locations.saveLocation(loc({ name: "Other", code: "GAL" }));
		expect(h.lastAlert()).toMatch(/already in use/);
		await h.svc.locations.saveLocation(loc({ id: l.id, name: "Galle Fort" }));
		expect(h.data().locations.filter((x) => x.code === "GAL")).toHaveLength(1);
	});
	it("gives existing stock a 0 bucket for the new location and audits it", async () => {
		const i = await h.svc.inventory.saveInventoryItem({ name: "Sugar", sku: "", type: "Ingredient", unit: "kg", qty: "5", reorder: "1", cost: "1", supplier: "" });
		const l = await h.svc.locations.saveLocation(loc());
		expect(h.data().inventory.find((x) => x.id === i.id).locationQuantities[l.id]).toBe(0);
		expect(h.data().locationAudit.some((a) => a.action === "location-created")).toBe(true);
	});
});

describe("business settings", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("saves the settings and marks onboarding complete", async () => {
		await h.svc.settings.saveSettings(settingsForm());
		expect(h.data().settings).toMatchObject({ business: "Test Cafe", businessType: "cafe", onboardingComplete: true, posUsers: 3 });
	});
	it("validates the service charge percentage", async () => {
		await h.svc.settings.saveSettings(settingsForm({ serviceChargeEnabled: true, serviceChargeRate: 150 }));
		expect(h.lastAlert()).toMatch(/0 to 100/);
		await h.svc.settings.saveSettings(settingsForm({ serviceChargeEnabled: true, serviceChargeRate: 10 }));
		expect(h.data().settings.serviceChargeRate).toBe(10);
	});
	it("requires an order channel for food service", async () => {
		await h.svc.settings.saveSettings(settingsForm({ orderChannels: [] }));
		expect(h.lastAlert()).toMatch(/at least one checkout order type/);
	});
	it("generates a support code when support is enabled and can regenerate it", async () => {
		await h.svc.settings.saveSettings(settingsForm({ supportEnabled: true }));
		const code = h.data().settings.supportCode;
		expect(code).toMatch(/^\d{6}$/);
		await h.svc.settings.regenerateSupportCode();
		expect(h.data().settings.supportCode).toMatch(/^\d{6}$/);
	});
	it("applies a POS setup preset once", async () => {
		await h.svc.settings.applyPosSetup({ type: "restaurant", addCategories: true, enableKot: true });
		expect(h.data().settings).toMatchObject({ businessType: "restaurant", autoPrintKot: true, onboardingComplete: true });
		expect(h.data().categories.length).toBeGreaterThan(0);
		expect(h.data().modifiers.length).toBeGreaterThan(0);
	});
	it("dismisses the setup reminder only when asked", async () => {
		await h.svc.settings.dismissPosSetup(false);
		expect(h.data().settings.onboardingDismissed).toBeUndefined();
		await h.svc.settings.dismissPosSetup(true);
		expect(h.data().settings.onboardingDismissed).toBe(true);
	});
	it("saves the theme and removes the logo", async () => {
		await h.svc.settings.setTheme("midnight", "Midnight");
		expect(h.data().settings.uiTheme).toBe("midnight");
	});
	it("records per-setting update times for sync", async () => {
		await h.svc.settings.saveSettings(settingsForm());
		expect(h.data().settingsUpdatedAt.business).toBeTruthy();
	});
});

describe("login location choice", () => {
	const data = { locations: [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C", active: false }] };
	const user = (o) => ({ id: "u", role: "cashier", locationAccess: "selected", locationIds: ["a", "b"], ...o });
	it("asks only non-owners of a multi-location business who may work at several locations", () => {
		expect(loginLocationChoices(user(), data, true).map((l) => l.id)).toEqual(["a", "b"]);
		expect(loginLocationChoices(user({ role: "manager", locationAccess: "all" }), data, true).map((l) => l.id)).toEqual(["a", "b"]);
		expect(loginLocationChoices(user({ role: "owner" }), data, true)).toEqual([]);
		expect(loginLocationChoices(user(), data, false)).toEqual([]); // locations feature off
		expect(loginLocationChoices(user({ locationIds: ["a"] }), data, true)).toEqual([]); // one location: no question
		expect(loginLocationChoices(user({ locationIds: ["a", "c"] }), data, true)).toEqual([]); // inactive locations do not count
	});
});
