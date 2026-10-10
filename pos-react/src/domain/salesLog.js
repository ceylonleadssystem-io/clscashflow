/**
 * Sales history tabs (pure): rows for "Voids & deletes" and "Refunds", the manager approval lookup used when a
 * cashier refunds or voids, and the audit text that keeps a permanently deleted sale readable afterwards.
 */
import { userName } from "./names";

/** Roles whose PIN may approve a refund or void started by someone else. */
export const APPROVER_ROLES = ["owner", "manager", "admin"];

/** The active owner / manager / admin whose PIN this is, or null. */
export function findApprover(users, pin) {
	const p = String(pin || "").trim();
	return p ? (users || []).find((u) => u.active !== false && u.pin && u.pin === p && APPROVER_ROLES.includes(u.role)) || null : null;
}

const SEP = " · ";
export const DELETED_ACTION = "sale-permanently-deleted";

/** Audit text for a deleted sale: receipt, status, payment, total, then the reason (old entries only hold the first two). */
export const deletedDetails = ({ receipt, status, payment, total, reason }) => [receipt, status, payment || "", Math.round((+total || 0) * 100) / 100, (reason || "").replaceAll("\n", " ")].join(SEP);

export function parseDeletedDetails(details) {
	const [receipt = "", status = "", payment = "", total = "", ...reason] = String(details || "").split(SEP);
	return { receipt, status, payment, total: total === "" ? null : +total, reason: reason.join(SEP) };
}

const day = (iso) => String(iso || "").slice(0, 10);
const inLocation = (x, locationId) => !locationId || locationId === "all" || !x.locationId || x.locationId === locationId;

/** Voided sales, cleared carts, voided open checks and permanently deleted sales, newest first. */
export function voidRows({ sales, voidOrders = [], openOrders = [], audit = [], users = [], locationId = "" }) {
	const rows = [];
	sales.filter((s) => s.status === "voided").forEach((s) =>
		rows.push({ key: "v" + s.id, date: day(s.voidAt || s.date), at: s.voidAt || s.date || "", kind: "Voided", receipt: s.receipt, payment: s.payment, reason: s.voidReason || "", total: s.voidAmount ?? s.originalTotal ?? 0, by: userName(users, s.voidBy, "—") }),
	);
	openOrders.filter((o) => o.status === "voided" && inLocation(o, locationId)).forEach((o) =>
		rows.push({ key: "o" + o.id, date: day(o.voidedAt), at: o.voidedAt || "", kind: "Voided check", receipt: o.orderNumber || o.orderReference || "Open check", payment: "—", reason: o.voidReason || "", total: (o.lines || []).reduce((a, l) => a + (+l.price || 0) * (+l.qty || 0), 0), by: userName(users, o.voidedBy, "—") }),
	);
	voidOrders.filter((v) => inLocation(v, locationId)).forEach((v) =>
		rows.push({ key: "c" + v.id, date: day(v.at), at: v.at || "", kind: "Cart cleared", receipt: "—", payment: "—", reason: "Cart cleared before payment", total: +v.total || 0, by: userName(users, v.staffId, "—") }),
	);
	audit.filter((a) => a.action === DELETED_ACTION && inLocation(a, locationId)).forEach((a) => {
		const d = parseDeletedDetails(a.details);
		rows.push({ key: "d" + a.id, date: day(a.at), at: a.at || "", kind: "Deleted", receipt: d.receipt, payment: d.payment || "—", reason: d.reason || "—", total: d.total, by: userName(users, a.userId, "—") });
	});
	return rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/** One row per refund recorded on a sale (full and partial), newest first. */
export function refundRows(sales, users = []) {
	return sales
		.flatMap((s) => (s.refunds || []).map((r) => ({ key: s.id + ":" + r.id, date: day(r.at), at: r.at || "", receipt: s.receipt, payment: s.payment, authorizedBy: userName(users, r.authorizedBy || r.by, "—"), reason: r.reason || "", total: +r.amount || 0 })))
		.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
