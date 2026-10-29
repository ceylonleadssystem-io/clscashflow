import { describe, expect, it } from "vitest";
import { buildReport, metricCards, saleFigures, sumFigures } from "../domain/reportBuilders";
import { formatCell, reportCsv, sortRows } from "../domain/reportFormat";
import { REPORT_GROUPS, firstSub, visibleGroups } from "../domain/reportsCatalog";
import { applyReportFilters } from "../hooks/useReportContext";

const line = (name, price, qty, extra = {}) => ({ name, price, qty, category: "Food", ...extra });
const sale = (id, o = {}) => ({
	id, receipt: "R" + id, date: "2026-10-29", createdAt: "2026-10-29T10:00:00Z", status: "completed", payment: "Cash", staffId: "u1", orderChannel: "Dine-in", locationId: "l1",
	lines: [line("Tea", 100, 2), line("Cake", 300, 1)], total: 500, ...o,
});
const range = { from: "2026-10-29", to: "2026-10-29" };
const ctx = (sales, more = {}) => ({ range, sales, users: [{ id: "u1", name: "Kehara", role: "owner" }], ...more });

describe("metric dictionary", () => {
	it("net = item - (discounts + refunds); total = gross + tips", () => {
		const s = sale("1", { lines: [line("Tea", 100, 2), line("Cake", 300, 1), { name: "Discount", price: -50, qty: 1, isDiscount: true }, { name: "Service", price: 25, qty: 1, isServiceCharge: true }], refunds: [{ amount: 100 }] });
		const f = saleFigures(s);
		expect(f).toMatchObject({ item: 500, disc: 50, refunds: 100, net: 350, tax: 0, gross: 350, tips: 25, total: 375 });
	});
	it("sums sales and shows discounts and refunds as negatives on the cards", () => {
		const cards = metricCards([sale("1", { refunds: [{ amount: 100 }] }), sale("2")]);
		const by = Object.fromEntries(cards.map((c) => [c.label, c.value]));
		expect(by["Item Sales"]).toBe(1000);
		expect(by["Refunds"]).toBe(-100);
		expect(by["Net Sales"]).toBe(900);
		expect(by["Total Order Count"]).toBe(2);
		expect(sumFigures([sale("1")]).guests).toBe(1);
	});
});

describe("sales reports", () => {
	it("excludes voided sales and totals rows", () => {
		const r = buildReport("sales", "overview", ctx([sale("1"), sale("2", { status: "voided" })]));
		expect(r.rows).toHaveLength(1);
		expect(r.totals.orders).toBe(1);
		expect(r.totals.net).toBe(500);
	});
	it("payment type splits a split payment by method", () => {
		const r = buildReport("sales", "payment-type", ctx([sale("1", { payment: "Split", payments: [{ method: "Cash", amount: 200 }, { method: "Card", amount: 300 }] })]));
		expect(r.rows.map((x) => [x.name, x.total])).toEqual([["Card", 300], ["Cash", 200]]);
		expect(r.rows.find((x) => x.name === "Card").group).toBe("Card");
	});
	it("order type and employee use net sales and average ticket", () => {
		const list = [sale("1"), sale("2", { orderChannel: "Takeaway", staffId: "u2" })];
		const o = buildReport("sales", "order-type", ctx(list));
		expect(o.rows.find((x) => x.name === "Dine-in")).toMatchObject({ qty: 1, avg: 500, net: 500 });
		const e = buildReport("sales", "employee", ctx(list));
		expect(e.rows.map((x) => x.name).sort()).toEqual(["Kehara", "Unknown"]);
	});
	it("zone and revenue center say they have no data", () => {
		expect(buildReport("sales", "zone", ctx([sale("1")])).note).toMatch(/not recorded/);
	});
});

describe("menu reports", () => {
	it("product mix sorts by quantity and shares add up", () => {
		const r = buildReport("menu", "product-mix", ctx([sale("1")]));
		expect(r.rows[0].name).toBe("Tea");
		expect(r.rows[0].qty).toBe(2);
		expect(Math.round(r.rows.reduce((a, x) => a + x.ofTotal, 0))).toBe(100);
	});
	it("scales item sales by the discount and ignores refunded quantity", () => {
		const s = sale("1", { lines: [line("Tea", 100, 2), { name: "Discount", price: -20, qty: 1, isDiscount: true }], refunds: [{ amount: 90, lines: [{ lineIndex: 0, qty: 1 }] }] });
		const r = buildReport("menu", "sales-category", ctx([s]));
		expect(r.rows[0].qty).toBe(1);
		expect(r.rows[0].net).toBeCloseTo(90); // 100 gross x (200-20)/200
	});
	it("modifier sales", () => {
		const r = buildReport("menu", "modifier-sales", ctx([sale("1", { lines: [line("Tea", 120, 2, { modifiers: [{ groupName: "Size", optionName: "Large", price: 20 }] })] })]));
		expect(r.rows[0]).toMatchObject({ name: "Large", qty: 2, sales: 40 });
	});
});

