import { describe, expect, it } from "vitest";
import { dailySeries, overall, rollup, summarize } from "../domain/adminAnalytics";

const now = new Date("2026-10-30T12:00:00Z");
const sale = (date, total, extra = {}) => ({ id: date + total, date, createdAt: date + "T10:00:00Z", status: "completed", total, payment: "Cash", orderChannel: "Dine-in", locationId: "l1", locationName: "Main", lines: [{ name: "Tea", price: total, qty: 1 }], ...extra });

describe("admin analytics", () => {
	const sales = [sale("2026-10-30", 500), sale("2026-10-29", 300, { payment: "Card", locationId: "l2", locationName: "Galle" }), sale("2026-10-20", 200), sale("2026-09-01", 900), sale("2026-10-30", 700, { status: "voided" }), sale("2026-10-28", 100, { status: "refunded" })];
	it("builds one figure per day, zero when nothing sold, counting only active sales", () => {
		const s = dailySeries(sales, 30, now);
		expect(s).toHaveLength(30);
		expect(s.at(-1)).toMatchObject({ date: "2026-10-30", orders: 1, sales: 500 });
		expect(s.at(-2)).toMatchObject({ date: "2026-10-29", sales: 300 });
		expect(s.find((d) => d.date === "2026-10-28").sales).toBe(0);
		expect(s.reduce((a, d) => a + d.sales, 0)).toBe(1000); // the voided, refunded and out of range sales are left out
	});
	it("summarises a business, and one of its locations", () => {
		const all = summarize(sales, { now });
		expect(all).toMatchObject({ orders: 3, sales: 1000 });
		expect(all.average).toBeCloseTo(333.33, 1);
		expect(all.payments.map((p) => [p.name, p.sales])).toEqual([["Cash", 700], ["Card", 300]]);
		expect(all.locations.map((l) => l.name)).toEqual(["Main", "Galle"]);
		expect(all.topItems[0]).toMatchObject({ name: "Tea", qty: 3, sales: 1000 });
		expect(all.lastSaleAt).toBe("2026-10-30T10:00:00Z");
		const galle = summarize(sales, { now, locationId: "l2" });
		expect(galle).toMatchObject({ orders: 1, sales: 300 });
		expect(summarize(sales, { now, days: 7 }).orders).toBe(2);
		expect(summarize([], { now })).toMatchObject({ orders: 0, sales: 0, average: 0, lastSaleAt: "" });
	});
	it("rolls up a small summary and adds businesses together", () => {
		const a = rollup(sales, now);
		expect(a).toMatchObject({ orders30: 3, sales30: 1000, orders7: 2, sales7: 800 });
		expect(a.daily).toHaveLength(30);
		const b = rollup([sale("2026-10-30", 250)], now);
		const quiet = rollup([], now);
		const o = overall([{ id: "a", business: "A", analytics: a }, { id: "b", business: "B", analytics: b }, { id: "q", business: "Quiet", analytics: quiet }, { id: "x", business: "No data" }], now);
		expect(o).toMatchObject({ businesses: 3, active7: 2, inactive: 1, orders30: 4, sales30: 1250 });
		expect(o.daily.at(-1).sales).toBe(750);
		expect(o.top.map((t) => t.name)).toEqual(["A", "B", "Quiet"]);
	});
});

import { hourLabel, hourlyActivity, localParts, overallHourly } from "../domain/adminAnalytics";

