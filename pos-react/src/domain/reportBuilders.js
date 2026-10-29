/**
 * Report builders (pure): one function per report in the Reports catalogue. Each takes the same context and returns
 * { cols, rows, totals?, cards?, note?, chart? } for the report page, CSV and PDF:
 *   cols   [{ key, label, type: "text"|"num"|"money"|"pct"|"hours"|"time" }]
 *   rows   [{ [col.key]: value }]  (raw numbers; the page formats them)
 *   cards  [{ label, value, type, tip, tone }]  summary cards using the shared metric definitions below
 *   note   what the report cannot show yet (a field the POS does not record), shown above the table
 * Every money figure comes from `saleFigures`, so Dashboard, Sales and Multi-Location totals always agree.
 */
import { isActiveSale } from "./sales";
import { refundRows, voidRows } from "./salesLog";
import { userName } from "./names";

const day = (iso) => String(iso || "").slice(0, 10);
const inRange = (d, r) => d >= r.from && d <= r.to;
const inLocation = (x, locationId) => !locationId || locationId === "all" || !x.locationId || x.locationId === locationId;
const hoursOf = (ms) => ms / 3600000;
const pct = (a, b) => (b ? (a / b) * 100 : 0);

// ------------------------------------------------------------------ metrics --
/**
 * Global metric dictionary for one sale. item_sales = lines before discounts; discounts_comps = discount lines; refunds = refunded
 * amounts; net_sales = item_sales - (discounts + refunds); gross_sales = net_sales + tax; tips = service charge;
 * total_sales = gross_sales + tips + fees. The POS records no tax, card fee or guest count: tax and fees are 0 and guests default to 1.
 */
export function saleFigures(s) {
	let item = 0;
	let disc = 0;
	let service = 0;
	for (const l of s.lines || []) {
		const v = (+l.price || 0) * (+l.qty || 0);
		if (l.isDiscount) disc += -v;
		else if (l.isServiceCharge) service += v;
		else item += v;
	}
	const refunds = (s.refunds || []).reduce((a, r) => a + (+r.amount || 0), 0);
	const net = item - disc - refunds;
	return { item, disc, refunds, net, tax: 0, gross: net, tips: service, fees: 0, total: net + service, orders: 1, guests: +s.guests || 1 };
}

const ZERO = () => ({ item: 0, disc: 0, refunds: 0, net: 0, tax: 0, gross: 0, tips: 0, fees: 0, total: 0, orders: 0, guests: 0 });
export function sumFigures(list) {
	const t = ZERO();
	for (const s of list) {
		const f = saleFigures(s);
		for (const k of Object.keys(t)) t[k] += f[k];
	}
	return t;
}

const TIPS = {
	item_sales: "Revenue from items before discounts or refunds",
	discounts: "Percentage and fixed discounts, free items and rewards (shown as a negative)",
	refunds: "Total amount refunded (shown as a negative)",
	net_sales: "Item Sales − (Discounts & Comps + Refunds)",
	tax: "Sales tax collected. This POS does not record tax yet.",
	gross_sales: "Net Sales + Tax",
	tips: "Tips and service charges",
	fees: "Extra, card and online fees. This POS does not record fees yet.",
	total_sales: "Gross Sales + Tips + Fee",
	avg_order: "Net Sales ÷ Total Order Count",
	avg_guest: "Net Sales ÷ Total Guest Count (1 guest per order unless a count is entered)",
	avg_guests_order: "Total Guest Count ÷ Total Order Count",
};
const money = (label, value, tip, tone) => ({ label, value, type: "money", tip, tone });
const num = (label, value, tip) => ({ label, value, type: "num", tip });

/** Summary cards for a set of sales (the Sales › Overview cards). */
export function metricCards(list) {
	const t = sumFigures(list);
	return [
		money("Item Sales", t.item, TIPS.item_sales),
		money("Discounts & Comps", -t.disc, TIPS.discounts, "neg"),
		money("Refunds", -t.refunds, TIPS.refunds, "neg"),
		money("Net Sales", t.net, TIPS.net_sales),
		money("Tax", t.tax, TIPS.tax),
		money("Gross Sales", t.gross, TIPS.gross_sales),
		money("Tips", t.tips, TIPS.tips),
		money("Fee", t.fees, TIPS.fees),
		money("Total Sales", t.total, TIPS.total_sales),
		money("Avg / Order", t.orders ? t.net / t.orders : 0, TIPS.avg_order),
		money("Avg / Guest", t.guests ? t.net / t.guests : 0, TIPS.avg_guest),
		num("Avg Guests / Order", t.orders ? t.guests / t.orders : 0, TIPS.avg_guests_order),
		num("Total Order Count", t.orders, "Orders processed, excluding voided orders"),
		num("Total Guest Count", t.guests, "Guests served; 1 per order when no count is entered"),
	];
}

