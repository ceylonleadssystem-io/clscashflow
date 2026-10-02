import { createEmitter } from "./usb";
import { createLogger } from "../../utils/logger";

const log = createLogger("scanner");

/**
 * Barcode scanners. Most USB scanners behave as keyboards ("wedge" mode): a fast
 * burst of keystrokes ending in Enter. WebHID is supported for scanners that
 * expose a raw HID keyboard interface.
 */
const HID_KEYS = "abcdefghijklmnopqrstuvwxyz1234567890";
const HID_MAP = {};
const HID_SHIFT = {};
for (let i = 0; i < 26; i++) {
	HID_MAP[4 + i] = "abcdefghijklmnopqrstuvwxyz"[i];
	HID_SHIFT[4 + i] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i];
}
"1234567890".split("").forEach((c, i) => (HID_MAP[30 + i] = c));
Object.assign(HID_MAP, { 44: " ", 45: "-", 46: "=", 47: "[", 48: "]", 49: "\\", 51: ";", 52: "'", 53: "`", 54: ",", 55: ".", 56: "/" });
Object.assign(HID_SHIFT, { 30: "!", 31: "@", 32: "#", 33: "$", 34: "%", 35: "^", 36: "&", 37: "*", 38: "(", 39: ")", 45: "_", 46: "+", 47: "{", 48: "}", 49: "|", 51: ":", 52: '"', 53: "~", 54: "<", 55: ">", 56: "?" });
void HID_KEYS;

export function scannerCodeVariants(code) {
	const raw = String(code || "").trim();
	const plain = raw.replace(/^\*+|\*+$/g, "");
	return Array.from(
		new Set(
			[
				raw,
				plain,
				raw.toUpperCase(),
				plain.toUpperCase(),
				raw.replace(/[^0-9A-Za-z. $/+%-]/g, ""),
				plain.replace(/[^0-9A-Za-z. $/+%-]/g, ""),
			]
				.map((v) => String(v || "").trim().toLowerCase())
				.filter(Boolean),
		),
	);
}

export function findScannedProduct(products, code) {
	const variants = scannerCodeVariants(code);
	return products.find((p) => {
		const values = [p.code, p.barcode, p.sku].map((v) => String(v || "").trim().toLowerCase());
		return variants.some((v) => values.includes(v));
	});
}

class BarcodeScanner {
	constructor() {
		this.status = { message: "USB scanner not connected. Keyboard-mode scanning is ready.", connected: false };
		this.emitter = createEmitter();
		this.device = null;
		this.hidBuffer = "";
		this.onRemember = null;
		this.onScan = null;
		this.buffer = "";
		this.startedAt = 0;
		this.lastAt = 0;
		this.resetTimer = 0;
		this._onHidReport = this._onHidReport.bind(this);
		this._onKeyDown = this._onKeyDown.bind(this);
	}

	subscribe(fn) {
		fn(this.status);
		return this.emitter.subscribe(fn);
	}
	_set(message, connected) {
		this.status = { message, connected: !!connected };
		this.emitter.emit(this.status);
	}

	/** Start listening for keyboard-wedge scans. `resolve(code)` should return a product or null. */
	attach(resolve, handle) {
		this.resolve = resolve;
		this.handle = handle;
		document.addEventListener("keydown", this._onKeyDown, true);
		if (navigator.hid) {
			navigator.hid.addEventListener("disconnect", (e) => {
				if (this.device === e.device) {
					this.device = null;
					this._set("USB barcode scanner disconnected. Reconnect the cable, then tap Connect USB Scanner.", false);
				}
			});
		}
		return () => document.removeEventListener("keydown", this._onKeyDown, true);
	}

	_reset() {
		this.buffer = "";
		this.startedAt = 0;
		this.lastAt = 0;
		clearTimeout(this.resetTimer);
	}

