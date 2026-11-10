import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssignmentTree } from "../components/settings/kit/AssignmentTree";

const groups = [
	{
		key: "Food",
		name: "Food",
		items: [{ id: "1", name: "Rice" }],
		subgroups: [{ key: "Food/Sides", name: "Sides", items: [{ id: "2", name: "Salad" }, { id: "3", name: "Soup" }] }],
	},
	{ key: "Drinks", name: "Drinks", items: [{ id: "4", name: "Tea" }] },
];
const html = (ids) => renderToStaticMarkup(createElement(AssignmentTree, { groups, selected: new Set(ids), onChange: () => {} }));
const countOf = (markup, name) => new RegExp(name + "</span><span class=\"muted\">(\\d+)/(\\d+)<").exec(markup)?.slice(1).map(Number);

describe("AssignmentTree with subcategories", () => {
	it("shows category > subcategory > items, with the ticked counts of each level", () => {
		const m = html(["2"]);
		expect(countOf(m, "Food")).toEqual([1, 3]);
		expect(countOf(m, "Sides")).toEqual([1, 2]);
		expect(countOf(m, "Drinks")).toEqual([0, 1]);
		expect(m.indexOf("Sides")).toBeGreaterThan(m.indexOf("Rice"));
	});

	it("an item alone leaves its subcategory and category partly ticked, not fully ticked", () => {
		const m = html(["2"]);
		expect(m).toContain('aria-label="Select all in Food"');
		expect(/aria-label="Select all in (Food|Sides)" checked/.test(m)).toBe(false);
	});

	it("ticking a subcategory or a category ticks everything under it", () => {
		const sub = html(["2", "3"]);
		expect(/aria-label="Select all in Sides" checked/.test(sub)).toBe(true);
		expect(/aria-label="Select all in Food" checked/.test(sub)).toBe(false);
		const all = html(["1", "2", "3"]);
		expect(/aria-label="Select all in Food" checked/.test(all)).toBe(true);
		expect((all.match(/ checked(?=[ >=])/g) || []).length).toBe(5); // Rice, Salad, Soup, Sides and Food
	});
});
