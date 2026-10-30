/**
 * Analytics for the Ceylonry administration portal (pure). A business's sales become a summary: orders, sales, average order, a figure per day,
 * the best-selling items, how people paid, the order types, and each location. The main page adds up the per-business totals; a business's own page
 * uses the full summary. "Sales" is the sale total as it stands (after refunds, with service charge and tax); voided and refunded sales are left out.
 * `dailySeries` / `rollup` are small enough to travel with the account list, so the main page does not need every business's sales.
 */
import { isActiveSale } from "./sales";

const DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const day = (s) => String(s.date || s.createdAt || "").slice(0, 10);
const total = (s) => +s.total || 0;
const group = (rows, keyOf, init) => {
	const m = new Map();
	for (const r of rows) {
		const k = keyOf(r) || "Other";
		m.set(k, init(m.get(k) || { name: k, orders: 0, sales: 0 }, r));
	}
	return [...m.values()].sort((a, b) => b.sales - a.sales);
};

/** The last `days` calendar days ending today: [{ date, orders, sales }] (days with no sales are zero). */
export function dailySeries(sales = [], days = 30, now = new Date()) {
	const out = Array.from({ length: days }, (_, i) => ({ date: iso(+new Date(iso(now)) - (days - 1 - i) * DAY), orders: 0, sales: 0 }));
	const at = new Map(out.map((d) => [d.date, d]));
	for (const s of sales) {
		if (!isActiveSale(s)) continue;
		const d = at.get(day(s));
		if (d) (d.orders += 1), (d.sales += total(s));
	}
	return out;
}

/** The summary of one business over the last `days` days; `locationId` narrows it to one location. */
export function summarize(sales = [], { days = 30, now = new Date(), locationId = "" } = {}) {
	const series = dailySeries(locationId ? sales.filter((s) => s.locationId === locationId) : sales, days, now);
	const from = series[0].date;
	const mine = sales.filter((s) => isActiveSale(s) && day(s) >= from && (!locationId || s.locationId === locationId));
	const orders = mine.length;
	const sum = mine.reduce((a, s) => a + total(s), 0);
	const items = new Map();
	for (const s of mine)
		for (const l of s.lines || []) {
			if (l.isDiscount || l.isServiceCharge) continue;
			const it = items.get(l.name) || { name: l.name, qty: 0, sales: 0 };
			it.qty += +l.qty || 0;
			it.sales += (+l.price || 0) * (+l.qty || 0);
			items.set(l.name, it);
		}
	return {
		orders,
		sales: sum,
		average: orders ? sum / orders : 0,
		series,
		topItems: [...items.values()].sort((a, b) => b.sales - a.sales).slice(0, 8),
		payments: group(mine, (s) => s.payment, (g, s) => ({ ...g, orders: g.orders + 1, sales: g.sales + total(s) })),
		channels: group(mine, (s) => s.orderChannel, (g, s) => ({ ...g, orders: g.orders + 1, sales: g.sales + total(s) })),
		locations: group(mine, (s) => s.locationName || s.locationId, (g, s) => ({ ...g, orders: g.orders + 1, sales: g.sales + total(s) })),
		lastSaleAt: sales.filter(isActiveSale).map((s) => s.createdAt || s.date || "").sort().pop() || "",
	};
}

/** The small summary that travels with each account in the list: totals for 7 and 30 days, the last sale, and 30 daily sales figures. */
export function rollup(sales = [], now = new Date()) {
	const s30 = dailySeries(sales, 30, now);
	const last7 = s30.slice(-7);
	const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
	return {
		orders30: sum(s30, "orders"),
		sales30: sum(s30, "sales"),
		orders7: sum(last7, "orders"),
		sales7: sum(last7, "sales"),
		daily: s30.map((d) => d.sales),
		lastSaleAt: sales.filter(isActiveSale).map((s) => s.createdAt || s.date || "").sort().pop() || "",
	};
}

/** The main page: every business's rollup added together, with the businesses ranked by sales. `accounts` are list rows that carry `analytics`. */
export function overall(accounts = [], now = new Date()) {
	const rows = accounts.filter((a) => a.analytics);
	const daily = Array.from({ length: 30 }, (_, i) => ({ date: iso(+new Date(iso(now)) - (29 - i) * DAY), sales: rows.reduce((a, r) => a + (+r.analytics.daily?.[i] || 0), 0) }));
	const sales30 = rows.reduce((a, r) => a + r.analytics.sales30, 0);
	const orders30 = rows.reduce((a, r) => a + r.analytics.orders30, 0);
	return {
		businesses: rows.length,
		active7: rows.filter((r) => r.analytics.orders7 > 0).length,
		inactive: rows.filter((r) => r.analytics.orders30 === 0).length,
		orders30,
		sales30,
		average: orders30 ? sales30 / orders30 : 0,
		daily,
		top: rows.map((r) => ({ id: r.id, name: r.business || r.email, sales: r.analytics.sales30, orders: r.analytics.orders30 })).sort((a, b) => b.sales - a.sales).slice(0, 8),
	};
}
