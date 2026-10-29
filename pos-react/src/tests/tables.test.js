import { describe, expect, it } from "vitest";
import { mergeOrders } from "../domain/orders";
import { splitByItems } from "../domain/cart";
import { NAV_ITEMS, ROLE_VIEWS } from "../config/roles";
import { GRID, MAIN_FLOOR, allFloorTables, findFreeSpot, floorLayout, floorLayoutKey, floorsFor, floorsKey, layoutFor, layoutKey, locationOrders, moveTargets, overlapsOthers, nextTableNumber, normalizeTable, tableNumberError, tableReference, tableStatus, gmBooking } from "../domain/tables";

describe("table layout", () => {
	it("snaps and keeps tables inside the floor", () => {
		const t = normalizeTable({ id: "a", number: " 7 ", seats: 99, shape: "weird", x: 5000, y: -20, w: 9999 });
		expect(t).toMatchObject({ number: "7", seats: 40, shape: "square", w: GRID.max, h: GRID.max, x: GRID.w - GRID.max, y: 0, active: true });
		expect(normalizeTable({ id: "b", number: "1", shape: "rect", w: 160, h: 60 })).toMatchObject({ w: 160, h: 60 });
		expect(normalizeTable({ id: "c", number: "2", shape: "round", w: 120, h: 60 }).h).toBe(120);
	});

	it("detects overlapping tables and finds a free spot for a new one", () => {
		const a = { id: "a", x: 0, y: 0, w: 100, h: 100 };
		expect(overlapsOthers([a], { id: "b", x: 50, y: 50, w: 100, h: 100 })).toBe(true);
		expect(overlapsOthers([a], { id: "b", x: 100, y: 0, w: 100, h: 100 })).toBe(false); // touching edges
		expect(overlapsOthers([a], a)).toBe(false); // a table never overlaps itself
		expect(findFreeSpot([a], 100, 100)).toEqual({ x: 100, y: 0 });
		const row = Array.from({ length: GRID.w / 100 }, (_, i) => ({ id: "r" + i, x: i * 100, y: 0, w: 100, h: 100 }));
		expect(findFreeSpot(row, 100, 100)).toEqual({ x: 0, y: 100 });
		expect(findFreeSpot([{ id: "wall", x: 0, y: 0, w: GRID.w, h: GRID.h }], 100, 100)).toBeNull();
	});

	it("keeps one floor plan per location and falls back to the old shared layout until a location saves its own", () => {
		const shared = [{ id: "s1", number: "1" }];
		const settings = { tableLayout: shared, [layoutKey("colombo")]: [{ id: "c1", number: "A" }, { id: "c2", number: "B" }], [layoutKey("galle")]: [] };
		expect(layoutFor(settings, "colombo").map((t) => t.number)).toEqual(["A", "B"]);
		expect(layoutFor(settings, "galle")).toEqual([]); // an emptied floor stays empty
		expect(layoutFor(settings, "kandy")).toBe(shared); // never saved: still the shared one
		expect(layoutFor({}, "kandy")).toEqual([]);
		expect(layoutFor(settings, "")).toBe(shared);
	});

	it("only counts open checks of the active location", () => {
		const orders = [{ id: "a", locationId: "colombo" }, { id: "b", locationId: "galle" }, { id: "c" }];
		expect(locationOrders(orders, "galle").map((o) => o.id)).toEqual(["b", "c"]);
	});

	it("numbers new tables and rejects duplicates", () => {
		const list = [{ id: "a", number: "1" }, { id: "b", number: "3" }];
		expect(nextTableNumber(list)).toBe("2");
		expect(tableNumberError(list, { id: "c", number: "3" })).toMatch(/already exists/);
		expect(tableNumberError(list, { id: "b", number: "3" })).toBe("");
		expect(tableNumberError(list, { id: "c", number: "" })).toMatch(/Enter/);
	});

	it("finds the open order of a table", () => {
		const t = { number: "4" };
		const orders = [{ id: "o1", status: "open", orderReference: "Table 4" }, { id: "o2", status: "paid", orderReference: "Table 5" }];
		expect(tableReference(t)).toBe("Table 4");
		expect(tableStatus(t, orders).open.id).toBe("o1");
		expect(tableStatus({ number: "5" }, orders).free).toBe(true);
	});
});

