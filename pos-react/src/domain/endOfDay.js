/**
 * End of Day report (pure): everything about one trading day in a single document, ending with the current stock levels.
 * Returns the report shape used by services/printing/reportDocument.js and reportPdf.js ({ title, subtitle, kpis, sections }).
 */
import { money } from "./format";
import { closedShiftsInRange, reportData, reportKpis, staffHours } from "./analytics";
import { refundRows, voidRows } from "./salesLog";
import { locationStock, stockStatus } from "./inventory";

const STATUS_ORDER = { "Out of stock": 0, "Low stock": 1, "In stock": 2 };
const time = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
const inLocation = (x, locationId) => !locationId || locationId === "all" || !x.locationId || x.locationId === locationId;

/** Current stock of every counted item at the location (all locations added up when "all"), lowest status first. */
export function currentStock(inventory = [], locationId = "all") {
	return inventory
		.map((item) => {
			const qty = locationId && locationId !== "all" ? locationStock(item, locationId) : Number(item.qty) || 0;
			const reorder = Number(item.reorder) || 0;
			return { name: item.name + (item.sizeName ? " (" + item.sizeName + ")" : ""), unit: item.unit || "each", qty, reorder, status: stockStatus({ qty, reorder }) };
		})
		.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name));
}

/**
 * `day` is YYYY-MM-DD. `data` holds the (location-scoped) sales, cash shifts and time entries plus users, inventory, stock
 * movements, open orders, cart voids and the support audit.
 */
export function endOfDayReport({ day, business = "", locationName = "", locationId = "all", sales = [], cashShifts = [], timeEntries = [], users = [], inventory = [], stockMovements = [], openOrders = [], voidOrders = [], supportAudit = [] }) {
	const range = { from: day, to: day };
	const d = reportData(sales, range);
	const k = reportKpis(d);
	const units = d.items.reduce((a, x) => a + x.qty, 0);
	const refunds = refundRows(sales, users).filter((r) => r.date === day);
	const voids = voidRows({ sales, voidOrders, openOrders, audit: supportAudit, users, locationId }).filter((r) => r.date === day);
	const shifts = closedShiftsInRange(cashShifts, range);
	const hours = staffHours(timeEntries, users, range);
	const open = openOrders.filter((o) => o.status === "open" && inLocation(o, locationId));
	const stock = currentStock(inventory, locationId);
	const movements = stockMovements.filter((m) => String(m.at || "").slice(0, 10) === day && inLocation(m, locationId));
	const moved = {};
	movements.forEach((m) => {
		const row = moved[m.itemName || m.itemId] || (moved[m.itemName || m.itemId] = { name: m.itemName || "Item", in: 0, out: 0 });
		if (m.change > 0) row.in += m.change;
		else row.out -= m.change;
	});
	const low = stock.filter((x) => x.status !== "In stock").length;
	const refunded = refunds.reduce((a, r) => a + r.total, 0);
	return {
		title: `End of Day Report ${day}`,
		business,
		subtitle: day + (locationName ? " · " + locationName : ""),
		kpis: [
			{ label: "Transactions", value: d.sales.length },
			{ label: "Revenue", value: money(k.revenue) },
			{ label: "Gross Profit", value: money(k.profit) },
			{ label: "Average Sale", value: money(d.sales.length ? k.revenue / d.sales.length : 0) },
			{ label: "Items Sold", value: units },
			{ label: "Low / Out of Stock", value: low },
		],
		sections: [
			{ title: "Sales by Payment Type", head: ["Payment", "Amount"], rows: Object.entries(k.payments).sort((a, b) => b[1] - a[1]).map(([name, v]) => [name, money(v)]), empty: "No payments today." },
			{ title: "Sales by Item", head: ["Item", "Units", "Revenue", "Cost", "Gross Profit"], rows: d.items.map((x) => [x.name, x.qty, money(x.revenue), money(x.cost), money(x.revenue - x.cost)]), empty: "No item sales today." },
			{ title: "Sales by Modifier", head: ["Group", "Option", "Units", "Extra charged"], rows: d.modifiers.map((x) => [x.group, x.option, x.qty, money(x.extra)]), empty: "No modifier sales today." },
			{ title: "Refunds", note: refunds.length ? refunds.length + " refunds · " + money(refunded) : "", head: ["Time", "Receipt", "Payment", "Authorised by", "Reason", "Amount"], rows: refunds.map((r) => [time(r.at), r.receipt, r.payment, r.authorizedBy, r.reason || "—", money(r.total)]), empty: "No refunds today." },
			{ title: "Voids and Cleared Carts", head: ["Time", "Type", "Receipt", "By", "Reason", "Amount"], rows: voids.map((r) => [time(r.at), r.kind, r.receipt, r.by, r.reason || "—", money(r.total)]), empty: "No voids today." },
			{ title: "Open Orders Not Yet Paid", head: ["Order", "Opened", "Items"], rows: open.map((o) => [o.orderReference || o.orderNumber, time(o.openedAt), (o.lines || []).filter((l) => !l.isDiscount && !l.isServiceCharge).reduce((a, l) => a + l.qty, 0)]), empty: "No open orders." },
			{ title: "Cash Register Reconciliation", head: ["User", "Closed", "Expected", "Actual", "Variance"], rows: shifts.map((x) => [users.find((u) => u.id === x.userId)?.name || "Unknown", time(x.closedAt), money(x.expectedCash), money(x.actualCash), money(x.variance)]), empty: "No registers closed today." },
			{ title: "Staff Hours", head: ["Staff", "Hours", "Break"], rows: hours.map((x) => [x.name, (x.work / 3600000).toFixed(2), (x.break / 3600000).toFixed(2)]), empty: "No staff hours today." },
			{ title: "Stock Movements Today", head: ["Item", "In", "Out"], rows: Object.values(moved).sort((a, b) => a.name.localeCompare(b.name)).map((x) => [x.name, x.in, x.out]), empty: "No stock movements today." },
			{ title: "Current Stock", note: low ? low + " items are low or out of stock." : "", head: ["Item", "Unit", "In stock", "Reorder at", "Status"], rows: stock.map((x) => [x.name, x.unit, x.qty, x.reorder, x.status]), empty: "No items are counted in stock." },
		],
	};
}
