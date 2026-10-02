import { claimUsbOutput, createEmitter, transferChunks } from "./usb";
import { receiptText } from "./documents";
import { escPosRaster } from "./imageTools";
import { createLogger } from "../../utils/logger";

const log = createLogger("printing");

const AZURE_PRINTER_VENDOR = 1046;
const AZURE_PRINTER_PRODUCT = 20497;

/**
 * Direct 80 mm ESC/POS printing over WebUSB (Android tablets in Chrome).
 * The device identity is persisted by the caller through `onRemember`.
 */
class ReceiptPrinter {
	constructor() {
		this.device = null;
		this.endpoint = 0;
		this.status = { message: "Checking connected hardware…", connected: false };
		this.emitter = createEmitter();
		this.onRemember = null;
		this._bind();
	}

	_bind() {
		if (typeof navigator === "undefined" || !navigator.usb) return;
		navigator.usb.addEventListener("disconnect", (e) => {
			if (this.device === e.device) {
				this.device = null;
				log.warn("USB receipt printer disconnected");
				this._set("USB printer disconnected. Reconnect the cable, then tap Connect USB Printer.", false);
			}
		});
		navigator.usb.addEventListener("connect", () => this.restore());
	}

	_set(message, connected) {
		this.status = { message, connected: !!connected };
		this.emitter.emit(this.status);
	}
	subscribe(fn) {
		fn(this.status);
		return this.emitter.subscribe(fn);
	}

	get supported() {
		return typeof navigator !== "undefined" && !!navigator.usb;
	}
	get connected() {
		return !!(this.device && this.device.opened);
	}

	async _claim(device) {
		const out = await claimUsbOutput(device, "USB receipt printer");
		this.device = device;
		this.endpoint = out.endpointNumber;
		this.onRemember?.({
			vendorId: device.vendorId,
			productId: device.productId,
			productName: device.productName || "USB receipt printer",
			serialNumber: device.serialNumber || "",
		});
		log.info("USB receipt printer connected", { device: device.productName || "USB receipt printer", vendorId: device.vendorId, productId: device.productId });
		this._set(`${device.productName || "USB receipt printer"} connected and automatic sale receipts enabled (${device.vendorId}:${device.productId}).`, true);
		return device;
	}

	async connect() {
		if (!this.supported)
			throw new Error("Direct USB printing is not available in this browser. Open Ceylonry POS in Chrome on the Android tablet, or use System Print.");
		try {
			const device = await navigator.usb.requestDevice({
				filters: [{ vendorId: AZURE_PRINTER_VENDOR, productId: AZURE_PRINTER_PRODUCT }, { classCode: 7 }],
			});
			await this._claim(device);
			return true;
		} catch (error) {
			// NotFoundError = the user closed the device picker; not a failure.
			if (error && error.name === "NotFoundError") return false;
			log.error("USB receipt printer connection failed", error);
			this._set("USB printer connection failed: " + (error.message || "check the cable and Android USB permission."), false);
			throw error;
		}
	}

	async restore(saved = {}) {
		if (!this.supported) return false;
		try {
			const devices = await navigator.usb.getDevices();
			const device = devices.find(
				(d) =>
					(saved.vendorId ? d.vendorId === saved.vendorId : d.vendorId === AZURE_PRINTER_VENDOR) &&
					(saved.productId ? d.productId === saved.productId : d.productId === AZURE_PRINTER_PRODUCT),
			);
			if (!device) {
				this._set("USB printer permission is not active. Tap Connect USB Printer.", false);
				return false;
			}
			await this._claim(device);
			return true;
		} catch (error) {
			log.warn("USB receipt printer restore failed", error);
			this._set("USB printer is unavailable. Reconnect the cable or grant access again.", false);
			return false;
		}
	}

	async print(sale, ctx) {
		if (!this.connected) {
			const restored = await this.restore(ctx.saved || {});
			if (!restored)
				throw new Error("USB printer is not connected. Tap Printer, select the receipt printer, and allow USB access.");
		}
		// Byte order matters: logo raster, then ESC @ (init) + text, then QR raster, then GS V B 0 (feed + partial cut).
		const encoder = new TextEncoder();
		const text = encoder.encode(receiptText(sale, ctx));
		const body = new Uint8Array(2 + text.length);
		body.set([27, 64], 0);
		body.set(text, 2);
		const cut = new Uint8Array([29, 86, 66, 0]);
		const logo = await escPosRaster(ctx.settings.logo, { size: 240, threshold: 160 });
		const qr = await escPosRaster(ctx.settings.receiptSocialQr, { size: 320, threshold: 170, leadingFeed: true, qr: true });
		const bytes = new Uint8Array(logo.length + body.length + qr.length + cut.length);
		bytes.set(logo);
		bytes.set(body, logo.length);
		bytes.set(qr, logo.length + body.length);
		bytes.set(cut, logo.length + body.length + qr.length);
		await transferChunks(this.device, this.endpoint, bytes);
		log.info("receipt bytes sent to USB printer", { receipt: sale.receipt, bytes: bytes.length, device: this.device.productName || "USB receipt printer" });
		this._set(`${this.device.productName || "USB receipt printer"} connected and ready.`, true);
	}
}

export const receiptPrinter = new ReceiptPrinter();
