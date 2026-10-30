/**
 * System Options (pure): the settings pages (Order Entry, Receipts, Sign In, Clock In / Out), their defaults, how a value is resolved
 * (default < organization < location override), validation, the Quick service / Full service presets and the auto clock-out rule.
 * Stored in settings.systemOptions = { org: { page: {key: value} }, locations: { [locationId]: { page: {key: value} } } }.
 * The receipt footer is the one value that already lives elsewhere (settings.receiptFooter); the page reads and writes that key so the
 * older Receipt Printing tab and the printed receipts stay in step.
 * Only settings the POS acts on are listed here; each added setting needs its behaviour wired first, so no switch is ever a dead switch.
 */
import { ORDER_CHANNELS } from "../config/constants";

export const SYSTEM_PAGES = [
	{ key: "overview", title: "Overview", description: "Every System Options page, and ready-made starting points." },
	{ key: "orderEntry", title: "Order Entry", description: "How an order is started and how the menu looks while taking it." },
	{ key: "receipts", title: "Receipts", description: "What customers see at the bottom of their receipt." },
	{ key: "signIn", title: "Sign In", description: "Where staff land after they sign in." },
	{ key: "clock", title: "Clock In / Out", description: "Clock people out automatically so no shift runs on by mistake." },
	{ key: "payroll", title: "Payroll", description: "Pay week, paid breaks and overtime rules used for hours and labor cost." },
	{ key: "zones", title: "Zones", description: "The areas of your floor that hold tables.", entity: true },
];

/** Pages in System Options that hold values (everything except the overview). */
export const OPTION_PAGES = ["orderEntry", "receipts", "signIn", "clock", "payroll"];

/** The views staff can land on after signing in. "auto" keeps the existing behaviour (the first page their role may open). */
export const LANDING_VIEWS = [
	{ value: "auto", label: "First page for their role" },
	{ value: "checkout", label: "Speed screen (Checkout)" },
	{ value: "orders", label: "Order queue" },
	{ value: "tables", label: "Table view" },
];

/**
 * Setting definitions: scope says whether a location may override the organization value.
 * Defaults keep today's behaviour for businesses that never open these pages.
 */
export const FIELDS = {
	orderEntry: {
		defaultOrderType: { scope: "location", default: "Dine-in" },
		requireOrderType: { scope: "location", default: false }, // staff must choose the order type before taking payment
		showPrices: { scope: "location", default: true },
		globalModifiers: { scope: "org", default: true }, // offer the global modifiers (Menu Admin, Modifiers) on an order line
		defaultMenu: { scope: "location", default: "" }, // an Availability menu id; "" = all items
	},
	receipts: {
		footer: { scope: "org", default: "Thank you for your purchase", max: 200 },
	},
	signIn: {
		defaultView: { scope: "location", default: "auto" },
	},
	clock: {
		autoElapsedOn: { scope: "location", default: false },
		maxHours: { scope: "location", default: 23, min: 0, max: 99 },
		maxMinutes: { scope: "location", default: 59, min: 0, max: 59 },
		autoTimeOn: { scope: "location", default: false },
		autoTime: { scope: "location", default: "03:00" },
	},
	// Payroll rules are the organization's (labour law does not change by branch)
	payroll: {
		weekDay: { scope: "org", default: 1 },
		weekTime: { scope: "org", default: "00:00" },
		paidBreaksOn: { scope: "org", default: false },
		paidBreakMin: { scope: "org", default: 15 },
		weeklyOn: { scope: "org", default: false },
		weeklyAfter: { scope: "org", default: 45 },
		weeklyMult: { scope: "org", default: 1.5 },
		dailyOn: { scope: "org", default: false },
		d1After: { scope: "org", default: 8 },
		d1Mult: { scope: "org", default: 1.5 },
		d2After: { scope: "org", default: 12 },
		d2Mult: { scope: "org", default: 2 },
		seventhOn: { scope: "org", default: false },
		s1Mult: { scope: "org", default: 1.5 },
		s2Mult: { scope: "org", default: 2 },
		carryover: { scope: "org", default: false },
	},
};

export const defaultsFor = (page) => Object.fromEntries(Object.entries(FIELDS[page]).map(([k, f]) => [k, f.default]));

const real = (id) => id && id !== "all";

/** One page's values for a location (or the organization when the location is "all"): defaults, then organization, then location overrides. */
export function resolveOptions(settings = {}, page, locationId = "all") {
	const so = settings.systemOptions || {};
	const org = { ...(so.org?.[page] || {}) };
	if (page === "receipts" && typeof settings.receiptFooter === "string" && org.footer === undefined) org.footer = settings.receiptFooter;
	const over = real(locationId) ? so.locations?.[locationId]?.[page] || {} : {};
	const out = { ...defaultsFor(page) };
	for (const k of Object.keys(out)) {
		if (org[k] !== undefined) out[k] = org[k];
		if (over[k] !== undefined && FIELDS[page][k].scope === "location") out[k] = over[k];
	}
	return out;
}

/** True when the location overrides the organization value of this setting. */
export const isOverridden = (settings = {}, page, key, locationId) => real(locationId) && settings.systemOptions?.locations?.[locationId]?.[page]?.[key] !== undefined;

/**
 * Returns a new systemOptions object with `patch` ({ page: { key: value|undefined } }) applied: to the location's overrides when a location is
 * given and the setting may be overridden, otherwise to the organization values. `undefined` removes an override (reset).
 */
