import { describe, expect, it } from "vitest";
import { detailingReport } from "../services/pos/detailing";

describe("Automobile report by date range (#192)", () => {
	const job = (id, day, status = "Completed") => ({ id, scheduledAt: day + "T09:00", status, packageName: "Full Detail", technicianId: "u1", payments: [{ amount: 1000 }] });
	const jobs = [job("a", "2026-10-31"), job("b", "2026-11-01"), job("c", "2026-11-30"), job("d", "2026-12-01"), job("e", "2026-11-10", "Cancelled")];
	const run = (range) => detailingReport(jobs, { ...range, tech: () => "Nimal" });
	const values = (r) => r.kpis.map((k) => k.value);

	it("includes both end days and nothing outside them", () => {
		const r = run({ from: "2026-11-01", to: "2026-11-30" });
		expect(values(r)[0]).toBe("2");
		expect(values(r)[3]).toBe("1");
		expect(r.sections[0].rows).toEqual([["Full Detail", "2", expect.stringContaining("2,000")]]);
		expect(r.sections[1].rows[0][0]).toBe("Nimal");
		expect(r.subtitle).toBe("2026-11-01 to 2026-11-30");
	});
	it("covers all dates when none are chosen, and accepts one side only", () => {
		expect(values(run({}))[0]).toBe("4");
		expect(values(run({ from: "2026-11-30" }))[0]).toBe("2");
		expect(values(run({ to: "2026-10-31" }))[0]).toBe("1");
	});
});
