import { describe, expect, it } from "vitest";
import { CAPABILITIES, hasCapability, typesWith } from "../config/capabilities";
import { INDUSTRY_TYPES, KITCHEN_TYPES, POS_TYPE_PRESETS, SERVICE_CHARGE_TYPES, commonModifierPresets } from "../config/presets";
import { FEATURE_PRESETS } from "../config/featurePresets";
import { kitchenMode, serviceChargeSupported } from "../services/pos/common";
import { batchStatus, commissionRows } from "../domain/industry";
import { INDUSTRY_MODULES } from "../views/businessTools";

describe("capabilities", () => {
	it("describe every business type that has a preset, and every preset points at a known type", () => {
		expect(Object.keys(CAPABILITIES).sort()).toEqual(Object.keys(POS_TYPE_PRESETS).sort());
		for (const p of FEATURE_PRESETS) expect(CAPABILITIES[p.posType], p.id).toBeDefined();
	});
	it("keep the behaviour the old business-type lists had", () => {
		expect(KITCHEN_TYPES).toEqual(["restaurant", "cafe"]);
		expect(SERVICE_CHARGE_TYPES).toEqual(["restaurant", "cafe", "salon", "services"]);
		expect(INDUSTRY_TYPES).toEqual(["salon", "services", "pharmacy"]);
		expect(typesWith("barcodeLabels").sort()).toEqual(["grocery", "hardware", "pharmacy", "retail"]);
		expect(kitchenMode({ businessType: "cafe" })).toBe(true);
		expect(kitchenMode({ businessType: "retail" })).toBe(false);
		expect(serviceChargeSupported({ businessType: "salon" })).toBe(true);
		expect(serviceChargeSupported({ businessType: "pharmacy" })).toBe(false);
		expect(hasCapability("nonsense", "kitchen")).toBe(false);
	});
	it("food types get the food modifier presets, others the retail ones", () => {
		expect(commonModifierPresets("restaurant")[0].options.map((o) => o.name)).toContain("Regular");
		expect(commonModifierPresets("retail")[0].options.map((o) => o.name)).toContain("2XL");
	});
	it("Business Tools modules each belong to a capability some business type has", () => {
		for (const m of INDUSTRY_MODULES) expect(typesWith(m.capability).length, m.key).toBeGreaterThan(0);
		const forType = (t) => INDUSTRY_MODULES.filter((m) => hasCapability(t, m.capability)).map((m) => m.key);
		expect(forType("salon")).toEqual(["appointments", "memberships", "commissions"]);
		expect(forType("pharmacy")).toEqual(["prescriptions", "medicineBatches", "commissions"]);
		expect(forType("restaurant")).toEqual([]);
	});
});

describe("business tools maths", () => {
	const now = new Date("2026-10-30T12:00:00");
	it("batch expiry status", () => {
		expect(batchStatus({ expiry: "2026-10-28" }, now)).toBe("Expired");
		expect(batchStatus({ expiry: "2026-11-10" }, now)).toBe("Expires in 12 days");
		expect(batchStatus({ expiry: "2027-01-10" }, now)).toBe("Expiring soon");
		expect(batchStatus({ expiry: "2028-01-01" }, now)).toBe("Current");
	});
	it("commission is the user's rate on completed sales, less what was paid", () => {
		const users = [{ id: "u1", name: "A", commissionRate: 10 }];
		const sales = [
			{ staffId: "u1", date: "2026-10-10", total: 1000, status: "completed" },
			{ staffId: "u1", date: "2026-10-11", total: 500, status: "voided" },
			{ staffId: "u1", date: "2026-09-01", total: 900, status: "completed" },
		];
		const range = { from: "2026-10-01", to: "2026-10-31" };
		const [row] = commissionRows(users, sales, [{ userId: "u1", from: range.from, to: range.to, amount: 40 }], range);
		expect(row).toMatchObject({ revenue: 1000, commission: 100, paid: 40, balance: 60 });
		expect(row.sales).toHaveLength(1);
	});
});