export function applyPatch(systemOptions = {}, patch = {}, locationId = "all") {
	const next = { org: { ...(systemOptions.org || {}) }, locations: { ...(systemOptions.locations || {}) } };
	for (const [page, values] of Object.entries(patch)) {
		for (const [key, value] of Object.entries(values)) {
			const field = FIELDS[page]?.[key];
			if (!field) continue;
			const toLocation = real(locationId) && field.scope === "location";
			const bag = toLocation ? (next.locations[locationId] = { ...(next.locations[locationId] || {}) }) : next.org;
			bag[page] = { ...(bag[page] || {}) };
			if (value === undefined) delete bag[page][key];
			else bag[page][key] = value;
			if (!Object.keys(bag[page]).length) delete bag[page];
		}
	}
	for (const id of Object.keys(next.locations)) if (!Object.keys(next.locations[id]).length) delete next.locations[id];
	return next;
}

const timeOk = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v));

/** Messages for invalid values of one page ({} when valid). Same rules the form shows. */
export function validateOptions(page, v) {
	const e = {};
	if (page === "orderEntry" && !ORDER_CHANNELS.includes(v.defaultOrderType)) e.defaultOrderType = "Choose one of the order types.";
	if (page === "receipts" && String(v.footer || "").length > FIELDS.receipts.footer.max) e.footer = "Keep the footer to 200 characters or fewer.";
	if (page === "signIn" && !LANDING_VIEWS.some((x) => x.value === v.defaultView)) e.defaultView = "Choose where staff land.";
	if (page === "clock") {
		const h = Number(v.maxHours);
		const m = Number(v.maxMinutes);
		if (v.autoElapsedOn) {
			if (!Number.isInteger(h) || h < 0 || h > 99 || !Number.isInteger(m) || m < 0 || m > 59) e.maxHours = "Enter hours (0 to 99) and minutes (0 to 59).";
			else if (h * 60 + m < 1) e.maxHours = "The maximum time must be at least 1 minute.";
		}
		if (v.autoTimeOn && !timeOk(v.autoTime)) e.autoTime = "Enter a time such as 03:00.";
	}
	if (page === "payroll") {
		const num = (x) => Number(x);
		const mult = (k, label) => {
			const m = num(v[k]);
			if (!(m >= 1 && m <= 3)) e[k] = label + " must be between 1.0 and 3.0.";
		};
		if (!timeOk(v.weekTime)) e.weekTime = "Enter a time such as 00:00.";
		if (![0, 1, 2, 3, 4, 5, 6].includes(num(v.weekDay))) e.weekDay = "Choose a day.";
		if (v.paidBreaksOn && !(num(v.paidBreakMin) >= 1 && num(v.paidBreakMin) <= 120)) e.paidBreakMin = "Enter 1 to 120 minutes.";
		if (v.weeklyOn) {
			if (!(num(v.weeklyAfter) > 0 && num(v.weeklyAfter) <= 168)) e.weeklyAfter = "Enter hours from 1 to 168.";
			mult("weeklyMult", "The weekly rate");
		}
		if (v.dailyOn) {
			if (!(num(v.d1After) > 0 && num(v.d1After) < 24)) e.d1After = "Enter hours from 1 to 23.";
			if (!(num(v.d2After) > num(v.d1After) && num(v.d2After) <= 24)) e.d2After = "Tier 2 must start after tier 1 and by 24 hours.";
			mult("d1Mult", "The tier 1 rate");
			mult("d2Mult", "The tier 2 rate");
		}
		if (v.seventhOn) {
			mult("s1Mult", "The 7th day tier 1 rate");
			mult("s2Mult", "The 7th day tier 2 rate");
		}
	}
	return e;
}

/** Ready-made starting points. Each lists only settings this POS has; the preview shows the before and after of every one. */
export const PRESETS = [
	{
		key: "quick",
		title: "Quick service",
		description: "Cafés, bakeries and counters: fast ordering at the speed screen.",
		values: { orderEntry: { defaultOrderType: "Takeaway" }, signIn: { defaultView: "checkout" } },
	},
	{
		key: "full",
		title: "Full service",
		description: "Table-service restaurants: dine-in orders and the table view.",
		values: { orderEntry: { defaultOrderType: "Dine-in" }, signIn: { defaultView: "tables" } },
	},
];

/** Rows for the preset preview: [{ page, key, before, after }] for every value the preset would change. */
export function presetChanges(preset, current) {
	const rows = [];
	for (const [page, values] of Object.entries(preset.values))
		for (const [key, after] of Object.entries(values)) if (current[page]?.[key] !== after) rows.push({ page, key, before: current[page]?.[key], after });
	return rows;
}

/**
 * Why a clocked-in entry is due to be clocked out automatically: "elapsed" (clocked in longer than the maximum), "time" (the daily
 * clock-out time has passed since it began) or "" (not due). `opts` are the resolved Clock In / Out options for the entry's location.
 */
export function autoClockOutDue(entry, opts, now = new Date()) {
	if (!entry || entry.clockOut) return "";
	const start = new Date(entry.clockIn);
	if (Number.isNaN(+start)) return "";
	if (opts.autoElapsedOn) {
		const limit = (Number(opts.maxHours) * 60 + Number(opts.maxMinutes)) * 60000;
		if (limit >= 60000 && now - start >= limit) return "elapsed";
	}
	if (opts.autoTimeOn && timeOk(opts.autoTime)) {
		const [h, m] = opts.autoTime.split(":").map(Number);
		const cutoff = new Date(start);
		cutoff.setHours(h, m, 0, 0);
		if (cutoff <= start) cutoff.setDate(cutoff.getDate() + 1); // the first such time after clocking in
		if (now >= cutoff) return "time";
	}
	return "";
}

/** The page a signed-in user lands on: the configured one when they may open it, else `fallback`. */
export const landingView = (opts, canOpen, fallback) => (opts.defaultView && opts.defaultView !== "auto" && canOpen(opts.defaultView) ? opts.defaultView : fallback);
