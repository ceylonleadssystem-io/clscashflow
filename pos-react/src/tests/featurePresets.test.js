import { describe, it, expect } from "vitest";
import { FEATURES, FEATURE_MAP } from "../config/features";
import { POS_TYPE_PRESETS } from "../config/presets";
import { FEATURE_PRESETS, presetFlags } from "../config/featurePresets";

describe("business category presets", () => {
	it("has 9 categories with valid ids, types and POS types", () => {
		expect(FEATURE_PRESETS).toHaveLength(9);
		for (const p of FEATURE_PRESETS) {
			expect(p.types.length).toBeGreaterThan(0);
			expect(POS_TYPE_PRESETS[p.posType]).toBeTruthy();
		}
	});
	it("only lists real, non-core features as off", () => {
		for (const p of FEATURE_PRESETS) for (const id of p.off) {
			expect(FEATURE_MAP[id], `${p.id}:${id}`).toBeTruthy();
			expect(FEATURE_MAP[id].core).toBe(false);
		}
	});
	it("presetFlags keeps core on and everything else on except off", () => {
		const p = FEATURE_PRESETS[1];
		const flags = presetFlags(p, FEATURES);
		for (const x of FEATURES) expect(flags[x.id]).toBe(x.core || !p.off.includes(x.id));
	});
});
