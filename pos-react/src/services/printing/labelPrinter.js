/**
 * USB TSPL label printer (gap labels: 30 x 20, 38 x 25, 50 x 25 or 60 x 40 mm, 3 mm gap): label layouts, bitmap print jobs, WebUSB connect/
 * restore/calibrate/print, plus the on-screen label preview and the browser-print (Android Print) label HTML.
 */
import { claimUsbOutput, createEmitter, transferChunks } from "./usb";
import { sendRaw } from "./printBridge";
import { localPrintPreview, showLabelPreview } from "./localPrintPreview";
import { cleanBarcode, code128Units, drawCode128, sizedBarcode } from "./barcode";
import { esc, money } from "../../domain/format";
import { createLogger } from "../../utils/logger";

const log = createLogger("printing");

/** USB TSPL label printer (gap labels, 3 mm gap) + browser print fallback. */

/**
 * Label roll the printer is loaded with. The size and gap sent with every job (and every calibration) MUST match the
 * physical labels: a mismatch is the usual reason a gap-label printer prints one label and then feeds a blank one.
 */
export const DEFAULT_LABEL_STOCK = { width: 30, height: 20, gap: 3 };
/** The only paper sizes supported (width x height, mm). The gap between labels is always 3 mm. */
export const LABEL_SIZES = ["30x20", "50x25", "60x40", "38x25", "30x15"];

/** Clamp/normalise a saved stock setting. A saved size that is not one of LABEL_SIZES snaps to the nearest one. */
export function resolveLabelStock(saved) {
	const num = (v, d, min, max) => {
		const n = Number(v);
		return Number.isFinite(n) && n >= min && n <= max ? n : d;
	};
	const w = Number(saved?.width);
	const h = Number(saved?.height);
	const [width, height] = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
		? LABEL_SIZES.map((x) => x.split("x").map(Number)).sort((a, b) => Math.abs(a[0] - w) + Math.abs(a[1] - h) - (Math.abs(b[0] - w) + Math.abs(b[1] - h)))[0]
		: [DEFAULT_LABEL_STOCK.width, DEFAULT_LABEL_STOCK.height];
	return {
		width,
		height,
		gap: DEFAULT_LABEL_STOCK.gap,
		// Alignment: how far (mm) the printed content is moved right (+) / down (+) to sit on the physical label, and the
		// blank side margin (mm; null = the layout default). Printers register the paper against a guide, so a label is
		// rarely exactly where the print head's zero point is: these three values fix cropped / off-centre output.
		offsetX: num(saved?.offsetX, 0, -10, 10),
		offsetY: num(saved?.offsetY, 0, -6, 6),
		marginMm: saved?.marginMm == null ? null : num(saved.marginMm, null, 1, 10),
	};
}

/**
 * Where things go on the label, in printer dots (8 dots = 1 mm at 203 dpi). Pure so it can be tested.
 * The content box runs from `margin` to `dotsW - margin`, moved by the alignment offset; it is kept inside the label
 * (4 dots from each edge) and never made narrower than 1 dot per barcode module, the scannable minimum.
 */
export function labelGeometry(dotsW, layout, offsets = {}, units = 0) {
	const dx = Math.round((Number(offsets.offsetX) || 0) * 8);
	const dy = Math.round((Number(offsets.offsetY) || 0) * 8);
	const margin = offsets.marginMm == null ? layout.margin : Math.round(offsets.marginMm * 8);
	const safe = 4;
	let left = Math.max(safe, margin + dx);
	let right = Math.min(dotsW - safe, dotsW - margin + dx);
	const tooWide = units > right - left;
	if (tooWide) {
		const centre = (left + right) / 2;
		left = Math.max(0, Math.min(dotsW - units, Math.round(centre - units / 2)));
		right = left + units;
	}
	return { dx, dy, margin, left, right, cx: (left + right) / 2, barcodeX: left, barcodeW: right - left, tooWide };
}