describe("labor, transactions, kitchen, multi-location", () => {
	it("hours are minus breaks; sales vs labor divides net by hours", () => {
		const timeEntries = [{ userId: "u1", clockIn: "2026-10-29T08:00:00Z", clockOut: "2026-10-29T12:00:00Z", breaks: [{ start: "2026-10-29T10:00:00Z", end: "2026-10-29T11:00:00Z" }] }];
		const labor = buildReport("payroll", "labor-costs", ctx([], { timeEntries }));
		expect(labor.rows[0].paid).toBeCloseTo(3);
		const svl = buildReport("sales-vs-labor", "", ctx([sale("1")], { timeEntries }));
		expect(svl.rows[0].perHour).toBeCloseTo(500 / 3);
	});
	it("cash log signs cash out as negative so the total is the sum of rows", () => {
		const cashShifts = [{ id: "c1", userId: "u1", openedAt: "2026-10-29T08:00:00Z", openingCash: 1000, status: "closed", closedAt: "2026-10-29T20:00:00Z", variance: -50 }];
		const r = buildReport("transactions", "cash-log", ctx([], { cashShifts }));
		expect(r.totals.amount).toBe(950);
		expect(r.cards.map((c) => c.value)).toEqual([950, 1000, -50]);
	});
	it("transactions list sales and refunds with signed totals", () => {
		const s = sale("1", { status: "partially_refunded", refunds: [{ id: "r1", amount: 100, at: "2026-10-29T11:00:00Z", by: "u1" }] });
		const r = buildReport("transactions", "sales-refunds", ctx([s]));
		expect(r.rows.map((x) => x.type).sort()).toEqual(["Refund", "Sale"]);
		expect(r.rows.find((x) => x.type === "Refund").total).toBe(-100);
	});
	it("kitchen tickets count by station", () => {
		const kitchenTickets = [{ destination: "Bar", createdAt: "2026-10-29T10:00:00Z", lines: [{ qty: 2 }] }, { destination: "Bar", createdAt: "2026-10-29T10:20:00Z", lines: [{ qty: 1 }] }, { destination: "Grill", createdAt: "2026-10-29T10:05:00Z", lines: [{ qty: 1 }] }];
		const r = buildReport("kitchen", "tickets-by-station", ctx([], { kitchenTickets }));
		expect(r.rows[0]).toMatchObject({ name: "Bar", tickets: 2, items: 3 });
		const slots = buildReport("kitchen", "tickets-by-fulfillment", ctx([], { kitchenTickets, extra: "30" })).rows;
		expect(slots.find((x) => x.station === "Bar").tickets).toBe(2); // 10:00 and 10:20 share one 30 minute slot
		expect(slots).toHaveLength(2);
	});
	it("multi-location sums each location from all sales", () => {
		const locations = [{ id: "l1", name: "Colombo" }, { id: "l2", name: "Kandy" }];
		const allSales = [sale("1"), sale("2", { locationId: "l2" }), sale("3", { locationId: "l2" })];
		const r = buildReport("multi-location", "summary", ctx(allSales, { allSales, locations }));
		expect(r.rows.map((x) => [x.name, x.orders])).toEqual([["Kandy", 2], ["Colombo", 1]]);
		expect(r.totals.orders).toBe(3);
	});
});

describe("catalogue, filters and formatting", () => {
	it("every sub-report has a builder result", () => {
		for (const g of REPORT_GROUPS) {
			if (g.key === "dashboard" || g.key === "end-of-day") continue;
			for (const sub of g.subs.length ? g.subs : [{ key: "" }]) {
				const r = buildReport(g.key, sub.key, ctx([sale("1")], { locations: [{ id: "l1", name: "A" }] }));
				expect(r.cols.length, g.key + "/" + sub.key).toBeGreaterThan(0);
			}
		}
		expect(firstSub("sales")).toBe("overview");
		expect(firstSub("taxes")).toBe("");
	});
	it("groups show only when their module or role allows", () => {
		const keys = (o) => visibleGroups(o).map((g) => g.key);
		expect(keys({ role: "owner", modules: {} })).not.toEqual(expect.arrayContaining(["payments", "loyalty", "kitchen", "multi-location"]));
		expect(keys({ role: "owner", modules: { kitchen: true, locations: 2 } })).toEqual(expect.arrayContaining(["kitchen", "multi-location", "payroll"]));
		expect(keys({ role: "accountant", modules: {} })).not.toContain("payroll");
	});
	it("filters narrow sales and time entries", () => {
		const f = applyReportFilters([sale("1"), sale("2", { staffId: "u2", payment: "Card" })], [{ userId: "u1" }, { userId: "u2" }], [{ type: "employee", value: "u2" }]);
		expect(f.sales.map((s) => s.id)).toEqual(["2"]);
		expect(f.timeEntries).toHaveLength(1);
	});
	it("formats cells, sorts numerically and exports CSV with a total row", () => {
		expect(formatCell("pct", 12.345)).toBe("12.3%");
		expect(formatCell("hours", 1.5)).toBe("1.50");
		expect(formatCell("money", null)).toBe("—");
		const cols = [{ key: "n", type: "num" }];
		expect(sortRows([{ n: 2 }, { n: 10 }], cols[0], "asc").map((r) => r.n)).toEqual([2, 10]);
		const r = buildReport("sales", "order-type", ctx([sale("1")]));
		const csv = reportCsv("t", "s", r, r.rows);
		expect(csv.at(-1)[0]).toBe("Total");
	});
});
