import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocationChecks } from "../components/settings/kit/LocationChecks";

const locations = [{ id: "a", name: "Main" }, { id: "b", name: "Galle" }, { id: "c", name: "Kandy" }];
const html = (value) => renderToStaticMarkup(createElement(LocationChecks, { value, locations, onChange: () => {} }));
const boxes = (markup) => [...markup.matchAll(/<label><input type="checkbox"([^>]*)\/?><span>([^<]+)<\/span>/g)].map((m) => ({ name: m[2], checked: /checked/.test(m[1]), disabled: /disabled/.test(m[1]) }));

describe("LocationChecks", () => {
	it("an empty list means All locations: it is ticked and the branches are ticked but locked", () => {
		const [all, ...branches] = boxes(html([]));
		expect(all).toMatchObject({ name: "All locations", checked: true });
		expect(branches.every((b) => b.checked && b.disabled)).toBe(true);
	});

	it("a chosen list ticks only those branches and lets each be changed", () => {
		const [all, main, galle, kandy] = boxes(html(["b"]));
		expect(all.checked).toBe(false);
		expect([main.checked, galle.checked, kandy.checked]).toEqual([false, true, false]);
		expect([main, galle, kandy].every((b) => !b.disabled)).toBe(true);
	});

	it("ticking every branch is the same as All locations", () => {
		expect(boxes(html(["a", "b", "c"]))[0].checked).toBe(true);
	});
});