/** TSPL block that tells the printer the label geometry (same block for printing and calibration). */
export function tsplSetup(width, height, gapMm) {
	return `SIZE ${width} mm,${height} mm\r\nGAP ${gapMm} mm,0\r\nOFFSET 0 mm\r\nREFERENCE 0,0\r\nDIRECTION 0\r\nDENSITY 15\r\nSPEED 2\r\nSET TEAR OFF\r\nSET PEEL OFF\r\nSET CUTTER OFF\r\nBACKFEED 0\r\n`;
}

export function labelBitmapLayout(width, height) {
	const L = (o) => ({ darken: true, gapMm: 3, ...o });
	// 60 x 40 mm (480 x 320 dots): name, description, size, barcode, price (the retail artwork)
	if (width >= 60 && height >= 40)
		return L({ margin: 28, nameFont: 40, descFont: 22, sizeFont: 22, priceFont: 40, top: 8, lineGap: 4, barcodeMax: 130, barcodeMin: 60, priceGap: 8, bottomPad: 14 });
	// 50 x 25 mm (400 x 200 dots)
	if (width >= 50)
		return L({ margin: 24, nameFont: 26, descFont: 15, sizeFont: 16, priceFont: 26, top: 4, lineGap: 3, barcodeMax: 100, barcodeMin: 40, priceGap: 5, bottomPad: 10 });
	// 38 x 25 mm (304 x 200 dots)
	if (width >= 38)
		return L({ margin: 22, nameFont: 22, descFont: 13, sizeFont: 14, priceFont: 22, top: 4, lineGap: 3, barcodeMax: 100, barcodeMin: 40, priceGap: 5, bottomPad: 10 });
	// 30 x 15 mm (240 x 120 dots): the shortest label; name, barcode and price only (no description), tight margins so all three fit
	if (height <= 15)
		return L({ margin: 24, nameFont: 12, descFont: 0, sizeFont: 11, priceFont: 12, top: 4, lineGap: 2, barcodeMax: 70, barcodeMin: 36, priceGap: 4, bottomPad: 6 });
	// 30 x 20 mm (240 x 160 dots): name, barcode and price must all fit above the gap; no description line
	return L({ margin: 24, nameFont: 14, descFont: 0, sizeFont: 12, priceFont: 14, top: 4, lineGap: 2, barcodeMax: 84, barcodeMin: 40, priceGap: 6, bottomPad: 14 });
}

/**
 * Vertical positions (dots) of the label rows: name, then the description and size lines when present, the barcode
 * (as tall as the room left allows, between barcodeMin and barcodeMax) and the price right under it. Pure so it can be tested.
 */
export function labelRows(layout, dotsH, { desc = false, size = false } = {}) {
	let y = layout.top;
	const nameY = y;
	y += layout.nameFont + layout.lineGap;
	let descY = null;
	let sizeY = null;
	if (desc && layout.descFont) {
		descY = y;
		y += layout.descFont + layout.lineGap;
	}
	if (size && layout.sizeFont) {
		sizeY = y;
		y += layout.sizeFont + layout.lineGap;
	}
	const barcodeY = y;
	const room = dotsH - layout.bottomPad - layout.priceFont - layout.priceGap - barcodeY;
	const barcodeH = Math.max(layout.barcodeMin, Math.min(layout.barcodeMax, room));
	return { nameY, descY, sizeY, barcodeY, barcodeH, priceY: barcodeY + barcodeH + layout.priceGap };
}

function fitText(ctx, text, maxWidth, font) {
	text = String(text || "").trim();
	ctx.font = font;
	if (ctx.measureText(text).width <= maxWidth) return text;
	while (text.length > 3 && ctx.measureText(text + "...").width > maxWidth) text = text.slice(0, -1);
	return text + "...";
}

/**
 * The label as it is printed: name, description, size, Code 128 barcode and price drawn on a canvas at the printer's 203 dpi (one canvas pixel =
 * one printer dot). `scale` draws the same label bigger (every dot becomes scale x scale pixels) for the preview, the browser print and the PNG,
 * so they all show exactly what the printer prints. `opts` = gap (mm) or {gapMm, offsetX, offsetY, marginMm}.
 */