// ------------------------------------------------------------------ helpers --
const C = {
	text: (key, label) => ({ key, label, type: "text" }),
	num: (key, label) => ({ key, label, type: "num" }),
	money: (key, label) => ({ key, label, type: "money" }),
	pct: (key, label) => ({ key, label, type: "pct" }),
	hours: (key, label) => ({ key, label, type: "hours" }),
	time: (key, label) => ({ key, label, type: "time" }),
};
const unavailable = (cols, note) => ({ cols, rows: [], note });

const activeSales = (ctx) => ctx.sales.filter((s) => isActiveSale(s) && inRange(s.date, ctx.range));
const orderTypeOf = (s) => s.orderChannel || "Retail";
const staffName = (ctx, id) => userName(ctx.users, id, "Unknown");

/** Group sales by `keyOf`; rows carry the shared figures plus the group name. */
function groupSales(list, keyOf) {
	const groups = new Map();
	for (const s of list) {
		const k = keyOf(s) || "Unassigned";
		const g = groups.get(k) || { name: k, sales: [] };
		g.sales.push(s);
		groups.set(k, g);
	}
	return [...groups.values()].map((g) => ({ name: g.name, ...sumFigures(g.sales) }));
}
const totalsRow = (rows, keys) => Object.fromEntries(keys.map((k) => [k, rows.reduce((a, r) => a + (+r[k] || 0), 0)]));

/** Payment shares of a sale: split payments one by one, otherwise the whole total on the single payment method. */
function paymentsOf(s) {
	const f = saleFigures(s);
	const parts = Array.isArray(s.payments) && s.payments.length ? s.payments : null;
	return parts ? parts.map((p) => ({ method: p.method || "Other", amount: +p.amount || 0 })) : [{ method: s.payment || "Other", amount: f.total }];
}

/** Chargeable lines of the sales in range, with the quantity left after refunds and the line's share of the sale's discount. */
function itemLines(ctx) {
	const out = [];
	for (const s of activeSales(ctx)) {
		const refunded = {};
		(s.refunds || []).forEach((r) => (r.lines || []).forEach((l) => (refunded[l.lineIndex] = (refunded[l.lineIndex] || 0) + l.qty)));
		const f = saleFigures(s);
		const rate = f.item ? (f.item - f.disc) / f.item : 1;
		(s.lines || []).forEach((l, i) => {
			if (l.isDiscount || l.isServiceCharge) return;
			const qty = Math.max(0, (+l.qty || 0) - (refunded[i] || 0));
			if (!qty) return;
			const gross = (+l.price || 0) * qty;
			out.push({ sale: s, line: l, qty, gross, discount: gross * (1 - rate), net: gross * rate });
		});
	}
	return out;
}

