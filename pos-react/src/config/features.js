/**
 * Feature registry used by the Admin Dashboard.
 *
 * Every entry is a switch that can be turned on/off for the whole POS
 * (business workspace). Flags are persisted in `settings.features`, therefore
 * they are stored in WatermelonDB and synced through the same cloud payload as
 * every other setting.
 *
 *   id          stable key used in code (`useFeature("checkout.splitBill")`)
 *   group       section in the Admin Dashboard
 *   core        true = the POS cannot work without it (cannot be disabled)
 *   default     value when the admin has never touched the switch
 *   requires    other features that must be enabled for this one to work
 *   legacy      note describing where the original HTML implemented it
 */
export const FEATURE_GROUPS = [
	{ id: "navigation", label: "Screens & navigation", icon: "▦" },
	{ id: "checkout", label: "Checkout & payments", icon: "▣" },
	{ id: "sales", label: "Sales history & returns", icon: "↗" },
	{ id: "catalogue", label: "Catalogue", icon: "□" },
	{ id: "customers", label: "Customers & CRM", icon: "♙" },
	{ id: "inventory", label: "Inventory & locations", icon: "▥" },
	{ id: "staff", label: "Staff & shifts", icon: "◷" },
	{ id: "reports", label: "Reports", icon: "▤" },
	{ id: "hardware", label: "Hardware & printing", icon: "🖨" },
	{ id: "settings", label: "Settings & platform", icon: "⚙" },
	{ id: "shell", label: "Register shell", icon: "⛶" },
	{ id: "industry", label: "Industry tools", icon: "✦" },
];

const f = (id, group, label, description, extra = {}) => ({
	id,
	group,
	label,
	description,
	default: true,
	core: false,
	requires: [],
	...extra,
});

