import { describe, expect, it } from "vitest";
import { settingsGroups } from "../views/settings/SettingsHome";

const tabs = [{ id: "business", label: "Business Profile" }, { id: "operations", label: "Operations" }, { id: "plan", label: "Plan & Support" }];
const all = () => true;
const keys = (g) => g.items.map((i) => i.key);

describe("settings grid", () => {
	it("has four areas, in order, with the business profile first under System Options", () => {
		const g = settingsGroups({ can: all, serviceChargeOn: true, kitchen: true, legacyTabs: tabs });
		expect(g.map((x) => x.title)).toEqual(["System Options", "Users", "Menu Admin", "Device Manager"]);
		expect(keys(g[0])[0]).toBe("legacy:business");
		expect(keys(g[0])).toEqual(expect.arrayContaining(["overview", "orderEntry", "receipts", "signIn", "clock", "payroll", "zones", "serviceCharge", "appearance", "feedback", "legacy:operations", "legacy:plan"]));
		expect(keys(g[0])).not.toContain("thirdParty");
		expect(keys(g[1])).toEqual(["users", "jobs"]);
		expect(keys(g[2])).toEqual(["items", "categories", "modifiers", "availability", "taxes", "salesCategories"]);
		expect(keys(g[3])).toEqual(["printers", "kds", "stations", "health"]);
		expect(g.every((x) => x.blurb)).toBe(true);
	});
	it("leaves out what the person may not use or the business does not have", () => {
		const g = settingsGroups({ can: () => false, serviceChargeOn: false, kitchen: false, legacyTabs: tabs });
		expect(g.map((x) => x.title)).toEqual(["System Options", "Device Manager"]);
		expect(keys(g[0])).not.toContain("serviceCharge");
		expect(keys(g[1])).toEqual(["printers", "health"]);
	});
});
