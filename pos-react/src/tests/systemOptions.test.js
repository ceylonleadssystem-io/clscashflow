import { describe, expect, it } from "vitest";
import { PRESETS, applyPatch, autoClockOutDue, defaultsFor, isOverridden, landingView, presetChanges, resolveOptions, validateOptions } from "../domain/systemOptions";

describe("system options values", () => {
	it("defaults keep today's behaviour", () => {
		expect(resolveOptions({}, "clock")).toMatchObject({ autoElapsedOn: false, autoTimeOn: false });
		expect(resolveOptions({}, "signIn").defaultView).toBe("auto");
		expect(resolveOptions({}, "orderEntry")).toEqual({ defaultOrderType: "Dine-in", showPrices: true });
	});
	it("resolves default < organization < location override, only for settings a location may override", () => {
		const settings = { systemOptions: { org: { orderEntry: { defaultOrderType: "Takeaway" }, receipts: { footer: "Org" } }, locations: { l1: { orderEntry: { defaultOrderType: "Dine-in", showPrices: false }, receipts: { footer: "Branch" } } } } };
		expect(resolveOptions(settings, "orderEntry", "all").defaultOrderType).toBe("Takeaway");
		expect(resolveOptions(settings, "orderEntry", "l1")).toEqual({ defaultOrderType: "Dine-in", showPrices: false });
		expect(resolveOptions(settings, "orderEntry", "l2").defaultOrderType).toBe("Takeaway");
		expect(resolveOptions(settings, "receipts", "l1").footer).toBe("Org"); // footer is organization-wide
		expect(isOverridden(settings, "orderEntry", "showPrices", "l1")).toBe(true);
		expect(isOverridden(settings, "orderEntry", "showPrices", "all")).toBe(false);
	});
	it("the receipt footer reads the existing receiptFooter setting until saved here", () => {
		expect(resolveOptions({ receiptFooter: "Come again" }, "receipts").footer).toBe("Come again");
		expect(resolveOptions({ receiptFooter: "Old", systemOptions: { org: { receipts: { footer: "New" } } } }, "receipts").footer).toBe("New");
		expect(defaultsFor("receipts").footer).toBe("Thank you for your purchase");
	});
	it("applyPatch writes to the location when it may override, else the organization; undefined resets", () => {
		let so = applyPatch({}, { orderEntry: { showPrices: false }, receipts: { footer: "Hi" } }, "l1");
		expect(so.locations.l1.orderEntry.showPrices).toBe(false);
		expect(so.org.receipts.footer).toBe("Hi");
		so = applyPatch(so, { orderEntry: { showPrices: undefined } }, "l1");
		expect(so.locations).toEqual({});
		expect(applyPatch({}, { orderEntry: { showPrices: false } }, "all").org.orderEntry.showPrices).toBe(false);
		expect(applyPatch({}, { nope: { x: 1 }, orderEntry: { nope: 1 } }).org).toEqual({});
	});
});

describe("validation", () => {
	it("checks each page", () => {
		expect(validateOptions("orderEntry", { defaultOrderType: "Drive-thru" }).defaultOrderType).toBeTruthy();
		expect(validateOptions("orderEntry", { defaultOrderType: "Takeaway" })).toEqual({});
		expect(validateOptions("receipts", { footer: "x".repeat(201) }).footer).toBeTruthy();
		expect(validateOptions("signIn", { defaultView: "nowhere" }).defaultView).toBeTruthy();
		expect(validateOptions("clock", { autoElapsedOn: true, maxHours: 0, maxMinutes: 0 }).maxHours).toBeTruthy();
		expect(validateOptions("clock", { autoElapsedOn: true, maxHours: 8, maxMinutes: 30 })).toEqual({});
		expect(validateOptions("clock", { autoTimeOn: true, autoTime: "25:00" }).autoTime).toBeTruthy();
		expect(validateOptions("clock", { autoElapsedOn: false, autoTimeOn: false, maxHours: "x" })).toEqual({}); // off switches are not validated
	});
});

describe("presets", () => {
	it("preview only what would change", () => {
		const current = { orderEntry: { defaultOrderType: "Dine-in" }, signIn: { defaultView: "auto" } };
		const quick = PRESETS.find((p) => p.key === "quick");
		expect(presetChanges(quick, current)).toEqual([
			{ page: "orderEntry", key: "defaultOrderType", before: "Dine-in", after: "Takeaway" },
			{ page: "signIn", key: "defaultView", before: "auto", after: "checkout" },
		]);
		expect(presetChanges(PRESETS.find((p) => p.key === "full"), { orderEntry: { defaultOrderType: "Dine-in" }, signIn: { defaultView: "tables" } })).toEqual([]);
	});
});

describe("auto clock-out", () => {
	const entry = { clockIn: "2026-10-29T08:00:00" };
	const at = (s) => new Date(s);
	it("clocks out after the maximum time", () => {
		const opts = { autoElapsedOn: true, maxHours: 8, maxMinutes: 30 };
		expect(autoClockOutDue(entry, opts, at("2026-10-29T16:29:00"))).toBe("");
		expect(autoClockOutDue(entry, opts, at("2026-10-29T16:30:00"))).toBe("elapsed");
	});
	it("clocks out at the daily time: the first such time after clocking in", () => {
		const opts = { autoTimeOn: true, autoTime: "03:00" };
		expect(autoClockOutDue(entry, opts, at("2026-10-30T02:59:00"))).toBe("");
		expect(autoClockOutDue(entry, opts, at("2026-10-30T03:00:00"))).toBe("time");
		expect(autoClockOutDue({ clockIn: "2026-10-29T01:00:00" }, opts, at("2026-10-29T03:01:00"))).toBe("time"); // clocked in before 03:00 the same day
	});
	it("does nothing when both are off, or the entry is already closed", () => {
		expect(autoClockOutDue(entry, { autoElapsedOn: false, autoTimeOn: false }, at("2027-01-01T00:00:00"))).toBe("");
		expect(autoClockOutDue({ ...entry, clockOut: "x" }, { autoElapsedOn: true, maxHours: 1, maxMinutes: 0 }, at("2027-01-01T00:00:00"))).toBe("");
	});
});

describe("landing view", () => {
	it("uses the configured page only when the user may open it", () => {
		const can = (v) => v !== "tables";
		expect(landingView({ defaultView: "checkout" }, can, "staff")).toBe("checkout");
		expect(landingView({ defaultView: "tables" }, can, "staff")).toBe("staff");
		expect(landingView({ defaultView: "auto" }, can, "staff")).toBe("staff");
	});
});