describe("hourly activity", () => {
	// Colombo is UTC+5:30: 04:00Z is 09:30 there, 10:00Z is 15:30, 20:00Z is 01:30 the next day
	const at = (z, extra = {}) => ({ id: z + JSON.stringify(extra), date: z.slice(0, 10), createdAt: z, status: "completed", total: 100, staffId: "a", locationId: "l1", lines: [], ...extra });
	const sales = [at("2026-10-29T04:00:00Z"), at("2026-10-29T04:10:00Z", { staffId: "b", total: 50 }), at("2026-10-30T04:20:00Z"), at("2026-10-30T10:00:00Z", { staffId: "b" }), at("2026-10-30T10:05:00Z", { status: "voided" }), at("2026-10-29T20:00:00Z", { locationId: "l2" })];
	it("buckets by the hour on the business's clock", () => {
		expect(localParts("2026-10-29T20:00:00Z")).toEqual({ day: "2026-10-30", hour: 1 });
		expect(localParts("2026-10-29T04:00:00Z", "UTC")).toEqual({ day: "2026-10-29", hour: 4 });
		expect([0, 9, 12, 15, 23].map(hourLabel)).toEqual(["12 am", "9 am", "12 pm", "3 pm", "11 pm"]);
	});
	it("counts orders, sales and the people selling each hour", () => {
		const { hours, summary } = hourlyActivity(sales, { now });
		expect(hours[9]).toMatchObject({ orders: 3, sales: 250, peakSellers: 2 });
		expect(hours[9].sellers).toBeCloseTo(1.5, 5); // two people on 29 Oct, one on 30 Oct, over two active days
		expect(hours[15]).toMatchObject({ orders: 1, peakSellers: 1 });
		expect(hours[1].orders).toBe(1);
		expect(summary).toMatchObject({ orders: 5, busiestHour: 9, firstHour: 1, lastHour: 15, peakSellers: 2 });
		expect(summary.activeDays).toBe(2); // 29 and 30 Oct (the 01:30 sale belongs to 30 Oct on the business's clock)
	});
	it("narrows to a location and counts people on the clock", () => {
		const l1 = hourlyActivity(sales, { now, locationId: "l1" });
		expect(l1.summary.orders).toBe(4);
		const shift = { userId: "a", clockIn: "2026-10-30T03:30:00Z", clockOut: "2026-10-30T05:30:00Z", locationId: "l1" }; // 09:00 to 11:00 in Colombo
		const clocked = hourlyActivity(sales, { now, timeEntries: [shift, { ...shift, userId: "b" }] });
		expect(clocked.hours[9].peakOnClock).toBe(2);
		expect(clocked.hours[12].peakOnClock).toBe(0);
		expect(hourlyActivity([], { now }).summary).toMatchObject({ orders: 0, busiestHour: null, firstHour: null, activeDays: 0 });
	});
	it("adds businesses together for the main page", () => {
		const a = { analytics: { hourly: { orders: Array(24).fill(0).map((_, i) => (i === 9 ? 3 : 0)), sales: Array(24).fill(0).map((_, i) => (i === 9 ? 300 : 0)), sellers: Array(24).fill(0).map((_, i) => (i === 9 ? 1.5 : 0)) } } };
		const b = { analytics: { hourly: { orders: Array(24).fill(0).map((_, i) => (i === 9 || i === 20 ? 2 : 0)), sales: Array(24).fill(0), sellers: Array(24).fill(0).map((_, i) => (i === 9 ? 1 : 0)) } } };
		const o = overallHourly([a, b, { id: "no data" }]);
		expect(o.hours[9]).toMatchObject({ orders: 5, sales: 300, sellers: 2.5 });
		expect(o).toMatchObject({ busiestHour: 9, firstHour: 9, lastHour: 20, peakSellers: 2.5 });
	});
	it("a shift nobody clocked out of counts for at most a day", () => {
		const forgotten = { userId: "z", clockIn: "2026-10-20T04:00:00Z", locationId: "l1" }; // never closed: would otherwise run to "now"
		const { hours } = hourlyActivity(sales, { now, timeEntries: [forgotten] });
		expect(hours.reduce((a, h) => a + h.peakOnClock, 0)).toBeLessThanOrEqual(24);
		expect(hours[9].onClock).toBeGreaterThan(0);
		expect(hours[9].onClock).toBeLessThanOrEqual(1);
	});
	it("averages people over the days that had sales, not over days that only had a clock-in", () => {
		const longShift = { userId: "z", clockIn: "2026-10-01T04:00:00Z", clockOut: "2026-10-01T05:00:00Z", locationId: "l1" };
		const { hours, summary } = hourlyActivity(sales, { now, timeEntries: [longShift] });
		expect(summary.activeDays).toBe(2);
		expect(hours[9].sellers).toBeCloseTo(1.5, 5);
	});
});
