import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { framePoint, qrLayout } from "../services/qrBrand";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

describe("branded QR menu code", () => {
	it("keeps the centre logo small enough to stay scannable", () => {
		const { size, band, inner, badge, badgeAt } = qrLayout(1000);
		expect((badge * badge) / (inner * inner)).toBeLessThan(0.1); // highest error correction restores about 30%
		expect(inner).toBe(size - band * 2);
		expect(badgeAt * 2 + badge).toBeCloseTo(size, -1);
	});
	it("wraps the words along one unbroken curved path inside the picture", () => {
		const { size, band, corner } = qrLayout(1000);
		const path = (t) => framePoint(t, size, band / 2, corner - band / 2);
		const { length } = path(0);
		let last = path(0);
		for (let t = 1; t <= length; t += 1) {
			const p = path(t);
			expect(Math.hypot(p.x - last.x, p.y - last.y)).toBeLessThan(1.1); // no jumps at the corners or where it closes
			expect(Math.min(p.x, p.y)).toBeGreaterThanOrEqual(band / 2 - 0.01);
			expect(Math.max(p.x, p.y)).toBeLessThanOrEqual(size - band / 2 + 0.01);
			last = p;
		}
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
