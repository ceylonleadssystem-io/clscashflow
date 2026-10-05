/**
 * USB TSPL label printer (gap labels, default 30 x 25 mm): label layouts, bitmap print jobs, WebUSB connect/
 * restore/calibrate/print, plus the on-screen label preview and the browser-print (Android Print) label HTML.
 */
import { claimUsbOutput, createEmitter } from "./usb";
import { barcodeSvg, cleanBarcode, drawCode128 } from "./barcode";
import { esc, money } from "../../domain/format";
import { createLogger } from "../../utils/logger";

const log = createLogger("printing");

/** USB TSPL label printer (30 × 25 mm gap labels) + browser print fallback. */

export function labelBitmapLayout(width, height) {
	const L = (o) => ({ darken: true, gapMm: 3, descFont: 0, underNameFont: 0, nameFont: 0, nameY: 0, descY: 0, ...o });
	if (width <= 25 && height <= 25)
		return L({ margin: 22, nameFont: 14, descFont: 7, priceFont: 15, nameY: 8, descY: 25, barcodeY: 40, barcodeH: 98, priceGap: 10, bottomPad: 16 });
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

/** Bitmap TSPL job: name, Code 128 barcode, price rendered on a canvas at 203 dpi. */
export function tsplBitmapBytes(product, copies, size) {
	const width = Number(size[0]) || 30;
	const height = Number(size[1]) || 25;
	const dotsW = Math.round(width * 8);
	const dotsH = Math.round(height * 8);
	const canvas = document.createElement("canvas");
	canvas.width = dotsW;
	canvas.height = dotsH;
	const ctx = canvas.getContext("2d");
	const layout = labelBitmapLayout(width, height);
	const name = String(product.name || "Item");
	const description = layout.descFont ? String(product.description || product.subcategory || product.category || "") : "";
	const price = money(product.price);
	const margin = layout.margin;
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, dotsW, dotsH);
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	if (layout.nameFont) {
		ctx.font = "900 " + layout.nameFont + "px Arial";
		ctx.fillText(fitText(ctx, name, dotsW - margin * 2, ctx.font), dotsW / 2, layout.nameY);
	}
	if (description) {
		ctx.font = "400 " + layout.descFont + "px Arial";
		ctx.fillText(fitText(ctx, description, dotsW - margin * 2, ctx.font), dotsW / 2, layout.descY);
	}
	drawCode128(ctx, product.code, margin, layout.barcodeY, dotsW - margin * 2, layout.barcodeH, layout.darken);
	if (layout.underNameFont) {
		ctx.font = "900 " + layout.underNameFont + "px Arial";
		ctx.fillText(
			fitText(ctx, name, dotsW - margin * 2, ctx.font),
			dotsW / 2,
			layout.barcodeY + layout.barcodeH + layout.underNameGap,
		);
	}
	ctx.font = "900 " + layout.priceFont + "px Arial";
	ctx.fillText(
		fitText(ctx, price, dotsW - margin * 2, ctx.font),
		dotsW / 2,
		Math.min(dotsH - layout.bottomPad, layout.barcodeY + layout.barcodeH + layout.priceGap),
	);
	const pixels = ctx.getImageData(0, 0, dotsW, dotsH).data;
	const rowBytes = Math.ceil(dotsW / 8);
	// TSPL BITMAP mode 0: a set bit is a WHITE dot, so black pixels stay 0.
	const raster = new Uint8Array(rowBytes * dotsH);
	for (let y = 0; y < dotsH; y++)
		for (let x = 0; x < dotsW; x++) {
			const o = (y * dotsW + x) * 4;
			const l = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2];
			if (pixels[o + 3] <= 40 || l >= 160) raster[y * rowBytes + (x >> 3)] |= 128 >> (x & 7);
		}
	const count = Math.max(1, Number(copies) || 1);
	const enc = new TextEncoder();
	const setup = enc.encode(
		`SIZE ${width} mm,${height} mm\r\nGAP ${layout.gapMm || 3} mm,0\r\nOFFSET 0 mm\r\nREFERENCE 0,0\r\nDIRECTION 0\r\nDENSITY 15\r\nSPEED 2\r\nSET TEAR OFF\r\nSET PEEL OFF\r\nSET CUTTER OFF\r\nBACKFEED 0\r\n`,
	);
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
	async calibrate(saved) {
		await this._ensure(saved);
		const cmd = new TextEncoder().encode(
			"SIZE 30 mm,25 mm\r\nGAP 3 mm,0\r\nOFFSET 0 mm\r\nREFERENCE 0,0\r\nDIRECTION 0\r\nDENSITY 15\r\nSPEED 2\r\nSET TEAR OFF\r\nSET PEEL OFF\r\nSET CUTTER OFF\r\nBACKFEED 0\r\nGAPDETECT\r\n",
		);
		const result = await this.device.transferOut(this.endpoint, cmd);
		if (result.status !== "ok") throw new Error("The label printer did not accept calibration.");
		this._set(this.name + " calibrated for 30 × 25 mm gap labels.", true);
	}
	async print(product, copies, size, saved) {
		await this._ensure(saved);
		const bytes = tsplBitmapBytes(product, copies, size);
		const result = await this.device.transferOut(this.endpoint, bytes);
		if (result.status !== "ok") {
			log.error("label print rejected by printer", new Error("transferOut status " + result.status), { device: this.name, bytes: bytes.length });
			throw new Error("The USB barcode printer stopped accepting label data.");
		}
		log.info("labels sent to USB printer", { device: this.name, copies: Number(copies) || 1, bytes: bytes.length });
		this._set(this.name + " ready for barcode labels.", true);
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
