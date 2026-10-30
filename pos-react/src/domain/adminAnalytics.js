/**
 * Analytics for the Ceylonry administration portal (pure). A business's sales become a summary: orders, sales, average order, a figure per day,
 * the best-selling items, how people paid, the order types, and each location. The main page adds up the per-business totals; a business's own page
 * uses the full summary. "Sales" is the sale total as it stands (after refunds, with service charge and tax); voided and refunded sales are left out.
 * `dailySeries` / `rollup` are small enough to travel with the account list, so the main page does not need every business's sales.
 */
import { insightRollup } from "./adminInsights";
import { isActiveSale } from "./sales";

const DAY = 86400000;
export const DEFAULT_TZ = "Asia/Colombo"; // the business's own clock: sales are bucketed by the hour on the wall there, whoever is looking
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
export function rollup(sales = [], now = new Date(), payload = {}) {
	const s30 = dailySeries(sales, 30, now);
	const last7 = s30.slice(-7);
	const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
	return {
		orders30: sum(s30, "orders"),
		sales30: sum(s30, "sales"),
		orders7: sum(last7, "orders"),
		sales7: sum(last7, "sales"),
		daily: s30.map((d) => d.sales),
		hourly: hourlyRollup(sales, { now }),
		insights: insightRollup({ ...payload, sales }, { now }),
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

// ------------------------------------------------------------------------------------- hourly activity ----
const fmt = new Map();
const parts = (tz) => (fmt.has(tz) ? fmt.get(tz) : (fmt.set(tz, new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })), fmt.get(tz)));
/** The calendar day ("2026-10-30") and hour (0 to 23) of a moment on the business's clock. */
export function localParts(at, tz = DEFAULT_TZ) {
	const p = Object.fromEntries(parts(tz).formatToParts(new Date(at)).map((x) => [x.type, x.value]));
	return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
}

/**
 * When a business is busy: for each hour of the day over the last `days` days, the orders and sales, how many different people sold (on an average
 * day they sold, and the most at once on any day) and how many were clocked in. `timeEntries` are optional. `summary` names the busiest hour, the
 * hours the POS is in use, and the peaks.
 */
export function hourlyActivity(sales = [], { days = 30, now = new Date(), locationId = "", tz = DEFAULT_TZ, timeEntries = [] } = {}) {
	const from = iso(+new Date(iso(now)) - (days - 1) * DAY);
	const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0, sales: 0, sellers: 0, peakSellers: 0, onClock: 0, peakOnClock: 0 }));
	const sellers = Array.from({ length: 24 }, () => new Map()); // hour -> day -> Set of staff
	const clocked = Array.from({ length: 24 }, () => new Map());
	const activeDays = new Set(); // days with sales
	const clockDays = new Set(); // days with people clocked in
	for (const s of sales) {
		if (!isActiveSale(s) || (locationId && s.locationId !== locationId)) continue;
		const { day: d, hour } = localParts(s.createdAt || s.date, tz);
		if (d < from) continue;
		activeDays.add(d);
		hours[hour].orders += 1;
		hours[hour].sales += total(s);
		const m = sellers[hour];
		if (!m.has(d)) m.set(d, new Set());
		m.get(d).add(s.staffId || "?");
	}
	for (const e of timeEntries) {
		if (!e.clockIn || (locationId && e.locationId && e.locationId !== locationId)) continue;
		// a shift nobody clocked out of counts for at most 24 hours, so a forgotten clock-out does not fill every hour of every day
		const end = Math.min(e.clockOut ? +new Date(e.clockOut) : +now, +new Date(e.clockIn) + DAY);
		for (let t = Math.floor(+new Date(e.clockIn) / 3600000) * 3600000; t <= end; t += 3600000) {
			const { day: d, hour } = localParts(t, tz);
			if (d < from) continue;
			clockDays.add(d);
			const m = clocked[hour];
			if (!m.has(d)) m.set(d, new Set());
			m.get(d).add(e.userId);
		}
	}
	const stat = (m, days) => ({ avg: [...m.values()].reduce((a, set) => a + set.size, 0) / Math.max(1, days), peak: Math.max(0, ...[...m.values()].map((x) => x.size)) });
	hours.forEach((h) => {
		const a = stat(sellers[h.hour], activeDays.size); // average over the days that had sales
		const b = stat(clocked[h.hour], clockDays.size); // and over the days anyone was clocked in
		Object.assign(h, { sellers: a.avg, peakSellers: a.peak, onClock: b.avg, peakOnClock: b.peak });
	});
	const busy = hours.filter((h) => h.orders > 0 || h.onClock > 0);
	const top = hours.reduce((best, h) => (h.orders > best.orders ? h : best), hours[0]);
	return {
		hours,
		summary: {
			orders: hours.reduce((a, h) => a + h.orders, 0),
			sales: hours.reduce((a, h) => a + h.sales, 0),
			activeDays: activeDays.size,
			busiestHour: top.orders ? top.hour : null,
			firstHour: busy.length ? busy[0].hour : null,
			lastHour: busy.length ? busy.at(-1).hour : null,
			peakSellers: Math.max(0, ...hours.map((h) => h.peakSellers)),
			peakOnClock: Math.max(0, ...hours.map((h) => h.peakOnClock)),
		},
	};
}

/** "9 am", "12 pm", "11 pm". */
export const hourLabel = (h) => (h === 0 ? "12 am" : h < 12 ? h + " am" : h === 12 ? "12 pm" : h - 12 + " pm");

/** The hourly part of an account's list summary: orders, sales and seller-days per hour over 30 days, and how many days had sales. */
export function hourlyRollup(sales = [], { now = new Date(), tz = DEFAULT_TZ } = {}) {
	const h = hourlyActivity(sales, { days: 30, now, tz });
	return { orders: h.hours.map((x) => x.orders), sales: h.hours.map((x) => x.sales), sellers: h.hours.map((x) => x.sellers), activeDays: h.summary.activeDays };
}
/** Every business's hourly figures added together (people are summed: the average number selling at that hour across all businesses). */
export function overallHourly(accounts = []) {
	const rows = accounts.filter((a) => a.analytics?.hourly);
	const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0, sales: 0, sellers: 0 }));
	for (const r of rows) hours.forEach((h, i) => ((h.orders += +r.analytics.hourly.orders[i] || 0), (h.sales += +r.analytics.hourly.sales[i] || 0), (h.sellers += +r.analytics.hourly.sellers[i] || 0)));
	const top = hours.reduce((b, h) => (h.orders > b.orders ? h : b), hours[0]);
	const busy = hours.filter((h) => h.orders > 0);
	return { hours, busiestHour: top.orders ? top.hour : null, firstHour: busy.length ? busy[0].hour : null, lastHour: busy.length ? busy.at(-1).hour : null, peakSellers: Math.max(0, ...hours.map((h) => h.sellers)) };
}
