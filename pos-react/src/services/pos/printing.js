import { kitchenPrinterHook } from "../platform.service";
import { T } from "../../db/tables";
import { downloadBlob, whatsappPhone } from "../../domain/format";
import { kotHtml, receiptHtml, receiptMessage } from "../printing/documents";
import { printHtmlInFrame, printHtmlInWindow } from "../printing/printDocument";
import { receiptPrinter } from "../printing/receiptPrinter";
import { createLogger } from "../../utils/logger";
import { kitchenMode, newId, stamp } from "./common";

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
export const kitchenDestination = (settings) => String(settings.kotPrinter || "").trim() || "Kitchen POS";

/** Queues a kitchen ticket (and hands it to a printer hook when one is configured). */
export async function queueKitchenTicket(ctx, order) {
	const d = ctx.data();
	const destination = kitchenDestination(d.settings);
	let status = destination === "Kitchen POS" ? "sent-to-kitchen-pos" : "sent-to-printer";
	const ticket = stamp(
		{
			id: newId("kot-"),
			orderId: order.id || "",
			orderNumber: order.orderNumber || order.receipt,
			reference: order.orderReference || "",
			destination,
			status,
			createdAt: new Date().toISOString(),
			lines: JSON.parse(JSON.stringify(order.lines || [])),
		},
		ctx.session(),
	);
	const hook = kitchenPrinterHook();
	if (destination !== "Kitchen POS") {
		if (hook) {
			try {
				await Promise.resolve(hook(ticket));
			} catch (error) {
				log.warn("kitchen printer hook failed; falling back to Kitchen POS", error, { destination, order: ticket.orderNumber });
				ticket.status = "printer-unavailable";
				ctx.ui.notice("Kitchen printer unavailable. Ticket sent to the Kitchen POS instead.");
			}
		} else ticket.status = "queued-for-" + destination;
	}
	await ctx.store.write((tx) => tx.put(T.kitchenTickets, ticket));
	log.info("kitchen ticket queued", { order: ticket.orderNumber, destination, status: ticket.status, items: ticket.lines.length });
	return destination;
}

export async function sendToKitchen(ctx, order) {
	const destination = await queueKitchenTicket(ctx, order);
	ctx.ui.notice(
		destination === "Kitchen POS"
			? "No kitchen printer is configured. Ticket sent to the Kitchen POS."
			: "Kitchen ticket sent to " + destination + ".",
	);
}

export async function printKotForSale(ctx, sale) {
	if (!kitchenMode(ctx.data().settings)) return void (await ctx.ui.alert("Enable Restaurant or Café / Bakery mode to use kitchen tickets."));
	if (!sale) return void (await ctx.ui.alert("Order not found."));
	return sendToKitchen(ctx, sale);
}

export async function printTestKot(ctx) {
	const d = ctx.data();
	if (!kitchenMode(d.settings)) return void (await ctx.ui.alert("Enable Restaurant or Café / Bakery mode to test kitchen tickets."));
	const destination = kitchenDestination(d.settings);
	ctx.ui.notice(
		destination === "Kitchen POS"
			? "No kitchen printer is configured. Test ticket sent to the Kitchen POS."
			: "Test kitchen ticket queued for " + destination + ".",
	);
}

/** Legacy pop-up KOT (used by the preview button in Settings when a window is wanted). */
export function openKotWindow(ctx, order, customerName) {
	return printHtmlInWindow(kotHtml(order, { settings: ctx.data().settings, customerName }));
}
