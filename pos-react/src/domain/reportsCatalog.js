/**
 * Reports catalogue: the report groups shown as boxes on the Reports page and as the left navigation once one is opened,
 * the sub-reports of each group, and which groups a role / location setup may see. Pure data plus `visibleGroups`.
 * Keys follow the Ceylonry POS Reports specification (route keys like sales/order-type).
 */
export const REPORT_GROUPS = [
	{ key: "dashboard", title: "Dashboard", icon: "▦", blurb: "Today at a glance: sales, payments, registers, staff and cash.", subs: [] },
	{
		key: "sales",
		title: "Sales",
		icon: "↗",
		blurb: "Sales by payment type, order type, employee, register, discounts and channel.",
		subs: [
			{ key: "overview", title: "Overview" },
			{ key: "payment-type", title: "Payment Type" },
			{ key: "order-type", title: "Order Type" },
			{ key: "employee", title: "Employee" },
			{ key: "register", title: "Register" },
			{ key: "zone", title: "Zone" },
			{ key: "revenue-center", title: "Revenue Center" },
			{ key: "discounts", title: "Discounts" },
			{ key: "in-store-channels", title: "In-Store Channels" },
		],
	},
	{
		key: "menu",
		title: "Menu",
		icon: "□",
		blurb: "Sales by category, product mix, best sellers and modifiers.",
		subs: [
			{ key: "sales-category", title: "Sales Category" },
			{ key: "product-category", title: "Product Category" },
			{ key: "product-mix", title: "Product Mix (Items)" },
			{ key: "modifier-sales", title: "Modifier Sales" },
		],
	},
	{
		key: "payroll",
		title: "Payroll",
		icon: "◷",
		blurb: "Hours worked per employee and the cash each employee handled.",
		subs: [
			{ key: "labor-costs", title: "Labor Costs" },
			{ key: "tips-cash", title: "Tips & Cash" },
		],
	},
	{ key: "sales-vs-labor", title: "Sales vs Labor", icon: "⇅", blurb: "Net sales against hours worked, by day.", subs: [] },
	{
		key: "payments",
		title: "Payments",
		icon: "▭",
		blurb: "Card deposits, transactions and processing fees.",
		subs: [
			{ key: "credit-card-deposits", title: "Credit Card Deposits" },
			{ key: "credit-card-transactions", title: "Credit Card Transactions" },
			{ key: "credit-card-summary", title: "Credit Card Summary" },
		],
	},
	{ key: "loyalty", title: "Loyalty", icon: "♡", blurb: "Customer engagement and spend.", subs: [] },
	{
		key: "gift-cards",
		title: "Gift Cards",
		icon: "✦",
		blurb: "Active gift cards, balances and transactions.",
		subs: [
			{ key: "balances", title: "Balances" },
			{ key: "transactions", title: "Transactions" },
		],
	},
	{ key: "taxes", title: "Taxes", icon: "%", blurb: "Tax types, rates, taxable sales and tax collected.", subs: [] },
	{
		key: "kitchen",
		title: "Kitchen Operations",
		icon: "♨",
		blurb: "Kitchen tickets and items by station.",
		subs: [
			{ key: "tickets-by-station", title: "Tickets by Station" },
			{ key: "tickets-by-fulfillment", title: "Tickets by Fulfillment" },
			{ key: "ticket-details", title: "Ticket Details" },
			{ key: "item-details", title: "Item Details" },
		],
	},
	{
		key: "transactions",
		title: "Transactions",
		icon: "☰",
		blurb: "Every sale, refund, void, discount and cash event.",
		subs: [
			{ key: "sales-refunds", title: "Sales & Refunds" },
			{ key: "voids-deletes", title: "Voids & Deletes" },
			{ key: "discounts-comps", title: "Discounts & Comps" },
			{ key: "cash-log", title: "Cash Log" },
		],
	},
	{
		key: "audit-trail",
		title: "Audit Trail",
		icon: "⌕",
		blurb: "Who moved stock and who changed timesheets.",
		subs: [
			{ key: "transfer", title: "Transfer Report" },
			{ key: "timesheet-audit", title: "Timesheet Audit" },
		],
	},
	{
		key: "multi-location",
		title: "Multi-Location",
		icon: "⌂",
		blurb: "Compare every location side by side.",
		subs: [
			{ key: "summary", title: "Summary" },
			{ key: "sales", title: "Sales" },
			{ key: "online-orders", title: "Online Orders" },
			{ key: "voids", title: "Voids" },
		],
	},
	{ key: "end-of-day", title: "End of Day & Overview", icon: "▤", blurb: "The full-day End of Day report, item sales, registers, staff hours and customer intelligence.", subs: [] },
];

export const groupOf = (key) => REPORT_GROUPS.find((g) => g.key === key) || null;
export const subOf = (group, sub) => groupOf(group)?.subs.find((s) => s.key === sub) || null;

/** Roles that may open Payroll (Payments is hidden anyway until a card processor is connected). */
const MANAGER_ONLY = ["payroll", "payments"];
const PAYROLL_ROLES = ["owner", "admin", "manager"];

/**
 * The groups this user sees. `modules` says what the business has switched on:
 * { kitchen: kitchen tickets / KDS, locations: number of active locations, payments, loyalty }.
 * Payments and Loyalty need their own module; Kitchen Operations needs kitchen tickets; Multi-Location needs 2 or more locations.
 */
export function visibleGroups({ role = "", modules = {} } = {}) {
	return REPORT_GROUPS.filter((g) => {
		if (MANAGER_ONLY.includes(g.key) && !PAYROLL_ROLES.includes(role)) return false;
		if (g.key === "payments") return !!modules.payments;
		if (g.key === "loyalty") return !!modules.loyalty;
		if (g.key === "kitchen") return !!modules.kitchen;
		if (g.key === "multi-location") return (modules.locations || 0) >= 2;
		return true;
	});
}

/** First sub-report key of a group ("" for groups that are a single page). */
export const firstSub = (group) => groupOf(group)?.subs[0]?.key || "";
