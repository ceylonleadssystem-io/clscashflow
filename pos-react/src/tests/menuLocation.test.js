import { describe, expect, it } from "vitest";
import { categoryAllowedAt, cleanLocationIds, itemAllowedAt, itemsAt, newItemLocationIds } from "../domain/menuLocation";

const ALL = ["main", "galle", "kandy"];
const settings = { categorySettings: [{ id: "desserts", name: "Desserts", locationIds: ["galle"] }, { id: "drinks", name: "Drinks", locationIds: [] }] };
const item = (name, category, locationIds) => ({ id: name, name, category, locationIds });

describe("menu items and categories by location", () => {
	it("shows everything with no limits, and at All locations", () => {
		expect(itemAllowedAt(item("Tea", "Drinks"), settings, "kandy", ALL)).toBe(true);
		expect(itemAllowedAt(item("Cake", "Desserts", ["galle"]), settings, "all", ALL)).toBe(true);
		expect(itemAllowedAt(item("Cake", "Desserts", ["galle"]), settings, "", ALL)).toBe(true);
	});

	it("an item limited to a branch shows only there", () => {
		const cake = item("Cake", "Drinks", ["galle"]);
		expect(itemAllowedAt(cake, settings, "galle", ALL)).toBe(true);
		expect(itemAllowedAt(cake, settings, "kandy", ALL)).toBe(false);
	});

	it("a category limited to a branch hides all its items elsewhere", () => {
		expect(categoryAllowedAt(settings, "Desserts", "galle", ALL)).toBe(true);
		expect(categoryAllowedAt(settings, "desserts ", "kandy", ALL)).toBe(false);
		expect(itemAllowedAt(item("Brownie", "Desserts"), settings, "kandy", ALL)).toBe(false);
	});

	it("needs both the item's and the category's limits to allow the branch", () => {
		const brownie = item("Brownie", "Desserts", ["kandy"]);
		expect(itemAllowedAt(brownie, settings, "kandy", ALL)).toBe(false);
		expect(itemAllowedAt(brownie, settings, "galle", ALL)).toBe(false);
	});

	it("ignores locations that no longer exist, so an item is never lost", () => {
		expect(itemAllowedAt(item("Old", "Drinks", ["closed-branch"]), settings, "kandy", ALL)).toBe(true);
		expect(cleanLocationIds(["galle", "galle", "x"], ALL)).toEqual(["galle"]);
	});

	it("filters a list, and a new item starts limited to the signed-in branch only when there are several locations", () => {
		const list = [item("Tea", "Drinks"), item("Cake", "Desserts"), item("Soup", "Drinks", ["main"])];
		expect(itemsAt(list, settings, "kandy", ALL).map((p) => p.name)).toEqual(["Tea"]);
		expect(itemsAt(list, settings, "all", ALL)).toHaveLength(3);
		expect(newItemLocationIds("galle", ALL)).toEqual(["galle"]);
		expect(newItemLocationIds("all", ALL)).toEqual([]);
		expect(newItemLocationIds("main", ["main"])).toEqual([]);
	});
});