export function drawLabelCanvas(product, size, opts, scale = 1) {
	const o = typeof opts === "object" && opts ? opts : { gapMm: opts };
	const width = Number(size[0]) || 30;
	const height = Number(size[1]) || 25;
	const dotsW = Math.round(width * 8);
	const dotsH = Math.round(height * 8);
	const canvas = document.createElement("canvas");
	canvas.width = dotsW * scale;
	canvas.height = dotsH * scale;
	const ctx = canvas.getContext("2d");
	ctx.scale(scale, scale);
	const layout = labelBitmapLayout(width, height);
	const name = String(product.name || "Item");
	const description = layout.descFont ? String(product.description || product.subcategory || product.category || "") : "";
	const sizeText = product.sizeLabel && layout.sizeFont ? "Size: " + product.sizeLabel : "";
	const rows = labelRows(layout, dotsH, { desc: !!description, size: !!sizeText });
	const g = labelGeometry(dotsW, layout, o, code128Units(product.code));
	const price = money(product.price);
	const textW = g.right - g.left;
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, dotsW, dotsH);
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.font = "900 " + layout.nameFont + "px Arial";
	ctx.fillText(fitText(ctx, name, textW, ctx.font), g.cx, rows.nameY + g.dy);
	if (description) {
		ctx.font = "400 " + layout.descFont + "px Arial";
		ctx.fillText(fitText(ctx, description, textW, ctx.font), g.cx, rows.descY + g.dy);
	}
	if (sizeText) {
		ctx.font = "900 " + layout.sizeFont + "px Arial";
		ctx.fillText(fitText(ctx, sizeText, textW, ctx.font), g.cx, rows.sizeY + g.dy);
	}
	drawCode128(ctx, product.code, g.barcodeX, rows.barcodeY + g.dy, g.barcodeW, rows.barcodeH, layout.darken);
	ctx.font = "900 " + layout.priceFont + "px Arial";
	ctx.fillText(fitText(ctx, price, textW, ctx.font), g.cx, rows.priceY + g.dy);
	return { canvas, dotsW, dotsH, width, height, o, layout };
}

/** Bitmap TSPL job for the label printer: the drawn label (scale 1) converted to printer dots. */
export function tsplBitmapBytes(product, copies, size, opts) {
	const { canvas, dotsW, dotsH, width, height, o, layout } = drawLabelCanvas(product, size, opts, 1);
	return tsplFromCanvas(canvas, dotsW, dotsH, width, height, copies, o.gapMm || layout.gapMm || 3);
}

/** Convert a drawn canvas to a TSPL job (BITMAP mode 0: a set bit is a WHITE dot, so black pixels stay 0). */
function tsplFromCanvas(canvas, dotsW, dotsH, width, height, copies, gapMm) {
	const pixels = canvas.getContext("2d").getImageData(0, 0, dotsW, dotsH).data;
	const rowBytes = Math.ceil(dotsW / 8);
	const raster = new Uint8Array(rowBytes * dotsH);
	for (let y = 0; y < dotsH; y++)
		for (let x = 0; x < dotsW; x++) {
			const o = (y * dotsW + x) * 4;
			const l = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2];
			if (pixels[o + 3] <= 40 || l >= 160) raster[y * rowBytes + (x >> 3)] |= 128 >> (x & 7);
		}
	const count = Math.max(1, Number(copies) || 1);
	const enc = new TextEncoder();
	const setup = enc.encode(tsplSetup(width, height, Number(gapMm) || 3));
	const head = enc.encode(`CLS\r\nBITMAP 0,0,${rowBytes},${dotsH},0,`);
	const tail = enc.encode(`\r\nPRINT 1,${count}\r\n`);
	const bytes = new Uint8Array(setup.length + head.length + raster.length + tail.length);
	let pos = 0;
	[setup, head, raster, tail].forEach((part) => {
		bytes.set(part, pos);
		pos += part.length;
	});
	return bytes;
}