// -------------------------------------------------------------------- sales --
const SALES = {
	overview(ctx) {
		const list = activeSales(ctx);
		const rows = groupSales(list, (s) => s.date).sort((a, b) => a.name.localeCompare(b.name)).map((r) => ({ date: r.name, orders: r.orders, item: r.item, disc: -r.disc, refunds: -r.refunds, net: r.net, tax: r.tax, gross: r.gross, tips: r.tips, total: r.total }));
		return {
			cards: metricCards(list),
			cols: [C.text("date", "Date"), C.num("orders", "Orders"), C.money("item", "Item Sales"), C.money("disc", "Discounts & Comps"), C.money("refunds", "Refunds"), C.money("net", "Net Sales"), C.money("tax", "Tax"), C.money("gross", "Gross Sales"), C.money("tips", "Tips"), C.money("total", "Total Sales")],
			rows,
			totals: totalsRow(rows, ["orders", "item", "disc", "refunds", "net", "tax", "gross", "tips", "total"]),
			chart: { label: "date", value: "net" },
			note: "Tax, card fees and guest counts are not recorded by this POS yet: Tax and Fee show 0 and each order counts as one guest.",
		};
	},
	"payment-type"(ctx) {
		const map = new Map();
		for (const s of activeSales(ctx)) for (const p of paymentsOf(s)) {
			const g = map.get(p.method) || { name: p.method, group: /card|visa|master|amex/i.test(p.method) ? "Card" : "Non-Card", qty: 0, total: 0 };
			g.qty += 1;
			g.total += p.amount;
			map.set(p.method, g);
		}
		const rows = [...map.values()].sort((a, b) => b.total - a.total);
		return { cols: [C.text("group", "Group"), C.text("name", "Name"), C.num("qty", "Quantity (#)"), C.money("total", "Total Sales")], rows, totals: totalsRow(rows, ["qty", "total"]), chart: { label: "name", value: "total" }, note: "Card-present and card-not-present are not told apart by this POS: card payments are grouped as Card." };
	},
	"order-type"(ctx) {
		const rows = groupSales(activeSales(ctx), orderTypeOf).map((r) => ({ name: r.name, qty: r.orders, avg: r.orders ? r.net / r.orders : 0, net: r.net })).sort((a, b) => b.net - a.net);
		const t = totalsRow(rows, ["qty", "net"]);
		return { cols: [C.text("name", "Name"), C.num("qty", "Quantity (#)"), C.money("avg", "Avg Ticket"), C.money("net", "Total Net Sales")], rows, totals: { ...t, avg: t.qty ? t.net / t.qty : 0 }, chart: { label: "name", value: "net" } };
	},
	employee(ctx) {
		const rows = groupSales(activeSales(ctx), (s) => staffName(ctx, s.staffId)).map((r) => ({ name: r.name, qty: r.orders, avg: r.orders ? r.net / r.orders : 0, guests: r.guests, avgGuest: r.guests ? r.net / r.guests : 0, guestsOrder: r.orders ? r.guests / r.orders : 0, net: r.net })).sort((a, b) => b.net - a.net);
		const t = totalsRow(rows, ["qty", "guests", "net"]);
		return { cols: [C.text("name", "Name"), C.num("qty", "Quantity (#)"), C.money("avg", "Avg / Order"), C.num("guests", "Guest (#)"), C.money("avgGuest", "Avg / Guest"), C.num("guestsOrder", "Avg Guests / Order"), C.money("net", "Total Net Sales")], rows, totals: { ...t, avg: t.qty ? t.net / t.qty : 0, avgGuest: t.guests ? t.net / t.guests : 0, guestsOrder: t.qty ? t.guests / t.qty : 0 }, chart: { label: "name", value: "net" } };
	},
	register(ctx) {
		const label = (s) => {
			const shift = ctx.cashShifts.find((x) => x.id === s.cashShiftId);
			return shift ? staffName(ctx, shift.userId) + " · opened " + day(shift.openedAt) : "No register";
		};
		const rows = groupSales(activeSales(ctx), label).map((r) => ({ name: r.name, qty: r.orders, net: r.net })).sort((a, b) => b.net - a.net);
		return { cols: [C.text("name", "Name"), C.num("qty", "Quantity (#)"), C.money("net", "Total Net Sales")], rows, totals: totalsRow(rows, ["qty", "net"]), chart: { label: "name", value: "net" } };
	},
	zone: () => unavailable([C.text("name", "Name"), C.num("qty", "Quantity (#)"), C.money("net", "Total Net Sales")], "Zones (floor areas) are not recorded on sales yet, so this report has no data."),
	"revenue-center": () => unavailable([C.text("name", "Revenue Center"), C.money("net", "Sales"), C.money("tax", "Tax"), C.num("qty", "Order (#)"), C.num("guests", "Guest (#)"), C.money("disc", "Discounts/Comps")], "Revenue centers and day parts are not configured in this POS yet, so this report has no data."),
	discounts(ctx) {
		const map = new Map();
		for (const s of activeSales(ctx)) for (const l of s.lines || []) if (l.isDiscount) {
			const name = s.discount?.reason || s.discount?.label || l.name || "Discount";
			const g = map.get(name) || { name, count: 0, amount: 0 };
			g.count += 1;
			g.amount += -(+l.price || 0) * (+l.qty || 0);
			map.set(name, g);
		}
		const all = [...map.values()].sort((a, b) => b.amount - a.amount);
		const sum = all.reduce((a, r) => a + r.amount, 0);
		const rows = all.map((r) => ({ ...r, share: pct(r.amount, sum) }));
		return { cols: [C.text("name", "Discount Reasons"), C.num("count", "Count (#)"), C.money("amount", "Discount"), C.pct("share", "% Disc")], rows, totals: { count: rows.reduce((a, r) => a + r.count, 0), amount: sum, share: rows.length ? 100 : 0 }, chart: { label: "name", value: "amount" } };
	},
	"in-store-channels"(ctx) {
		const rows = groupSales(activeSales(ctx), (s) => (s.platformOrderId ? "Platform: " + orderTypeOf(s) : "POS · " + orderTypeOf(s))).map((r) => ({ name: r.name, revenue: r.net, orders: r.orders })).sort((a, b) => b.revenue - a.revenue);
		return { cols: [C.text("name", "Channel"), C.money("revenue", "Revenue"), C.num("orders", "Order Count")], rows, totals: totalsRow(rows, ["revenue", "orders"]), chart: { label: "name", value: "revenue" }, note: "Handheld and kiosk channels are not separate in this POS. Channels are the POS order channels and delivery platforms." };
	},
};

