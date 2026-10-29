import { describe, it, expect } from "vitest";
import { cleanStations, kitchenStations, routeKitchenLines } from "../domain/kitchenStations";
import { currentStock, endOfDayReport } from "../domain/endOfDay";
import { runSetupChecks } from "../domain/ceylo";
import { resolveFeatures } from "../config/features";

const stations = [
	{ id: "a", name: "Kitchen", type: "printer" },
	{ id: "b", name: "Bar", type: "printer" },
];
const products = [
	{ id: "p1", name: "Burger", stationIds: ["a", "b"] },
	{ id: "p2", name: "Soda", stationIds: ["a"] },
	{ id: "p3", name: "Fries" },
];

describe("kitchen stations", () => {
	it("keeps the old single destination when no list was saved", () => {
		expect(kitchenStations({ kotPrinter: "Grill" })).toEqual([{ id: "kot", name: "Grill", type: "printer" }]);
		expect(kitchenStations({ kotPrinter: "Grill" }, true)).toEqual([{ id: "kds", name: "Kitchen Display", type: "kds" }]);
		expect(kitchenStations({})).toEqual([]);
		expect(kitchenStations({ kotPrinter: "Grill", kitchenStations: [] })).toEqual([]);
	});
	it("sends an item to every station it is assigned to, and unassigned items to the first", () => {
		const lines = [{ productId: "p1", qty: 1 }, { productId: "p2", qty: 2 }, { productId: "p3", qty: 1 }, { isDiscount: true, qty: 1 }];
		const routes = routeKitchenLines(lines, products, stations);
		expect(routes.map((r) => [r.station.name, r.lines.map((l) => l.productId)])).toEqual([
			["Kitchen", ["p1", "p2", "p3"]],
			["Bar", ["p1"]],
		]);
	});
	it("ignores stations that were removed", () => {
		const routes = routeKitchenLines([{ productId: "p1", qty: 1 }], [{ id: "p1", stationIds: ["gone"] }], stations);
		expect(routes.map((r) => r.station.id)).toEqual(["a"]);
	});
	it("cleans the list typed in Settings", () => {
		expect(cleanStations([{ id: "a", name: " Bar " }, { name: "" }, { id: "k", name: "Kds", type: "kds" }]).stations).toEqual([
			{ id: "a", name: "Bar", type: "printer" },
			{ id: "k", name: "Kds", type: "kds" },
		]);
		expect(cleanStations([{ name: "Bar" }, { name: "bar" }]).error).toMatch(/two kitchen stations/);
	});
});

describe("end of day report", () => {
	const day = "2026-10-29";
	const sales = [
		{ id: "s1", date: day, receipt: "R1", payment: "Cash", total: 500, cost: 200, lines: [{ name: "Tea", qty: 2, price: 250, cost: 100 }], refunds: [{ id: "r1", at: day + "T10:00:00Z", amount: 250, reason: "cold" }] },
		{ id: "s2", date: "2026-10-28", receipt: "R0", payment: "Card", total: 900, cost: 100, lines: [{ name: "Cake", qty: 1, price: 900 }] },
	];
	const inventory = [
		{ id: "i1", name: "Milk", unit: "l", qty: 20, reorder: 5, locationQuantities: { L1: 2 } },
		{ id: "i2", name: "Sugar", unit: "kg", qty: 0, reorder: 1 },
	];
	it("covers one day only and ends with the current stock", () => {
		const r = endOfDayReport({ day, sales, inventory, users: [] });
		expect(r.kpis.find((k) => k.label === "Transactions").value).toBe(1);
		expect(r.sections.find((s) => s.title === "Sales by Item").rows[0][0]).toBe("Tea");
		expect(r.sections.find((s) => s.title === "Refunds").rows).toHaveLength(1);
		const stock = r.sections.at(-1);
		expect(stock.title).toBe("Current Stock");
		expect(stock.rows.map((x) => [x[0], x[4]])).toEqual([["Sugar", "Out of stock"], ["Milk", "In stock"]]);
	});
	it("uses the location's own quantity", () => {
		expect(currentStock(inventory, "L1").find((x) => x.name === "Milk")).toMatchObject({ qty: 2, status: "Low stock" });
	});
});

describe("Ceylo kitchen printer check", () => {
	const input = (settings) => ({
		settings: { business: "Lotus", businessType: "restaurant", ...settings },
		users: [], locations: [], products: [],
		features: resolveFeatures({}).enabled,
		printers: {},
	});
	const kot = (settings) => runSetupChecks(input(settings)).find((r) => r.id === "kot-printer");
	it("counts the saved kitchen printers and displays, and still checks the old printer name without a list", () => {
		expect(kot({ kitchenStations: stations })).toMatchObject({ status: "ok", title: "2 kitchen printers and displays are set" });
		expect(kot({ kitchenStations: [] }).status).toBe("warn");
		expect(kot({ kotPrinter: "Kitchen" }).status).toBe("ok");
	});
});
