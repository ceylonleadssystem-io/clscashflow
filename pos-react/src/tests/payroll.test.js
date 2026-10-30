import { describe, expect, it } from "vitest";
import { entryHours, payCost, payrollHours, payrollWeekStart, splitWeek } from "../domain/payroll";
import { defaultsFor, validateOptions } from "../domain/systemOptions";

const base = defaultsFor("payroll");
const opts = (o = {}) => ({ ...base, ...o });
const at = (d, h = 9, m = 0) => `${d}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
const shift = (day, from, to, extra = {}) => ({ userId: "u1", clockIn: at(day, from), clockOut: at(day, to), breaks: [], ...extra });
const range = { from: "2026-10-26", to: "2026-11-01" }; // Monday to Sunday

describe("payroll week", () => {
	it("starts on the chosen day and time", () => {
		expect(payrollWeekStart(new Date("2026-10-29T10:00:00"), { weekDay: 1, weekTime: "00:00" }).toDateString()).toBe(new Date("2026-10-26T00:00:00").toDateString());
		expect(payrollWeekStart(new Date("2026-10-26T03:00:00"), { weekDay: 1, weekTime: "05:00" }).toDateString()).toBe(new Date("2026-10-19T00:00:00").toDateString()); // before 05:00 Monday: still last week
	});
});

describe("hours worked", () => {
	it("takes off breaks, or only the part beyond the paid break length", () => {
		const e = shift("2026-10-26", 9, 17, { breaks: [{ start: at("2026-10-26", 12), end: at("2026-10-26", 12, 30) }] });
		expect(entryHours(e, opts())).toBeCloseTo(7.5);
		expect(entryHours(e, opts({ paidBreaksOn: true, paidBreakMin: 15 }))).toBeCloseTo(7.75);
		expect(entryHours(e, opts({ paidBreaksOn: true, paidBreakMin: 30 }))).toBe(8);
	});
});

describe("overtime", () => {
	it("is all regular hours when no rule is on", () => {
		const [r] = payrollHours([shift("2026-10-26", 6, 20)], range, opts());
		expect(r).toMatchObject({ regular: 14, ot: 0, ot2: 0, total: 14 });
	});
	it("daily tiers: after 8 at tier 1, after 12 at tier 2", () => {
		const [r] = payrollHours([shift("2026-10-26", 6, 20)], range, opts({ dailyOn: true }));
		expect(r.buckets).toMatchObject({ regular: 8, ot1: 4, ot2: 2 });
		expect(r).toMatchObject({ regular: 8, ot: 4, ot2: 2 });
	});
	it("weekly limit turns later regular hours into weekly overtime", () => {
		const week = ["26", "27", "28", "29", "30"].map((d) => shift("2026-10-" + d, 8, 18)); // 5 x 10 = 50 h
		const [r] = payrollHours(week, range, opts({ weeklyOn: true, weeklyAfter: 45 }));
		expect(r.buckets).toMatchObject({ regular: 45, weeklyOt: 5 });
	});
	it("carryover counts daily overtime toward the weekly limit", () => {
		const week = ["26", "27", "28", "29"].map((d) => shift("2026-10-" + d, 8, 18)); // 4 x 10 h: 2 h daily OT each day
		const off = payrollHours(week, range, opts({ dailyOn: true, d1After: 8, d2After: 24, weeklyOn: true, weeklyAfter: 30 }))[0].buckets;
		const on = payrollHours(week, range, opts({ dailyOn: true, d1After: 8, d2After: 24, weeklyOn: true, weeklyAfter: 30, carryover: true }))[0].buckets;
		expect(off.weeklyOt).toBe(2); // regular hours 32 vs a limit of 30
		expect(on.weeklyOt).toBe(8); // all 40 hours counted, 10 over, but only 8 regular hours left to convert
		expect(on.regular + on.weeklyOt + on.ot1).toBe(40);
	});
	it("the 7th consecutive day uses its own tiers", () => {
		const week = ["26", "27", "28", "29", "30", "31"].map((d) => shift("2026-10-" + d, 9, 13)).concat(shift("2026-11-01", 8, 20)); // 12 h on day 7
		const [r] = payrollHours(week, range, opts({ seventhOn: true }));
		expect(r.buckets).toMatchObject({ regular: 24, s1: 8, s2: 4 });
		expect(payrollHours(week.slice(0, 6), range, opts({ seventhOn: true }))[0].buckets.s1).toBe(0); // only six days
	});
	it("a week that starts before the range is still counted whole", () => {
		const week = ["26", "27", "28"].map((d) => shift("2026-10-" + d, 8, 18)); // 30 h, limit 25
		const [r] = payrollHours(week, { from: "2026-10-28", to: "2026-10-28" }, opts({ weeklyOn: true, weeklyAfter: 25 }));
		expect(r.buckets).toMatchObject({ regular: 5, weeklyOt: 5 }); // only the Wednesday, but the 5 h over the limit land on it
	});
	it("costs hours with the multipliers", () => {
		expect(payCost({ regular: 8, weeklyOt: 0, ot1: 4, ot2: 2, s1: 0, s2: 0 }, 100, opts())).toBe(800 + 4 * 150 + 2 * 200);
	});
	it("splitWeek keeps days in order", () => {
		const rows = splitWeek([{ date: "2026-10-27", hours: 5 }, { date: "2026-10-26", hours: 5 }], opts(), new Date("2026-10-26T00:00:00"));
		expect(rows.map((r) => r.date)).toEqual(["2026-10-26", "2026-10-27"]);
	});
});

describe("payroll settings validation", () => {
	it("tier 2 must come after tier 1 and multipliers stay in range; off switches are not checked", () => {
		expect(validateOptions("payroll", opts({ dailyOn: true, d1After: 10, d2After: 8 })).d2After).toBeTruthy();
		expect(validateOptions("payroll", opts({ dailyOn: true, d1Mult: 0.5 })).d1Mult).toBeTruthy();
		expect(validateOptions("payroll", opts({ weeklyOn: true, weeklyAfter: 0 })).weeklyAfter).toBeTruthy();
		expect(validateOptions("payroll", opts({ weeklyOn: true, weeklyAfter: 45, weeklyMult: 4 })).weeklyMult).toBeTruthy();
		expect(validateOptions("payroll", opts({ paidBreaksOn: true, paidBreakMin: 0 })).paidBreakMin).toBeTruthy();
		expect(validateOptions("payroll", opts({ dailyOn: false, d1After: 10, d2After: 8, weeklyAfter: 0 }))).toEqual({});
		expect(validateOptions("payroll", opts({ dailyOn: true, weeklyOn: true, seventhOn: true }))).toEqual({});
	});
});