export const FEATURES = [
	// ------------------------------------------------------------ navigation
	f("view.dashboard", "navigation", "Dashboard", "KPIs, best sellers, payment mix, cashflow overview and branch status."),
	f("view.checkout", "navigation", "Checkout", "The sales register screen.", { core: true }),
	f("view.orders", "navigation", "Order Queue", "Open checks, table orders and kitchen sending (Restaurant / Café presets).", { requires: ["checkout.openOrders"] }),
	f("view.products", "navigation", "Products & Services", "Catalogue management: items, prices, categories."),
	f("view.modifiers", "navigation", "Modifiers", "Modifier groups (sizes, flavours, add-ons)."),
	f("view.customers", "navigation", "Customers", "Customer directory and purchase history."),
	f("view.crm", "navigation", "CRM & Feedback", "Segments, birthdays, WhatsApp and feedback requests.", { requires: ["view.customers"] }),
	f("view.sales", "navigation", "Sales History", "Receipts, reprints, downloads and sale actions."),
	f("view.reports", "navigation", "Reports", "Business reports and exports."),
	f("view.inventory", "navigation", "Inventory & Stock", "Stock items, movements and adjustments."),
	f("view.staff", "navigation", "Staff & Shifts", "Attendance, cash register and users."),
	f("view.settings", "navigation", "Settings", "Business, printing, plan and support settings.", { core: true }),

	// -------------------------------------------------------------- checkout
	f("checkout.customerLookup", "checkout", "Customer lookup", "Find a customer by mobile number or add one during checkout.", { requires: ["view.customers"] }),
	f("checkout.discounts", "checkout", "Order discounts", "Percentage / fixed discounts on the current order."),
	f("checkout.serviceCharge", "checkout", "Service charge", "Optional percentage added to bills (Restaurant, Café, Salon, Services).", {}),
	f("checkout.cashTender", "checkout", "Cash received & change", "Cash tender panel with exact-cash button and change calculation."),
	f("checkout.splitBill", "checkout", "Split bill", "Split a bill equally or by custom amounts across payment methods."),
	f("checkout.orderReference", "checkout", "Table / order reference", "Optional reference printed on kitchen tickets and saved with the sale."),
	f("checkout.orderChannels", "checkout", "Order channels", "Dine-in / Takeaway / PickMe / Uber Eats selector (Restaurant, Café).", { requires: ["checkout.orderReference"] }),
	f("checkout.openOrders", "checkout", "Save open orders", "Save an order and recall it later to take payment."),
	f("checkout.kitchenTickets", "checkout", "Kitchen tickets (KOT)", "Send orders to the kitchen and print kitchen order tickets.", { requires: ["checkout.openOrders"] }),
	f("checkout.emailReceipt", "checkout", "E-mail receipt", "Send the receipt to the customer by e-mail (EmailJS)."),
	f("checkout.whatsappReceipt", "checkout", "WhatsApp receipt", "Prepare the receipt as a WhatsApp message."),
	f("checkout.printReceipt", "checkout", "Print receipt after checkout", "Automatic / optional receipt printing."),
	f("checkout.stockGuard", "checkout", "Stock guard", "Block sales of items that are out of stock and show remaining quantity."),
	f("checkout.modeChooser", "checkout", "Mobile / POS checkout chooser", "Lets the operator pick the phone layout or the full POS layout."),

	// ----------------------------------------------------------------- sales
	f("sales.refunds", "sales", "Refunds", "Full and partial refunds with stock restoration.", { requires: ["view.sales"] }),
	f("sales.voids", "sales", "Voids", "Void a completed sale with a reason.", { requires: ["view.sales"] }),
	f("sales.permanentDelete", "sales", "Permanent sale deletion", "Owner/admin can permanently delete refunded or voided sales.", { requires: ["view.sales"] }),
	f("sales.exportCsv", "sales", "Sales CSV export", "Export the sales history.", { requires: ["view.sales"] }),
	f("sales.receiptDownload", "sales", "Receipt download & WhatsApp share", "Download a receipt or share it on WhatsApp from history.", { requires: ["view.sales"] }),

	// ------------------------------------------------------------- catalogue
	f("catalogue.import", "catalogue", "Excel / CSV import", "Import products from Excel, CSV or a Square catalogue.", { requires: ["view.products"] }),
	f("catalogue.subcategories", "catalogue", "Subcategories", "Main categories with subcategories.", { requires: ["view.products"] }),
	f("catalogue.thumbnailView", "catalogue", "Thumbnail view", "Switch the catalogue between list and thumbnail cards.", { requires: ["view.products"] }),
	f("catalogue.imagePositioning", "catalogue", "Image positioning", "Drag / arrow controls to position product images.", { requires: ["view.products"] }),
	f("catalogue.barcodeLabels", "catalogue", "Barcode labels", "Print Code-39/128 labels for products.", { requires: ["view.products"] }),
	f("modifiers.commonPresets", "catalogue", "Common modifier presets", "One-click starter modifier groups.", { requires: ["view.modifiers"] }),

	// ------------------------------------------------------------- customers
	f("customers.discounts", "customers", "Customer next-visit discounts", "Per-customer discount eligibility fields.", { requires: ["view.customers"] }),
	f("crm.whatsapp", "customers", "CRM WhatsApp messages", "Birthday / special WhatsApp messages with communication log.", { requires: ["view.crm"] }),
	f("crm.feedback", "customers", "Feedback requests", "E-mail feedback requests after purchases.", { requires: ["view.crm"] }),
	f("crm.smartCustomer", "customers", "Smart customer panel", "Segment, lifetime value and birthday reward shown at checkout.", { requires: ["view.customers"] }),

	// ------------------------------------------------------------- inventory
	f("inventory.recipes", "inventory", "Recipes / stock usage", "Deduct ingredients automatically when a product is sold.", { requires: ["view.inventory"] }),
	f("inventory.productStock", "inventory", "Sellable product stock", "Automatic stock rows for every non-service product.", { requires: ["view.inventory"] }),
	f("inventory.stockTools", "inventory", "Stock counting tools", "Count-sheet upload and low-stock WhatsApp alerts.", { requires: ["view.inventory"] }),
	f("business.locations", "inventory", "Multiple locations", "Branches, per-location stock, branch selector on login.", {}),
	f("business.branchStock", "inventory", "Branch stock counts", "Owner/admin branch and bulk stock counts (All Locations).", { requires: ["business.locations", "view.inventory"] }),

	// ----------------------------------------------------------------- staff
	f("staff.attendance", "staff", "Clock in / out & breaks", "Attendance tracking.", { requires: ["view.staff"] }),
	f("staff.cashRegister", "staff", "Cash register shifts", "Open/close register with expected vs counted cash.", { requires: ["view.staff"] }),
	f("staff.users", "staff", "User management", "Create, edit and deactivate POS users.", { requires: ["view.staff"] }),
	f("staff.userDeletion", "staff", "Permanent user deletion", "Owner/admin can delete users.", { requires: ["staff.users"] }),
	f("staff.shiftPrompt", "staff", "Start-shift prompt", "Offer clock-in / register opening right after sign-in.", { requires: ["view.staff"] }),

	// ---------------------------------------------------------------- reports
	f("reports.customerIntelligence", "reports", "Customer intelligence", "Customer spend, repeat visits and birthdays in Reports.", { requires: ["view.reports"] }),
	f("reports.export", "reports", "Report CSV export", "Export the selected report period.", { requires: ["view.reports"] }),
	f("dashboard.cashflow", "reports", "Cashflow overview", "Owner/accountant cashflow panel on the dashboard.", { requires: ["view.dashboard"] }),

	// -------------------------------------------------------------- hardware
	f("hardware.usbPrinter", "hardware", "USB receipt printer", "WebUSB ESC/POS direct printing.", {}),
	f("hardware.labelPrinter", "hardware", "USB label printer", "TSPL barcode label printer support.", { requires: ["catalogue.barcodeLabels"] }),
	f("hardware.barcodeScanner", "hardware", "Barcode scanner", "Keyboard-wedge and WebHID scanners add items to the order."),
	f("hardware.headerPrinterButton", "hardware", "Header printer button", "Quick printer connect/test button in the top bar.", { requires: ["hardware.usbPrinter"] }),

	// -------------------------------------------------------------- settings
	f("settings.posSetupWizard", "settings", "POS setup wizard", "First-login preset chooser for owners."),
	f("settings.businessLogo", "settings", "Business logo", "Logo uploader used on screen and receipts."),
	f("settings.themes", "settings", "Appearance themes", "Ceylonry Orange / Graphite / Gold themes."),
	f("settings.receiptSocials", "settings", "Socials & QR on receipt", "Social handles and QR artwork printed on receipts."),
	f("settings.supportAccess", "settings", "Support access code", "Owner-controlled diagnostic access with 24-hour codes."),
	f("settings.billing", "settings", "Billing & subscription widget", "Shared platform billing widget, trial countdown and paywall."),
	f("settings.cloudBanner", "settings", "Cloud sync status banner", "Shows online/offline/synced status."),

	// ----------------------------------------------------------------- shell
	f("shell.fullscreen", "shell", "Full screen / kiosk mode", "Full screen toggle, touch kiosk mode and iOS install guide."),
	f("shell.sidebarToggle", "shell", "Sidebar toggle", "Show / hide menu button."),
	f("shell.sessionButtons", "shell", "Lock POS / Sign out buttons", "Session buttons in the top bar.", { core: true }),

	// -------------------------------------------------------------- industry
	f("industry.tools", "industry", "Business Tools", "Appointments, memberships, prescriptions, medicine batches and staff commissions (Salon / Services / Pharmacy). Hidden in the last release of the legacy POS, so it is OFF by default.", { default: false }),
];

