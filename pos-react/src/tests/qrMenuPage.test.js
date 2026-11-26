import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../../../cashflow/menu-public.html", import.meta.url), "utf8");

describe("public QR menu page", () => {
	it("lays items out as a grid that widens on larger screens", () => {
		for (const n of [2, 3, 4]) expect(page).toContain(`grid-template-columns: repeat(${n}, minmax(0, 1fr))`);
	});
	it("opens an item in a pop-up and never builds the menu from HTML strings", () => {
		expect(page).toContain("dlg.showModal()");
		expect(page).not.toMatch(/innerHTML|insertAdjacentHTML/);
		const script = page.slice(page.indexOf("<script>") + 8, page.indexOf("</script>"));
		expect(() => new Function(script)).not.toThrow();
	});
});
