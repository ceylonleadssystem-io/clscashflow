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
