/**
 * Deeper analytics for the administration portal (pure). `insightRollup` turns one business's data into a small summary that travels with the account
 * list (the server builds the same shape in netlify/functions/pos-admin-data.js; tests/adminInsightsParity.test.js keeps the two equal). The other
 * functions read those summaries: who may be leaving, how far new businesses got, when everyone trades, how people pay, and what looks wrong.
 * Windows are the last 30 days and the 30 before; days and hours are on the business's clock.
 */
import { DEFAULT_TZ, localParts } from "./adminAnalytics";

const DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const num = (v) => +v || 0;
const r1 = (n) => Math.round(n * 10) / 10;
const ACTIVE = ["completed", "partially_refunded"];
const STANDARD_PAYMENTS = ["Cash", "Card", "Bank Transfer", "Online Payment", "Split"];
export const weekdayOf = (day) => (new Date(day + "T00:00:00Z").getUTCDay() + 6) % 7; // Monday = 0
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The summary of one business: `payload` has sales, cashShifts and kitchenTickets. */
export function insightRollup(payload = {}, { now = new Date(), tz = DEFAULT_TZ } = {}) {
	const sales = Array.isArray(payload.sales) ? payload.sales : [];
	const today = iso(now);
	const start30 = iso(+new Date(today) - 29 * DAY);
	const start60 = iso(+new Date(today) - 59 * DAY);
	const out = {
		saleCount: 0, firstSaleAt: "", salesDays30: 0,
		prev30: { orders: 0, sales: 0 },
		heat: Array(168).fill(0),
		items30: 0, gross30: 0, records30: 0,
		payments: {}, channels: {},
		refunds: { count: 0, amount: 0 }, voids: { count: 0, amount: 0 }, discounts: { count: 0, amount: 0 },
		cash: { shifts: 0, net: 0, abs: 0 },
		kitchen: { tickets: 0, avgMinutes: 0, medianMinutes: 0 },
	};
	const days = new Set();
	for (const s of sales) {
		const at = String(s.createdAt || s.date || "");
		const status = s.status || "completed";
		const active = ACTIVE.includes(status);
		if (active) {
			out.saleCount += 1;
			if (at && (!out.firstSaleAt || at < out.firstSaleAt)) out.firstSaleAt = at;
		}
		const d = at ? localParts(at, tz) : null;
		if (!d || d.day < start60) continue;
		if (d.day < start30) {
			if (active) (out.prev30.orders += 1), (out.prev30.sales += num(s.total));
			continue;
		}
		out.records30 += 1;
		if (status === "voided") (out.voids.count += 1), (out.voids.amount += num(s.voidAmount ?? s.originalTotal ?? s.total));
		for (const r of s.refunds || []) (out.refunds.count += 1), (out.refunds.amount += num(r.amount));
		if (!active) continue;
		days.add(d.day);
		out.heat[weekdayOf(d.day) * 24 + d.hour] += 1;
		let items = 0;
		let discount = 0;
		for (const l of s.lines || []) {
			const v = num(l.price) * num(l.qty);
			if (l.isDiscount) discount += -v;
			else if (!l.isServiceCharge) (items += num(l.qty)), (out.gross30 += v);
		}
		out.items30 += items;
		if (discount > 0) (out.discounts.count += 1), (out.discounts.amount += discount);
		const pay = s.payment || "Other";
		const p = (out.payments[pay] ||= { orders: 0, sales: 0 });
		(p.orders += 1), (p.sales += num(s.total));
		const ch = s.orderChannel || "Other";
		const c = (out.channels[ch] ||= { orders: 0, sales: 0 });
		(c.orders += 1), (c.sales += num(s.total));
	}
	out.salesDays30 = days.size;
	for (const sh of Array.isArray(payload.cashShifts) ? payload.cashShifts : []) {
		if (sh.status !== "closed" || !sh.closedAt || localParts(sh.closedAt, tz).day < start30) continue;
		out.cash.shifts += 1;
		out.cash.net += num(sh.variance);
		out.cash.abs += Math.abs(num(sh.variance));
	}
	const mins = [];
	for (const t of Array.isArray(payload.kitchenTickets) ? payload.kitchenTickets : []) {
		if (t.destination !== "KDS" || !["ready", "done"].includes(t.status) || !t.createdAt || !t.updatedAt) continue;
		if (localParts(t.createdAt, tz).day < start30) continue;
		const m = (+new Date(t.updatedAt) - +new Date(t.createdAt)) / 60000;
		if (m > 0 && m < 240) mins.push(m);
	}
	if (mins.length) {
		mins.sort((a, b) => a - b);
		out.kitchen = { tickets: mins.length, avgMinutes: r1(mins.reduce((a, b) => a + b, 0) / mins.length), medianMinutes: r1(mins[Math.floor(mins.length / 2)]) };
	}
	for (const k of ["amount"]) {
		out.refunds[k] = Math.round(out.refunds[k]);
		out.voids[k] = Math.round(out.voids[k]);
		out.discounts[k] = Math.round(out.discounts[k]);
	}
	out.gross30 = Math.round(out.gross30);
	out.cash.net = Math.round(out.cash.net);
	out.cash.abs = Math.round(out.cash.abs);
	// keep the list small: the eight biggest payment methods and order types
	const top = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1].sales - a[1].sales).slice(0, 8).map(([k, v]) => [k, { orders: v.orders, sales: Math.round(v.sales) }]));
	out.payments = top(out.payments);
	out.channels = top(out.channels);
	out.prev30.sales = Math.round(out.prev30.sales);
	return out;
}