/**
 * Alignment test label (canvas, shared by the print job and the on-screen preview): a border on the very edge of the label, a centre cross, L/R/T/B markers and a 1 mm ruler.
 * Whatever is missing or cut on the printed label shows which way to move the content (Settings > Printing).
 */
export function drawAlignmentLabel(size, opts) {
	const o = typeof opts === "object" && opts ? opts : { gapMm: opts };
	const width = Number(size[0]) || 30;
	const height = Number(size[1]) || 25;
	const dotsW = Math.round(width * 8);
	const dotsH = Math.round(height * 8);
	const dx = Math.round((Number(o.offsetX) || 0) * 8);
	const dy = Math.round((Number(o.offsetY) || 0) * 8);
	const canvas = document.createElement("canvas");
	canvas.width = dotsW;
	canvas.height = dotsH;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, dotsW, dotsH);
	ctx.fillStyle = "#000";
	ctx.translate(dx, dy);
	ctx.strokeStyle = "#000";
	ctx.lineWidth = 3;
	ctx.strokeRect(1.5, 1.5, dotsW - 3, dotsH - 3); // the label edge
	ctx.lineWidth = 1;
	ctx.beginPath(); // centre cross
	ctx.moveTo(dotsW / 2, dotsH / 2 - 14);
	ctx.lineTo(dotsW / 2, dotsH / 2 + 14);
	ctx.moveTo(dotsW / 2 - 14, dotsH / 2);
	ctx.lineTo(dotsW / 2 + 14, dotsH / 2);
	ctx.stroke();
	for (let mm = 1; mm < Math.max(width, height); mm++) {
		const long = mm % 5 === 0 ? 14 : 7;
		if (mm < width) ctx.fillRect(mm * 8, 4, 1, long); // top edge ruler
		if (mm < height) ctx.fillRect(4, mm * 8, long, 1); // left edge ruler
	}
	ctx.font = "900 20px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("T", dotsW / 2, 30);
	ctx.fillText("B", dotsW / 2, dotsH - 22);
	ctx.fillText("L", 32, dotsH / 2);
	ctx.fillText("R", dotsW - 32, dotsH / 2);
	ctx.font = "700 12px Arial";
	ctx.fillText(`${width}x${height}mm  X${Number(o.offsetX || 0).toFixed(1)} Y${Number(o.offsetY || 0).toFixed(1)}`, dotsW / 2, dotsH / 2 + 28);
	return canvas;
}

export function tsplAlignmentBytes(size, opts) {
	const o = typeof opts === "object" && opts ? opts : { gapMm: opts };
	const width = Number(size[0]) || 30;
	const height = Number(size[1]) || 25;
	const canvas = drawAlignmentLabel(size, o);
	return tsplFromCanvas(canvas, canvas.width, canvas.height, width, height, 1, o.gapMm || 3);
}


/**
 * Alignment wizard rule: `sides` = how many mm of the test label's border are missing at each edge (top, bottom, left,
 * right). A missing left edge means the content has to move right (+X), a missing top edge down (+Y), and so on. Returns
 * the new shift (kept within the allowed range) and `clash` when opposite edges are both cut off, which no shift can fix
 * (the wrong size is selected or the roll is not the size the printer was calibrated for).
 */
export function alignmentAdjust(stock, sides = {}) {
	const n = (k) => Math.max(0, Number(sides[k]) || 0);
	const fit = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v * 10) / 10));
	return {
		offsetX: fit((Number(stock.offsetX) || 0) + n("left") - n("right"), -10, 10),
		offsetY: fit((Number(stock.offsetY) || 0) + n("top") - n("bottom"), -6, 6),
		clash: (n("left") > 0 && n("right") > 0) || (n("top") > 0 && n("bottom") > 0),
		any: n("left") + n("right") + n("top") + n("bottom") > 0,
	};
}

