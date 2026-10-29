/**
 * Receipt and kitchen-ticket output: USB ESC/POS or system printing, receipt download, WhatsApp receipt
 * sharing, test receipts, and queueing/sending kitchen tickets (KOT) to the Kitchen POS or a printer hook.
 */
import { kitchenPrinterHook } from "../platform.service";
import { T } from "../../db/tables";
import { downloadBlob, whatsappPhone } from "../../domain/format";
import { kotHtml, kotTicketsHtml, receiptHtml, receiptMessage } from "../printing/documents";
import { printKitchenTicket } from "../printing/kitchenPrinters";
import { printHtmlInFrame, printHtmlInWindow } from "../printing/printDocument";
import { receiptPrinter } from "../printing/receiptPrinter";
import { createLogger } from "../../utils/logger";
import { KDS_DESTINATION } from "../../KDS/kds";
import { kdsLink } from "../../KDS/link";
import { kitchenMode, newId, stamp } from "./common";
import { kitchenStations, routeKitchenLines } from "../../domain/kitchenStations";

const log = createLogger("printing");

/** Receipt / kitchen-ticket output: USB ESC/POS, system print, download, WhatsApp. */

const locationFor = (d, sale, session) =>
	(d.locations || []).find((l) => l.id === (sale.locationId || session.locationId)) || null;

const docCtx = (ctx, sale, extra = {}) => {
	const d = ctx.data();
	return { settings: d.settings, location: locationFor(d, sale, ctx.session()), ...extra };
};

/** Sends a sale receipt to the configured printer. Returns true when printed. */
export async function printReceipt(ctx, sale) {
	const d = ctx.data();
	if (!sale) return void (await ctx.ui.alert("Receipt not found."));
	const type = d.settings.printerType || "system";
	if (type === "usb-direct" && ctx.features()["hardware.usbPrinter"]) {
		try {
			await receiptPrinter.print(sale, { ...docCtx(ctx, sale), saved: d.settings.usbPrinter });
			log.info("receipt printed", { receipt: sale.receipt, method: "usb-direct" });
			ctx.ui.notice("Receipt " + sale.receipt + " sent directly to the USB receipt printer.");
			return true;
		} catch (error) {
			console.error("Direct USB receipt print failed", error);
			log.error("receipt print failed", error, { receipt: sale.receipt, method: "usb-direct" });
			await ctx.ui.alert(
				"Receipt was not printed. " + (error.message || "Reconnect the USB receipt printer and try again.") + " The POS will not open Save as PDF.",
			);
			return false;
		}
	}
	// System print: the browser dialog gives no completion signal, so only the hand-off is logged.
	log.info("receipt sent to system print", { receipt: sale.receipt, printerType: type });
	printHtmlInFrame(receiptHtml(sale, docCtx(ctx, sale)), "Receipt print job");
	return true;
}

export async function printTestReceipt(ctx) {
	return printReceipt(ctx, {
		id: "test",
		receipt: "TEST-RECEIPT",
		createdAt: new Date().toISOString(),
		payment: "Cash",
		total: 350,
		lines: [{ name: "Test Item", qty: 1, price: 350, modifiers: [] }],
		locationId: ctx.session().locationId === "all" ? "" : ctx.session().locationId,
	});
}

export function downloadReceipt(ctx, sale) {
	if (!sale) return;
	downloadBlob(new Blob([receiptHtml(sale, docCtx(ctx, sale, { autoPrint: false }))], { type: "text/html" }), sale.receipt + "-receipt.html");
}

/** WhatsApp receipt. `targetWindow` = pre-opened window (avoids pop-up blockers). */
export async function shareReceiptWhatsApp(ctx, sale, targetWindow) {
	const d = ctx.data();
	const customer = sale && d.customers.find((c) => c.id === sale.customerId);
	const phone = whatsappPhone(customer?.phone);
	if (!sale || !phone) {
		log.warn("whatsapp receipt skipped: no customer mobile number", { receipt: sale?.receipt });
		if (targetWindow) targetWindow.close();
		return void (await ctx.ui.alert("This sale does not have a customer mobile number."));
	}
	const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(receiptMessage(sale, { settings: d.settings, customer }));
	log.info("whatsapp receipt opened", { receipt: sale.receipt });
	if (targetWindow) targetWindow.location.href = url;
	else window.open(url, "_blank");
}

// ----------------------------------------------------------- kitchen tickets
/** Legacy single destination (businesses without a station list): the KDS when it is on, else the KOT printer name. */
export const kitchenDestination = (settings, features = {}) => (features["checkout.kds"] ? KDS_DESTINATION : String(settings.kotPrinter || "").trim() || "Kitchen POS");

const stationDestination = (station, features) => (station.type === "kds" && features["checkout.kds"] ? KDS_DESTINATION : station.name);

