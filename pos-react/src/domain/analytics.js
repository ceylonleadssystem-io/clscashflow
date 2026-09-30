import { VIP_SPEND } from "../config/constants";
import { isActiveSale, refundableLines } from "./sales";
import { localDateValue, today } from "./format";

/** Dashboard / report / customer analytics (final legacy behaviour). */

export function rangeDates(type, now = new Date()) {
	const end = new Date(now);
	let start = new Date(now);
	if (type === "7days") start.setDate(end.getDate() - 6);
	else if (type === "month") start = new Date(end.getFullYear(), end.getMonth(), 1);
	return { from: localDateValue(start), to: localDateValue(end) };
}

export const defaultRange = () => rangeDates("month");

export const salesInRange = (sales, from, to) =>
	sales.filter((s) => s.date >= from && s.date <= to && isActiveSale(s));

function tallyPayments(sales) {
	const payments = {};
	sales.forEach((s) => (payments[s.payment] = (payments[s.payment] || 0) + (+s.total || 0)));
	return payments;
}

export function dashboardData(sales, { from, to }) {
	const list = salesInRange(sales, from, to);
	const revenue = list.reduce((a, s) => a + (+s.total || 0), 0);
	const cost = list.reduce((a, s) => a + (+s.cost || 0), 0);
	const profit = revenue - cost;
	const itemMap = {};
	list.forEach((s) =>
		(s.lines || []).forEach((l) => {
			const name = l.name || "Item";
			const x = itemMap[name] || (itemMap[name] = { name, qty: 0, revenue: 0 });
			x.qty += +l.qty || 0;
			x.revenue += (+l.price || 0) * (+l.qty || 0);
		}),
	);
	const items = Object.values(itemMap).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
	const payments = tallyPayments(list);
	const cash = payments.Cash || 0;
	return {
		sales: list,
		revenue,
		cost,
		profit,
		average: list.length ? revenue / list.length : 0,
		items,
		payments,
		cash,
		nonCash: revenue - cash,
		margin: revenue ? (profit / revenue) * 100 : 0,
		customersServed: new Set(list.map((s) => s.customerId).filter(Boolean)).size,
		units: items.reduce((a, x) => a + x.qty, 0),
	};
}

/** Per-item report rows (accounts for refunded quantities + discount scaling). */
export function reportData(sales, { from, to }) {
	const list = salesInRange(sales, from, to);
	const items = {};
	list.forEach((s) => {
		const refunded = {};
		(s.refunds || []).forEach((r) =>
			(r.lines || []).forEach((l) => (refunded[l.lineIndex] = (refunded[l.lineIndex] || 0) + l.qty)),
		);
		const remaining = (s.lines || [])
			.map((l, lineIndex) => ({ l, qty: Math.max(0, l.qty - (refunded[lineIndex] || 0)) }))
			.filter((x) => !x.l.isDiscount && !x.l.isServiceCharge && x.qty > 0);
		const gross = remaining.reduce((a, x) => a + x.l.price * x.qty, 0);
		const rate = gross ? s.total / gross : 1;
		remaining.forEach((x) => {
			const name = x.l.name || "Item";
			const item = items[name] || (items[name] = { name, qty: 0, revenue: 0, cost: 0 });
			item.qty += x.qty;
			item.revenue += x.l.price * x.qty * rate;
			item.cost += (+x.l.cost || 0) * x.qty;
		});
	});
	return { from, to, sales: list, items: Object.values(items).sort((a, b) => b.revenue - a.revenue) };
}

export function reportKpis(data) {
	const revenue = data.sales.reduce((a, s) => a + (+s.total || 0), 0);
	const cost = data.sales.reduce((a, s) => a + (+s.cost || 0), 0);
	const profit = revenue - cost;
	return { revenue, cost, profit, margin: revenue ? (profit / revenue) * 100 : 0, payments: tallyPayments(data.sales) };
}

export function closedShiftsInRange(shifts, { from, to }) {
	return shifts.filter(
		(s) => s.status === "closed" && (s.closedAt || "").slice(0, 10) >= from && (s.closedAt || "").slice(0, 10) <= to,
	);
}