class LabelPrinter {
	constructor() {
		this.device = null;
		this.endpoint = 0;
		this.name = "";
		this.bridge = ""; // name of the Windows printer used through the print helper (services/printing/printBridge.js); "" = direct USB
		this.status = { message: "Barcode label printer not detected.", connected: false };
		this.emitter = createEmitter();
		this.onRemember = null;
		if (typeof navigator !== "undefined" && navigator.usb) {
			navigator.usb.addEventListener("connect", () => this.restore());
			navigator.usb.addEventListener("disconnect", (e) => {
				if (this.device === e.device) {
					this.device = null;
					log.warn("USB label printer disconnected");
					this._set("USB barcode label printer disconnected. Reconnect the cable; saved permission will restore automatically when Android allows it.", false);
				}
			});
		}
	}
	subscribe(fn) {
		fn(this.status);
		return this.emitter.subscribe(fn);
	}
	_set(message, connected) {
		this.status = { message, connected: !!connected };
		this.emitter.emit(this.status);
	}
	get supported() {
		return typeof navigator !== "undefined" && !!navigator.usb;
	}
	get connected() {
		return !!(this.bridge || (this.device && this.device.opened));
	}
	/** Name of the connected label printer ("" when none): the Windows printer name through the print helper, else the USB device. */
	get deviceName() {
		if (this.bridge) return this.bridge;
		return this.connected ? this.device.productName || this.name || "USB barcode label printer" : "";
	}
	async _claim(device) {
		const out = await claimUsbOutput(device, "USB label printer");
		this.bridge = "";
		this.device = device;
		this.endpoint = out.endpointNumber;
		this.name = device.productName || "USB barcode label printer";
		this.onRemember?.({ vendorId: device.vendorId, productId: device.productId, productName: this.name, serialNumber: device.serialNumber || "" });
		log.info("USB label printer connected", { device: this.name, vendorId: device.vendorId, productId: device.productId });
		this._set(this.name + " connected for barcode labels.", true);
	}
	/** Use a Windows printer through the print helper instead of direct USB. The choice is remembered like a USB printer. */
	connectHelper(printerName) {
		this.bridge = String(printerName || "").trim();
		this.device = null;
		this.name = this.bridge;
		if (!this.bridge) return false;
		this.onRemember?.({ bridge: this.bridge, productName: this.bridge });
		log.info("label printer set to the print helper", { printer: this.bridge });
		this._set(this.bridge + " connected for barcode labels through the print helper.", true);
		return true;
	}
	async connect() {
		if (!this.supported) throw new Error("USB barcode label detection needs Chrome with WebUSB support.");
		try {
			const device = await navigator.usb.requestDevice({ filters: [{ classCode: 7 }] });
			await this._claim(device);
			return true;
		} catch (error) {
			// NotFoundError = the user closed the device picker; not a failure.
			if (error && error.name === "NotFoundError") return false;
			log.error("USB label printer connection failed", error);
			this._set("USB barcode printer connection failed: " + (error.message || "check cable and permission."), false);
			throw error;
		}
	}
	async restore(saved = {}) {
		// a printer chosen through the print helper needs no USB permission; the helper itself is reached when a label is printed
		if (saved.bridge) {
			this.bridge = String(saved.bridge);
			this.device = null;
			this.name = this.bridge;
			this._set(this.bridge + " set for barcode labels through the print helper.", true);
			return true;
		}
		if (!this.supported) return false;
		try {
			const devices = await navigator.usb.getDevices();
			const device = devices.find((d) => saved.vendorId && d.vendorId === saved.vendorId && (!saved.productId || d.productId === saved.productId));
			if (!device) return false;
			await this._claim(device);
			return true;
		} catch (error) {
			log.warn("USB label printer restore failed", error);
			this._set("USB barcode printer is unavailable. Reconnect and allow USB access again.", false);
			return false;
		}
	}
	async _ensure(saved) {
		if (!this.connected && !(await this.restore(saved)))
			throw new Error("USB barcode printer is not connected. Tap Detect USB Label Printer first.");
	}
	/** Gives printer commands to the printer: through the print helper when one is chosen, else over USB in 4 KB chunks. */
	async _send(bytes, what) {
		if (this.bridge) return sendRaw(this.bridge, bytes);
		try {
			await transferChunks(this.device, this.endpoint, bytes);
		} catch (error) {
			log.error(what + " rejected by printer", error, { device: this.name, bytes: bytes.length });
			throw new Error("The USB barcode printer stopped accepting label data.");
		}
	}
	/** Teach the printer the label length and gap of the loaded roll (use the real size/gap of the labels). */
	async calibrate(saved, stock) {
		await this._ensure(saved);
		const s = resolveLabelStock(stock);
		const cmd = new TextEncoder().encode(tsplSetup(s.width, s.height, s.gap) + "GAPDETECT\r\n");
		if (this.bridge) await this._send(cmd, "calibration");
		else if ((await this.device.transferOut(this.endpoint, cmd)).status !== "ok") throw new Error("The label printer did not accept calibration.");
		log.info("label printer calibrated", { device: this.name, width: s.width, height: s.height, gap: s.gap });
		this._set(`${this.name} calibrated for ${s.width} × ${s.height} mm labels with a ${s.gap} mm gap.`, true);
	}
	async print(product, copies, size, saved, opts) {
		// local test mode: no printer needed, show the label that would be printed
		if (localPrintPreview()) return void showLabelPreview({ title: "Label · " + (product.name || "Item"), bytes: tsplBitmapBytes(product, copies, size, opts), size, copies });
		await this._ensure(saved);
		const bytes = tsplBitmapBytes(product, copies, size, opts);
		// Over USB it is sent in 4 KB chunks like the receipt printer: one 6 KB bulk transfer is rejected or truncated by some printers.
		await this._send(bytes, "label print");
		log.info("labels sent to the label printer", { device: this.name, copies: Number(copies) || 1, bytes: bytes.length, size: size.join("x"), gapMm: Number(opts?.gapMm ?? opts) || 3, offsetX: opts?.offsetX || 0, offsetY: opts?.offsetY || 0 });
		this._set(this.name + " ready for barcode labels.", true);
	}
	/** Print one alignment test label (see tsplAlignmentBytes). */
	async printAlignment(saved, stock) {
		const st = resolveLabelStock(stock);
		const bytes = tsplAlignmentBytes([String(st.width), String(st.height)], { gapMm: st.gap, offsetX: st.offsetX, offsetY: st.offsetY });
		// local test mode: no printer needed, show the calibration label that would be printed
		if (localPrintPreview()) return void showLabelPreview({ title: "Calibration label", bytes, size: [String(st.width), String(st.height)] });
		await this._ensure(saved);
		await this._send(bytes, "alignment label");
		log.info("alignment test label sent", { device: this.name, offsetX: st.offsetX, offsetY: st.offsetY });
	}
}

