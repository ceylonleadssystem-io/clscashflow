import { describe, expect, it } from "vitest";
import { LIMITS, activationFunnel, benchmark, byBusinessType, change, churnRisk, heatmap, kitchenSpeed, lossWatch, overallMix, paymentGroup } from "../domain/adminInsights";

const now = new Date("2026-10-30T12:00:00Z");
const daysAgo = (n) => new Date(+now - n * 86400000).toISOString();
const ins = (o = {}) => ({ saleCount: 20, firstSaleAt: daysAgo(60), salesDays30: 12, prev30: { orders: 40, sales: 4000 }, heat: Array(168).fill(0), items30: 80, gross30: 5000, records30: 41, payments: { Cash: { orders: 20, sales: 3000 }, Card: { orders: 20, sales: 2000 } }, channels: { "Dine-in": { orders: 40, sales: 5000 } }, refunds: { count: 0, amount: 0 }, voids: { count: 0, amount: 0 }, discounts: { count: 0, amount: 0 }, cash: { shifts: 4, net: 0, abs: 0 }, kitchen: { tickets: 0, avgMinutes: 0, medianMinutes: 0 }, ...o });
const acct = (id, o = {}, i = {}, a = {}) => ({ id, business: id, status: "live", paused: false, products: 10, businessType: "cafe", analytics: { orders30: 40, sales30: 5000, orders7: 10, sales7: 1200, lastSaleAt: daysAgo(0), insights: ins(i), ...a }, ...o });

describe("churn risk", () => {
	it("names who is drifting, worst first, and skips healthy, test and disabled accounts", () => {
		const list = [
			acct("healthy"),
			acct("silent", {}, {}, { lastSaleAt: daysAgo(20), sales7: 0 }),
			acct("falling", {}, { prev30: { orders: 80, sales: 12000 } }, { sales30: 4000, lastSaleAt: daysAgo(1) }),
			acct("slowWeek", {}, {}, { sales7: 100, lastSaleAt: daysAgo(2) }),
			acct("nothingYet", {}, { saleCount: 0, prev30: { orders: 0, sales: 0 } }, { orders30: 0, sales30: 0, orders7: 0, sales7: 0, lastSaleAt: "" }),
			acct("test", { status: "test" }, {}, { lastSaleAt: daysAgo(40) }),
			acct("off", { paused: true }, {}, { lastSaleAt: daysAgo(40) }),
		];
		const r = churnRisk(list, now);
		expect(r.map((x) => x.id)).toEqual(["falling", "silent", "nothingYet", "slowWeek"]); // by score, then by name
		expect(r[1]).toMatchObject({ id: "silent", severity: "medium" });
		expect(r.find((x) => x.id === "silent").reasons[0]).toBe("No sale for 20 days");
		expect(r.find((x) => x.id === "falling").reasons[0]).toMatch(/down 67%/);
		expect(r.find((x) => x.id === "nothingYet").reasons).toEqual(["Menu set up but no sale yet"]);
		expect(churnRisk([acct("gone", {}, {}, { lastSaleAt: daysAgo(45), sales7: 0 })], now)[0].severity).toBe("high");
	});
});

describe("activation funnel", () => {
	it("counts how far each business got and who is stuck where", () => {
		const f = activationFunnel([
			acct("a"), // everything
			acct("b", { products: 0 }, { saleCount: 0, salesDays30: 0 }), // signed up only
			acct("c", {}, { saleCount: 0, salesDays30: 0 }), // menu, no sale
			acct("d", {}, { saleCount: 4, salesDays30: 2 }), // first sales
			acct("e", {}, { saleCount: 14, salesDays30: 3 }), // ten sales
			acct("t", { status: "test" }),
		]);
		expect(f.map((x) => x.count)).toEqual([5, 4, 3, 2, 1]);
		expect(f[2].stuck).toEqual(["c"]);
		expect(f[1]).toMatchObject({ ofPrevious: 80, ofAll: 80 });
		expect(f[4].label).toMatch(/7 different days/);
	});
});

