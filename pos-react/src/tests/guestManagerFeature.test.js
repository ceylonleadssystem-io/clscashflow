import { describe, expect, it } from "vitest";
import { FEATURE_MAP, resolveFeatures } from "../config/features";
import { FEATURE_PRESET_MAP, FEATURE_PRESETS, presetFlags } from "../config/featurePresets";
import { PLAN_FEATURE_OFF } from "../config/plans";
import { FEATURES } from "../config/features";

const ID = "view.guestManager";

describe("Guest Manager feature switch", () => {
	it("exists, is off by default and has no requirements", () => {
		expect(FEATURE_MAP[ID]).toMatchObject({ group: "navigation", default: false, requires: [] });
		expect(resolveFeatures({}).enabled[ID]).toBe(false);
		expect(resolveFeatures({ [ID]: true }).enabled[ID]).toBe(true);
	});

	it("business presets switch it on only for Food & Beverage and Hospitality", () => {
		const on = FEATURE_PRESETS.filter((p) => presetFlags(p, FEATURES)[ID]).map((p) => p.id);
		expect(on.sort()).toEqual(["food", "hospitality"]);
		expect(FEATURE_PRESET_MAP.retail.off).toContain(ID);
	});

	it("the Starter plan excludes it", () => {
		expect(PLAN_FEATURE_OFF.starter).toContain(ID);
		expect(PLAN_FEATURE_OFF.business).not.toContain(ID);
	});
});

describe("Guest Manager seating on the floor", () => {
	const settings = { gmSeating: { t1: { name: "Nimal", customerId: "c1", phone: "0771234567", at: new Date().toISOString() }, t2: { name: "Old", at: "2020-01-01T00:00:00Z" } } };
	it("returns the seated guest of a table and ignores old or missing records", async () => {
		const { gmSeating } = await import("../domain/tables");
		expect(gmSeating(settings, "t1")).toMatchObject({ name: "Nimal", customerId: "c1" });
		expect(gmSeating(settings, "t2")).toBeNull();
		expect(gmSeating(settings, "t3")).toBeNull();
		expect(gmSeating({}, "t1")).toBeNull();
	});
});
