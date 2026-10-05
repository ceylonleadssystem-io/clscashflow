/**
 * Order numbering (ORD-0001): parsing and formatting, picking the next sequence, a one-off migration of
 * legacy receipt numbers, and the open-order total.
 */
/** Order numbering (ORD-0001) and open-order helpers. */
import { discountAmount } from "./cart";

export const orderSequenceFrom = (value) => {
	const m = String(value || "").match(/^ORD-(\d+)$/);
	return m ? +m[1] : 0;
};

export const isSequential = (value) => /^ORD-\d{4,}$/.test(String(value || ""));

export const formatOrderNumber = (n) => "ORD-" + String(n).padStart(4, "0");

/** Next sequence for the current data (never reuses a number). */
export function nextSequence(meta, sales, openOrders) {
	const used = [
		...sales.flatMap((s) => [s.orderNumber, s.receipt]),
		...openOrders.map((o) => o.orderNumber),
	].reduce((max, v) => Math.max(max, orderSequenceFrom(v)), 0);
	const saved = Math.max(1, Math.floor(+meta.nextOrderSequence || 1));
	return Math.max(saved, used + 1);
}

const orderTime = (item) => {
	const t = Date.parse(item.createdAt || item.openedAt || item.date || "");
	return Number.isFinite(t) ? t : 0;
};

/**
 * One-off migration: legacy random receipt numbers -> ORD-0001..N.
 * Returns { sales, openOrders, nextOrderSequence, changed }.
 */
export function migrateOrderNumbers(sales, openOrders, meta) {
	const all = [...sales, ...openOrders];
	if (meta.orderSequenceVersion === 2 && all.every((i) => isSequential(i.orderNumber || i.receipt)))
		return { sales, openOrders, changed: false };
	const records = [
		...sales.map((item) => ({ item: { ...item }, kind: "sale" })),
		...openOrders.map((item) => ({ item: { ...item }, kind: "order" })),
	].sort((a, b) => orderTime(a.item) - orderTime(b.item));
	let sequence = 1;
	const used = new Set();
	records.forEach((r) => {
		const current = r.item.orderNumber || r.item.receipt;
		if (isSequential(current) && !used.has(current)) {
			used.add(current);
			sequence = Math.max(sequence, Number(current.slice(4)) + 1);
			return;
		}
		while (used.has(formatOrderNumber(sequence))) sequence++;
		const number = formatOrderNumber(sequence++);
		r.item.orderNumber = number;
		if (r.kind === "sale") r.item.receipt = number;
		used.add(number);
	});
	const newSales = records.filter((r) => r.kind === "sale").map((r) => r.item);
	const newOrders = records.filter((r) => r.kind === "order").map((r) => r.item);
	newSales.forEach((sale) => {
		const order = newOrders.find((o) => o.id === sale.openOrderId);
		if (order) {
			sale.orderNumber = order.orderNumber;
			sale.receipt = order.orderNumber;
		}
	});
	// keep original list order
	const byId = (list) => new Map(list.map((x) => [x.id, x]));
	const s = byId(newSales);
	const o = byId(newOrders);
	return {
		sales: sales.map((x) => s.get(x.id) || x),
		openOrders: openOrders.map((x) => o.get(x.id) || x),
		nextOrderSequence: Math.max(sequence, 1),
		changed: true,
	};
}

export function orderTotal(order) {
	const subtotal = (order.lines || []).reduce((a, l) => a + l.price * l.qty, 0);
	return Math.max(0, subtotal - (order.discount?.amount || 0));
}

/**
 * Merges open order `source` into `target`: identical lines (same key) add up quantities, the target keeps its
 * reference, customer and discount (falling back to the source's when it has none).
 * Returns { target, source } ready to save; the source is marked merged.
 */
export function mergeOrders(target, source, now = new Date().toISOString()) {
	const lines = (target.lines || []).map((l) => ({ ...l }));
	for (const l of source.lines || []) {
		const same = lines.find((x) => x.key && x.key === l.key);
		if (same) same.qty += l.qty;
		else lines.push({ ...l });
	}
	const base = +target.discount?.value > 0 ? target.discount : +source.discount?.value > 0 ? source.discount : target.discount || { type: "percent", value: 0 };
	const discount = { type: base.type, value: base.value, amount: discountAmount(lines, base) };
	return {
		target: { ...target, lines, discount, customerId: target.customerId || source.customerId || "", updatedAt: now },
		source: { ...source, status: "merged", mergedInto: target.id, closedAt: now },
	};
}
