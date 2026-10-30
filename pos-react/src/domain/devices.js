/**
 * Device Manager (pure): the POS devices of a business (registers and order pads) and the printers set up on each one.
 * Devices register themselves the first time a signed-in browser opens the POS (settings.posDevices); a device's printers are
 * settings.devicePrinters, one list for the business. USB access is granted per browser, so a printer is always used by the device
 * it belongs to: connect it on that device. A device without a setup keeps the existing behaviour (Settings, Receipt Printing and the
 * Stations page), so nothing changes until someone configures its printers.
 */
import { stationPrinter } from "./kitchenStations";

export const DEVICE_KINDS = [
	{ value: "register", label: "Register" },
	{ value: "orderpad", label: "Order pad" },
];
export const RECEIPT_CONNECTIONS = [
	{ value: "default", label: "As set in Receipt Printing" },
	{ value: "system", label: "System print dialog" },
	{ value: "usb", label: "USB receipt printer (ESC/POS)" },
];
export const KITCHEN_CONNECTIONS = [
	{ value: "none", label: "No printer (tickets stay in the Order Queue)" },
	{ value: "system", label: "System print dialog" },
	{ value: "usb", label: "USB kitchen printer (ESC/POS)" },
];
export const MAX_COPIES = 5;
export const MAX_NAME = 40;

const text = (v, max = MAX_NAME) => String(v ?? "").trim().slice(0, max);
const list = (v) => (Array.isArray(v) ? v : []);

export const receiptPrinterId = (deviceId) => "rcpt-" + deviceId;

// ------------------------------------------------------------------------------------------ devices ----
const device = (d) => ({ id: String(d.id), name: text(d.name), kind: d.kind === "orderpad" ? "orderpad" : "register", locationId: String(d.locationId || "") });

/** The devices of a location (all of them for "all" / no location). A device saved without a location shows everywhere. */
export function devicesOf(settings = {}, locationId = "") {
	return list(settings.posDevices)
		.filter((d) => d && d.id && text(d.name))
		.map(device)
		.filter((d) => !locationId || locationId === "all" || !d.locationId || d.locationId === locationId);
}

export function deviceNameError(settings, { id, name }) {
	const clean = text(name);
	if (!clean) return "Enter a name.";
	if (list(settings.posDevices).some((d) => d.id !== id && text(d.name).toLowerCase() === clean.toLowerCase())) return "There is already a device called " + clean + ".";
	return "";
}

// ----------------------------------------------------------------------------------------- printers ----
function connection(role, c = {}) {
	const kinds = (role === "receipt" ? RECEIPT_CONNECTIONS : KITCHEN_CONNECTIONS).map((k) => k.value);
	const kind = kinds.includes(c.kind) ? c.kind : role === "receipt" ? "default" : "none";
	return kind === "usb" ? stationPrinter({ printer: { kind, usb: c.usb } }) : { kind };
}

/** A printer as stored: known fields only, values kept inside their limits. */
export function normalizePrinter(p = {}) {
	const role = p.role === "kitchen" ? "kitchen" : "receipt";
	const copies = Math.round(Number(p.receiptCopies));
	return {
		id: String(p.id),
		deviceId: String(p.deviceId),
		role,
		name: role === "receipt" ? "Receipt printer" : text(p.name),
		connection: connection(role, p.connection),
		stationId: role === "kitchen" ? String(p.stationId || "") : "",
		receiptCopies: role === "receipt" ? (copies >= 1 && copies <= MAX_COPIES ? copies : 1) : 1,
		printFromThisDevice: p.printFromThisDevice !== false,
		backupPrinterId: role === "kitchen" ? String(p.backupPrinterId || "") : "",
		duplicateToPrinterId: role === "kitchen" ? String(p.duplicateToPrinterId || "") : "",
	};
}

/** The printers of a device: its Receipt printer first (a default one when none was saved), then the kitchen printers. */
export function printersOf(settings = {}, deviceId = "") {
	const mine = list(settings.devicePrinters).filter((p) => p && p.id && p.deviceId === deviceId).map(normalizePrinter);
	const receipt = mine.find((p) => p.role === "receipt") || normalizePrinter({ id: receiptPrinterId(deviceId), deviceId, role: "receipt" });
	return [receipt, ...mine.filter((p) => p.role === "kitchen")];
}

