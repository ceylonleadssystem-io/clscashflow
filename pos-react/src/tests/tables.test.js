import { describe, expect, it } from "vitest";
import { GRID, nextTableNumber, normalizeTable, tableNumberError, tableReference, tableStatus } from "../domain/tables";

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
