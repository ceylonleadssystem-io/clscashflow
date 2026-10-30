import { describe, expect, it } from "vitest";
import { activeThirdParty, move, nameError, paymentChoices, reorder, splitChoices, usedNames } from "../domain/thirdPartyPayments";

const settings = { thirdPartyPayments: [{ id: "a", name: "PickMe Food", active: true }, { id: "b", name: "Uber Eats", active: false }, { id: "c", name: "Corporate account" }, { id: "", name: "x" }] };

describe("3rd party payment types", () => {
	it("checkout offers the standard methods plus the active types, in order", () => {
		expect(activeThirdParty(settings).map((t) => t.name)).toEqual(["PickMe Food", "Corporate account"]);
		expect(paymentChoices(settings)).toEqual(["Cash", "Card", "Bank Transfer", "Online Payment", "PickMe Food", "Corporate account"]);
		expect(paymentChoices({})).toEqual(["Cash", "Card", "Bank Transfer", "Online Payment"]);
	});
	it("split bills replace the generic 3rd Party entry once types exist", () => {
		expect(splitChoices({})).toContain("3rd Party");
		const s = splitChoices(settings);
		expect(s).not.toContain("3rd Party");
		expect(s.slice(-2)).toEqual(["PickMe Food", "Corporate account"]);
	});
	it("names are required, short and unique (case-insensitive, also against the built-in methods)", () => {
		expect(nameError("  ")).toBeTruthy();
		expect(nameError("x".repeat(41))).toBeTruthy();
		expect(nameError("pickme food", settings.thirdPartyPayments)).toBeTruthy();
		expect(nameError("cash")).toBeTruthy();
		expect(nameError("DoorDash", settings.thirdPartyPayments)).toBe("");
	});
	it("knows which types past sales used", () => {
		const used = usedNames([{ payment: "Cash" }, { payment: "Split", payments: [{ method: "Uber Eats" }, { method: "Cash" }] }]);
		expect(used.has("Uber Eats")).toBe(true);
		expect(used.has("PickMe Food")).toBe(false);
	});
	it("reorders by id and by step", () => {
		const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
		expect(move(list, "a", 1).map((x) => x.id)).toEqual(["b", "a", "c"]);
		expect(move(list, "a", -1)).toBe(list);
		expect(reorder(list, ["c", "a"]).map((x) => x.id)).toEqual(["c", "a", "b"]);
	});
});