// --------------------------------------------------------------------- menu --
function groupItems(ctx, keyOf) {
	const map = new Map();
	for (const x of itemLines(ctx)) {
		const k = keyOf(x.line) || "Uncategorised";
		const g = map.get(k) || { name: k, qty: 0, gross: 0, discount: 0, net: 0 };
		g.qty += x.qty;
		g.gross += x.gross;
		g.discount += x.discount;
		g.net += x.net;
		map.set(k, g);
	}
	const rows = [...map.values()].sort((a, b) => b.net - a.net);
	const sum = rows.reduce((a, r) => a + r.net, 0);
	return rows.map((r) => ({ ...r, share: pct(r.net, sum) }));
}
const MENU = {
	"sales-category"(ctx) {
		const rows = groupItems(ctx, (l) => l.category);
		return { cols: [C.text("name", "Name"), C.num("qty", "Quantity (#)"), C.money("net", "Net Sales"), C.pct("share", "% of Net Sales")], rows, totals: { ...totalsRow(rows, ["qty", "net"]), share: rows.length ? 100 : 0 }, chart: { label: "name", value: "net" } };
	},
	"product-category"(ctx) {
		const map = new Map();
		for (const x of itemLines(ctx)) {
			const name = x.line.subcategory || x.line.category || "Uncategorised";
			const g = map.get(name) || { name, category: x.line.category || "—", qty: 0, net: 0 };
			g.qty += x.qty;
			g.net += x.net;
			map.set(name, g);
		}
		const all = [...map.values()].sort((a, b) => b.net - a.net);
		const sum = all.reduce((a, r) => a + r.net, 0);
		const rows = all.map((r) => ({ ...r, share: pct(r.net, sum) }));
		return { cols: [C.text("name", "Name"), C.text("category", "Sales Category"), C.num("qty", "Quantity (#)"), C.money("net", "Net Sales"), C.pct("share", "% of Net Sales")], rows, totals: { ...totalsRow(rows, ["qty", "net"]), share: rows.length ? 100 : 0 }, chart: { label: "name", value: "net" } };
	},
	"product-mix"(ctx) {
		const map = new Map();
		const catNet = {};
		let all = 0;
		for (const x of itemLines(ctx)) {
			const name = x.line.name || "Item";
			const g = map.get(name) || { name, category: x.line.subcategory || x.line.category || "Uncategorised", qty: 0, gross: 0, discount: 0, net: 0 };
			g.qty += x.qty;
			g.gross += x.gross;
			g.discount += x.discount;
			g.net += x.net;
			map.set(name, g);
			catNet[g.category] = (catNet[g.category] || 0) + x.net;
			all += x.net;
		}
		const rows = [...map.values()].sort((a, b) => b.qty - a.qty || b.net - a.net).map((r) => ({ ...r, avg: r.qty ? r.gross / r.qty : 0, ofCategory: pct(r.net, catNet[r.category]), ofTotal: pct(r.net, all) }));
		return { cols: [C.text("name", "Item"), C.text("category", "Product Category"), C.num("qty", "Quantity (#)"), C.money("avg", "Avg Price"), C.money("gross", "Gross Item Sales"), C.money("discount", "Discounts"), C.money("net", "Net Sales"), C.pct("ofCategory", "% of Category"), C.pct("ofTotal", "% of Total")], rows, totals: totalsRow(rows, ["qty", "gross", "discount", "net"]), chart: { label: "name", value: "qty" } };
	},
	"modifier-sales"(ctx) {
		const map = new Map();
		for (const x of itemLines(ctx)) for (const m of x.line.modifiers || []) {
			const key = (m.optionName || "") + "\u0000" + (x.line.name || "");
			const g = map.get(key) || { name: m.optionName || "Modifier", group: m.groupName || "Modifier", parent: x.line.name || "Item", qty: 0, sales: 0 };
			g.qty += x.qty;
			g.sales += (+m.price || 0) * x.qty;
			map.set(key, g);
		}
		const rows = [...map.values()].sort((a, b) => b.qty - a.qty);
		return { cols: [C.text("name", "Modifier"), C.text("group", "Group"), C.text("parent", "Parent Item"), C.num("qty", "Quantity (#)"), C.money("sales", "Modifier Sales")], rows, totals: totalsRow(rows, ["qty", "sales"]), chart: { label: "name", value: "qty" } };
	},
};

// ------------------------------------------------------------------ payroll --
function laborByEmployee(ctx) {
	const map = new Map();
	for (const e of ctx.timeEntries) {
		const d = day(e.clockIn);
		if (!inRange(d, ctx.range)) continue;
		const end = e.clockOut ? new Date(e.clockOut) : new Date();
		const breaks = (e.breaks || []).reduce((a, b) => a + (new Date(b.end || Date.now()) - new Date(b.start)), 0);
		const work = Math.max(0, end - new Date(e.clockIn) - breaks);
		const g = map.get(e.userId) || { id: e.userId, work: 0, days: {} };
		g.work += work;
		g.days[d] = (g.days[d] || 0) + work;
		map.set(e.userId, g);
	}
	return map;
}
const PAYROLL = {
	"labor-costs"(ctx) {
		const rows = [...laborByEmployee(ctx).values()].map((g) => {
			const u = ctx.users.find((x) => x.id === g.id);
			return { name: u?.name || "Unknown", role: u?.role || "—", regular: hoursOf(g.work), ot: 0, ot2: 0, paid: hoursOf(g.work) };
		}).sort((a, b) => b.paid - a.paid);
		return { cols: [C.text("name", "Employee"), C.text("role", "Assignment"), C.hours("regular", "Regular Hours"), C.hours("ot", "OT Hours"), C.hours("ot2", "OT 2 Hours"), C.hours("paid", "Paid Hours")], rows, totals: totalsRow(rows, ["regular", "ot", "ot2", "paid"]), chart: { label: "name", value: "paid" }, note: "Hourly wages, overtime rules and declared tips are not stored in this POS yet, so only hours are shown. All hours count as regular hours." };
	},
	"tips-cash"(ctx) {
		const by = new Map();
		for (const s of activeSales(ctx)) {
			const name = staffName(ctx, s.staffId);
			const g = by.get(name) || { name, cash: 0, other: 0, service: 0 };
			for (const p of paymentsOf(s)) {
				if (p.method === "Cash") g.cash += p.amount;
				else g.other += p.amount;
			}
			g.service += saleFigures(s).tips;
			by.set(name, g);
		}
		const out = [...by.values()].sort((a, b) => b.cash - a.cash);
		return { cols: [C.text("name", "Employee"), C.money("cash", "Cash Sales"), C.money("other", "Card & Other Sales"), C.money("service", "Service Charge")], rows: out, totals: totalsRow(out, ["cash", "other", "service"]), chart: { label: "name", value: "cash" }, note: "Card tips and declared tips are not recorded in this POS yet. The cash and service charge each employee handled is shown." };
	},
};

