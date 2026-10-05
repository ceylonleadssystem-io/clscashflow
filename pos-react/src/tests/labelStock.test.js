/** Label printing: the size/gap sent to the printer must follow the configured stock (mismatch = blank labels). */
import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_STOCK, resolveLabelStock, tsplSetup } from "../services/printing/labelPrinter";

describe("label stock", () => {
	it("defaults to 30 x 25 mm with a 3 mm gap", () => {
		expect(resolveLabelStock(undefined)).toMatchObject(DEFAULT_LABEL_STOCK);
		expect(resolveLabelStock({})).toMatchObject({ width: 30, height: 25, gap: 3, offsetX: 0, offsetY: 0, marginMm: null });
	});
	it("keeps valid values and rejects out-of-range ones", () => {
		expect(resolveLabelStock({ width: 40, height: 30, gap: 2 })).toMatchObject({ width: 40, height: 30, gap: 2 });
		expect(resolveLabelStock({ width: 0, height: "x", gap: 99 })).toMatchObject(DEFAULT_LABEL_STOCK);
	});
	it("puts the configured size and gap into the TSPL setup", () => {
		const setup = tsplSetup(40, 30, 2);
		expect(setup).toContain("SIZE 40 mm,30 mm\r\n");
		expect(setup).toContain("GAP 2 mm,0\r\n");
		expect(setup.endsWith("BACKFEED 0\r\n")).toBe(true);
	});
});

describe("label layouts fit every offered size", () => {
	it("keeps the barcode and the price inside the label height", async () => {
		const { LABEL_SIZES, labelBitmapLayout } = await import("../services/printing/labelPrinter");
		expect(LABEL_SIZES).toContain("30x20");
		for (const size of LABEL_SIZES) {
			const [w, h] = size.split("x").map(Number);
			const dotsH = h * 8;
			const l = labelBitmapLayout(w, h);
			const priceY = Math.min(dotsH - l.bottomPad, l.barcodeY + l.barcodeH + l.priceGap);
			expect(l.barcodeY + l.barcodeH, size + " barcode").toBeLessThanOrEqual(dotsH);
			expect(priceY + l.priceFont, size + " price").toBeLessThanOrEqual(dotsH);
		}
	});
});

describe("label alignment", () => {
	it("clamps the alignment offsets and keeps the margin optional", async () => {
		const { resolveLabelStock } = await import("../services/printing/labelPrinter");
		expect(resolveLabelStock({}).offsetX).toBe(0);
		expect(resolveLabelStock({ offsetX: 99, offsetY: -99 })).toMatchObject({ offsetX: 0, offsetY: 0 });
		expect(resolveLabelStock({ offsetX: 2.5, offsetY: -1.5, marginMm: 4 })).toMatchObject({ offsetX: 2.5, offsetY: -1.5, marginMm: 4 });
		expect(resolveLabelStock({}).marginMm).toBeNull();
	});
	it("moves the content box by the offsets without changing its width until it hits the label edge", async () => {
		const { labelGeometry, labelBitmapLayout } = await import("../services/printing/labelPrinter");
		const layout = labelBitmapLayout(30, 20);
		const flat = labelGeometry(240, layout, {}, 123);
		expect(flat.cx).toBe(120);
		expect(flat.barcodeX).toBe(24);
		expect(flat.barcodeW).toBe(192); // centred: 24 dots each side
		const moved = labelGeometry(240, layout, { offsetX: 2, offsetY: -1 }, 123);
		expect(moved.dx).toBe(16);
		expect(moved.dy).toBe(-8);
		expect(moved.barcodeX).toBe(40);
		expect(moved.barcodeW).toBe(192); // same width, moved 2 mm right
		expect(moved.cx).toBe(136);
		const far = labelGeometry(240, layout, { offsetX: 5 }, 123);
		expect(far.barcodeX + far.barcodeW).toBe(236); // clamped 4 dots from the edge
		expect(far.barcodeW).toBeLessThan(flat.barcodeW);
		const left = labelGeometry(240, layout, { offsetX: -2 }, 123);
		expect(left.barcodeX).toBe(8);
		expect(left.barcodeW).toBe(192);
	});
	it("never makes the barcode narrower than one dot per module", async () => {
		const { labelGeometry, labelBitmapLayout } = await import("../services/printing/labelPrinter");
		const g = labelGeometry(240, labelBitmapLayout(30, 20), { marginMm: 10 }, 123);
		expect(g.barcodeW).toBe(123);
		expect(g.tooWide).toBe(true);
		expect(g.barcodeX + g.barcodeW).toBeLessThanOrEqual(240);
	});
});
