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
