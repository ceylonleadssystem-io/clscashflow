/**
 * Front of house view of the kitchen's progress (pure logic). A Kitchen Display marks single items ready (`readyLines` on the prep ticket);
 * each station has its own ticket, so an order with food from the kitchen and the bar is tracked per station. `servedLines` are the ready
 * items a waiter already collected.
 */
import { KDS_DESTINATION, prepLines, readyIndexes, toCollect } from "../KDS/kds";

const kdsTicketsOf = (tickets) => (tickets || []).filter((t) => t.destination === KDS_DESTINATION);

/** The items that became ready between a ticket's old state and the new list, for the alert: "Order 12 · Table 5 · Kitchen: 2 × Burger". */
export function readyAlert(ticket, nextReady) {
	const before = new Set(readyIndexes(ticket));
	const fresh = prepLines(ticket).filter(({ index }) => nextReady.includes(index) && !before.has(index));
	if (!fresh.length) return "";
	const where = [ticket.reference || ticket.orderNumber, ticket.station].filter(Boolean).join(" · ");
	return where + " ready to collect: " + fresh.map(({ line }) => line.qty + " × " + line.name).join(", ");
}

/** Per station progress of one order: [{ id, station, ready, total, items: [{ index, name, qty, ready, served }] }]. */
export function orderProgress(tickets, orderId) {
	return kdsTicketsOf(tickets)
		.filter((t) => t.orderId === orderId && t.status !== "done")
		.map((t) => {
			const ready = new Set(readyIndexes(t));
			const served = new Set(t.servedLines || []);
			const items = prepLines(t).map(({ line, index }) => ({ index, name: line.name, qty: line.qty, ready: ready.has(index), served: served.has(index) }));
			return { id: t.id, station: t.station || "Kitchen", ready: items.filter((i) => i.ready).length, total: items.length, items };
		});
}

/** Everything ready and not yet collected, one entry per ticket: [{ ticket, items }]. Oldest ticket first. */
export function readyToCollect(tickets) {
	return kdsTicketsOf(tickets)
		.map((t) => {
			const left = new Set(toCollect(t));
			return { ticket: t, items: prepLines(t).filter(({ index }) => left.has(index)) };
		})
		.filter((r) => r.items.length)
		.sort((a, b) => String(a.ticket.createdAt).localeCompare(String(b.ticket.createdAt)));
}

/** Short sound for the waiter; browsers may block it until the page has been touched, the notice still shows. */
export function readyBeep() {
	try {
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const osc = ctx.createOscillator();
		osc.connect(ctx.destination);
		osc.frequency.value = 660;
		osc.start();
		osc.stop(ctx.currentTime + 0.3);
		osc.onended = () => ctx.close();
	} catch {
		/* no audio */
	}
}
