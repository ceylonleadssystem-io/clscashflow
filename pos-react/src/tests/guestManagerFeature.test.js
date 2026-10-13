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
