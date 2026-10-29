/**
 * USB kitchen printers (WebUSB, ESC/POS): each kitchen printer station remembers its own printer (vendor, product and serial
 * number, so two printers of the same model are told apart). Choosing a printer asks the browser once; after that tickets print
 * without a dialog. A printer that is also the receipt printer is shared with it instead of being claimed twice.
 */
import { claimUsbOutput, transferChunks } from "./usb";
import { receiptPrinter } from "./receiptPrinter";
import { kotEscPos, kotHtml } from "./documents";
import { localPrintPreview, showPrintPreview } from "./localPrintPreview";
import { createLogger } from "../../utils/logger";

const log = createLogger("printing");
const claimed = new Map(); // USBDevice -> endpoint number

export const usbSupported = () => typeof navigator !== "undefined" && !!navigator.usb;

const identity = (d) => ({ vendorId: d.vendorId, productId: d.productId, serialNumber: d.serialNumber || "", productName: d.productName || "USB printer" });
const matches = (d, saved) => d.vendorId === saved.vendorId && d.productId === saved.productId && (!saved.serialNumber || (d.serialNumber || "") === saved.serialNumber);

/** Lets the user pick the station's printer in the browser dialog. Returns its identity, or null when the dialog was closed. */
export async function chooseKitchenPrinter() {
	if (!usbSupported()) throw new Error("USB printing is not available in this browser. Use Chrome on Android, Windows or macOS, or choose System print dialog.");
	try {
		const device = await navigator.usb.requestDevice({ filters: [{ classCode: 7 }] });
		return identity(device);
	} catch (e) {
		if (e?.name === "NotFoundError") return null; // the picker was closed
		throw e;
	}
}

async function endpointFor(saved) {
	if (receiptPrinter.connected && matches(receiptPrinter.device, saved)) return { device: receiptPrinter.device, endpoint: receiptPrinter.endpoint };
	const device = (await navigator.usb.getDevices()).find((d) => matches(d, saved));
	if (!device) throw new Error((saved.productName || "The USB printer") + " is not connected or access was not granted. Reconnect it, or choose it again on the Stations page.");
	if (!device.opened || !claimed.has(device)) claimed.set(device, (await claimUsbOutput(device, "kitchen printer")).endpointNumber);
	return { device, endpoint: claimed.get(device) };
}

/** Prints one kitchen ticket on the station's USB printer. Throws an Error with a message for the staff. */
export async function printKitchenTicket(station, ticket) {
	const saved = station.printer?.usb;
	if (localPrintPreview()) return void showPrintPreview({ title: "Kitchen ticket for " + station.name + " (USB printer)", html: kotHtml(ticket, { station: station.name, autoPrint: false }) });
	if (!saved) throw new Error("No USB printer is chosen for " + station.name + ". Choose one on the Stations page.");
	if (!usbSupported()) throw new Error("USB printing is not available in this browser.");
	const { device, endpoint } = await endpointFor(saved);
	await transferChunks(device, endpoint, kotEscPos(ticket));
	log.info("kitchen ticket printed on USB printer", { station: station.name, order: ticket.orderNumber, device: device.productName || "USB printer" });
}

if (usbSupported())
	navigator.usb.addEventListener("disconnect", (e) => {
		claimed.delete(e.device);
	});