// ------------------------------------------------------------------------------------------- reading ----
const real = (a) => a.analytics && a.status !== "test";
/** Percent change from `before` to `now` (null when there was nothing before). */
export const change = (now, before) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

/** Businesses that look like they are drifting away, worst first: [{ id, name, status, severity, reasons }]. */
export function churnRisk(accounts = [], now = new Date()) {
	const out = [];
	for (const a of accounts.filter((x) => real(x) && !x.paused && x.analytics.insights)) {
		const an = a.analytics;
		const i = an.insights;
		const last = an.lastSaleAt ? Math.floor((+now - +new Date(an.lastSaleAt)) / DAY) : null;
		const reasons = [];
		let score = 0;
		if (i.saleCount > 0 && last != null && last >= 14) (reasons.push(`No sale for ${last} days`), (score += last >= 30 ? 3 : 2));
		else if (i.saleCount > 0 && last != null && last >= 7) (reasons.push(`No sale for ${last} days`), (score += 1));
		const drop = change(an.sales30, i.prev30.sales);
		if (drop != null && drop <= -50 && last != null && last < 14) (reasons.push(`Sales down ${-drop}% on the previous 30 days`), (score += 2));
		else if (drop != null && drop <= -30 && last != null && last < 14) (reasons.push(`Sales down ${-drop}% on the previous 30 days`), (score += 1));
		if (an.sales30 > 0 && an.sales7 < ((an.sales30 / 30) * 7) * 0.3 && last != null && last < 7) (reasons.push("This week is far below their usual"), (score += 1));
		if (i.saleCount === 0 && a.products > 0) (reasons.push("Menu set up but no sale yet"), (score += 1));
		if (reasons.length) out.push({ id: a.id, name: a.business || a.email, status: a.status, severity: score >= 3 ? "high" : score === 2 ? "medium" : "low", score, reasons });
	}
	return out.sort((x, y) => y.score - x.score || x.name.localeCompare(y.name));
}