// ----------------------------------------------------------- sales vs labor --
function salesVsLabor(ctx) {
	const net = new Map();
	for (const s of activeSales(ctx)) net.set(s.date, (net.get(s.date) || 0) + saleFigures(s).net);
	const hrs = new Map();
	for (const g of laborByEmployee(ctx).values()) for (const [d, ms] of Object.entries(g.days)) hrs.set(d, (hrs.get(d) || 0) + hoursOf(ms));
	const days = [...new Set([...net.keys(), ...hrs.keys()])].sort();
	const rows = days.map((d) => ({ date: d, net: net.get(d) || 0, hours: hrs.get(d) || 0, perHour: hrs.get(d) ? (net.get(d) || 0) / hrs.get(d) : 0 }));
	const t = totalsRow(rows, ["net", "hours"]);
	return { cols: [C.text("date", "Period"), C.money("net", "Net Sales"), C.hours("hours", "Labor Hours"), C.money("perHour", "Sales per Labor Hour")], rows, totals: { ...t, perHour: t.hours ? t.net / t.hours : 0 }, chart: { label: "date", value: "net" }, note: "Labor cost and Labor % need hourly wages, which this POS does not store yet. Net sales are compared with hours worked." };
}

// ----------------------------------------------------------------- not yet --
const NO_GIFT = "Gift cards are not set up in this POS yet, so there is nothing to report.";
const GIFT = {
	balances: () => unavailable([C.text("card", "Card #"), C.text("date", "Activation Date"), C.money("balance", "Outstanding Balance")], NO_GIFT),
	transactions: () => unavailable([C.text("card", "Card #"), C.time("at", "Date"), C.text("location", "Location"), C.text("employee", "Employee"), C.text("type", "TXN"), C.money("amount", "Amount")], NO_GIFT),
};
const TAXES = () => unavailable([C.text("name", "Tax Name"), C.pct("rate", "Tax Rate (%)"), C.money("sold", "Taxable Items Sold"), C.num("items", "Taxable Items"), C.money("amount", "Tax Amount")], "No tax is configured or recorded by this POS yet, so no tax was collected in these reports.");
const PAYMENTS = {
	"credit-card-deposits": () => unavailable([C.time("at", "Time"), C.text("what", "Description"), C.money("total", "Total")], "Card deposits need a connected card processor."),
	"credit-card-transactions": () => unavailable([C.time("at", "Time"), C.text("ref", "Reference Number"), C.text("card", "Card Number"), C.money("total", "Total"), C.text("status", "Status")], "Card transactions need a connected card processor."),
	"credit-card-summary": () => unavailable([C.text("what", "Item"), C.money("total", "Total")], "The card summary needs a connected card processor."),
};
const LOYALTY = () => unavailable([C.text("name", "Customer"), C.num("visits", "Visits"), C.money("net", "Net Sales")], "Loyalty points are not available in this POS yet.");

