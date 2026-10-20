/**
 * Ceylo setup checks (pure). Reads the business's settings and data already on the device and returns one result per check:
 *   { id, area, title, status: "ok" | "warn" | "problem" | "skip", text, fix: { view, tab? } | null }
 * Nothing is changed and nothing secret (PINs, keys, customer data) is put into the text. A check whose feature the administrator
 * switched off is not run at all, so Ceylo never suggests something the business cannot use.
 * See docs/reference/ceylo-setup-checker.html for the product description.
 */
import { KITCHEN_TYPES } from "../config/presets";
import { APPROVER_ROLES } from "./salesLog";
import { emailError } from "./validators";
import { layoutFor } from "./tables";

/** Shops that sell barcoded goods: Ceylo also checks the barcode scanner and the label printer for them. */
export const RETAIL_TYPES = ["retail", "grocery", "hardware", "pharmacy"];
const WEAK_PINS = new Set(["0000", "1111", "1234", "4321", "1212", "9999"]);
const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");
const isEmbedded = (v) => typeof v === "string" && v.startsWith("data:");
const HOUR = 3600000;
const isWebLink = (v) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(String(v || "").trim());
const ago = (iso, now) => now - (Date.parse(iso || "") || now);
/** How many values appear more than once (ignoring blanks and case). */
const repeats = (values) => {
	const seen = new Map();
	values.map((v) => String(v || "").trim().toLowerCase()).filter(Boolean).forEach((v) => seen.set(v, (seen.get(v) || 0) + 1));
	return [...seen.values()].filter((n) => n > 1).length;
};

/**
 * Plan limits and subscription/payment status are not checked here (the POS shows those itself in Settings > Plan & Support).
 * input: { settings, users, locations, products, features (enabled map),
 *          cloudState ("synced" | "syncing" | "offline" | "retry" | ""), cloud (bool: signed in to the cloud), kds: { paired, connected },
 *          printers: { receipt: connected?, label: connected? } (USB devices on this device),
 *          scanner: { connected (USB scanner), lastScanAt (ms, last scanner-speed scan on this device) },
 *          customers, inventory, modifiers, openOrders, timeEntries, cashShifts (the business data lists), locationId (this device), now }
 */
