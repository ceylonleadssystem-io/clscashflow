/**
 * Menu Admin (pure): the lists edited with Save then Publish, and what the POS does with the published ones.
 * Saving stores a draft in settings.menuDraft[key]; nothing changes at the till until Publish copies every draft over the published
 * list (settings[key]) in one write. A key missing from menuDraft has no draft. Published lists:
 *   settings.salesCategories    [{ id, name, itemIds, status }]            reporting buckets for Reports > Menu > Sales Category
 *   settings.availabilityMenus  [{ id, name, hours:[{days,start,end}], categories:[name], status }]   which categories the till shows when
 *   settings.taxes / settings.taxRules   see taxes.js
 *   settings.itemSettings       [{ id: productId, name, taxId, takeawayTaxId, prepTicketName, receiptName }]   per-item overrides; only items that have one
 * Categories are referred to by name, as everywhere else in this POS.
 */
import { categoryKey } from "./catalog";

export const PAGES = {
	salesCategories: { label: "Sales category", plural: "Sales categories" },
	availabilityMenus: { label: "Menu", plural: "Menus" },
	taxes: { label: "Tax", plural: "Taxes" },
	taxRules: { label: "Tax rules", plural: "Tax rules" },
	itemSettings: { label: "Item", plural: "Items" },
};
export const PAGE_KEYS = Object.keys(PAGES);
export const SALES_DEFAULTS = ["Food", "Beverage", "Alcohol", "Retail", "Other"];
export const WEEKDAYS = [
	{ value: 1, label: "Mon" },
	{ value: 2, label: "Tue" },
	{ value: 3, label: "Wed" },
	{ value: 4, label: "Thu" },
	{ value: 5, label: "Fri" },
	{ value: 6, label: "Sat" },
	{ value: 0, label: "Sun" },
];
export const MAX_NAME = 40;

const list = (v) => (Array.isArray(v) ? v : []);
const text = (v, max = MAX_NAME) => String(v ?? "").trim().slice(0, max);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ------------------------------------------------------------------------------- entities ----
export function cleanSalesCategory(s = {}) {
	return { id: String(s.id), name: text(s.name), itemIds: [...new Set(list(s.itemIds).map(String))], status: s.status === "inactive" ? "inactive" : "active" };
}

const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
export function cleanMenu(m = {}) {
	return {
		id: String(m.id),
		name: text(m.name),
		hours: list(m.hours).map((h) => ({ days: [...new Set(list(h.days).map(Number).filter((d) => d >= 0 && d <= 6))], start: String(h.start || ""), end: String(h.end || "") })),
		categories: [...new Set(list(m.categories).map((c) => String(c).trim()).filter(Boolean))],
		status: m.status === "inactive" ? "inactive" : "active",
	};
}

/** The published list of a page. */
export const publishedOf = (settings = {}, key) => list(settings[key]);
/** The list as it is being edited: the draft when there is one, else the published list. */
export const workingOf = (settings = {}, key) => (settings.menuDraft && Array.isArray(settings.menuDraft[key]) ? settings.menuDraft[key] : publishedOf(settings, key));
export const hasDraft = (settings = {}, key) => !!(settings.menuDraft && Array.isArray(settings.menuDraft[key]));

const nameClash = (name, others) => others.some((o) => o.name.toLowerCase() === name.toLowerCase());

export function salesCategoryError(s, others = []) {
	if (!s.name) return "Enter a name.";
	if (nameClash(s.name, others)) return "There is already a sales category called " + s.name + ".";
	return "";
}

export function menuError(m, others = []) {
	if (!m.name) return "Enter a name.";
	if (nameClash(m.name, others)) return "There is already a menu called " + m.name + ".";
	if (!m.hours.length) return "Add the hours this menu runs.";
	for (const h of m.hours) {
		if (!h.days.length) return "Choose at least one day for each row of hours.";
		if (!hhmm.test(h.start) || !hhmm.test(h.end)) return "Enter a start and an end time for each row of hours.";
		if (h.start === h.end) return "The start and end time of a row cannot be the same.";
	}
	return "";
}

/** Gives `itemIds` to the sales category `id`, taking them out of any other (an item has one sales category). */
export function assignItems(categories, id, itemIds) {
	const take = new Set(itemIds);
	return categories.map((c) => (c.id === id ? { ...c, itemIds: [...take] } : { ...c, itemIds: c.itemIds.filter((i) => !take.has(i)) }));
}

/** The sales category name of an item among the published, active ones ("" when it has none). */
export function salesCategoryNameOf(categories, productId) {
	return categories.find((c) => c.status === "active" && c.itemIds.includes(String(productId)))?.name || "";
}

// --------------------------------------------------------------------------- availability ----
const minutes = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3));

/** Whether a row of hours covers `now` (an end time at or before the start runs past midnight, into the next day). */
export function inHours(hours, now = new Date()) {
	const day = now.getDay();
	const at = now.getHours() * 60 + now.getMinutes();
	return hours.some((h) => {
		if (!hhmm.test(h.start) || !hhmm.test(h.end)) return false;
		const a = minutes(h.start);
		const b = minutes(h.end);
		if (a < b) return h.days.includes(day) && at >= a && at < b;
		return (h.days.includes(day) && at >= a) || (h.days.includes((day + 6) % 7) && at < b);
	});
}

/**
 * The menus the till follows right now: every active menu whose hours cover this moment (overlapping menus all show); when none do,
 * the chosen default menu; when there is none either, null (everything shows).
 */