describe("heat map", () => {
	it("adds every business and finds the busiest hour and the quietest window", () => {
		const a = Array(168).fill(0);
		a[4 * 24 + 19] = 30; // Friday 7 pm
		a[1 * 24 + 7] = 2;
		const b = Array(168).fill(0);
		b[4 * 24 + 19] = 10;
		for (let h = 6; h < 22; h++) b[2 * 24 + h] += h >= 14 && h <= 16 ? 0 : 5; // every hour busy except 2 pm to 5 pm (on Wednesday)
		const h = heatmap([acct("a", {}, { heat: a }), acct("b", {}, { heat: b }), { id: "x" }]);
		expect(h.busiest).toEqual({ day: 4, hour: 19, orders: 40 });
		expect(h.cells[4][19]).toBe(40);
		expect(h.quietest.from).toBeGreaterThanOrEqual(6);
		expect(h.quietest.to - h.quietest.from).toBe(3);
		expect(heatmap([]).quietest).toBeNull();
	});
});

describe("mix, types and benchmark", () => {
	const list = [
		acct("cafe1", {}, { payments: { Cash: { orders: 10, sales: 1000 }, Card: { orders: 10, sales: 3000 }, "Uber Eats": { orders: 5, sales: 1000 } } }, { orders30: 25, sales30: 5000 }),
		acct("cafe2", {}, { items30: 100 }, { orders30: 50, sales30: 5000 }),
		acct("shop", { businessType: "retail" }, {}, { orders30: 10, sales30: 5000 }),
	];
	it("groups payment methods", () => {
		expect(["Cash", "Card", "Bank Transfer", "Online Payment", "Uber Eats", "Split"].map(paymentGroup)).toEqual(["Cash", "Card", "Bank or online", "Bank or online", "3rd party", "Other"]);
		const m = overallMix(list);
		expect(m.payments.map((x) => x.name)).toContain("3rd party");
		expect(m.payments.reduce((a, x) => a + x.share, 0)).toBeGreaterThanOrEqual(99);
	});
	it("compares business types", () => {
		const t = byBusinessType(list);
		expect(t.map((x) => x.type)).toEqual(["cafe", "retail"]);
		expect(t[0]).toMatchObject({ businesses: 2, orders: 75 });
		expect(t[0].average).toBeCloseTo(10000 / 75, 5);
		expect(t[0].pay["3rd party"]).toBeGreaterThan(0);
	});
	it("tells a business how it compares with similar ones", () => {
		const b = benchmark(list[0], list);
		expect(b).toMatchObject({ peers: 1, type: "cafe" });
		expect(b.average).toBe(200);
		expect(b.peerAverage).toBe(100);
		expect(b.averageDiff).toBe(100);
		expect(benchmark(list[2], list)).toBeNull(); // the only retail business
		expect(change(80, 100)).toBe(-20);
		expect(change(5, 0)).toBeNull();
	});
});

describe("loss watch and kitchen speed", () => {
	it("flags refunds, voids, discounts and cash variance that look high", () => {
		const rows = lossWatch([
			acct("calm"),
			acct("risky", {}, { refunds: { count: 5, amount: 900 }, voids: { count: 6, amount: 800 }, discounts: { count: 9, amount: 1500 }, cash: { shifts: 4, net: -300, abs: 300 } }),
			acct("test", { status: "test" }),
		]);
		expect(rows.map((r) => r.id)).toEqual(["risky", "calm"]);
		expect(rows[0].flags).toEqual(["Refunds", "Voids", "Discounts", "Cash variance"]);
		expect(rows[0]).toMatchObject({ refundRate: 15.3, voidRate: 14.6, discountRate: 30, varianceRate: 6 });
		expect(rows[1].flags).toEqual([]);
		expect(LIMITS.refundRate).toBe(5);
	});
	it("averages kitchen speed by ticket and lists the slowest first", () => {
		const k = kitchenSpeed([acct("a", {}, { kitchen: { tickets: 10, avgMinutes: 6, medianMinutes: 5 } }), acct("b", {}, { kitchen: { tickets: 30, avgMinutes: 10, medianMinutes: 9 } }), acct("c")]);
		expect(k.rows.map((r) => r.id)).toEqual(["b", "a"]);
		expect(k).toMatchObject({ tickets: 40, avgMinutes: 9 });
	});
});
