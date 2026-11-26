import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { qrLayout } from "../services/qrBrand";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

describe("branded QR menu code", () => {
	it("keeps the centre logo small enough to stay scannable", () => {
		const { size, band, inner, badge, badgeAt } = qrLayout(1000);
		expect((badge * badge) / (inner * inner)).toBeLessThan(0.1); // highest error correction restores about 30%
		expect(inner).toBe(size - band * 2);
		expect(badgeAt * 2 + badge).toBeCloseTo(size, -1);
	});
	it("does not show the menu link in Settings", () => {
		const page = read("../views/settings/QrMenuPage.jsx");
		expect(page).not.toMatch(/value=\{url\}|Copy link|clipboard/);
	});
	it("hides the link in the address bar, and a reload returns to the menu", () => {
		expect(read("../../../cashflow/menu-public.html")).toContain('history.replaceState({ qrMenu: token }, "", "/")');
		expect(read("../../../index.html")).toContain('location.replace("/m/"+m)');
	});
});