/** Why a printer cannot be saved ("" when it can). `siblings` are the other printers of the same device. */
export function printerError(p, siblings = [], stations = []) {
	if (p.role === "kitchen") {
		if (!text(p.name)) return "Enter a name for the printer.";
		if (siblings.some((s) => s.role === "kitchen" && s.name.toLowerCase() === text(p.name).toLowerCase())) return "This device already has a printer called " + text(p.name) + ".";
		if (!p.stationId) return "Choose the station this printer serves.";
		if (!stations.some((s) => s.id === p.stationId)) return "That station no longer exists. Choose another.";
	}
	const copies = Number(p.receiptCopies);
	if (p.role === "receipt" && !(Number.isInteger(copies) && copies >= 1 && copies <= MAX_COPIES)) return `Receipt copies must be a whole number from 1 to ${MAX_COPIES}.`;
	if (p.connection?.kind === "usb" && !p.connection.usb) return "Connect the USB printer first, or choose another connection.";
	const ids = new Set(siblings.map((s) => s.id));
	for (const [field, label] of [["backupPrinterId", "Backup"], ["duplicateToPrinterId", "Duplicate"]]) {
		const target = p[field];
		if (!target) continue;
		if (target === p.id) return label + " printer cannot be the printer itself.";
		if (!ids.has(target)) return label + " printer must be another printer of this device.";
	}
	// following the backups from this printer must never come back to it
	const byId = new Map(siblings.map((s) => [s.id, s]));
	for (let at = p.backupPrinterId, hops = 0; at && hops <= siblings.length; hops++) {
		if (at === p.id) return "The backup printers form a loop. Choose a different backup.";
		at = byId.get(at)?.backupPrinterId;
	}
	return "";
}

/**
 * The printers copied to another device: new ids, USB connections dropped (USB access belongs to the browser it was granted in),
 * backup and duplicate links kept between the copies.
 */
export function copyPrinters(printers, toDeviceId, newId) {
	const ids = new Map(printers.map((p) => [p.id, p.role === "receipt" ? receiptPrinterId(toDeviceId) : newId()]));
	return printers.map((p) =>
		normalizePrinter({
			...p,
			id: ids.get(p.id),
			deviceId: toDeviceId,
			connection: p.connection.kind === "usb" ? { kind: p.role === "receipt" ? "default" : "none" } : p.connection,
			backupPrinterId: ids.get(p.backupPrinterId) || "",
			duplicateToPrinterId: ids.get(p.duplicateToPrinterId) || "",
		}),
	);
}

// ---------------------------------------------------------------------------------------- printing ----
/** How receipts print on this device: { kind: "default" | "system" | "usb", usb?, copies, print }. "default" = the Receipt Printing settings. */
export function receiptPlan(settings, deviceId) {
	const p = printersOf(settings, deviceId)[0];
	return { kind: p.connection.kind, usb: p.connection.usb, copies: p.receiptCopies, print: p.printFromThisDevice };
}

const asStation = (p, station) => ({ ...station, name: p.name || station.name, type: "printer", printer: p.connection });

/**
 * How a kitchen ticket of `station` prints on this device, or null when the device has no printer for it (the station's own printer
 * then prints it, as before). { print: false } = log only; backup and duplicate are station-like objects the ticket can also go to.
 */
export function ticketPlan(settings, deviceId, station) {
	const mine = printersOf(settings, deviceId).filter((p) => p.role === "kitchen");
	const primary = mine.find((p) => p.stationId === station.id);
	if (!primary) return null;
	const pick = (id) => {
		const p = mine.find((x) => x.id === id);
		return p ? asStation(p, station) : null;
	};
	return { print: primary.printFromThisDevice, primary: asStation(primary, station), backup: pick(primary.backupPrinterId), duplicate: pick(primary.duplicateToPrinterId) };
}

/** Printer stations that nothing prints for: no printer chosen on the Stations page and none on any device. */
export function stationsWithoutPrinter(settings, stations = []) {
	const served = new Set(list(settings.devicePrinters).filter((p) => p && p.role === "kitchen" && normalizePrinter(p).connection.kind !== "none").map((p) => p.stationId));
	return stations.filter((s) => s.type === "printer" && (s.printer?.kind || "none") === "none" && !served.has(s.id));
}

/** One line saying how a printer is connected. */
export function connectionLabel(p) {
	const c = p.connection;
	if (c.kind === "usb") return c.usb?.productName || "USB printer";
	if (c.kind === "system") return "System print dialog";
	return p.role === "receipt" ? "As set in Receipt Printing" : "Not connected";
}