export function staffHours(entries, users, { from, to }) {
	const hours = {};
	entries
		.filter((e) => (e.clockIn || "").slice(0, 10) >= from && (e.clockIn || "").slice(0, 10) <= to)
		.forEach((e) => {
			const u = users.find((x) => x.id === e.userId);
			const x = hours[e.userId] || (hours[e.userId] = { name: u?.name || "Unknown", work: 0, break: 0 });
			const end = e.clockOut ? new Date(e.clockOut) : new Date();
			const breakMs = (e.breaks || []).reduce(
				(a, b) => a + (new Date(b.end || Date.now()) - new Date(b.start)),
				0,
			);
			x.break += breakMs;
			x.work += Math.max(0, end - new Date(e.clockIn) - breakMs);
		});
	return Object.values(hours);
}

// ------------------------------------------------------------ customers ----
export const validCustomerSales = (sales, id) => sales.filter((s) => s.customerId === id && isActiveSale(s));

export function customerInsights(customer, sales) {
	const list = validCustomerSales(sales, customer.id);
	const spent = list.reduce((a, s) => a + (+s.total || 0), 0);
	const dates = list.map((s) => s.date).filter(Boolean).sort();
	const items = {};
	list.forEach((s) =>
		(s.lines || [])
			.filter((l) => !l.isDiscount && !l.isServiceCharge)
			.forEach((l) => (items[l.name] = (items[l.name] || 0) + l.qty)),
	);
	const favorite = Object.entries(items).sort((a, b) => b[1] - a[1])[0]?.[0] || "Not enough data";
	const last = dates.at(-1) || "";
	return {
		visits: list.length,
		spent,
		last,
		first: dates[0] || "",
		average: list.length ? spent / list.length : 0,
		daysSince: last ? Math.floor((new Date(today()) - new Date(last)) / 86400000) : null,
		favorite,
	};
}

export function birthdayInfo(customer, now = new Date()) {
	if (!customer.birthday) return { label: "Not recorded", days: null, upcoming: false };
	const parts = customer.birthday.split("-").map(Number);
	const next = new Date(now.getFullYear(), parts[1] - 1, parts[2]);
	next.setHours(0, 0, 0, 0);
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	if (next < start) next.setFullYear(next.getFullYear() + 1);
	const days = Math.round((next - start) / 86400000);
	return {
		label: next.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
		days,
		upcoming: days <= 30,
	};
}

export function customerSegment(insights) {
	if (insights.spent >= VIP_SPEND || insights.visits >= 8) return "VIP";
	if (insights.visits >= 4) return "Regular";
	if (insights.daysSince != null && insights.daysSince >= 60) return "Win back";
	if (insights.visits === 1) return "New";
	return "Growing";
}

export function feedbackDue(customer, sales, delayDays) {
	const s = customerInsights(customer, sales);
	if (!s.last) return false;
	const due = new Date(s.last);
	due.setDate(due.getDate() + (+delayDays || 0));
	return due <= new Date() && !customer.lastFeedbackAt;
}

/** Enriched customer rows used by the CRM screen. */
export function crmRows(customers, sales, settings) {
	return customers.map((c) => {
		const s = customerInsights(c, sales);
		return {
			c,
			s,
			b: birthdayInfo(c),
			segment: customerSegment(s),
			due: feedbackDue(c, sales, settings.feedbackDelay),
		};
	});
}

export function customerReport(customers, sales, { from, to }) {
	const periodSales = sales.filter(
		(s) => s.date >= from && s.date <= to && s.customerId && isActiveSale(s),
	);
	const groups = {};
	periodSales.forEach((s) => {
		const x = groups[s.customerId] || (groups[s.customerId] = { visits: 0, revenue: 0, last: "" });
		x.visits++;
		x.revenue += +s.total || 0;
		x.last = x.last > s.date ? x.last : s.date;
	});
	const rows = Object.entries(groups)
		.map(([id, x]) => ({ c: customers.find((c) => c.id === id), ...x }))
		.filter((x) => x.c)
		.sort((a, b) => b.revenue - a.revenue);
	return {
		rows,
		unique: rows.length,
		repeat: rows.filter((x) => customerInsights(x.c, sales).visits > 1).length,
		avg: periodSales.length ? periodSales.reduce((a, s) => a + s.total, 0) / periodSales.length : 0,
		birthdays: customers.filter((c) => birthdayInfo(c).upcoming).length,
	};
}

export function customerStats(customerId, sales, customers) {
	const c = customers.find((x) => x.id === customerId);
	if (!c) return { visits: 0, spent: 0, last: "" };
	const s = customerInsights(c, sales);
	return { visits: s.visits, spent: s.spent, last: s.last };
}

export { refundableLines };
