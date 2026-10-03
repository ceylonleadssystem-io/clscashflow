/**
 * Role-based access: which pages each role can open, page titles/subtitles, the sidebar order and
 * labels (NAV_ITEMS) and the role groups used for settings, management, reporting and ownership checks.
 */
/**
 * Role based access. `roleViews` is the final (post-upgrade) mapping taken from
 * the original application; the admin dashboard can additionally switch whole
 * views off for every role through feature flags.
 */
export const ROLES = ["cashier", "manager", "accountant", "admin", "owner"];

export const ROLE_VIEWS = {
	owner: [
		"dashboard",
		"checkout",
		"orders",
		"products",
		"modifiers",
		"customers",
		"crm",
		"sales",
		"reports",
		"inventory",
		"industry",
		"staff",
		"settings",
	],
	manager: [
		"dashboard",
		"checkout",
		"orders",
		"products",
		"modifiers",
		"customers",
		"crm",
		"sales",
		"inventory",
		"industry",
		"staff",
		"settings",
	],
	accountant: ["dashboard", "sales", "reports", "inventory", "industry", "staff", "settings"],
	cashier: ["checkout", "orders", "customers", "staff", "settings"],
};
ROLE_VIEWS.admin = ROLE_VIEWS.owner.slice();

export const VIEW_TITLES = {
	dashboard: ["Dashboard", "Sales, customers and profit at a glance"],
	checkout: ["Checkout", "Create a new counter sale"],
	orders: ["Order Queue", "Open checks, tables and kitchen sending"],
	products: [
		"Products & Services",
		"Manage items, pricing, images and categories",
	],
	modifiers: ["Modifiers", "Sizes, flavours and add-on choices"],
	customers: ["Customers", "Customer directory and purchase history"],
	crm: ["CRM & Feedback", "Customer relationships and feedback requests"],
	sales: ["Sales History", "Receipts, revenue and profit"],
	reports: ["Reports", "Financial and operational performance"],
	inventory: [
		"Inventory & Stock",
		"Ingredients, product stock and automatic recipe usage",
	],
	industry: [
		"Business Tools",
		"Appointments, memberships, commissions and pharmacy records",
	],
	staff: ["Staff & Shifts", "Attendance, breaks, access and cash reconciliation"],
	settings: ["Settings", "Business, printing and support preferences"],
};

/** Sidebar order + glyph labels, exactly as shown by the original POS. */
export const NAV_ITEMS = [
	{ view: "dashboard", label: "▦ Dashboard" },
	{ view: "checkout", label: "▣ Checkout" },
	{ view: "orders", label: "☰ Order Queue" },
	{ view: "products", label: "□ Products & Services" },
	{ view: "modifiers", label: "＋ Modifiers" },
	{ view: "customers", label: "♙ Customers" },
	{ view: "crm", label: "♡ CRM & Feedback" },
	{ view: "sales", label: "↗ Sales History" },
	{ view: "reports", label: "▤ Reports" },
	{ view: "inventory", label: "▥ Inventory & Stock" },
	{ view: "industry", label: "✦ Business Tools" },
	{ view: "staff", label: "◷ Staff & Shifts" },
	{ view: "settings", label: "⚙ Settings" },
];

export const FULL_SETTINGS_ROLES = ["owner", "manager", "admin"];
export const MANAGER_ROLES = ["owner", "manager"];
export const REPORTING_ROLES = ["owner", "admin", "manager", "accountant"];
export const OWNER_ROLES = ["owner", "admin"];