async function queueTicket(ctx, order, lines, destination, station, systemPrints) {
	const toKds = destination === KDS_DESTINATION;
	const status = toKds ? "new" : destination === "Kitchen POS" ? "sent-to-kitchen-pos" : "sent-to-printer";
	const ticket = stamp(
		{
			id: newId("kot-"),
			orderId: order.id || "",
			orderNumber: order.orderNumber || order.receipt,
			reference: order.orderReference || "",
			destination,
			...(station ? { stationId: station.id, station: station.name } : {}),
			status,
			createdAt: new Date().toISOString(),
			lines: JSON.parse(JSON.stringify(lines || [])),
		},
		ctx.session(),
	);
	const kind = !toKds && station?.printer?.kind;
	if (kind === "usb") {
		try {
			await printKitchenTicket(station, ticket);
			ticket.status = "printed";
		} catch (error) {
			log.warn("USB kitchen printer failed; ticket kept in the Order Queue", error, { station: station.name, order: ticket.orderNumber });
			ticket.status = "printer-unavailable";
			ctx.ui.notice(station.name + ": " + error.message);
		}
	} else if (kind === "system") systemPrints.push(ticket);
	else if (destination !== "Kitchen POS" && !toKds) {
		const hook = kitchenPrinterHook();
		if (hook) {
			try {
				await Promise.resolve(hook(ticket));
			} catch (error) {
				log.warn("kitchen printer hook failed; falling back to Kitchen POS", error, { destination, order: ticket.orderNumber });
				ticket.status = "printer-unavailable";
				ctx.ui.notice("Kitchen printer " + destination + " unavailable. Ticket sent to the Kitchen POS instead.");
			}
		} else ticket.status = "queued-for-" + destination;
	}
	await ctx.store.write((tx) => tx.put(T.kitchenTickets, ticket));
	if (toKds) kdsLink.send(ticket, station?.id); // the station's own screen, over the local Wi-Fi; kept in its outbox until acknowledged
	log.info("kitchen ticket queued", { order: ticket.orderNumber, destination, status: ticket.status, items: ticket.lines.length });
	return destination;
}

/**
 * Queues the kitchen tickets of an order: one per kitchen station that has items on it (an item can go to several stations,
 * an item with none goes to the first). Stations printing through the system dialog share one print job (one page each).
 * Returns the destinations, e.g. ["Kitchen", "KDS"].
 */
export async function queueKitchenTicket(ctx, order) {
	const d = ctx.data();
	const features = ctx.features();
	const stations = kitchenStations(d.settings, features["checkout.kds"]);
	const systemPrints = [];
	if (!stations.length) return [await queueTicket(ctx, order, order.lines, "Kitchen POS", null, systemPrints)];
	const routes = routeKitchenLines(order.lines || [], d.products || [], stations);
	const list = routes.length ? routes : [{ station: stations[0], lines: order.lines || [] }];
	const sent = [];
	for (const r of list) sent.push(await queueTicket(ctx, order, r.lines, stationDestination(r.station, features), r.station, systemPrints));
	if (systemPrints.length) printHtmlInFrame(kotTicketsHtml(systemPrints, { settings: d.settings }), "Kitchen tickets " + (order.orderNumber || order.receipt || ""));
	return [...new Set(sent)];
}

/** Test ticket on one station's printer or screen (Stations page). */
export async function testStation(ctx, station) {
	const ticket = { id: newId("kot-test-"), orderNumber: "TEST", reference: "Test ticket", station: station.name, createdAt: new Date().toISOString(), lines: [{ name: "Test item", qty: 1, modifiers: [{ groupName: "Note", optionName: "printer test" }] }] };
	if (station.type === "kds") {
		kdsLink.send({ ...ticket, destination: KDS_DESTINATION, status: "new" }, station.id);
		return ctx.ui.notice(kdsLink.station(station.id).state().connected ? "Test ticket sent to " + station.name + "." : station.name + " is not connected. The test ticket is sent when it connects.");
	}
	const kind = station.printer?.kind;
	if (kind === "usb") {
		try {
			await printKitchenTicket(station, ticket);
			ctx.ui.notice("Test ticket printed on " + station.name + ".");
		} catch (error) {
			await ctx.ui.alert(error.message);
		}
	} else if (kind === "system") printHtmlInFrame(kotTicketsHtml([ticket], { settings: ctx.data().settings }), "Test kitchen ticket");
	else ctx.ui.notice(station.name + " has no printer. Choose one to print its tickets.");
}

const kdsNotice = () =>
	kdsLink.state().connected
		? "Ticket sent to the Kitchen Display."
		: kdsLink.state().paired
			? "Kitchen Display is not connected. The ticket is saved and will be sent when it reconnects."
			: "No Kitchen Display is paired yet. Pair one in Settings, KDS.";

export async function sendToKitchen(ctx, order) {
	const destinations = await queueKitchenTicket(ctx, order);
	const printers = destinations.filter((x) => x !== KDS_DESTINATION && x !== "Kitchen POS");
	const notes = [];
	if (destinations.includes("Kitchen POS")) notes.push("No kitchen printer is configured. Ticket sent to the Kitchen POS.");
	if (printers.length) notes.push("Kitchen ticket sent to " + printers.join(", ") + ".");
	if (destinations.includes(KDS_DESTINATION)) notes.push(kdsNotice());
	ctx.ui.notice(notes.join(" "));
}

export async function printKotForSale(ctx, sale) {
	if (!kitchenMode(ctx.data().settings)) return void (await ctx.ui.alert("Enable Restaurant or Café / Bakery mode to use kitchen tickets."));
	if (!sale) return void (await ctx.ui.alert("Order not found."));
	return sendToKitchen(ctx, sale);
}

export async function printTestKot(ctx) {
	const d = ctx.data();
	if (!kitchenMode(d.settings)) return void (await ctx.ui.alert("Enable Restaurant or Café / Bakery mode to test kitchen tickets."));
	const stations = kitchenStations(d.settings, ctx.features()["checkout.kds"]);
	ctx.ui.notice(
		!stations.length
			? "No kitchen printer is configured. Test ticket sent to the Kitchen POS."
			: "Test kitchen ticket queued for " + stations.map((s) => s.name).join(", ") + ".",
	);
}

/** Legacy pop-up KOT (used by the preview button in Settings when a window is wanted). */
export function openKotWindow(ctx, order, customerName) {
	return printHtmlInWindow(kotHtml(order, { settings: ctx.data().settings, customerName }));
}
