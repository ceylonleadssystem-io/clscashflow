/** Label printing: the size/gap sent to the printer must follow the configured stock (mismatch = blank labels). */
import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_STOCK, resolveLabelStock, tsplSetup } from "../services/printing/labelPrinter";

describe("label stock", () => {
	it("defaults to 30 x 20 mm with a 3 mm gap", () => {
		expect(resolveLabelStock(undefined)).toMatchObject(DEFAULT_LABEL_STOCK);
		expect(resolveLabelStock({})).toMatchObject({ width: 30, height: 20, gap: 3, offsetX: 0, offsetY: 0, marginMm: null });
	});
	it("supports only 30x20, 50x25, 60x40 and 38x25 with a fixed 3 mm gap", async () => {
		const { LABEL_SIZES } = await import("../services/printing/labelPrinter");
		expect(LABEL_SIZES).toEqual(["30x20", "50x25", "60x40", "38x25"]);
		expect(resolveLabelStock({ width: 50, height: 25, gap: 2 })).toMatchObject({ width: 50, height: 25, gap: 3 });
		expect(resolveLabelStock({ width: 60, height: 40 })).toMatchObject({ width: 60, height: 40 });
		expect(resolveLabelStock({ width: 38, height: 25, gap: 5 })).toMatchObject({ width: 38, height: 25, gap: 3 });
		// an older saved size snaps to the nearest supported one
		expect(resolveLabelStock({ width: 30, height: 25 })).toMatchObject({ width: 30, height: 20 });
		expect(resolveLabelStock({ width: 45, height: 30 })).toMatchObject({ width: 50, height: 25 });
		expect(resolveLabelStock({ width: 0, height: "x" })).toMatchObject(DEFAULT_LABEL_STOCK);
	});
	it("puts the configured size and gap into the TSPL setup", () => {
		const setup = tsplSetup(40, 30, 2);
		expect(setup).toContain("SIZE 40 mm,30 mm\r\n");
		expect(setup).toContain("GAP 2 mm,0\r\n");
		expect(setup.endsWith("BACKFEED 0\r\n")).toBe(true);
	});
});

describe("label layouts fit every offered size", () => {
	it("keeps every row, the barcode and the price inside the label height, with or without description and size", async () => {
		const { LABEL_SIZES, labelBitmapLayout, labelRows } = await import("../services/printing/labelPrinter");
		for (const size of LABEL_SIZES) {
			const [w, h] = size.split("x").map(Number);
			const dotsH = h * 8;
			const l = labelBitmapLayout(w, h);
			for (const desc of [false, true])
				for (const sz of [false, true]) {
					const r = labelRows(l, dotsH, { desc, size: sz });
					const tag = `${size} desc=${desc} size=${sz}`;
					expect(r.barcodeY + r.barcodeH, tag + " barcode").toBeLessThanOrEqual(r.priceY);
					expect(r.priceY + l.priceFont, tag + " price").toBeLessThanOrEqual(dotsH);
					expect(r.barcodeH, tag + " barcode height").toBeGreaterThanOrEqual(l.barcodeMin);
					if (r.descY != null) expect(r.descY).toBeGreaterThan(r.nameY);
					if (r.sizeY != null) expect(r.sizeY + l.sizeFont).toBeLessThanOrEqual(r.barcodeY);
				}
		}
	});
	it("30x20 has no description line; 38x25, 50x25 and 60x40 do", async () => {
		const { labelBitmapLayout } = await import("../services/printing/labelPrinter");
		expect(labelBitmapLayout(30, 20).descFont).toBe(0);
		expect(labelBitmapLayout(38, 25).descFont).toBeGreaterThan(0);
		expect(labelBitmapLayout(50, 25).descFont).toBeGreaterThan(0);
		expect(labelBitmapLayout(60, 40).descFont).toBeGreaterThan(0);
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

describe("alignment wizard rule", () => {
	it("moves content right/down when the left/top edge is cut off, left/up for right/bottom", async () => {
		const { alignmentAdjust } = await import("../services/printing/labelPrinter");
		expect(alignmentAdjust({ offsetX: 0, offsetY: 0 }, { left: 2 })).toMatchObject({ offsetX: 2, offsetY: 0, clash: false, any: true });
		expect(alignmentAdjust({ offsetX: 1, offsetY: 0.5 }, { right: 1.5, top: 1 })).toMatchObject({ offsetX: -0.5, offsetY: 1.5 });
		expect(alignmentAdjust({ offsetX: 0, offsetY: 1 }, { bottom: 2 })).toMatchObject({ offsetY: -1 });
	});
	it("stays inside the allowed range and flags opposite edges that are both cut off", async () => {
		const { alignmentAdjust } = await import("../services/printing/labelPrinter");
		expect(alignmentAdjust({ offsetX: 9, offsetY: 5 }, { left: 5, top: 5 })).toMatchObject({ offsetX: 10, offsetY: 6 });
		expect(alignmentAdjust({}, { left: 1, right: 1 }).clash).toBe(true);
		expect(alignmentAdjust({}, { top: 1, bottom: 1 }).clash).toBe(true);
		expect(alignmentAdjust({}, {}).any).toBe(false);
		expect(alignmentAdjust({}, { left: "x", top: -3 }).any).toBe(false); // junk or negative counts as nothing
	});
});

describe("local print preview", () => {
	it("is off outside the local dev environment (tests, production)", async () => {
		const { localPrintPreview } = await import("../services/printing/localPrintPreview");
		expect(localPrintPreview()).toBe(false);
	});
});
