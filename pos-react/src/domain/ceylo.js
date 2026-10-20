/**
 * Ceylo setup checks (pure). Reads the business's settings and data already on the device and returns one result per check:
 *   { id, area, title, status: "ok" | "warn" | "problem" | "skip", text, fix: { view, tab? } | null }
 * Nothing is changed and nothing secret (PINs, keys, customer data) is put into the text.
 * See docs/reference/ceylo-setup-checker.html for the product description.
 */
import { KITCHEN_TYPES } from "../config/presets";
import { APPROVER_ROLES } from "./salesLog";
import { accessAllowed, billingWarning } from "../services/billing";
import { usageOf } from "../config/subscription";

const WEAK_PINS = new Set(["0000", "1111", "1234", "4321", "1212", "9999"]);
const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");
const isEmbedded = (v) => typeof v === "string" && v.startsWith("data:");

/**
 * input: { settings, users, locations, products, features (enabled map), subscription (or null), billingProfile (or null),
 *          cloudState ("synced" | "syncing" | "offline" | "retry" | ""), cloud (bool: signed in to the cloud), kds: { paired, connected } }
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
	if (!products.length) add("menu", "Menu", "There are no products yet", "problem", "Nothing can be sold until the menu has at least one item.", MENU);
	else {
		const free = products.filter((p) => !(Number(p.price) > 0)).length;
		const loose = products.filter((p) => !String(p.category || "").trim()).length;
		if (free) add("menu-prices", "Menu", plural(free, "product") + " at LKR 0", "warn", "They will ring up free at the till. Check the price is meant to be zero.", MENU);
		if (loose) add("menu-categories", "Menu", plural(loose, "product") + " without a category", "warn", "They are hard to find on the checkout screen.", MENU);
		if (!free && !loose) add("menu", "Menu", plural(products.length, "product") + ", all priced and categorised", "ok", "");
	}

	// printing
	const PRINT = { view: "settings", tab: "printing" };
	if (/epson/i.test(String(s.printerType || "")) && !String(s.printerAddress || "").trim()) add("printer-address", "Receipt printing", "Network printer has no address", "warn", "Receipts cannot reach the printer until its IP address is set.", PRINT);
	else add("printer-address", "Receipt printing", "Receipt printer is set up", "ok", "");
	if (kitchen && on("checkout.kitchenTickets")) {
		if (!String(s.kotPrinter || "").trim()) add("kot-printer", "Receipt printing", "Kitchen printer name is empty", "warn", "Kitchen tickets (KOT) will print on the receipt printer instead of the kitchen.", PRINT);
		else add("kot-printer", "Receipt printing", "Kitchen printer is set", "ok", "");
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
	if (!users.some((u) => APPROVER_ROLES.includes(u.role))) add("approver", "Users", "No active owner or manager", "problem", "Nobody can approve refunds or voids.", USERS);
	else add("approver", "Users", "An owner or manager can approve refunds and voids", "ok", "");
	const noPin = users.filter((u) => !String(u.pin || "").trim()).length;
	const weak = users.filter((u) => WEAK_PINS.has(String(u.pin || "").trim())).length;
	if (noPin) add("pins-missing", "Users", plural(noPin, "user") + " without a PIN", "warn", "They cannot sign in to the POS.", USERS);
	if (weak) add("pins-weak", "Users", plural(weak, "user") + (weak === 1 ? " has" : " have") + " an easy-to-guess PIN", "warn", "Anyone could sign in as them. Ask them to choose a different PIN.", USERS);
	if (!noPin && !weak) add("pins", "Users", "Every user has their own PIN", "ok", "");

	// locations
	if (on("business.locations")) {
		const ids = new Set(locations.map((l) => l.id));
		const unnamed = locations.filter((l) => l.active !== false && !String(l.name || "").trim()).length;
		const orphan = users.filter((u) => u.locationAccess === "selected" && (Array.isArray(u.locationIds) ? u.locationIds : []).some((id) => !ids.has(id))).length;
		if (unnamed) add("location-names", "Locations", plural(unnamed, "location") + " without a name", "warn", "Staff choose locations by name when they sign in.", BUSINESS);
		if (orphan) add("location-users", "Locations", plural(orphan, "user") + " linked to a removed location", "warn", "Check which locations they may use.", USERS);
		if (!unnamed && !orphan) add("locations", "Locations", plural(locations.filter((l) => l.active !== false).length, "active location"), "ok", "");
	}

	// plan limits
	const sub = input.subscription;
	if (sub) {
		const u = usageOf(sub, input.users, locations);
		const limit = (id, noun, used, max) => {
			if (max == null) return add(id, "Plan", noun[0].toUpperCase() + noun.slice(1) + "s: no limit on your plan", "ok", "");
			const label = used + " of " + max + " " + noun + "s on your " + (sub.name ? sub.name + (/plan$/i.test(sub.name) ? "" : " plan") : "plan");
			if (used > max) add(id, "Plan", label, "problem", "You are over your plan. Deactivate some " + noun + "s or ask Ceylonry to change your plan.", { view: "settings", tab: "plan" });
			else if (max > 1 && max - used <= 1) add(id, "Plan", label, "warn", used >= max ? "You cannot add another " + noun + "." : "You can add one more " + noun + ".", { view: "settings", tab: "plan" });
			else add(id, "Plan", label, "ok", "");
		};
		limit("plan-users", "user", u.users, u.maxUsers);
		limit("plan-locations", "location", u.locations, u.maxLocations);
	}

	// subscription (needs the cloud profile)
	const p = input.billingProfile;
	if (p) {
		if (!accessAllowed(p)) add("subscription", "Subscription", "Subscription has ended", "problem", "Renew under Settings › Plan & Support to keep using the POS.", { view: "settings", tab: "plan" });
		else {
			const warning = billingWarning(p);
			if (warning) add("subscription", "Subscription", "Payment or trial ending soon", "warn", warning, { view: "settings", tab: "plan" });
			else add("subscription", "Subscription", "Subscription is up to date", "ok", "");
		}
	}

	// cloud sync
	if (input.cloud) {
		const st = input.cloudState;
		if (st === "retry") add("sync", "Cloud sync", "Cloud sync is failing", "problem", "Changes on this device are not reaching your other devices. Tap the red sync icon to retry.", null);
		else if (st === "offline") add("sync", "Cloud sync", "This device is offline", "warn", "Sales are saved here and upload when the connection returns.", null);
		else add("sync", "Cloud sync", "Cloud sync is working", "ok", "");
	}

	// images kept inside the business data make every sync slower
	const embedded = products.filter((x) => isEmbedded(x.image)).length + (isEmbedded(s.logo) ? 1 : 0);
	if (input.cloud && embedded) add("images", "Images", plural(embedded, "image") + " not yet in cloud storage", "warn", "They make every sync slower. Use “Move saved images to cloud storage”.", BUSINESS);

	return out;
}

/** Counts and the order to show results in: problems, then warnings, then passed. */
export function summarize(results) {
	const by = (st) => results.filter((r) => r.status === st);
	const problems = by("problem"), warnings = by("warn"), passed = by("ok");
	return { problems, warnings, passed, checked: problems.length + warnings.length + passed.length, mood: problems.length || warnings.length ? "alert" : "glad" };
}
