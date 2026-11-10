import { describe, expect, it } from "vitest";
import { assignGroupEdits, withItemEdit } from "../domain/catalogDraft";

const product = (id, modifierIds = []) => ({ id, name: "Item " + id, price: 100, cost: 40, category: "Food", subcategory: "", code: "", description: "", image: "", stationIds: [], modifierIds });
const idsOf = (p, edits) => withItemEdit(p, edits).modifierIds;

describe("Assign a modifier group to several items", () => {
	const items = [product("1"), product("2", ["g2"]), product("3", ["g1"])];

	it("puts the group on the chosen items and takes it off the others, keeping their other groups", () => {
		const edits = assignGroupEdits([], items, "g1", ["1", "2"]);
		expect(idsOf(items[0], edits)).toEqual(["g1"]);
		expect(idsOf(items[1], edits)).toEqual(["g2", "g1"]);
		expect(idsOf(items[2], edits)).toEqual([]);
	});

	it("drafts only the items that change", () => {
		const edits = assignGroupEdits([], items, "g1", ["3"]);
		expect(edits).toEqual([]);
	});

	it("keeps other changes already drafted on an item, and drops the draft when the item is back to what it was", () => {
		const drafted = [{ id: "1", name: "Renamed", original: "Item 1", changes: { name: "Renamed" } }];
		const on = assignGroupEdits(drafted, items, "g1", ["1", "3"]);
		expect(withItemEdit(items[0], on)).toMatchObject({ name: "Renamed", modifierIds: ["g1"] });
		const off = assignGroupEdits(on, items, "g1", ["3"]);
		expect(off.find((e) => e.id === "1").changes).toEqual({ name: "Renamed" });
		expect(assignGroupEdits(assignGroupEdits([], items, "g1", ["1", "3"]), items, "g1", ["3"])).toEqual([]);
	});

	it("also assigns items that are new drafts waiting to be published", () => {
		const fresh = [{ id: "n1", isNew: true, name: "New", original: "", changes: { name: "New", modifierIds: [] } }];
		expect(assignGroupEdits(fresh, [], "g1", ["n1"])[0].changes.modifierIds).toEqual(["g1"]);
		expect(assignGroupEdits(assignGroupEdits(fresh, [], "g1", ["n1"]), [], "g1", [])[0].changes.modifierIds).toEqual([]);
	});
});
