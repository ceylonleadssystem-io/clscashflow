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
		"tables",
		"products",
		"modifiers",
		"stations",
		"customers",
		"crm",
		"sales",
		"receipts",
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
		"tables",
		"products",
		"modifiers",
		"stations",
		"customers",
		"crm",
		"sales",
		"receipts",
		"inventory",
		"industry",
		"staff",
		"settings",
	],
	accountant: ["dashboard", "sales", "receipts", "reports", "inventory", "industry", "staff", "settings"],
	cashier: ["checkout", "orders", "tables", "receipts", "customers", "staff", "settings"],
};
ROLE_VIEWS.admin = ROLE_VIEWS.owner.slice();

export const VIEW_TITLES = {
	dashboard: ["Dashboard", "Sales, customers and profit at a glance"],
	checkout: ["Checkout", "Create a new counter sale"],
	orders: ["Order Queue", "Open checks, tables and kitchen sending"],
	tables: ["Table Layout", "Floor plan: seat guests and open table checks"],
	products: [
		"Products & Services",
		"Manage items, pricing, images and categories",
	],
	modifiers: ["Modifiers", "Sizes, flavours and add-on choices"],
	stations: ["Stations", "Kitchen printers and Kitchen Displays"],
	customers: ["Customers", "Customer directory and purchase history"],
	crm: ["CRM & Feedback", "Customer relationships and feedback requests"],
	sales: ["Sales History", "Receipts, revenue and profit"],
	receipts: ["Receipts & Refunds", "Reprint, download, refund or void a receipt"],
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

/**
 * Sidebar order + glyph labels. `group` is a heading shown above the first item of each group; an item
 * without a group (Settings) after a group is separated by a divider.
 */
export const NAV_ITEMS = [
	{ view: "checkout", label: "▣ Checkout" },
	{ view: "orders", label: "☰ Order Queue" },
	{ view: "tables", label: "▦ Table Layout" },
	{ view: "receipts", label: "⎙ Receipts & Refunds" },
	// Products & Services, Modifiers and Stations now live in Settings (Menu Admin and Device Manager): see SETTINGS_PAGE_OF_VIEW
	{ view: "inventory", label: "▥ Inventory & Stock", group: "Inventory" },
	{ view: "industry", label: "✦ Business Tools", group: "Inventory" },
	{ view: "sales", label: "↗ Sales History", group: "Reports" },
	{ view: "reports", label: "▤ Reports", group: "Reports" },
	{ view: "customers", label: "♙ Customers", group: "Customer Relationship" },
	{ view: "crm", label: "♡ CRM & Feedback", group: "Customer Relationship" },
	{ view: "staff", label: "◷ Staff & Shifts", group: "User management" },
	{ view: "settings", label: "⚙ Settings" },
];

/** Views that moved into Settings: opening one opens that Settings page instead. */
export const SETTINGS_PAGE_OF_VIEW = { products: "items", modifiers: "modifiers", stations: "stations" };

export const FULL_SETTINGS_ROLES = ["owner", "manager", "admin"];
export const MANAGER_ROLES = ["owner", "manager"];
export const REPORTING_ROLES = ["owner", "admin", "manager", "accountant"];
export const OWNER_ROLES = ["owner", "admin"];