	_onKeyDown(event) {
		if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
		const now = performance.now();
		const t = event.target;
		const editable = t && t.matches && t.matches('input,textarea,select,[contenteditable="true"]');
		if (event.key === "Enter") {
			const duration = this.startedAt ? now - this.startedAt : Infinity;
			const code = this.buffer;
			const product = code.length >= 3 && duration < Math.max(900, code.length * 90) ? this.resolve?.(code) : null;
			this._reset();
			// Only complete, scanner-speed bursts are logged; ordinary typing never reaches this point.
			if (!product) {
				if (code.length >= 3 && duration < Math.max(900, code.length * 90)) log.warn("barcode scan unresolved", { code, source: "keyboard" });
				return;
			}
			log.info("barcode scan resolved", { code, source: "keyboard" });
			event.preventDefault();
			event.stopPropagation();
			if (editable && t.value === code) t.value = "";
			this.handle?.(code, product);
			return;
		}
		if (event.key.length !== 1 || (editable && t.id !== "product-search")) {
			if (now - this.lastAt > 120) this._reset();
			return;
		}
		if (!this.startedAt || now - this.lastAt > 120) {
			this.buffer = "";
			this.startedAt = now;
		}
		this.buffer += event.key;
		this.lastAt = now;
		clearTimeout(this.resetTimer);
		this.resetTimer = setTimeout(() => this._reset(), 180);
	}

	_onHidReport(event) {
		const data = new Uint8Array(event.data.buffer);
		const shift = !!(data[0] & 34);
		for (let i = 2; i < data.length; i++) {
			const key = data[i];
			if (!key) continue;
			if (key === 40) {
				const code = this.hidBuffer.trim();
				this.hidBuffer = "";
				if (code) {
					const product = this.resolve?.(code);
					if (product) log.info("barcode scan resolved", { code, source: "hid" });
					else log.warn("barcode scan unresolved", { code, source: "hid" });
					if (product) this.handle?.(code, product);
					else this.handle?.(code, null);
				}
				continue;
			}
			const ch = shift ? HID_SHIFT[key] : HID_MAP[key];
			if (ch) this.hidBuffer += ch;
		}
	}

	async _claim(device) {
		if (!device.opened) await device.open();
		this.device = device;
		this.onRemember?.({ vendorId: device.vendorId, productId: device.productId, productName: device.productName || "USB barcode scanner" });
		device.removeEventListener("inputreport", this._onHidReport);
		device.addEventListener("inputreport", this._onHidReport);
		log.info("USB scanner connected", { device: device.productName || "USB barcode scanner", vendorId: device.vendorId, productId: device.productId });
		this._set((device.productName || "USB barcode scanner") + " connected. Scan an item code to add it to Current Order.", true);
	}

	/** @returns {Promise<"connected"|"unsupported"|"cancelled">} */
	async connect() {
		if (!navigator.hid) {
			this._set("This tablet browser does not support USB HID selection. Use keyboard mode: tap Start Scanner Test, then scan.", false);
			return "unsupported";
		}
		try {
			const devices = await navigator.hid.requestDevice({ filters: [{ usagePage: 1, usage: 6 }] });
			if (!devices.length) return "cancelled";
			await this._claim(devices[0]);
			return "connected";
		} catch (error) {
			if (error && error.name === "NotFoundError") return "cancelled";
			log.error("USB scanner connection failed", error);
			this._set("USB scanner connection failed: " + (error.message || "check cable and Android permission."), false);
			throw error;
		}
	}

	async restore(saved = {}) {
		if (!navigator.hid) return false;
		try {
			const devices = await navigator.hid.getDevices();
			const device =
				devices.find((d) => saved.vendorId && d.vendorId === saved.vendorId && (!saved.productId || d.productId === saved.productId)) ||
				devices[0];
			if (!device) return false;
			await this._claim(device);
			return true;
		} catch (error) {
			log.warn("USB scanner restore failed", error);
			this._set("USB scanner is unavailable. Reconnect and allow HID access again, or scan in keyboard mode.", false);
			return false;
		}
	}

	setMessage(message, connected) {
		this._set(message, connected);
	}
}

export const barcodeScanner = new BarcodeScanner();
