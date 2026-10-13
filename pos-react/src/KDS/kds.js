/**
 * Kitchen Display System (pure logic). A prep ticket (kitchen_tickets row, created by queueKitchenTicket) whose destination is "KDS"
 * moves new -> preparing -> ready -> done. Tickets that went to a printer or the old "Kitchen POS" are never shown here.
 */
export const KDS_DESTINATION = "KDS";

export const KDS_COLUMNS = [
	{ status: "new", label: "New", action: "Start" },
	{ status: "preparing", label: "Preparing", action: "Ready" },
	{ status: "ready", label: "Ready", action: "Done" },
];
const NEXT = { new: "preparing", preparing: "ready", ready: "done" };
const BACK = { preparing: "new", ready: "preparing", done: "ready" };

export const nextStatus = (status) => NEXT[status] || null;
export const prevStatus = (status) => BACK[status] || null;

/** Ticket status as the KDS sees it; the first status a ticket is queued with ("sent-to-kds") counts as new. */
export const kdsStatus = (t) => (NEXT[t.status] || t.status === "done" ? t.status : "new");

/** Open KDS tickets of a location, oldest first (the one waiting longest is on the left). */
export function kdsTickets(tickets, locationId) {
	return (tickets || [])
		.filter((t) => t.destination === KDS_DESTINATION && kdsStatus(t) !== "done" && (!t.locationId || !locationId || locationId === "all" || t.locationId === locationId))
		.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

/** Tickets finished in the last `limit` entries, newest first, for the recall list. */
export const recentDone = (tickets, limit = 10) =>
	(tickets || [])
		.filter((t) => t.destination === KDS_DESTINATION && t.status === "done")
		.sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
		.slice(0, limit);

export const ageMinutes = (t, now = Date.now()) => Math.max(0, Math.floor((now - new Date(t.createdAt).getTime()) / 60000) || 0);

/** ok under `warn` minutes, warn until `late`, then late. */
export const urgency = (minutes, warn = 8, late = 15) => (minutes >= late ? "late" : minutes >= warn ? "warn" : "ok");

export const ageLabel = (minutes) => (minutes < 1 ? "<1 min" : minutes + " min");