// ------------------------------------------------------------------ kitchen --
const ticketsIn = (ctx) => ctx.kitchenTickets.filter((t) => inRange(day(t.createdAt), ctx.range) && inLocation(t, ctx.locationId));
const KITCHEN_NOTE = "This POS records when a ticket is sent to a station, not when the kitchen finishes it, so cook and fulfil times are not shown.";
const KITCHEN = {
	"tickets-by-station"(ctx) {
		const map = new Map();
		for (const t of ticketsIn(ctx)) {
			const name = t.destination || "Kitchen";
			const g = map.get(name) || { name, tickets: 0, items: 0 };
			g.tickets += 1;
			g.items += (t.lines || []).reduce((a, l) => a + (+l.qty || 0), 0);
			map.set(name, g);
		}
		const rows = [...map.values()].sort((a, b) => b.tickets - a.tickets);
		return { cols: [C.text("name", "Station Name"), C.num("tickets", "# of Tickets Sent"), C.num("items", "Items")], rows, totals: totalsRow(rows, ["tickets", "items"]), chart: { label: "name", value: "tickets" }, note: KITCHEN_NOTE };
	},
	"tickets-by-fulfillment"(ctx) {
		const size = +ctx.extra || 60;
		const map = new Map();
		for (const t of ticketsIn(ctx)) {
			const d = new Date(t.createdAt);
			const start = new Date(d);
			start.setMinutes(Math.floor(d.getMinutes() / size) * size, 0, 0);
			if (size >= 60) start.setMinutes(0, 0, 0);
			const label = day(t.createdAt) + " " + start.toTimeString().slice(0, 5);
			const key = label + "|" + (t.destination || "Kitchen");
			const g = map.get(key) || { interval: label, station: t.destination || "Kitchen", tickets: 0 };
			g.tickets += 1;
			map.set(key, g);
		}
		const rows = [...map.values()].sort((a, b) => a.interval.localeCompare(b.interval) || a.station.localeCompare(b.station));
		return { cols: [C.text("interval", "Time Interval"), C.text("station", "Stations"), C.num("tickets", "Tickets Sent")], rows, totals: totalsRow(rows, ["tickets"]), extra: { label: "Time interval", options: [{ value: "15", label: "15 minutes" }, { value: "30", label: "30 minutes" }, { value: "60", label: "1 hour" }], value: String(size) }, note: KITCHEN_NOTE };
	},
	"ticket-details"(ctx) {
		const rows = ticketsIn(ctx).map((t) => ({ at: t.createdAt, receipt: t.orderNumber || "—", ref: t.reference || "—", station: t.destination || "Kitchen", status: t.status || "—", items: (t.lines || []).reduce((a, l) => a + (+l.qty || 0), 0) })).sort((a, b) => String(b.at).localeCompare(String(a.at)));
		return { cols: [C.time("at", "Sent to Kitchen"), C.text("receipt", "Order #"), C.text("ref", "Table / Reference"), C.text("station", "Station Name"), C.text("status", "Status"), C.num("items", "Items")], rows, totals: totalsRow(rows, ["items"]), note: KITCHEN_NOTE };
	},
	"item-details"(ctx) {
		const rows = ticketsIn(ctx).flatMap((t) => (t.lines || []).map((l) => ({ name: l.name || "Item", at: t.createdAt, qty: +l.qty || 0, receipt: t.orderNumber || "—", station: t.destination || "Kitchen" }))).sort((a, b) => String(b.at).localeCompare(String(a.at)));
		return { cols: [C.text("name", "Item Name"), C.time("at", "Sent to Kitchen"), C.num("qty", "Quantity (#)"), C.text("receipt", "Order #"), C.text("station", "Station")], rows, totals: totalsRow(rows, ["qty"]), note: KITCHEN_NOTE };
	},
};