export const FUNNEL = [
	{ key: "signedUp", label: "Signed up", test: () => true },
	{ key: "menu", label: "Added a menu", test: (a) => a.products > 0 },
	{ key: "firstSale", label: "Made a first sale", test: (a) => a.analytics.insights.saleCount >= 1 },
	{ key: "ten", label: "Made 10 sales", test: (a) => a.analytics.insights.saleCount >= 10 },
	{ key: "regular", label: "Sold on 7 different days this month", test: (a) => a.analytics.insights.salesDays30 >= 7 },
];
/** How far businesses got: [{ key, label, count, ofPrevious, ofAll, stuck: [names who reached the previous step but not this one] }]. */
export function activationFunnel(accounts = []) {
	const rows = accounts.filter((a) => real(a) && a.analytics.insights);
	let prev = rows;
	return FUNNEL.map((s, i) => {
		const reached = rows.filter((a) => FUNNEL.slice(0, i + 1).every((x) => x.test(a)));
		const row = { key: s.key, label: s.label, count: reached.length, ofPrevious: i === 0 ? 100 : prev.length ? Math.round((reached.length / prev.length) * 100) : 0, ofAll: rows.length ? Math.round((reached.length / rows.length) * 100) : 0, stuck: prev.filter((a) => !reached.includes(a)).map((a) => a.business || a.email) };
		prev = reached;
		return row;
	});
}

/** Every business's weekday-by-hour order counts added up: { cells: [7][24], max, busiest, quietest }, plus the quietest 3 hour window. */
export function heatmap(accounts = []) {
	const cells = Array.from({ length: 7 }, () => Array(24).fill(0));
	for (const a of accounts.filter((x) => x.analytics?.insights?.heat)) a.analytics.insights.heat.forEach((n, i) => (cells[Math.floor(i / 24)][i % 24] += num(n)));
	return summarizeHeat(cells);
}
export function summarizeHeat(cells) {
	let max = 0;
	let busiest = null;
	cells.forEach((row, d) => row.forEach((n, h) => n > max && ((max = n), (busiest = { day: d, hour: h, orders: n }))));
	// the quietest three hours in a row between 6 am and midnight, across all days: when a deploy or an outage hurts least
	const byHour = Array.from({ length: 24 }, (_, h) => cells.reduce((a, row) => a + row[h], 0));
	let quietest = null;
	for (let h = 6; h <= 21; h++) {
		const sum = byHour[h] + byHour[h + 1] + byHour[h + 2];
		if (!quietest || sum < quietest.orders) quietest = { from: h, to: h + 3, orders: sum };
	}
	return { cells, max, busiest, quietest: byHour.some(Boolean) ? quietest : null, total: byHour.reduce((a, b) => a + b, 0) };
}

/** Payment methods as four groups: cash, card, bank or online, and 3rd party (any other name). */
export function paymentGroup(name) {
	if (name === "Cash") return "Cash";
	if (name === "Card") return "Card";
	if (name === "Bank Transfer" || name === "Online Payment") return "Bank or online";
	return STANDARD_PAYMENTS.includes(name) ? "Other" : "3rd party";
}
export const TYPE_LABELS = { restaurant: "Restaurant", cafe: "Café / Bakery", retail: "Retail", hardware: "Hardware", grocery: "Grocery", salon: "Salon", pharmacy: "Pharmacy", services: "Services", other: "Other" };

/** By business type: businesses, orders, average order, items per order, and the share of sales by payment group and by order type. */
export function byBusinessType(accounts = []) {
	const types = new Map();
	for (const a of accounts.filter((x) => real(x) && x.analytics.insights)) {
		const t = a.businessType || "other";
		const g = types.get(t) || { type: t, label: TYPE_LABELS[t] || t, businesses: 0, orders: 0, sales: 0, items: 0, pay: {}, channels: {} };
		g.businesses += 1;
		g.orders += a.analytics.orders30;
		g.sales += a.analytics.sales30;
		g.items += a.analytics.insights.items30;
		for (const [k, v] of Object.entries(a.analytics.insights.payments)) g.pay[paymentGroup(k)] = (g.pay[paymentGroup(k)] || 0) + v.sales;
		for (const [k, v] of Object.entries(a.analytics.insights.channels)) g.channels[k] = (g.channels[k] || 0) + v.sales;
		types.set(t, g);
	}
	return [...types.values()].map((g) => ({ ...g, average: g.orders ? g.sales / g.orders : 0, itemsPerOrder: g.orders ? g.items / g.orders : 0 })).sort((a, b) => b.sales - a.sales);
}
/** All businesses together: sales by payment group and by order type, as [{ name, sales, share }]. */
export function overallMix(accounts = []) {
	const pay = {};
	const ch = {};
	for (const a of accounts.filter((x) => real(x) && x.analytics.insights)) {
		for (const [k, v] of Object.entries(a.analytics.insights.payments)) pay[paymentGroup(k)] = (pay[paymentGroup(k)] || 0) + v.sales;
		for (const [k, v] of Object.entries(a.analytics.insights.channels)) ch[k] = (ch[k] || 0) + v.sales;
	}
	const rows = (o) => {
		const total = Object.values(o).reduce((a, b) => a + b, 0);
		return Object.entries(o).map(([name, sales]) => ({ name, sales, share: total ? Math.round((sales / total) * 100) : 0 })).sort((a, b) => b.sales - a.sales);
	};
	return { payments: rows(pay), channels: rows(ch) };
}

