/**
 * Print helper connection. Some Windows computers keep a USB label printer for their own printer driver, and the browser is then not allowed to
 * open it directly ("Access denied"). The helper is a small free app (QZ Tray) installed on that computer: the POS hands it the printer
 * commands over a local connection and the helper gives them to the Windows driver as they are ("raw"), so nothing about the printer's
 * driver has to change. The library is loaded only when a helper is used.
 */
import { createLogger } from "../../utils/logger";

const log = createLogger("print-helper");

export const HELPER_NAME = "QZ Tray";
export const HELPER_URL = "https://qz.io/download/";

let loaded = null;
const loadQz = () => (loaded ||= import("qz-tray").then((m) => m.default || m));

/** What went wrong in words a shop owner can act on. */
export function helperError(error) {
	const text = String((error && error.message) || error || "");
	if (/unable to establish|connection|websocket|closed|refused|no connection/i.test(text))
		return new Error(`The print helper (${HELPER_NAME}) is not running on this computer. Install it from ${HELPER_URL.replace("https://", "")}, start it, and try again.`);
	if (/not allowed|denied|blocked|certificate|untrusted/i.test(text))
		return new Error(`The print helper did not allow this request. Click Allow in the ${HELPER_NAME} window (tick "Remember this decision") and try again.`);
	if (/not find|no printer|unknown printer|not found/i.test(text)) return new Error("The print helper cannot find that printer. Check its name under Windows Printers & scanners.");
	return new Error("The print helper could not print: " + (text || "unknown error") + ".");
}

/** Connects to the helper on this computer (once) and returns its library. */
export async function connectHelper(load = loadQz) {
	try {
		const qz = await load();
		if (!qz.websocket.isActive()) await qz.websocket.connect({ retries: 1, delay: 0.5 });
		return qz;
	} catch (error) {
		log.warn("print helper not reachable", error);
		throw helperError(error);
	}
}

/** The names of the printers Windows has, as the helper sees them. */
export async function helperPrinters(load) {
	const qz = await connectHelper(load);
	try {
		const found = await qz.printers.find();
		return (Array.isArray(found) ? found : found ? [found] : []).map(String).sort((a, b) => a.localeCompare(b));
	} catch (error) {
		throw helperError(error);
	}
}

const toBase64 = (bytes) => {
	let binary = "";
	for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(binary);
};

/** Sends printer commands as they are to the named printer. Throws an Error with a plain explanation. */
export async function sendRaw(printerName, bytes, load) {
	const qz = await connectHelper(load);
	try {
		await qz.print(qz.configs.create(printerName), [{ type: "raw", format: "command", flavor: "base64", data: toBase64(bytes) }]);
	} catch (error) {
		log.error("print helper rejected the job", error, { printer: printerName, bytes: bytes.length });
		throw helperError(error);
	}
	log.info("job sent through the print helper", { printer: printerName, bytes: bytes.length });
}