// ------------------------------------------------------------- transactions --
const TRANSACTIONS = {
	"sales-refunds"(ctx) {
		const sales = ctx.sales.filter((s) => inRange(s.date, ctx.range) && ["completed", "partially_refunded", "refunded"].includes(s.status || "completed")).map((s) => ({ at: s.createdAt || s.date, receipt: s.receipt, type: "Sale", orderType: orderTypeOf(s), payment: s.payment || "—", employee: staffName(ctx, s.staffId), approved: "—", tip: saleFigures(s).tips, total: (+s.originalTotal || saleFigures(s).total) }));
		const refunds = refundRows(ctx.sales.filter((s) => inLocation(s, ctx.locationId)), ctx.users).filter((r) => inRange(r.date, ctx.range)).map((r) => ({ at: r.at, receipt: r.receipt, type: "Refund", orderType: "—", payment: r.payment || "—", employee: "—", approved: r.authorizedBy, tip: 0, total: -r.total }));
		const rows = [...sales, ...refunds].sort((a, b) => String(b.at).localeCompare(String(a.at)));
		const cards = [num("Total Transactions (#)", sales.length), money("Total Transaction", sales.reduce((a, r) => a + r.total, 0) + refunds.reduce((a, r) => a + r.total, 0), "Sales net of refunds"), num("Total Refunds (#)", refunds.length), money("Total Refunds", refunds.reduce((a, r) => a + r.total, 0), "", "neg")];
		return { cards, cols: [C.time("at", "Date"), C.text("receipt", "Receipt"), C.text("type", "Transaction Type"), C.text("orderType", "Order Type"), C.text("payment", "Payment Type"), C.text("employee", "Employee"), C.text("approved", "Approved By"), C.money("tip", "Tip"), C.money("total", "Total")], rows, totals: { total: rows.reduce((a, r) => a + r.total, 0), tip: rows.reduce((a, r) => a + r.tip, 0) } };
	},
	"voids-deletes"(ctx) {
		const rows = voidRows({ sales: ctx.sales.filter((s) => inLocation(s, ctx.locationId)), voidOrders: ctx.voidOrders, openOrders: ctx.openOrders, audit: ctx.supportAudit, users: ctx.users, locationId: ctx.locationId }).filter((r) => inRange(r.date, ctx.range)).map((r) => ({ at: r.at, receipt: r.receipt, kind: r.kind, payment: r.payment, by: r.by, reason: r.reason || "—", total: +r.total || 0 }));
		const count = (k) => rows.filter((r) => r.kind === k).length;
		return { cards: [num("Total Order Voids (#)", count("Voided") + count("Voided check")), num("Cleared Carts (#)", count("Cart cleared")), num("Deleted Sales (#)", count("Deleted"))], cols: [C.time("at", "Date"), C.text("receipt", "Receipt"), C.text("kind", "Transaction Type"), C.text("payment", "Payment Type"), C.text("by", "Employee"), C.text("reason", "Reason"), C.money("total", "Total")], rows, totals: totalsRow(rows, ["total"]) };
	},
	"discounts-comps"(ctx) {
		const rows = [];
		for (const s of activeSales(ctx)) for (const l of s.lines || []) if (l.isDiscount) rows.push({ at: s.createdAt || s.date, receipt: s.receipt, type: l.name || "Discount", orderType: orderTypeOf(s), employee: staffName(ctx, s.staffId), reason: s.discount?.reason || "—", amount: -(+l.price || 0) * (+l.qty || 0) });
		rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
		return { cols: [C.time("at", "Date"), C.text("receipt", "Receipt"), C.text("type", "Discount Type"), C.text("orderType", "Order Type"), C.text("employee", "Employee"), C.text("reason", "Reason"), C.money("amount", "Discount")], rows, totals: totalsRow(rows, ["amount"]) };
	},
	"cash-log"(ctx) {
		const rows = [];
		for (const sh of ctx.cashShifts) {
			if (!inLocation(sh, ctx.locationId)) continue;
			const who = staffName(ctx, sh.userId);
			if (inRange(day(sh.openedAt), ctx.range)) rows.push({ at: sh.openedAt, type: "Cash In", reason: "Opening float", employee: who, amount: +sh.openingCash || 0 });
			if (sh.status === "closed" && inRange(day(sh.closedAt), ctx.range) && +sh.variance) rows.push({ at: sh.closedAt, type: +sh.variance > 0 ? "Cash In" : "Cash Out", reason: "Closing difference (over / short)", employee: who, amount: +sh.variance });
		}
		rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
		const cashIn = rows.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0);
		const cashOut = rows.filter((r) => r.amount < 0).reduce((a, r) => a + r.amount, 0);
		return { cards: [money("Total Amount", cashIn + cashOut), money("Cash In", cashIn), money("Cash Out", cashOut, "", "neg")], cols: [C.time("at", "Date"), C.text("type", "Type"), C.text("reason", "Reason"), C.text("employee", "Employee"), C.money("amount", "Amount")], rows, totals: totalsRow(rows, ["amount"]), note: "Separate pay-in and pay-out entries are not recorded by this POS. The opening float and the closing over / short difference of each register are shown." };
	},
};

// -------------------------------------------------------------- audit trail --
const AUDIT = {
	transfer(ctx) {
		const rows = ctx.stockTransfers.filter((t) => inRange(day(t.createdAt), ctx.range)).map((t) => ({ at: t.createdAt, item: ctx.inventory.find((i) => i.id === t.itemId)?.name || "Item", from: ctx.locations.find((l) => l.id === t.fromLocationId)?.name || "—", to: ctx.locations.find((l) => l.id === t.toLocationId)?.name || "—", by: staffName(ctx, t.userId), qty: +t.qty || 0 }));
		return { cols: [C.time("at", "Date"), C.text("item", "Item"), C.text("from", "From"), C.text("to", "To"), C.text("by", "Transferred By"), C.num("qty", "Quantity")], rows, totals: totalsRow(rows, ["qty"]), note: "Stock transfers between locations are listed. Moving a check to another table or server is not logged by this POS yet." };
	},
	"timesheet-audit": () => unavailable([C.time("at", "Changed At"), C.text("employee", "Employee"), C.text("field", "Field"), C.text("old", "Old Value"), C.text("new", "New Value"), C.text("by", "Changed By")], "Timesheet edits are not logged by this POS yet, so there is nothing to show."),
};

