/** Label printing: the size/gap sent to the printer must follow the configured stock (mismatch = blank labels). */
import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_STOCK, resolveLabelStock, tsplSetup } from "../services/printing/labelPrinter";

describe("label stock", () => {
	it("defaults to 30 x 20 mm with a 3 mm gap", () => {
		expect(resolveLabelStock(undefined)).toMatchObject(DEFAULT_LABEL_STOCK);
		expect(resolveLabelStock({})).toMatchObject({ width: 30, height: 20, gap: 3, offsetX: 0, offsetY: 0, marginMm: null });
	});
	it("supports only 30x20, 50x25, 60x40, 38x25 and 30x15 with a fixed 3 mm gap", async () => {
		const { LABEL_SIZES } = await import("../services/printing/labelPrinter");
		expect(LABEL_SIZES).toEqual(["30x20", "50x25", "60x40", "38x25", "30x15"]);
		expect(resolveLabelStock({ width: 30, height: 15, gap: 5 })).toMatchObject({ width: 30, height: 15, gap: 3 });
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
	it("30x15 has no description line and keeps the barcode readable", async () => {
		const { labelBitmapLayout, labelRows } = await import("../services/printing/labelPrinter");
		const l = labelBitmapLayout(30, 15);
		expect(l.descFont).toBe(0);
		expect(l.barcodeMin).toBeGreaterThanOrEqual(36); // at least 4.5 mm of bars
		expect(labelRows(l, 120, { desc: false, size: false }).barcodeH).toBeGreaterThanOrEqual(64);
	});
	it("browser printing prints the same picture as the printer, one page per label, at the label's real size", async () => {
		const { barcodeLabelsHtml } = await import("../services/printing/labelPrinter");
		const made = [];
		const imageFor = (product, size) => (made.push({ code: product.code, sizeLabel: product.sizeLabel, size }), "data:image/png;base64,PIC" + made.length);
		const p = { name: "Cap", code: "CAP-1", price: 1200 };
		const html = barcodeLabelsHtml(p, [{ sizeLabel: "M", copies: 2 }, { sizeLabel: "L", copies: 1 }], ["30", "15"], imageFor);
		expect(html).toContain("@page{size:30mm 15mm;margin:0}");
		expect(html).toContain("width:30mm;height:15mm");
		expect(html.match(/<section>/g)).toHaveLength(3);
		// each size is drawn once with its own barcode ("<item code>-<size>")
		expect(made.map((m) => m.code)).toEqual(["CAP-1-M", "CAP-1-L"]);
		expect(html.match(/PIC1/g)).toHaveLength(2);
		expect(barcodeLabelsHtml(p, 1, ["30", "20"], imageFor).match(/<section>/g)).toHaveLength(1);
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

describe("label PNG download", () => {
	it("names the file after the item, without characters a file name cannot hold", async () => {
		const { labelFileName } = await import("../services/printing/labelPrinter");
		expect(labelFileName("Wide Leg Trouser")).toBe("Wide Leg Trouser.png");
		expect(labelFileName("Wide Leg Trouser", "M")).toBe("Wide Leg Trouser - M.png");
		expect(labelFileName('Cheese/Ham: "Large" <hot>?')).toBe("Cheese Ham Large hot.png");
		expect(labelFileName("  ..Tea \\\\ Cup  ")).toBe("Tea Cup.png");
		expect(labelFileName("Half-Price Tee 5%")).toBe("Half-Price Tee 5%.png");
		expect(labelFileName("")).toBe("label.png");
		expect(labelFileName("x".repeat(300)).length).toBe(104);
		expect(labelFileName("සුදු කමිසය")).toBe("සුදු කමිසය.png");
	});
	it("adds the resolution right after the PNG header so printing software keeps the real size", async () => {
		const { pngWithDpi, LABEL_PNG_DPI } = await import("../services/printing/labelPrinter");
		// a minimal valid PNG: signature, IHDR (1 x 1), IEND
		const sig = [137, 80, 78, 71, 13, 10, 26, 10];
		const ihdr = [0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 0, 0, 0, 0, 0x3a, 0x7e, 0x9b, 0x55];
		const iend = [0, 0, 0, 0, 73, 69, 78, 68, 0xae, 0x42, 0x60, 0x82];
		const png = new Uint8Array([...sig, ...ihdr, ...iend]);
		const out = pngWithDpi(png, LABEL_PNG_DPI);
		expect(out.length).toBe(png.length + 21);
		expect([...out.slice(0, 33)]).toEqual([...sig, ...ihdr]);
		const chunk = out.slice(33, 54);
		const view = new DataView(chunk.buffer);
		expect(new TextDecoder().decode(chunk.slice(4, 8))).toBe("pHYs");
		const perMeter = Math.round(LABEL_PNG_DPI / 0.0254);
		expect(view.getUint32(8)).toBe(perMeter);
		expect(view.getUint32(12)).toBe(perMeter);
		expect(chunk[16]).toBe(1);
		// 30 mm at that resolution is 960 pixels: the size of the downloaded picture
		expect(Math.round((30 / 1000) * perMeter)).toBe(960);
		// the checksum matches the chunk (CRC-32 of type + data)
		let c = 0xffffffff;
		for (const b of chunk.slice(4, 17)) {
			c ^= b;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		expect(view.getUint32(17)).toBe((c ^ 0xffffffff) >>> 0);
		expect([...out.slice(54)]).toEqual(iend);
	});
});
