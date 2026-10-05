/**
 * USB TSPL label printer (gap labels, default 30 x 25 mm): label layouts, bitmap print jobs, WebUSB connect/
 * restore/calibrate/print, plus the on-screen label preview and the browser-print (Android Print) label HTML.
 */
import { claimUsbOutput, createEmitter, transferChunks } from "./usb";
import { barcodeSvg, cleanBarcode, code128Units, drawCode128 } from "./barcode";
import { esc, money } from "../../domain/format";
import { createLogger } from "../../utils/logger";

const log = createLogger("printing");

/** USB TSPL label printer (gap labels, default 30 × 25 mm with a 3 mm gap) + browser print fallback. */

/**
 * Label roll the printer is loaded with. The size and gap sent with every job (and every calibration) MUST match the
 * physical labels: a mismatch is the usual reason a gap-label printer prints one label and then feeds a blank one.
 */
export const DEFAULT_LABEL_STOCK = { width: 30, height: 25, gap: 3 };
export const LABEL_SIZES = ["25x25", "30x20", "30x25", "35x25", "40x25", "35x35", "40x30", "45x30", "50x30"];
export const LABEL_GAPS = [2, 2.5, 3, 3.5, 4];

/** Clamp/normalise a saved stock setting. */
export function resolveLabelStock(saved) {
	const num = (v, d, min, max) => {
		const n = Number(v);
		return Number.isFinite(n) && n >= min && n <= max ? n : d;
	};
	return {
		width: num(saved?.width, DEFAULT_LABEL_STOCK.width, 15, 100),
		height: num(saved?.height, DEFAULT_LABEL_STOCK.height, 10, 100),
		gap: num(saved?.gap, DEFAULT_LABEL_STOCK.gap, 1, 8),
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
	const L = (o) => ({ darken: true, gapMm: 3, descFont: 0, underNameFont: 0, nameFont: 0, nameY: 0, descY: 0, ...o });
	if (width <= 25 && height <= 25)
		return L({ margin: 22, nameFont: 14, descFont: 7, priceFont: 15, nameY: 8, descY: 25, barcodeY: 40, barcodeH: 98, priceGap: 10, bottomPad: 16 });
	// 30 x 20 mm (160 dots high): name, barcode and price must all fit above the gap
	if (width <= 30 && height <= 20)
		return L({ margin: 24, nameFont: 14, priceFont: 14, nameY: 4, barcodeY: 22, barcodeH: 84, priceGap: 6, bottomPad: 18 });
	if (width <= 30 && height <= 25)
		return L({ margin: 24, nameFont: 16, priceFont: 16, nameY: 6, barcodeY: 28, barcodeH: 96, priceGap: 6, bottomPad: 30 });
	if (width <= 35 && height <= 25)
		return L({ margin: 32, underNameFont: 8, priceFont: 11, barcodeY: 34, barcodeH: 84, underNameGap: 6, priceGap: 24, bottomPad: 15 });
	if (width <= 40 && height <= 25)
		return L({ margin: 38, underNameFont: 8, priceFont: 13, barcodeY: 34, barcodeH: 86, underNameGap: 6, priceGap: 25, bottomPad: 18 });
	if (width <= 35 && height <= 35)
		return L({ margin: 30, nameFont: 14, underNameFont: 9, priceFont: 14, nameY: 8, barcodeY: 34, barcodeH: 132, underNameGap: 5, priceGap: 27, bottomPad: 20 });
	if (width <= 40 && height <= 30)
		return L({ margin: 42, nameFont: 18, descFont: 8, priceFont: 18, nameY: 14, descY: 36, barcodeY: 56, barcodeH: 110, priceGap: 12, bottomPad: 22 });
	if (width <= 45 || height <= 30)
		return L({ margin: 30, nameFont: 20, descFont: 9, priceFont: 20, nameY: 8, descY: 34, barcodeY: 52, barcodeH: 94, priceGap: 8, bottomPad: 26 });
	return L({ margin: 20, nameFont: 28, descFont: 13, priceFont: 28, nameY: 12, descY: 44, barcodeY: 68, barcodeH: 100, priceGap: 9, bottomPad: 34 });
}

function fitText(ctx, text, maxWidth, font) {
	text = String(text || "").trim();
	ctx.font = font;
	if (ctx.measureText(text).width <= maxWidth) return text;
	while (text.length > 3 && ctx.measureText(text + "...").width > maxWidth) text = text.slice(0, -1);
	return text + "...";
}

/** Bitmap TSPL job: name, Code 128 barcode, price rendered on a canvas at 203 dpi. `opts` = gap (mm) or {gapMm, offsetX, offsetY, marginMm}. */
export function tsplBitmapBytes(product, copies, size, opts) {
	const o = typeof opts === "object" && opts ? opts : { gapMm: opts };
	const width = Number(size[0]) || 30;
	const height = Number(size[1]) || 25;
	const dotsW = Math.round(width * 8);
	const dotsH = Math.round(height * 8);
	const canvas = document.createElement("canvas");
	canvas.width = dotsW;
	canvas.height = dotsH;
	const ctx = canvas.getContext("2d");
	const layout = labelBitmapLayout(width, height);
	const g = labelGeometry(dotsW, layout, o, code128Units(product.code));
	const name = String(product.name || "Item");
	const description = layout.descFont ? String(product.description || product.subcategory || product.category || "") : "";
	const price = money(product.price);
	const textW = g.right - g.left;
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, dotsW, dotsH);
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	if (layout.nameFont) {
		ctx.font = "900 " + layout.nameFont + "px Arial";
		ctx.fillText(fitText(ctx, name, textW, ctx.font), g.cx, layout.nameY + g.dy);
	}
	if (description) {
		ctx.font = "400 " + layout.descFont + "px Arial";
		ctx.fillText(fitText(ctx, description, textW, ctx.font), g.cx, layout.descY + g.dy);
	}
	drawCode128(ctx, product.code, g.barcodeX, layout.barcodeY + g.dy, g.barcodeW, layout.barcodeH, layout.darken);
	if (layout.underNameFont) {
		ctx.font = "900 " + layout.underNameFont + "px Arial";
		ctx.fillText(fitText(ctx, name, textW, ctx.font), g.cx, layout.barcodeY + layout.barcodeH + layout.underNameGap + g.dy);
	}
	ctx.font = "900 " + layout.priceFont + "px Arial";
	ctx.fillText(
		fitText(ctx, price, textW, ctx.font),
		g.cx,
		Math.min(dotsH - layout.bottomPad, layout.barcodeY + layout.barcodeH + layout.priceGap) + g.dy,
	);
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
 * Alignment test label: a border on the very edge of the label, a centre cross, L/R/T/B markers and a 1 mm ruler.
 * Whatever is missing or cut on the printed label shows which way to move the content (Settings > Printing).
 */
export function tsplAlignmentBytes(size, opts) {
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
	return tsplFromCanvas(canvas, dotsW, dotsH, width, height, 1, o.gapMm || 3);
}

class LabelPrinter {
	constructor() {
		this.device = null;
		this.endpoint = 0;
		this.name = "";
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
		return !!(this.device && this.device.opened);
	}
	/** Name of the connected USB label printer ("" when none). */
	get deviceName() {
		return this.connected ? this.device.productName || this.name || "USB barcode label printer" : "";
	}
	async _claim(device) {
		const out = await claimUsbOutput(device, "USB label printer");
		this.device = device;
		this.endpoint = out.endpointNumber;
		this.name = device.productName || "USB barcode label printer";
		this.onRemember?.({ vendorId: device.vendorId, productId: device.productId, productName: this.name, serialNumber: device.serialNumber || "" });
		log.info("USB label printer connected", { device: this.name, vendorId: device.vendorId, productId: device.productId });
		this._set(this.name + " connected for barcode labels.", true);
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
	/** Teach the printer the label length and gap of the loaded roll (use the real size/gap of the labels). */
	async calibrate(saved, stock) {
		await this._ensure(saved);
		const s = resolveLabelStock(stock);
		const cmd = new TextEncoder().encode(tsplSetup(s.width, s.height, s.gap) + "GAPDETECT\r\n");
		const result = await this.device.transferOut(this.endpoint, cmd);
		if (result.status !== "ok") throw new Error("The label printer did not accept calibration.");
		log.info("label printer calibrated", { device: this.name, width: s.width, height: s.height, gap: s.gap });
		this._set(`${this.name} calibrated for ${s.width} × ${s.height} mm labels with a ${s.gap} mm gap.`, true);
	}
	async print(product, copies, size, saved, opts) {
		await this._ensure(saved);
		const bytes = tsplBitmapBytes(product, copies, size, opts);
		// Sent in 4 KB chunks like the receipt printer: one 6 KB bulk transfer is rejected or truncated by some printers.
		try {
			await transferChunks(this.device, this.endpoint, bytes);
		} catch (error) {
			log.error("label print rejected by printer", error, { device: this.name, bytes: bytes.length });
			throw new Error("The USB barcode printer stopped accepting label data.");
		}
		log.info("labels sent to USB printer", { device: this.name, copies: Number(copies) || 1, bytes: bytes.length, size: size.join("x"), gapMm: Number(opts?.gapMm ?? opts) || 3, offsetX: opts?.offsetX || 0, offsetY: opts?.offsetY || 0 });
		this._set(this.name + " ready for barcode labels.", true);
	}
	/** Print one alignment test label (see tsplAlignmentBytes). */
	async printAlignment(saved, stock) {
		await this._ensure(saved);
		const st = resolveLabelStock(stock);
		const bytes = tsplAlignmentBytes([String(st.width), String(st.height)], { gapMm: st.gap, offsetX: st.offsetX, offsetY: st.offsetY });
		try {
			await transferChunks(this.device, this.endpoint, bytes);
		} catch (error) {
			log.error("alignment label rejected by printer", error, { device: this.name });
			throw new Error("The USB barcode printer stopped accepting label data.");
		}
		log.info("alignment test label sent", { device: this.name, offsetX: st.offsetX, offsetY: st.offsetY });
	}
}

export const labelPrinter = new LabelPrinter();

/** Screen preview of one label. */
export function barcodeLabelCopy(product) {
	const description = product.description || product.subcategory || product.category || "";
	return `<div class="barcode-label-copy"><strong class="label-name">${esc(product.name || "Item")}</strong><span class="label-description">${esc(
		description || "Scan this label at checkout",
	)}</span><div class="label-barcode">${barcodeSvg(product.code)}</div><strong class="label-price">${money(product.price)}</strong></div>`;
}

/** Full HTML document for "Android Print" of N labels. */
export function barcodeLabelsHtml(product, copies, size) {
	const description = product.description || product.subcategory || product.category || "";
	const label = `<div class="copy"><strong class="copy-name">${esc(product.name || "Item")}</strong><span class="copy-description">${esc(
		description || "Scan this label at checkout",
	)}</span><div class="copy-barcode">${barcodeSvg(cleanBarcode(product.code))}</div><b class="copy-price">${money(product.price)}</b></div>`;
	const labels = Array.from({ length: copies }, () => `<section>${label}</section>`).join("");
	return `<!doctype html><html><head><style>@page{size:${size[0]}mm ${size[1]}mm;margin:1mm}*{box-sizing:border-box}body{margin:0;font-family:Arial;color:#000}section{width:${
		Number(size[0]) - 2
	}mm;height:${
		Number(size[1]) - 2
	}mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always;overflow:hidden}.copy{width:100%;display:grid;justify-items:center;gap:.45mm}.copy-name,.copy-price{display:block;font-size:10pt;font-weight:900;line-height:1}.copy-description{display:block;max-width:96%;font-size:7.5pt;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.copy-barcode{width:100%;display:grid;place-items:center;margin:.2mm 0}svg{display:block;width:95%;height:auto;max-height:14mm;margin:0 auto}</style></head><body>${labels}<script>onload=()=>print()</script></body></html>`;
}