describe("floors", () => {
	const settings = {
		[layoutKey("L1")]: [{ id: "m1", number: "1" }],
		[floorsKey("L1")]: [{ id: MAIN_FLOOR, name: "Ground" }, { id: "fl-a", name: "Terrace" }],
		[floorLayoutKey("L1", "fl-a")]: [{ id: "t1", number: "11" }, { id: "t2", number: "12" }],
	};
	it("lists the floors with the main one first, and just the main floor when none were added", () => {
		expect(floorsFor(settings, "L1").map((f) => f.name)).toEqual(["Ground", "Terrace"]);
		expect(floorsFor({}, "L1")).toEqual([{ id: MAIN_FLOOR, name: "Main floor" }]);
		expect(floorsFor({ [floorsKey("L1")]: [{ id: "fl-a", name: "Roof" }] }, "L1").map((f) => f.id)).toEqual([MAIN_FLOOR, "fl-a"]);
	});
	it("keeps the main floor under the original layout key, so layouts saved before floors still show", () => {
		expect(floorLayoutKey("L1", MAIN_FLOOR)).toBe(layoutKey("L1"));
		expect(floorLayoutKey("L1", "fl-a")).toBe(layoutKey("L1") + "__fl-a");
		expect(floorLayout(settings, "L1", MAIN_FLOOR).map((t) => t.number)).toEqual(["1"]);
		expect(floorLayout({ tableLayout: [{ id: "s", number: "9" }] }, "L2", MAIN_FLOOR).map((t) => t.number)).toEqual(["9"]); // old shared layout
	});
	it("gives each floor its own tables and all of them together with their floor", () => {
		expect(floorLayout(settings, "L1", "fl-a").map((t) => t.number)).toEqual(["11", "12"]);
		expect(floorLayout(settings, "L1", "gone")).toEqual([]);
		expect(allFloorTables(settings, "L1").map((t) => t.number + "@" + t.floor)).toEqual(["1@main", "11@fl-a", "12@fl-a"]);
	});
	it("numbers new tables and rejects duplicates across floors", () => {
		const all = allFloorTables(settings, "L1");
		expect(nextTableNumber(all)).toBe("2");
		expect(tableNumberError(all, { id: "new", number: "11" })).toMatch(/already exists/);
	});
});

describe("move, merge and split", () => {
	const line = (key, price, qty) => ({ key, name: key, price, qty });
	it("merges open orders: same lines add up, source is closed", () => {
		const a = { id: "a", orderReference: "Table 1", lines: [line("x", 100, 1)], discount: { type: "percent", value: 10 } };
		const b = { id: "b", orderReference: "Table 2", lines: [line("x", 100, 2), line("y", 50, 1)], discount: { type: "percent", value: 0 } };
		const m = mergeOrders(a, b, "T");
		expect(m.target.lines.map((l) => [l.key, l.qty])).toEqual([["x", 3], ["y", 1]]);
		expect(m.target.discount.amount).toBeCloseTo(35);
		expect(m.target.orderReference).toBe("Table 1");
		expect(m.source).toMatchObject({ status: "merged", mergedInto: "a" });
	});

	it("lists free tables to move to and busy ones to merge into", () => {
		const tables = [1, 2, 3].map((n) => ({ id: "t" + n, number: String(n), active: n !== 3 }));
		const mine = { id: "o1", status: "open", orderReference: "Table 1" };
		const orders = [mine, { id: "o2", status: "open", orderReference: "Table 2" }, { id: "o3", status: "open", orderReference: "Takeaway" }];
		const t = moveTargets(mine, tables, orders);
		expect(t.map((x) => [x.kind, x.into?.id || null])).toEqual([["table", "o2"], ["order", "o3"]]);
		expect(moveTargets({ id: "o2", status: "open", orderReference: "Table 2" }, tables, orders)[0]).toMatchObject({ kind: "table", into: mine });
	});

	it("splits by item in proportion, remainder on the last guest", () => {
		const cart = [line("x", 100, 2), line("y", 50, 1)];
		const shares = splitByItems(cart, { "x:0": 0, "x:1": 1, "y:0": 1 }, 2, 150);
		expect(shares.map((s) => s.amount)).toEqual([60, 90]);
		const odd = splitByItems([line("x", 10, 3)], { "x:0": 0, "x:1": 1, "x:2": 2 }, 3, 100);
		expect(odd.map((s) => s.amount)).toEqual([33.33, 33.33, 33.34]);
		expect(shares.reduce((a, s) => a + s.amount, 0)).toBeCloseTo(150);
		expect(splitByItems(cart, { "x:0": 0, "x:1": 0, "y:0": 0 }, 3, 250)).toHaveLength(1);
	});

	it("shows every page the owner can open exactly once in the nav (the Dashboard is opened from Reports)", () => {
		const nav = NAV_ITEMS.map((n) => n.view);
		expect(new Set(nav).size).toBe(nav.length);
		expect([...nav].sort()).toEqual(ROLE_VIEWS.owner.filter((v) => v !== "dashboard").sort());
	});
});

describe("Guest Manager bookings on the floor plan (BUG 011)", () => {
	const settings = { gmBookings: { t4: [{ name: "Test", party: 8, date: "2026-10-15", time: "19:00", duration: 120, status: "booked" }] } };
	const at = (hhmm) => new Date("2026-10-15T" + hhmm).getTime();
	it("a table is reserved only during its booking and the hour before, not all day", () => {
		expect(gmBooking(settings, "t4", at("11:00"))).toBeNull(); // the morning of a 19:00 booking: free
		expect(gmBooking(settings, "t4", at("17:59"))).toBeNull();
		expect(gmBooking(settings, "t4", at("18:00"))?.name).toBe("Test"); // an hour before
		expect(gmBooking(settings, "t4", at("20:59"))?.name).toBe("Test");
		expect(gmBooking(settings, "t4", at("21:00"))).toBeNull(); // the booking has ended
		expect(gmBooking(settings, "t5", at("19:30"))).toBeNull();
		expect(gmBooking({}, "t4", at("19:30"))).toBeNull();
	});
});
