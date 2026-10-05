import { describe, expect, it } from "vitest";
import { mergeOrders } from "../domain/orders";
import { splitByItems } from "../domain/cart";
import { NAV_ITEMS, ROLE_VIEWS } from "../config/roles";
import { GRID, moveTargets, nextTableNumber, normalizeTable, tableNumberError, tableReference, tableStatus } from "../domain/tables";

describe("table layout", () => {
	it("snaps and keeps tables inside the floor", () => {
		const t = normalizeTable({ id: "a", number: " 7 ", seats: 99, shape: "weird", x: 5000, y: -20, w: 9999 });
		expect(t).toMatchObject({ number: "7", seats: 40, shape: "square", w: GRID.max, h: GRID.max, x: GRID.w - GRID.max, y: 0, active: true });
		expect(normalizeTable({ id: "b", number: "1", shape: "rect", w: 160, h: 60 })).toMatchObject({ w: 160, h: 60 });
		expect(normalizeTable({ id: "c", number: "2", shape: "round", w: 120, h: 60 }).h).toBe(120);
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

	it("shows every page the owner can open exactly once in the nav", () => {
		const nav = NAV_ITEMS.map((n) => n.view);
		expect(new Set(nav).size).toBe(nav.length);
		expect([...nav].sort()).toEqual([...ROLE_VIEWS.owner].sort());
	});
});
