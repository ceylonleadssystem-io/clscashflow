import { nowIso } from "./format";

/** Sale status helpers, refund maths and cash-drawer reconciliation. */

export const ACTIVE_STATUSES = ["completed", "partially_refunded"];
export const statusOf = (sale) => sale.status || "completed";
export const isActiveSale = (sale) => ACTIVE_STATUSES.includes(statusOf(sale));

export const realLines = (sale) => (sale.lines || []).filter((l) => !l.isDiscount);

export const saleItemCount = (sale) =>
	realLines(sale).reduce((a, l) => a + (+l.qty || 0), 0);

// --------------------------------------------------------------- refunds ----
export function refundableLines(sale) {
	const refunded = {};
	(sale.refunds || []).forEach((r) =>
		(r.lines || []).forEach((l) => (refunded[l.lineIndex] = (refunded[l.lineIndex] || 0) + l.qty)),
	);
	return (sale.lines || [])
		.map((line, lineIndex) => ({
			line,
			lineIndex,
			available: Math.max(0, line.qty - (refunded[lineIndex] || 0)),
		}))
		.filter((x) => !x.line.isDiscount && x.available > 0);
}

/** Ratio between what the customer paid and the gross price of the lines. */
export function refundRate(sale) {
	const gross = (sale.lines || [])
		.filter((l) => !l.isDiscount)
		.reduce((a, l) => a + l.price * l.qty, 0);
	const original =
		sale.originalTotal ?? (sale.lines || []).reduce((a, l) => a + l.price * l.qty, 0);
	return gross ? original / gross : 1;
}

/** Lines picked for a refund: `choices` = { [lineIndex]: qty } (partial) or all (full). */
export function selectedRefundLines(sale, refundType, choices = {}) {
	const rows = refundableLines(sale);
	if (refundType === "full")
		return rows.map((x) => ({
			lineIndex: x.lineIndex,
			productId: x.line.productId,
			name: x.line.name,
			qty: x.available,
			unitPrice: x.line.price,
		}));
	return rows
		.filter((x) => choices[x.lineIndex] != null)
		.map((x) => ({
			lineIndex: x.lineIndex,
			productId: x.line.productId,
			name: x.line.name,
			qty: Math.min(x.available, Math.max(1, +choices[x.lineIndex] || 1)),
			unitPrice: x.line.price,
		}));
}

export function calculateRefundAmount(sale, refundType, lines) {
	if (refundType === "full") return +sale.total || 0;
	return Math.min(
		+sale.total || 0,
		lines.reduce((a, l) => a + l.unitPrice * l.qty, 0) * refundRate(sale),
	);
}

/**
 * Applies a refund/void to `sale` (pure: returns the updated sale).
 * `restoredLines` tells the caller which quantities went back to stock.
 */
