/**
 * Tests for subscription constraints: standard plan limits, forced-off features, and the POS refusing a new user or location
 * beyond what the plan assigned in the admin portal allows (accounts without an assignment stay unlimited).
 */
import { describe, expect, it } from "vitest";
import { resolveFeatures } from "../config/features";
import { flagsWithPlan, locationLimitError, normalizeSubscription, standardSubscription, subscriptionOf, usageOf, userLimitError } from "../config/subscription";
import { createHarness } from "./harness";

const userForm = (n, extra = {}) => ({ id: "", name: "Staff " + n, pin: String(2000 + n), role: "cashier", active: true, locationAccess: "all", locationIds: [], ...extra });
const locationForm = (n, extra = {}) => ({ id: "", name: "Branch " + n, code: "B" + n, address: "", phone: "", email: "", openingHours: "", active: true, receiptHeader: "", receiptFooter: "", ...extra });

describe("standard plans", () => {
	it("match the pricing sheet: users, locations and excluded features", () => {
		expect(standardSubscription("starter")).toMatchObject({ maxUsers: 2, maxLocations: 1 });
		expect(standardSubscription("starter").featuresOff).toContain("catalogue.barcodeLabels");
		expect(standardSubscription("business")).toMatchObject({ maxUsers: 10, maxLocations: 3 });
		expect(standardSubscription("pro")).toMatchObject({ maxUsers: null, maxLocations: null, featuresOff: [] });
		expect(standardSubscription("nope")).toBeNull();
	});
	it("cleans what the admin portal sends", () => {
		const s = normalizeSubscription({ planId: "founders", name: "Founders", maxUsers: "5", maxLocations: "", featuresOff: ["view.crm", "bad id!", "view.crm"], custom: [{ label: " Free hardware ", value: "1 printer" }, { label: "", value: "x" }] });
		expect(s).toMatchObject({ enforced: true, maxUsers: 5, maxLocations: null, featuresOff: ["view.crm"], custom: [{ label: "Free hardware", value: "1 printer" }] });
	});
	it("forces the plan's features off but never a required one", () => {
		const sub = standardSubscription("starter");
		const on = resolveFeatures(flagsWithPlan({}, sub)).enabled;
		expect(on["view.crm"]).toBe(false);
		expect(on["catalogue.barcodeLabels"]).toBe(false);
		expect(on["view.checkout"]).toBe(true);
		expect(resolveFeatures(flagsWithPlan({}, null)).enabled["view.crm"]).toBe(true);
	});
	it("counts only active users and locations", () => {
		const sub = standardSubscription("starter");
		const users = [{ id: "a" }, { id: "b", active: false }];
		expect(userLimitError(sub, users)).toBe("");
		expect(userLimitError(sub, [...users, { id: "c" }])).toMatch(/up to 2 active users/);
		expect(userLimitError(sub, [{ id: "a" }, { id: "c" }], "c")).toBe(""); // editing a user already counted
		expect(locationLimitError(sub, [{ id: "l1" }])).toMatch(/up to 1 location/);
		expect(usageOf(sub, users, [{ id: "l1" }])).toEqual({ users: 1, maxUsers: 2, locations: 1, maxLocations: 1 });
		expect(subscriptionOf({ subscription: { enforced: false } })).toBeNull();
	});
});

describe("the POS follows the assigned plan", () => {
	it("refuses a user beyond the plan's limit, but allows editing and deactivating", async () => {
		const h = await createHarness({ settings: { subscription: standardSubscription("starter") } });
		expect(await h.svc.staff.saveUser(userForm(1))).toBeTruthy(); // owner + 1 = 2
		const before = h.data().users.length;
		await h.svc.staff.saveUser(userForm(2));
		expect(h.lastAlert()).toMatch(/up to 2 active users/);
		expect(h.data().users).toHaveLength(before);
		const cashier = h.data().users.find((u) => u.name === "Staff 1");
		await h.svc.staff.saveUser({ ...userForm(1), id: cashier.id, name: "Renamed" });
		expect(h.data().users.find((u) => u.id === cashier.id).name).toBe("Renamed");
		await h.svc.staff.saveUser({ ...userForm(1), id: cashier.id, name: "Renamed", active: false });
		await h.svc.staff.saveUser(userForm(3)); // a slot is free again
		expect(h.data().users.some((u) => u.name === "Staff 3")).toBe(true);
		await h.svc.staff.saveUser({ ...userForm(1), id: cashier.id, name: "Renamed", active: true }); // would be a third active user
		expect(h.lastAlert()).toMatch(/up to 2 active users/);
	});

	it("refuses a location beyond the plan's limit", async () => {
		const starter = await createHarness({ settings: { subscription: standardSubscription("starter") } });
		const count = starter.data().locations.filter((l) => l.active !== false).length;
		expect(count).toBeGreaterThanOrEqual(1);
		await starter.svc.locations.saveLocation(locationForm(1));
		if (count >= 1) expect(starter.lastAlert()).toMatch(/up to 1 location/);
		const business = await createHarness({ settings: { subscription: standardSubscription("business") } });
		await business.svc.locations.saveLocation(locationForm(1));
		expect(business.data().locations.some((l) => l.name === "Branch 1")).toBe(true);
	});

	it("does not limit a business that has no plan assigned", async () => {
		const h = await createHarness();
		for (let i = 1; i <= 5; i++) await h.svc.staff.saveUser(userForm(i));
		expect(h.data().users.filter((u) => u.name.startsWith("Staff"))).toHaveLength(5);
	});
});