export const labelPrinter = new LabelPrinter();

/** Pixels per printer dot in the preview, the browser print and the PNG. The printer has 8 dots per mm (203.2 dpi), so x4 is 32 pixels per mm (812.8 dpi): sharp on any printer. */
export const LABEL_PNG_SCALE = 4;
export const LABEL_PNG_DPI = 8 * 25.4 * LABEL_PNG_SCALE;

/** The label exactly as the printer prints it, as a PNG address (data URL). */
export function labelImage(product, size, opts, scale = LABEL_PNG_SCALE) {
	return drawLabelCanvas(product, size, opts, scale).canvas.toDataURL("image/png");
}

/** Screen preview of one label: the picture of the label the printer prints (`product.sizeLabel` adds the "Size: M" line). */
export function barcodeLabelCopy(product, size = ["30", "20"]) {
	return `<img class="label-preview-image" alt="${esc("Label for " + (product.name || "item") + ", barcode " + product.code)}" src="${labelImage(product, size, {}, 3)}">`;
}

/**
 * Full HTML document for the browser print ("Android Print"): one page per label, each page the same picture the printer prints. `copies` is a
 * number, or a list of { sizeLabel, copies } to print several sizes of the same item in one job (each size prints its own barcode, "<item code>-<size>").
 * `imageFor` makes the picture (a test can hand in a stand-in).
 */