export function applyReversal(sale, { type, reason, userId, cashShiftId, refundType, refundLines }) {
	const s = { ...sale, refunds: sale.refunds ? sale.refunds.map((r) => ({ ...r })) : undefined };
	const isSplit = s.payment === "Split";
	const splitCash = (s.payments || []).some((p) => p.method === "Cash");
	const cashRelevant = s.payment === "Cash" || (isSplit && splitCash);
	let restoredLines;
	if (type === "void") {
		s.originalTotal ??= s.total;
		s.originalCost ??= s.cost;
		s.status = "voided";
		s.voidAt = nowIso();
		s.voidReason = reason;
		s.voidBy = userId;
		s.voidAmount = s.total;
		if (s.payment === "Cash" && cashShiftId) s.voidCashShiftId = cashShiftId;
		restoredLines = refundableLines(s).map((x) => ({ lineIndex: x.lineIndex, qty: x.available }));
		if (isSplit && splitCash) {
			s.voidCashAmount = (s.payments || [])
				.filter((p) => p.method === "Cash")
				.reduce((a, p) => a + p.amount, 0);
			if (cashShiftId) s.voidCashShiftId = cashShiftId;
		}
		s.total = 0;
		s.cost = 0;
		s.profit = 0;
	} else {
		const amount = calculateRefundAmount(s, refundType, refundLines);
		s.originalTotal ??= s.total;
		s.originalCost ??= s.cost;
		s.refunds = Array.isArray(s.refunds) ? s.refunds : [];
		const costRefund = refundLines.reduce(
			(a, r) => a + (+s.lines[r.lineIndex].cost || 0) * r.qty,
			0,
		);
		const total = s.originalTotal || (s.payments || []).reduce((a, p) => a + p.amount, 0);
		const record = {
			id: "rf" + Date.now(),
			at: nowIso(),
			lines: refundLines,
			amount,
			reason,
			by: userId,
			cashShiftId: s.payment === "Cash" ? cashShiftId || "" : "",
		};
		if (isSplit) {
			record.paymentBreakdown = (s.payments || []).map((p) => ({
				method: p.method,
				amount: total ? (amount * p.amount) / total : 0,
			}));
			if (splitCash && cashShiftId) record.cashShiftId = cashShiftId;
		}
		s.refunds.push(record);
		s.total = Math.max(0, s.total - amount);
		s.cost = Math.max(0, (+s.cost || 0) - costRefund);
		s.profit = s.total - s.cost;
		restoredLines = refundLines.map((r) => ({ lineIndex: r.lineIndex, qty: r.qty }));
		s.status = s.total < 0.01 || !refundableLines(s).length ? "refunded" : "partially_refunded";
		s.refundAt = nowIso();
		s.refundReason = reason;
		s.refundBy = userId;
	}
	return { sale: s, restoredLines, cashRelevant };
}

// ---------------------------------------------------------- cash drawer -----
/** Expected cash in the drawer for a shift (final legacy formula). */
export function expectedCash(shift, sales) {
	const cashSales = sales
		.filter((s) => s.cashShiftId === shift.id)
		.reduce(
			(a, s) =>
				a +
				(s.payment === "Split"
					? (s.payments || []).filter((p) => p.method === "Cash").reduce((x, p) => x + p.amount, 0)
					: s.payment === "Cash"
						? (s.originalTotal ?? s.total)
						: 0),
			0,
		);
	const refundCash = sales
		.flatMap((s) =>
			(s.refunds || [])
				.filter((r) => r.cashShiftId === shift.id)
				.map((r) =>
					r.paymentBreakdown
						? r.paymentBreakdown.find((p) => p.method === "Cash")?.amount || 0
						: s.payment === "Cash"
							? r.amount
							: 0,
				),
		)
		.reduce((a, x) => a + x, 0);
	const voidCash = sales
		.filter((s) => s.voidCashShiftId === shift.id)
		.reduce(
			(a, s) =>
				a +
				(s.voidCashAmount ||
					(s.payment === "Cash" ? s.voidAmount || s.originalTotal || 0 : 0)),
			0,
		);
	return (+shift.openingCash || 0) + cashSales - refundCash - voidCash;
}

export const currentCashShift = (shifts, userId) =>
	shifts.find((s) => s.userId === userId && s.status === "open");

export const activeTimeEntry = (entries, userId) =>
	entries.find((e) => e.userId === userId && !e.clockOut);

export const isOnBreak = (entry) =>
	!!(entry && entry.breaks?.length && !entry.breaks[entry.breaks.length - 1].end);

// ----------------------------------------------------------- sale build -----
export function makeDiscountLine(amount) {
	return {
		id: "discount",
		productId: "",
		key: "discount-" + Date.now(),
		name: "Order Discount",
		code: "DISC",
		category: "Discount",
		cost: 0,
		price: -amount,
		qty: 1,
		isDiscount: true,
		recipe: [],
		modifiers: [],
	};
}

export function makeServiceLine(amount, rate) {
	return {
		id: "service-charge",
		productId: "",
		key: "service-charge-" + Date.now(),
		name: "Service Charge (" + rate + "%)",
		code: "SERVICE",
		category: "Service Charge",
		cost: 0,
		price: amount,
		qty: 1,
		isServiceCharge: true,
		recipe: [],
		modifiers: [],
	};
}

export function receiptDate(s) {
	const d = new Date(s.createdAt || s.date || Date.now());
	return d.toLocaleString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}
