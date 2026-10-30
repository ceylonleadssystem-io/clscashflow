import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { insightRollup } from "../domain/adminInsights";

// pos-admin-data.js does not export its helpers: take insightsRollup out of the source and run it on the same data
const src = readFileSync(new URL("../../../netlify/functions/pos-admin-data.js", import.meta.url), "utf8");
const start = src.indexOf("function insightsRollup");
const end = src.indexOf("function addBillingPeriod");
const server = new Function(src.slice(start, end) + "; return insightsRollup;")();

const ago = (days, hhmm = "04:00") => new Date(new Date().toISOString().slice(0, 10) + "T" + hhmm + ":00Z").getTime() - days * 86400000;
const sale = (days, total, extra = {}) => ({ id: "s" + days + total + JSON.stringify(extra).length, createdAt: new Date(ago(days)).toISOString(), date: new Date(ago(days)).toISOString().slice(0, 10), status: "completed", total, payment: "Cash", orderChannel: "Dine-in", lines: [{ name: "Tea", price: total, qty: 2 }], ...extra });

export const payload = {
	sales: [
		sale(0, 500), sale(0, 300, { payment: "Card", orderChannel: "Takeaway" }), sale(1, 900, { payment: "Uber Eats", lines: [{ name: "Cake", price: 450, qty: 2 }, { name: "Order Discount", price: -90, qty: 1, isDiscount: true }, { name: "Service", price: 20, qty: 1, isServiceCharge: true }] }),
		sale(3, 250, { status: "voided", voidAmount: 250 }), sale(5, 400, { refunds: [{ amount: 100 }], status: "partially_refunded" }), sale(8, 150), sale(35, 700), sale(40, 200), sale(90, 999), sale(2, 120, { status: "refunded", refunds: [{ amount: 120 }] }),
	],
	cashShifts: [{ status: "closed", closedAt: new Date(ago(2)).toISOString(), variance: -40 }, { status: "closed", closedAt: new Date(ago(4)).toISOString(), variance: 15 }, { status: "open", variance: 0 }, { status: "closed", closedAt: new Date(ago(60)).toISOString(), variance: 500 }],
	kitchenTickets: [
		{ destination: "KDS", status: "done", createdAt: new Date(ago(1)).toISOString(), updatedAt: new Date(ago(1) + 9 * 60000).toISOString() },
		{ destination: "KDS", status: "ready", createdAt: new Date(ago(1)).toISOString(), updatedAt: new Date(ago(1) + 6 * 60000).toISOString() },
		{ destination: "KDS", status: "new", createdAt: new Date(ago(1)).toISOString(), updatedAt: new Date(ago(1)).toISOString() },
		{ destination: "Kitchen", status: "done", createdAt: new Date(ago(1)).toISOString(), updatedAt: new Date(ago(1) + 60000).toISOString() },
	],
};

describe("insight rollup", () => {
	const r = insightRollup(payload);
	it("counts the last 30 days and the 30 before, on the business's clock", () => {
		expect(r.saleCount).toBe(8); // active sales ever (voided and fully refunded left out): 0,0,1,5,8,35,40,90 days ago
		expect(r.prev30).toEqual({ orders: 2, sales: 900 }); // 35 and 40 days ago
		expect(r.salesDays30).toBe(4); // today, 1, 5 and 8 days ago
		expect(r.heat.reduce((a, b) => a + b, 0)).toBe(5);
		expect(r.records30).toBe(7); // five active, one voided, one fully refunded, in the last 30 days
		expect(r.firstSaleAt).toBe(new Date(ago(90)).toISOString());
	});
	it("reads items, discounts, payments, losses, cash and kitchen speed", () => {
		expect(r.items30).toBe(2 + 2 + 2 + 2 + 2); // two of each in the five sales (the discount and service lines are not items)
		expect(r.discounts).toEqual({ count: 1, amount: 90 });
		expect(r.voids).toEqual({ count: 1, amount: 250 });
		expect(r.refunds).toEqual({ count: 2, amount: 220 });
		expect(Object.keys(r.payments)).toEqual(expect.arrayContaining(["Cash", "Card", "Uber Eats"]));
		expect(r.cash).toEqual({ shifts: 2, net: -25, abs: 55 });
		expect(r.kitchen).toEqual({ tickets: 2, avgMinutes: 7.5, medianMinutes: 9 });
	});
	it("is exactly what the server builds", () => {
		expect(JSON.parse(JSON.stringify(server(payload)))).toEqual(JSON.parse(JSON.stringify(r)));
		expect(JSON.parse(JSON.stringify(server({})))).toEqual(JSON.parse(JSON.stringify(insightRollup({}))));
	});
});
