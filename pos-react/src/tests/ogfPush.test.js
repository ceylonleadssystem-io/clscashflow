import { describe, expect, it } from "vitest";
import { blankForm, formFrom, formProblems, newRegister, registerProblem, PAYMENT_ROWS, INTERVALS } from "../domain/ogfPush";
import { settingsGroups } from "../views/settings/SettingsHome";

describe("Sales push settings (OGF only)", () => {
	it("starts switched off on the test server, hourly, with the spec's defaults", () => {
		expect(blankForm()).toMatchObject({ enabled: false, environment: "test", intervalMinutes: 60, tokenPath: "/connect/token", importPath: "/api/possale/importpossaleswithitems", salesCurrency: "LKR", itemAmountBasis: "before-tax", discountField: "both", registers: [] });
		expect(INTERVALS).toContain(60);
		expect(PAYMENT_ROWS.map((r) => r[0])).toEqual(["Cash", "Card", "Bank Transfer", "Online Payment", "Gift Card", "3rd Party"]);
	});
	it("fills in whatever a saved setting is missing and keeps what it has", () => {
		const f = formFrom({ enabled: true, propertyCode: "OGF1", registers: [{ id: "r1", posInterfaceCode: "CCB1-PS-23-00000039" }], paymentMap: { Card: "Visa" } });
		expect(f).toMatchObject({ enabled: true, propertyCode: "OGF1", environment: "test", intervalMinutes: 60 });
		expect(f.registers[0]).toEqual({ id: "r1", name: "", locationId: "", deviceId: "", posInterfaceCode: "CCB1-PS-23-00000039", clientId: "" });
		expect(f.paymentMap).toEqual({ Card: "Visa" });
		expect(formFrom(undefined)).toEqual(blankForm());
		expect(formFrom("junk")).toEqual(blankForm());
	});
	it("says what is missing before the push can be switched on", () => {
		expect(formProblems(blankForm())).toEqual(["Enter the property code OGF gave you.", "Enter the test server address.", "Add a register with its POS interface code and login."]);
		const ready = { ...blankForm(), propertyCode: "OGF1", testBaseUrl: "https://pos-api.example.com", registers: [newRegister()] };
		expect(formProblems(ready)).toEqual([]);
		expect(formProblems({ ...ready, testBaseUrl: "http://pos-api.example.com" })[0]).toMatch(/must start with https/);
		expect(formProblems({ ...ready, environment: "live" })[0]).toMatch(/live server address/);
	});
	it("a register needs its code and client ID, and a secret the first time", () => {
		const r = { ...newRegister(), posInterfaceCode: "PS-1", clientId: "cid" };
		expect(registerProblem({ ...r, posInterfaceCode: "" }, true, "")).toMatch(/interface code/);
		expect(registerProblem({ ...r, clientId: " " }, true, "")).toMatch(/client ID/);
		expect(registerProblem(r, false, "")).toMatch(/secret/);
		expect(registerProblem(r, true, "")).toBe("");
		expect(registerProblem(r, false, "abc")).toBe("");
		expect(newRegister(1).id).not.toBe(newRegister(2).id);
	});
	it("the Sales push page is listed under System Options for a Restaurant (OGF) business only", () => {
		const tabs = [{ id: "business", label: "Business Profile" }, { id: "operations", label: "Operations" }, { id: "plan", label: "Plan & Support" }];
		const keys = (salesPush) => settingsGroups({ can: () => true, serviceChargeOn: true, kitchen: true, legacyTabs: tabs, salesPush })[0].items.map((i) => i.key);
		expect(keys(true)).toContain("ogfPush");
		expect(keys(false)).not.toContain("ogfPush");
		expect(settingsGroups({ can: () => true, serviceChargeOn: true, kitchen: true, legacyTabs: tabs })[0].items.map((i) => i.label)).not.toContain("Sales push (OGF only)");
		expect(settingsGroups({ can: () => true, serviceChargeOn: true, kitchen: true, legacyTabs: tabs, salesPush: true })[0].items.find((i) => i.key === "ogfPush").label).toBe("Sales push (OGF only)");
	});
});