/** "Your average order is 12% below similar cafés": the business against the other businesses of its type (null when it is the only one). */
export function benchmark(account, accounts = []) {
	const mine = account.analytics;
	if (!mine?.orders30) return null;
	const peers = accounts.filter((a) => a.id !== account.id && real(a) && (a.businessType || "other") === (account.businessType || "other") && a.analytics.orders30 > 0);
	if (!peers.length) return null;
	const sales = peers.reduce((a, p) => a + p.analytics.sales30, 0);
	const orders = peers.reduce((a, p) => a + p.analytics.orders30, 0);
	const items = peers.reduce((a, p) => a + p.analytics.insights.items30, 0);
	const avg = mine.sales30 / mine.orders30;
	const peerAvg = sales / orders;
	return { peers: peers.length, type: account.businessType || "other", average: avg, peerAverage: peerAvg, averageDiff: change(avg, peerAvg), itemsPerOrder: mine.insights.items30 / mine.orders30, peerItemsPerOrder: items / orders };
}

/** Thresholds for the loss-prevention view (a share of the business's own figures). */
export const LIMITS = { refundRate: 5, voidRate: 3, discountRate: 15, varianceRate: 1 };
/** Refunds, voids, discounts and cash variance per business, with what looks high: [{ id, name, sales, refundRate, ..., flags }]. */
export function lossWatch(accounts = []) {
	const pct = (a, b) => (b > 0 ? r1((a / b) * 100) : 0);
	return accounts
		.filter((a) => real(a) && a.analytics.insights && (a.analytics.orders30 > 0 || a.analytics.insights.records30 > 0))
		.map((a) => {
			const i = a.analytics.insights;
			const row = {
				id: a.id, name: a.business || a.email, sales: a.analytics.sales30,
				refunds: i.refunds, voids: i.voids, discounts: i.discounts, cash: i.cash,
				refundRate: pct(i.refunds.amount, a.analytics.sales30 + i.refunds.amount),
				voidRate: pct(i.voids.count, i.records30),
				discountRate: pct(i.discounts.amount, i.gross30),
				varianceRate: pct(i.cash.abs, a.analytics.sales30),
			};
			row.flags = [row.refundRate > LIMITS.refundRate && "Refunds", row.voidRate > LIMITS.voidRate && "Voids", row.discountRate > LIMITS.discountRate && "Discounts", row.varianceRate > LIMITS.varianceRate && "Cash variance"].filter(Boolean);
			return row;
		})
		.sort((a, b) => b.flags.length - a.flags.length || b.refundRate + b.voidRate + b.discountRate - (a.refundRate + a.voidRate + a.discountRate));
}

/** Kitchen speed per business that uses the Kitchen Display, and overall (weighted by tickets). */
export function kitchenSpeed(accounts = []) {
	const rows = accounts.filter((a) => real(a) && a.analytics.insights?.kitchen?.tickets > 0).map((a) => ({ id: a.id, name: a.business || a.email, ...a.analytics.insights.kitchen }));
	const tickets = rows.reduce((a, r) => a + r.tickets, 0);
	return { rows: rows.sort((a, b) => b.avgMinutes - a.avgMinutes), tickets, avgMinutes: tickets ? r1(rows.reduce((a, r) => a + r.avgMinutes * r.tickets, 0) / tickets) : 0 };
}