export function barcodeLabelsHtml(product, copies, size, imageFor = labelImage) {
	const runs = Array.isArray(copies) ? copies : [{ sizeLabel: product.sizeLabel || "", copies }];
	const pictures = new Map();
	const picture = (sizeLabel) => {
		if (!pictures.has(sizeLabel)) pictures.set(sizeLabel, imageFor({ ...product, code: sizedBarcode(product.code, sizeLabel), sizeLabel }, size, {}));
		return pictures.get(sizeLabel);
	};
	const labels = runs.flatMap((r) => Array.from({ length: r.copies }, () => `<section><img alt="" src="${picture(r.sizeLabel)}"></section>`)).join("");
	const [w, h] = [Number(size[0]), Number(size[1])];
	return `<!doctype html><html><head><style>@page{size:${w}mm ${h}mm;margin:0}*{box-sizing:border-box}body{margin:0}section{width:${w}mm;height:${h}mm;page-break-after:always;overflow:hidden}img{display:block;width:${w}mm;height:${h}mm;image-rendering:pixelated}</style></head><body>${labels}<script>onload=()=>print()</script></body></html>`;
}

/** The PNG file name of a label: the item name (and the size for an item with sizes), without characters a file name cannot hold. */
export function labelFileName(name, sizeLabel = "") {
	const clean = (v) => String(v || "").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").replace(/^[\s.]+|[\s.]+$/g, "").slice(0, 100).trim();
	const base = clean(name) || "label";
	const size = clean(sizeLabel);
	return (size ? base + " - " + size : base) + ".png";
}

const crcTable = (() => {
	const t = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c >>> 0;
	}
	return t;
})();
const crc32 = (bytes) => {
	let c = 0xffffffff;
	for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};

/** Adds the picture's resolution (dpi) to PNG bytes, so printing software prints the label at its real size (30 mm stays 30 mm). */
export function pngWithDpi(png, dpi) {
	const perMeter = Math.round(dpi / 0.0254);
	const chunk = new Uint8Array(21); // length(4) + "pHYs"(4) + data(9) + crc(4)
	const view = new DataView(chunk.buffer);
	view.setUint32(0, 9);
	chunk.set([0x70, 0x48, 0x59, 0x73], 4);
	view.setUint32(8, perMeter);
	view.setUint32(12, perMeter);
	chunk[16] = 1; // unit: metre
	view.setUint32(17, crc32(chunk.subarray(4, 17)));
	const at = 33; // 8-byte signature + the 25-byte IHDR chunk
	const out = new Uint8Array(png.length + chunk.length);
	out.set(png.subarray(0, at), 0);
	out.set(chunk, at);
	out.set(png.subarray(at), at + chunk.length);
	return out;
}

/** The label as a print-ready PNG file (812 dpi, real size). */
export async function labelPngBlob(product, size, opts) {
	const { canvas } = drawLabelCanvas(product, size, opts, LABEL_PNG_SCALE);
	const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The browser could not make the picture."))), "image/png"));
	return new Blob([pngWithDpi(new Uint8Array(await blob.arrayBuffer()), LABEL_PNG_DPI)], { type: "image/png" });
}

/** Downloads the label as a PNG named after the item, so the client can print it from any program. */
export async function downloadLabelPng(product, size, opts) {
	const url = URL.createObjectURL(await labelPngBlob(product, size, opts));
	const a = document.createElement("a");
	a.href = url;
	a.download = labelFileName(product.name, product.sizeLabel);
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 10000);
	return a.download;
}