export function runSetupChecks(input) {
	const s = input.settings || {};
	const users = (input.users || []).filter((u) => u.active !== false);
	const locations = input.locations || [];
	const products = input.products || [];
	const on = (id) => !!input.features?.[id];
	const kitchen = KITCHEN_TYPES.includes(s.businessType);
	const out = [];
	const add = (id, area, title, status, text, fix = null) => out.push({ id, area, title, status, text, fix });
	const BUSINESS = { view: "settings", tab: "business" };

	// business profile
	if (!String(s.business || "").trim()) add("business-name", "Business profile", "Business name is missing", "problem", "Receipts and invoices will show a blank business name.", BUSINESS);
	else add("business-name", "Business profile", "Business name is set", "ok", s.business);
	const missing = [!String(s.address || "").trim() && "address", !String(s.email || "").trim() && "email", on("settings.businessLogo") && !s.logo && "logo"].filter(Boolean);
	if (missing.length) add("business-details", "Business profile", "Business " + missing.join(", ") + (missing.length === 1 ? " is" : " are") + " missing", "warn", "Customers see these on receipts and invoices.", BUSINESS);
	else add("business-details", "Business profile", "Address, email and logo are set", "ok", "");
	if (String(s.email || "").trim() && emailError(s.email)) add("business-email", "Business profile", "Business email looks wrong", "warn", "Receipts and feedback e-mails may not reach customers. Check the spelling.", BUSINESS);

	// POS setup
	if (!s.businessType) add("pos-type", "POS setup", "Business type is not chosen", "warn", "The POS uses it to suggest features such as tables and kitchen tickets.", { view: "settings", tab: "pos" });
	else add("pos-type", "POS setup", "Business type is chosen", "ok", "");
	if (s.serviceChargeEnabled && on("checkout.serviceCharge")) {
		const rate = Number(s.serviceChargeRate) || 0;
		if (rate <= 0) add("service-charge", "POS setup", "Service charge is on but set to 0 %", "warn", "Bills will show a service charge line with no amount.", { view: "settings", tab: "pos" });
		else add("service-charge", "POS setup", "Service charge is " + rate + " %", "ok", "");
	}

	// menu
	const MENU = { view: "products" };
	const menuOn = on("view.products");
	if (menuOn && !products.length) add("menu", "Menu", "There are no products yet", "problem", "Nothing can be sold until the menu has at least one item.", MENU);
	else if (menuOn) {
		const free = products.filter((p) => !(Number(p.price) > 0)).length;
		const loose = products.filter((p) => !String(p.category || "").trim()).length;
		if (free) add("menu-prices", "Menu", plural(free, "product") + " at LKR 0", "warn", "They will ring up free at the till. Check the price is meant to be zero.", MENU);
		if (loose) add("menu-categories", "Menu", plural(loose, "product") + " without a category", "warn", "They are hard to find on the checkout screen.", MENU);
		if (!free && !loose) add("menu", "Menu", plural(products.length, "product") + ", all priced and categorised", "ok", "");
	}

	// printing
	const PRINT = { view: "settings", tab: "printing" };
	const printers = input.printers || {};
	if (on("checkout.printReceipt")) {
		const type = String(s.printerType || "system");
		if (type === "usb-direct" && on("hardware.usbPrinter")) {
			if (!s.usbPrinter || !Object.keys(s.usbPrinter).length) add("receipt-printer", "Printing", "USB receipt printer is chosen but not set up", "problem", "Receipts cannot print until the printer is connected once under Receipt Printing.", PRINT);
			else if (!printers.receipt) add("receipt-printer", "Printing", "USB receipt printer is not connected", "warn", "Check the cable and power, then tap Connect USB Printer on this device.", PRINT);
			else add("receipt-printer", "Printing", "USB receipt printer is connected", "ok", "");
		} else if (printers.receipt) add("receipt-printer", "Printing", "USB receipt printer is connected", "ok", "");
		else if (/epson/i.test(type) && !String(s.printerAddress || "").trim()) add("receipt-printer", "Printing", "Epson network printer has no address", "warn", "Receipts cannot reach the printer until its IP address is set.", PRINT);
		// the browser cannot see system (Bluetooth / driver) or network printers, so say so instead of guessing
		else add("receipt-printer", "Printing", (/epson/i.test(type) ? "Epson network printer" : "System printer") + " is set (Ceylo cannot see if it is switched on: print a test receipt to check)", "ok", "");
	}
	if (kitchen && on("checkout.kitchenTickets")) {
		if (!String(s.kotPrinter || "").trim()) add("kot-printer", "Printing", "Kitchen printer name is empty", "warn", "Kitchen tickets (KOT) will print on the receipt printer instead of the kitchen.", PRINT);
		else add("kot-printer", "Printing", "Kitchen printer is set", "ok", "");
	}
	// shops always need the label printer; other businesses only once they have set one up, so they are not nagged
	const retail = RETAIL_TYPES.includes(s.businessType);
	const labelSetUp = !!(s.barcodePrinter && Object.keys(s.barcodePrinter).length);
	if (on("hardware.labelPrinter") && (retail || labelSetUp)) {
		if (printers.label) add("label-printer", "Printing", "Label printer is connected", "ok", "");
		else if (!labelSetUp) add("label-printer", "Printing", "No label printer set up", "warn", "Connect the USB label printer under Receipt Printing to print barcode and price labels.", PRINT);
		else add("label-printer", "Printing", "Label printer is not connected", "warn", "Barcode labels cannot print on this device until it is reconnected.", PRINT);
	}
	if (retail && on("hardware.barcodeScanner")) {
		const scan = input.scanner || {};
		const recent = scan.lastScanAt && (input.now || Date.now()) - scan.lastScanAt < 7 * 24 * 3600000;
		if (scan.connected) add("barcode-scanner", "Printing", "USB barcode scanner is connected", "ok", "");
		else if (recent) add("barcode-scanner", "Printing", "Barcode scanner worked on this device in the last 7 days", "ok", "");
		else add("barcode-scanner", "Printing", "No barcode scanner seen on this device", "warn", "Connect a USB scanner under Receipt Printing, or scan any product on the checkout screen to test a keyboard-style scanner.", PRINT);
	}

	// kitchen display
	if (kitchen && on("checkout.kds")) {
		const kds = input.kds || {};
		if (!kds.paired) add("kds", "Kitchen display", "Kitchen display is not paired", "problem", "Kitchen orders will not reach the kitchen screen. Pair it with the code shown on /KDS.", { view: "settings", tab: "kds" });
		else if (!kds.connected) add("kds", "Kitchen display", "Kitchen display is paired but not connected", "warn", "Check the kitchen screen is on, open at /KDS and on the same Wi-Fi.", { view: "settings", tab: "kds" });
		else add("kds", "Kitchen display", "Kitchen display is connected", "ok", "");
	}

	// users and roles
	const USERS = { view: "staff" };
	const reversals = on("sales.refunds") || on("sales.voids");
	if (reversals && !users.some((u) => APPROVER_ROLES.includes(u.role))) add("approver", "Users", "No active owner or manager", "problem", "Nobody can approve refunds or voids.", USERS);
	else if (reversals) add("approver", "Users", "An owner or manager can approve refunds and voids", "ok", "");
	const staffOn = on("staff.users");
	const noPin = !staffOn ? 0 : users.filter((u) => !String(u.pin || "").trim()).length;
	const weak = !staffOn ? 0 : users.filter((u) => WEAK_PINS.has(String(u.pin || "").trim())).length;
	if (noPin) add("pins-missing", "Users", plural(noPin, "user") + " without a PIN", "warn", "They cannot sign in to the POS.", USERS);
	if (weak) add("pins-weak", "Users", plural(weak, "user") + (weak === 1 ? " has" : " have") + " an easy-to-guess PIN", "warn", "Anyone could sign in as them. Ask them to choose a different PIN.", USERS);
	if (staffOn && !noPin && !weak) add("pins", "Users", "Every user has their own PIN", "ok", "");

	// locations
	if (on("business.locations")) {
		const ids = new Set(locations.map((l) => l.id));
		const unnamed = locations.filter((l) => l.active !== false && !String(l.name || "").trim()).length;
		const orphan = !on("staff.users") ? 0 : users.filter((u) => u.locationAccess === "selected" && (Array.isArray(u.locationIds) ? u.locationIds : []).some((id) => !ids.has(id))).length;
		if (unnamed) add("location-names", "Locations", plural(unnamed, "location") + " without a name", "warn", "Staff choose locations by name when they sign in.", BUSINESS);
		if (orphan) add("location-users", "Locations", plural(orphan, "user") + " linked to a removed location", "warn", "Check which locations they may use.", USERS);
		if (!unnamed && !orphan) add("locations", "Locations", plural(locations.filter((l) => l.active !== false).length, "active location"), "ok", "");
	}

	// day-to-day housekeeping: things left open, stock, duplicates
	const now = input.now || Date.now();
	const STAFF = { view: "staff" };
	if (on("staff.cashRegister")) {
		const stale = (input.cashShifts || []).filter((x) => x.status === "open" && ago(x.openedAt, now) > 24 * HOUR).length;
		if (stale) add("register-open", "Daily routine", plural(stale, "cash register") + " left open for more than a day", "warn", "Close the register at the end of each day so the cash count matches the sales.", STAFF);
		else add("register-open", "Daily routine", "No cash register left open overnight", "ok", "");
	}
	if (on("staff.attendance")) {
		const stale = (input.timeEntries || []).filter((x) => x.clockIn && !x.clockOut && ago(x.clockIn, now) > 16 * HOUR).length;
		if (stale) add("clocked-in", "Daily routine", plural(stale, "staff member") + " still clocked in after 16 hours", "warn", "They probably forgot to clock out, so their hours will be wrong.", STAFF);
	}
	if (on("checkout.openOrders")) {
		const stale = (input.openOrders || []).filter((x) => (x.status || "open") === "open" && ago(x.openedAt || x.createdAt, now) > 12 * HOUR).length;
		if (stale) add("open-orders", "Daily routine", plural(stale, "open order") + " older than 12 hours", "warn", "Take payment or void them so the order queue and kitchen stay clear.", { view: on("view.orders") ? "orders" : "checkout" });
	}
	if (on("view.inventory")) {
		const low = (input.inventory || []).filter((x) => Number(x.reorder) > 0 && Number(x.qty) <= Number(x.reorder)).length;
		if (low) add("low-stock", "Stock", plural(low, "stock item") + " at or below the reorder level", "warn", "Order more before they run out at the till.", { view: "inventory" });
		else if ((input.inventory || []).length) add("low-stock", "Stock", "Stock is above the reorder levels", "ok", "");
	}
	if (menuOn && products.length) {
		const codes = repeats(products.map((x) => x.barcode).concat(products.map((x) => x.code)));
		const names = repeats(products.map((x) => x.name));
		if (codes) add("duplicate-codes", "Menu", plural(codes, "barcode or item code") + " used on more than one product", "warn", "Scanning or typing that code may add the wrong item.", MENU);
		if (names) add("duplicate-names", "Menu", plural(names, "product name") + " used more than once", "warn", "Staff may pick the wrong item at checkout. Rename or remove the copies.", MENU);
	}
	if (on("view.modifiers")) {
		const empty = (input.modifiers || []).filter((g) => !(Array.isArray(g.options) && g.options.some((o) => String(o?.name || "").trim()))).length;
		if (empty) add("modifiers-empty", "Menu", plural(empty, "modifier group") + " without options", "warn", "They show up at checkout with nothing to choose.", { view: "modifiers" });
	}
	if (on("view.customers")) {
		const dupes = repeats((input.customers || []).map((c) => String(c.phone || "").replace(/\D/g, "").slice(-9)));
		if (dupes) add("customer-phones", "Customers", plural(dupes, "phone number") + " shared by more than one customer", "warn", "Customer lookup and loyalty may pick the wrong person. Merge the duplicates.", { view: "customers" });
	}
	if (on("crm.feedback") && String(s.feedbackLink || "").trim() && !isWebLink(s.feedbackLink)) add("feedback-link", "Customers", "Feedback link is not a web address", "warn", "Feedback e-mails will contain a broken link. It should start with https://.", { view: "settings", tab: "operations" });
	if (on("settings.receiptSocials") && String(s.receiptSocials?.website || "").trim() && !isWebLink(/^https?:/i.test(s.receiptSocials.website) ? s.receiptSocials.website : "https://" + s.receiptSocials.website)) add("receipt-website", "Printing", "Website on receipts looks wrong", "warn", "Customers cannot open it. Check the spelling.", PRINT);
	if (kitchen && on("view.tables") && input.locationId && input.locationId !== "all" && !layoutFor(s, input.locationId).length) add("table-layout", "Restaurant", "This location has no table layout", "warn", "Draw your floor plan so staff can seat guests and open table checks.", { view: "tables" });
	if (on("settings.supportAccess") && s.supportEnabled && Number(s.supportCodeExpiresAt) > now) add("support-access", "Security", "Support access is open", "warn", "Ceylonry support can sign in until " + new Date(Number(s.supportCodeExpiresAt)).toLocaleString() + ". Switch it off when support is done.", { view: "settings", tab: "plan" });
	if (on("business.locations") && on("staff.users")) {
		const reach = (l) => users.some((u) => u.locationAccess !== "selected" || (Array.isArray(u.locationIds) && u.locationIds.includes(l.id)));
		const lonely = locations.filter((l) => l.active !== false && !reach(l)).length;
		if (lonely) add("location-staff", "Locations", plural(lonely, "location") + " with no staff who can sign in", "warn", "Give at least one user access to each location.", USERS);
	}

	// cloud sync
	if (input.cloud && on("settings.cloudBanner")) {
		const st = input.cloudState;
		if (st === "retry") add("sync", "Cloud sync", "Cloud sync is failing", "problem", "Changes on this device are not reaching your other devices. Tap the red sync icon to retry.", null);
		else if (st === "offline") add("sync", "Cloud sync", "This device is offline", "warn", "Sales are saved here and upload when the connection returns.", null);
		else add("sync", "Cloud sync", "Cloud sync is working", "ok", "");
	}

	// images kept inside the business data make every sync slower
	const embedded = products.filter((x) => isEmbedded(x.image)).length + (isEmbedded(s.logo) ? 1 : 0);
	if (input.cloud && embedded && (on("view.products") || on("settings.businessLogo"))) add("images", "Images", plural(embedded, "image") + " not yet in cloud storage", "warn", "They make every sync slower. Use “Move saved images to cloud storage”.", BUSINESS);

	return out;
}

/**
 * Counts and the order to show results in: problems, then warnings, then passed. Problems and warnings the business chose to
 * ignore (settings.ceyloIgnored, by check id) are left out of the counts and listed separately.
 */
export function summarize(results, ignoredIds = []) {
	const skip = new Set(ignoredIds);
	const by = (st) => results.filter((r) => r.status === st && (st === "ok" || !skip.has(r.id)));
	const problems = by("problem"), warnings = by("warn"), passed = by("ok");
	const ignored = results.filter((r) => (r.status === "problem" || r.status === "warn") && skip.has(r.id));
	return { problems, warnings, passed, ignored, checked: problems.length + warnings.length + passed.length + ignored.length, mood: problems.length || warnings.length ? "alert" : "glad" };
}