// ----------------------------------------------------------- multi-location --
function byLocation(ctx) {
	const names = new Map(ctx.locations.map((l) => [l.id, l.name]));
	const list = ctx.allSales.filter((s) => isActiveSale(s) && inRange(s.date, ctx.range));
	return groupSales(list, (s) => names.get(s.locationId) || s.locationName || "Unassigned");
}
const MULTI = {
	summary(ctx) {
		const rows = byLocation(ctx).map((r) => ({ name: r.name, item: r.item, disc: -r.disc, refunds: -r.refunds, net: r.net, tax: r.tax, gross: r.gross, tips: r.tips, fees: r.fees, total: r.total, orders: r.orders, guests: r.guests }));
		return { cols: [C.text("name", "Restaurant Name"), C.money("item", "Item Sales"), C.money("disc", "Discounts & Comps"), C.money("refunds", "Refunds"), C.money("net", "Net Sales"), C.money("tax", "Total Tax"), C.money("gross", "Gross Sales"), C.money("tips", "Tips"), C.money("fees", "Fee"), C.money("total", "Total Sales"), C.num("orders", "Total Orders"), C.num("guests", "Total Guests")], rows: rows.sort((a, b) => b.total - a.total), totals: totalsRow(rows, ["item", "disc", "refunds", "net", "tax", "gross", "tips", "fees", "total", "orders", "guests"]), chart: { label: "name", value: "total" }, note: "All locations use the same currency in this POS, so totals are summed." };
	},
	sales(ctx) {
		const names = new Map(ctx.locations.map((l) => [l.id, l.name]));
		const list = ctx.allSales.filter((s) => isActiveSale(s) && inRange(s.date, ctx.range));
		const map = new Map();
		for (const s of list) {
			const name = names.get(s.locationId) || s.locationName || "Unassigned";
			const g = map.get(name) || { name, qty: 0, total: 0, dine: 0, take: 0, delivery: 0, other: 0 };
			const f = saleFigures(s);
			g.qty += (s.lines || []).filter((l) => !l.isDiscount && !l.isServiceCharge).reduce((a, l) => a + (+l.qty || 0), 0);
			g.total += f.net;
			const t = orderTypeOf(s).toLowerCase();
			if (/dine/.test(t)) g.dine += f.net;
			else if (/take|pick/.test(t)) g.take += f.net;
			else if (/deliver/.test(t)) g.delivery += f.net;
			else g.other += f.net;
			map.set(name, g);
		}
		const rows = [...map.values()].sort((a, b) => b.total - a.total);
		return { cols: [C.text("name", "Restaurant Name"), C.num("qty", "Quantity (#)"), C.money("total", "Total"), C.money("take", "Take Out"), C.money("delivery", "Delivery"), C.money("dine", "Dine In"), C.money("other", "Others")], rows, totals: totalsRow(rows, ["qty", "total", "take", "delivery", "dine", "other"]), chart: { label: "name", value: "total" } };
	},
	"online-orders"(ctx) {
		const names = new Map(ctx.locations.map((l) => [l.id, l.name]));
		const list = ctx.allSales.filter((s) => isActiveSale(s) && s.platformOrderId && inRange(s.date, ctx.range));
		const rows = groupSales(list, (s) => names.get(s.locationId) || s.locationName).map((r) => ({ name: r.name, orders: r.orders, sales: r.net, tips: r.tips }));
		return { cols: [C.text("name", "Restaurant Name"), C.num("orders", "Orders (#)"), C.money("sales", "Sales"), C.money("tips", "Tips")], rows, totals: totalsRow(rows, ["orders", "sales", "tips"]), chart: { label: "name", value: "sales" }, note: "Online orders are the sales that came from a delivery platform. Delivery fees are not recorded separately." };
	},
	voids(ctx) {
		const names = new Map(ctx.locations.map((l) => [l.id, l.name]));
		const rows = ctx.locations.map((l) => {
			const v = voidRows({ sales: ctx.allSales.filter((s) => s.locationId === l.id), voidOrders: ctx.voidOrders, openOrders: ctx.openOrders, audit: ctx.supportAudit, users: ctx.users, locationId: l.id }).filter((r) => inRange(r.date, ctx.range));
			const orders = v.filter((r) => r.kind === "Voided" || r.kind === "Voided check");
			const carts = v.filter((r) => r.kind === "Cart cleared");
			const sum = (a) => a.reduce((x, r) => x + (+r.total || 0), 0);
			return { name: names.get(l.id), orderCount: orders.length, orderValue: sum(orders), cartCount: carts.length, cartValue: sum(carts) };
		});
		return { cols: [C.text("name", "Restaurant Name"), C.num("orderCount", "Order Void (#)"), C.money("orderValue", "Order Void ($)"), C.num("cartCount", "Cleared Cart (#)"), C.money("cartValue", "Cleared Cart ($)")], rows, totals: totalsRow(rows, ["orderCount", "orderValue", "cartCount", "cartValue"]) };
	},
};

const BUILDERS = { sales: SALES, menu: MENU, payroll: PAYROLL, "gift-cards": GIFT, payments: PAYMENTS, kitchen: KITCHEN, transactions: TRANSACTIONS, "audit-trail": AUDIT, "multi-location": MULTI };

/**
 * Builds one report. `ctx`: { range:{from,to}, sales (location-scoped), allSales, cashShifts, timeEntries, users, locations, locationId,
 * kitchenTickets, openOrders, voidOrders, supportAudit, stockTransfers, inventory, extra }.
 * Returns { cols, rows, totals?, cards?, note?, chart?, extra? }.
 */
export function buildReport(group, sub, ctx) {
	const full = { allSales: ctx.sales, kitchenTickets: [], openOrders: [], voidOrders: [], supportAudit: [], stockTransfers: [], inventory: [], locations: [], cashShifts: [], timeEntries: [], users: [], ...ctx };
	if (group === "sales-vs-labor") return salesVsLabor(full);
	if (group === "taxes") return TAXES();
	if (group === "loyalty") return LOYALTY();
	const fn = BUILDERS[group]?.[sub];
	return fn ? fn(full) : unavailable([], "This report is not available.");
}
