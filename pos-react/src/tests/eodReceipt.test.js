import { describe, expect, it } from "vitest";
import { endOfDayReport } from "../domain/endOfDay";
import { eodReceiptHtml } from "../services/printing/documents";

const sale = { id: "1", receipt: "R1", date: "2026-10-29", createdAt: "2026-10-29T10:00:00Z", status: "completed", payment: "Cash", staffId: "u1", locationId: "l1", lines: [{ name: "Tea", price: 100, qty: 2, category: "Food" }], total: 200 };

describe("End of Day receipt", () => {
	const report = endOfDayReport({ day: "2026-10-29", business: "Cafe <One>", sales: [sale], users: [{ id: "u1", name: "Kehara" }] });
	const html = eodReceiptHtml(report, { autoPrint: false });
	it("is an 80 mm receipt with totals, payments and items", () => {
		expect(html).toContain("size:80mm auto");
		expect(html).toContain("END OF DAY REPORT");
		expect(html).toContain("Cafe &lt;One&gt;");
		expect(html).toMatch(/Cash\s+200\.00/);
		expect(html).toMatch(/Tea\s+x2\s+200\.00/);
	});
	it("keeps every line within the 46 printable columns", () => {
		const lines = [...html.matchAll(/<div class="ln [^"]*">([^<]*)<\/div>/g)].map((m) => m[1].replace(/&[a-z]+;/g, "x"));
		expect(Math.max(...lines.map((l) => l.length))).toBeLessThanOrEqual(46);
	});
	it("shows None for empty sections", () => {
		expect(eodReceiptHtml(endOfDayReport({ day: "2026-10-29" }), { autoPrint: false })).toContain(">None<");
	});
});

import { applyEodOptions } from "../domain/endOfDay";
import { applyPatch, resolveOptions, validateOptions } from "../domain/systemOptions";

describe("EOD Reports options", () => {
	const report = endOfDayReport({ day: "2026-10-29", sales: [sale], users: [{ id: "u1", name: "Kehara" }] });
	it("shows everything by default and hides only what is switched off", () => {
		const all = resolveOptions({}, "eod", "all");
		expect(applyEodOptions(report, all).sections).toHaveLength(report.sections.length);
		const off = applyEodOptions(report, { ...all, refunds: false, items: false, totals: false });
		expect(off.sections.map((s) => s.title)).not.toContain("Refunds");
		expect(off.sections.map((s) => s.title)).not.toContain("Sales by Item");
		expect(off.kpis).toEqual([]);
		expect(eodReceiptHtml(off, { autoPrint: false })).not.toContain("ITEMS SOLD");
	});
	it("stores per location and validates the automatic print time", () => {
		const so = applyPatch({}, { eod: { refunds: false } }, "l1");
		expect(resolveOptions({ systemOptions: so }, "eod", "l1").refunds).toBe(false);
		expect(resolveOptions({ systemOptions: so }, "eod", "l2").refunds).toBe(true);
		expect(validateOptions("eod", { autoOn: true, autoTime: "25:00" }).autoTime).toBeTruthy();
		expect(validateOptions("eod", { autoOn: true, autoTime: "23:00" })).toEqual({});
	});
});