export const FEATURE_MAP = Object.fromEntries(FEATURES.map((x) => [x.id, x]));

/** Default on/off map. */
export function defaultFeatureFlags() {
	return Object.fromEntries(FEATURES.map((x) => [x.id, x.default]));
}

/**
 * Merge the admin's saved flags with defaults and apply dependency rules:
 * a feature only works when its switch AND all of its requirements are on.
 * Returns `{ enabled, raw, blockedBy }`.
 */
export function resolveFeatures(saved = {}) {
	const raw = { ...defaultFeatureFlags() };
	for (const [id, v] of Object.entries(saved || {}))
		if (id in raw) raw[id] = !!v;
	for (const x of FEATURES) if (x.core) raw[x.id] = true;
	const enabled = {};
	const blockedBy = {};
	const visiting = new Set();
	const resolve = (id) => {
		if (id in enabled) return enabled[id];
		if (visiting.has(id)) return false;
		visiting.add(id);
		let on = !!raw[id];
		const missing = [];
		for (const dep of FEATURE_MAP[id]?.requires || []) {
			if (!resolve(dep)) {
				on = false;
				missing.push(dep);
			}
		}
		visiting.delete(id);
		enabled[id] = on;
		if (missing.length) blockedBy[id] = missing;
		return on;
	};
	FEATURES.forEach((x) => resolve(x.id));
	return { enabled, raw, blockedBy };
}

/** Features that (transitively) need `id`. Used to warn before disabling it. */
export function dependentsOf(id) {
	const out = new Set();
	const walk = (target) => {
		for (const x of FEATURES)
			if (x.requires.includes(target) && !out.has(x.id)) {
				out.add(x.id);
				walk(x.id);
			}
	};
	walk(id);
	return [...out];
}

/** Maps legacy navigation views to their feature switch. */
export const VIEW_FEATURE = {
	dashboard: "view.dashboard",
	checkout: "view.checkout",
	orders: "view.orders",
	products: "view.products",
	modifiers: "view.modifiers",
	customers: "view.customers",
	crm: "view.crm",
	sales: "view.sales",
	reports: "view.reports",
	inventory: "view.inventory",
	industry: "industry.tools",
	staff: "view.staff",
	settings: "view.settings",
};
