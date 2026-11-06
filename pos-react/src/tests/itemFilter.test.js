import { describe, expect, it } from "vitest";
import { filterItems } from "../domain/catalogDraft";

const items = [
	{ id: "1", name: "Iced Coffee", code: "DRK-1", category: "Drinks", subcategory: "Cold", type: "Product" },
	{ id: "2", name: "Haircut", code: "SRV-1", category: "Services", type: "Service" },
	{ id: "3", name: "Club Sandwich", code: "FD-1", category: "Food" },
];

describe("Items list filter (the POS catalogue's search and filters)", () => {
	it("searches name, code, category, subcategory and type", () => {
		const ids = (o) => filterItems(items, o).map((p) => p.id);
		expect(ids({ q: "coffee" })).toEqual(["1"]);
		expect(ids({ q: "srv-1" })).toEqual(["2"]);
		expect(ids({ q: "cold" })).toEqual(["1"]);
		expect(ids({ q: "service" })).toEqual(["2"]);
		expect(ids({ q: "  " })).toEqual(["1", "2", "3"]);
	});
	it("filters by category and by type, an item without a type counting as a product", () => {
		const ids = (o) => filterItems(items, o).map((p) => p.id);
		expect(ids({ category: "Food" })).toEqual(["3"]);
		expect(ids({ type: "Product" })).toEqual(["1", "3"]);
		expect(ids({ type: "Service" })).toEqual(["2"]);
		expect(ids({ category: "Drinks", type: "Service" })).toEqual([]);
	});
});