export function menusInEffect(menus = [], defaultMenuId = "", now = new Date()) {
	const active = menus.filter((m) => m.status === "active");
	const byHours = active.filter((m) => inHours(m.hours, now));
	if (byHours.length) return byHours;
	const fallback = active.find((m) => m.id === defaultMenuId);
	return fallback ? [fallback] : null;
}

/** The category keys those menus allow (null = all categories). */
export function allowedCategoryKeys(menus) {
	return menus ? new Set(menus.flatMap((m) => m.categories.map(categoryKey))) : null;
}

export function hoursSummary(hours = []) {
	if (!hours.length) return "No hours";
	return hours
		.map((h) => {
			const days = WEEKDAYS.filter((w) => h.days.includes(w.value)).map((w) => w.label);
			const span = days.length === 7 ? "Every day" : days.length === 5 && !h.days.includes(0) && !h.days.includes(6) ? "Mon–Fri" : days.join(", ");
			return `${span} ${h.start}–${h.end}`;
		})
		.join("; ");
}

/** Other active menus whose hours overlap this menu's (the editor shows a gentle note; both menus show at those times). */
export function overlappingMenus(menu, others = []) {
	const probe = (m, day, at) => inHours(m.hours, new Date(2024, 0, 7 + day, Math.floor(at / 60), at % 60)); // 7 Jan 2024 was a Sunday
	return others.filter((o) => o.status === "active" && o.id !== menu.id && [0, 1, 2, 3, 4, 5, 6].some((d) => Array.from({ length: 48 }, (_, i) => i * 30).some((at) => probe(menu, d, at) && probe(o, d, at))));
}

// ------------------------------------------------------------------------------ drafts ----
const FIELD_LABELS = {
	name: "Name", status: "Status", itemIds: "Items", hours: "Hours", categories: "Categories",
	isGroup: "Tax group", rate: "Rate (%)", memberTaxIds: "Taxes in group",
	taxId: "Tax", takeawayTaxId: "Takeaway tax", prepTicketName: "Prep ticket name", receiptName: "Receipt name",
	defaultTaxId: "Default tax", takeawayOn: "Takeaway tax", serviceTaxOn: "Tax on service charge", serviceTaxId: "Service charge tax", categoryTaxes: "Category taxes",
};
const brief = (field, v) => {
	if (field === "hours") return hoursSummary(v);
	if (Array.isArray(v)) return `${v.length} ${field === "itemIds" ? "items" : field === "memberTaxIds" ? "taxes" : "categories"}`;
	if (field === "categoryTaxes") return `${Object.keys(v || {}).length} categories`;
	if (typeof v === "boolean") return v ? "On" : "Off";
	return v === undefined || v === "" ? "None" : String(v);
};

/** Every unpublished change: [{ page, key, id, name, kind: "added" | "edited" | "removed", fields: [{ field, before, after }] }]. */
export function draftChanges(settings = {}) {
	const out = [];
	for (const key of PAGE_KEYS) {
		if (!hasDraft(settings, key)) continue;
		const before = new Map(publishedOf(settings, key).map((e) => [e.id, e]));
		const after = workingOf(settings, key);
		for (const e of after) {
			const old = before.get(e.id);
			if (!old) out.push({ page: key, id: e.id, name: e.name, kind: "added", fields: [] });
			else {
				const fields = Object.keys(FIELD_LABELS).filter((f) => !same(old[f], e[f])).map((f) => ({ field: FIELD_LABELS[f], before: brief(f, old[f]), after: brief(f, e[f]) }));
				if (fields.length) out.push({ page: key, id: e.id, name: e.name, kind: "edited", fields });
			}
			before.delete(e.id);
		}
		for (const old of before.values()) out.push({ page: key, id: old.id, name: old.name, kind: "removed", fields: [] });
		if (!out.some((c) => c.page === key) && !same(publishedOf(settings, key).map((e) => e.id), after.map((e) => e.id))) {
			// only the order changed
			out.push({ page: key, id: "", name: PAGES[key].plural, kind: "edited", fields: [{ field: "Order", before: "", after: "changed" }] });
		}
	}
	return out;
}

/** The drafts to store after `next` was saved for `key`: a list equal to the published one is not a draft. */
export function nextDrafts(settings = {}, key, next) {
	const drafts = { ...(settings.menuDraft || {}) };
	if (same(next, publishedOf(settings, key))) delete drafts[key];
	else drafts[key] = next;
	return drafts;
}

// ------------------------------------------------------------------------------ item overrides ----
/** One item's overrides as stored. taxId / takeawayTaxId: "" = follow the category, "none" = no tax, else a tax id. */
export function cleanItemSetting(i = {}) {
	return { id: String(i.id), name: text(i.name, 80), taxId: String(i.taxId || ""), takeawayTaxId: String(i.takeawayTaxId || ""), prepTicketName: text(i.prepTicketName, 60), receiptName: text(i.receiptName, 60) };
}
export const itemSettingBlank = (i) => !i.taxId && !i.takeawayTaxId && !i.prepTicketName && !i.receiptName;
/** The published overrides by product id. */
export const itemSettingsById = (settings = {}) => Object.fromEntries(publishedOf(settings, "itemSettings").map((i) => [i.id, i]));
/** The name to show for an item on a kitchen ticket / receipt: its override, else the name on the line. */
export const prepName = (settings, line) => itemSettingsById(settings)[line.productId]?.prepTicketName || line.name;
export const receiptName = (settings, line) => itemSettingsById(settings)[line.productId]?.receiptName || line.name;
