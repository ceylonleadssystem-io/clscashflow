/**
 * Catalogue edits kept as drafts (pure). Unlike the other Menu Admin lists, these are not copied over a published list: Publish applies them to the
 * live catalogue (categories, items, modifier groups) in the same write that publishes everything else. The drafts are:
 *   settings.menuDraft.categoryEdits  [{ id, original, name, removed, moveTo }]       add ("original" is ""), rename, or remove a category
 *   settings.menuDraft.itemEdits      [{ id: productId, name, original, changes, isNew? }]   changed fields of an existing item, or a new item (isNew: every field in `changes`)
 *   settings.menuDraft.subcategoryEdits [{ id, group, parent, name, original, isNew?, removed? }]   add, rename or remove a subcategory (group = the parent's key)
 *   settings.menuDraft.groupEdits     [{ id, isNew, name, mode, required, options, removed }]   add, edit or remove a modifier group
 * Categories are referred to by name, as everywhere in this POS.
 */
import { categoryKey } from "./catalog";

const list = (v) => (Array.isArray(v) ? v : []);
const text = (v, max) => String(v ?? "").trim().slice(0, max);
export const UNCATEGORIZED = "Uncategorized";
export const ITEM_FIELDS = ["name", "price", "cost", "category", "subcategory", "code", "description", "stationIds", "modifierIds", "image"];
const ARRAY_FIELDS = ["stationIds", "modifierIds"];

export const draftList = (settings = {}, key) => list(settings.menuDraft?.[key]);

// -------------------------------------------------------------------------------- categories ----
/** Category names as the draft would leave them: [{ key, name, original, state: "live" | "added" | "renamed" | "removed", moveTo }]. */
export function workingCategories(liveNames = [], edits = []) {
	const byKey = new Map(edits.filter((e) => e.original).map((e) => [categoryKey(e.original), e]));
	const rows = liveNames.map((original) => {
		const e = byKey.get(categoryKey(original));
		if (!e) return { key: categoryKey(original), name: original, original, state: "live", moveTo: "" };
		if (e.removed) return { key: categoryKey(original), name: original, original, state: "removed", moveTo: e.moveTo || "" };
		return { key: categoryKey(original), name: e.name, original, state: categoryKey(e.name) === categoryKey(original) && e.name === original ? "live" : "renamed", moveTo: "" };
	});
	for (const e of edits.filter((x) => !x.original && !x.removed)) rows.push({ key: e.id, name: e.name, original: "", state: "added", moveTo: "" });
	return rows;
}
/** The category an item will be in once the draft is published: its category's new name, or where a removed category's items move to. */
export function effectiveCategory(rows, category) {
	const r = rows.find((x) => x.original && categoryKey(x.original) === categoryKey(category));
	if (!r || r.state === "live") return category;
	return r.state === "removed" ? r.moveTo || UNCATEGORIZED : r.name;
}
/** Names that remain after the draft (removed categories are gone). */
export const remainingNames = (rows) => rows.filter((r) => r.state !== "removed").map((r) => r.name);

export function cleanCategoryEdit(e = {}, id) {
	return { id: String(id ?? e.id), original: text(e.original, 60), name: text(e.name, 60), removed: !!e.removed, moveTo: text(e.moveTo, 60) };
}
/** Why a category change cannot be saved ("" when it can). `rows` are the working categories without this one. */
export function categoryEditError(e, rows) {
	if (e.removed) {
		if (e.moveTo && !remainingNames(rows).some((n) => categoryKey(n) === categoryKey(e.moveTo))) return "Choose a category that still exists to move the items to.";
		return "";
	}
	if (!e.name) return "Enter a name.";
	if (remainingNames(rows).some((n) => categoryKey(n) === categoryKey(e.name))) return "There is already a category called " + e.name + ".";
	return "";
}

// ------------------------------------------------------------------------------------ items ----
/** The fields of an item edit that differ from the live item (price and cost as numbers). */
export function itemChanges(product, form) {
	const next = { name: text(form.name, 80), price: Number(form.price), cost: Number(form.cost), category: text(form.category, 60), subcategory: text(form.subcategory, 60), code: text(form.code, 40), description: text(form.description, 200), image: form.image === undefined ? String(product.image || "") : String(form.image || ""), stationIds: list(form.stationIds === undefined ? product.stationIds : form.stationIds).map(String), modifierIds: list(form.modifierIds === undefined ? product.modifierIds : form.modifierIds).map(String) };
	const out = {};
	for (const f of ITEM_FIELDS) {
		const was = f === "price" || f === "cost" ? Number(product[f]) : ARRAY_FIELDS.includes(f) ? list(product[f]).map(String) : String(product[f] ?? "");
		if (JSON.stringify(next[f]) !== JSON.stringify(was)) out[f] = next[f];
	}
	return out;
}
/** Why the edited item cannot be saved ("" when it can). `form` is the full set of fields. */
export function itemEditError(form, categories) {
	if (!text(form.name, 80)) return "Enter a name.";
	if (!(Number(form.price) > 0)) return "Enter a selling price above 0.";
	if (!(Number(form.cost) >= 0) || form.cost === "") return "Enter a cost price of 0 or more.";
	if (!categories.some((c) => categoryKey(c) === categoryKey(form.category))) return "Choose a category.";
	return "";
}
/** The fields of a new item as the draft stores them. */
export const newItemFields = (form) => itemChanges({ name: "", price: 0, cost: 0, category: "", subcategory: "", code: "", description: "", image: "", stationIds: [], modifierIds: [] }, { ...form, price: form.price, cost: form.cost });
/** New items waiting to be published, shaped like products so lists can show them. */
export const draftNewItems = (edits) => list(edits).filter((e) => e.isNew).map((e) => ({ id: e.id, type: "Product", stationIds: [], modifierIds: [], code: "", description: "", subcategory: "", ...e.changes, isDraft: true }));
/** An item with its draft changes applied (for lists that show what Publish will do). */
export const withItemEdit = (product, edits) => {
	const e = list(edits).find((x) => x.id === String(product.id));
	return e ? { ...product, ...e.changes } : product;
};

// ----------------------------------------------------------------------------------- groups ----
export function cleanGroupEdit(g = {}) {
	return {
		id: String(g.id),
		isNew: !!g.isNew,
		name: text(g.name, 40),
		mode: g.mode === "multiple" ? "multiple" : "single",
		required: g.required !== false,
		options: list(g.options).map((o) => ({ name: text(o.name, 40), price: Math.max(0, Number(o.price) || 0) })).filter((o) => o.name),
		removed: !!g.removed,
	};
}
export function groupEditError(g, others = []) {
	if (g.removed) return "";
	if (!g.name) return "Enter a group name.";
	if (others.some((o) => o.name.toLowerCase() === g.name.toLowerCase())) return "There is already a modifier group called " + g.name + ".";
	if (!g.options.length) return "Add at least one option.";
	const seen = new Set();
	for (const o of g.options) {
		if (seen.has(o.name.toLowerCase())) return "Two options are called " + o.name + ".";
		seen.add(o.name.toLowerCase());
	}
	return "";
}
/** Live groups with their draft edits applied (removed ones dropped, new ones added): [{ ...group, state }]. */
export function workingGroups(live = [], edits = []) {
	const byId = new Map(edits.map((e) => [e.id, e]));
	const rows = live.map((g) => {
		const e = byId.get(g.id);
		if (!e) return { ...g, state: "live" };
		return e.removed ? { ...g, state: "removed" } : { ...g, name: e.name, mode: e.mode, required: e.required, options: e.options, state: "edited" };
	});
	for (const e of edits.filter((x) => x.isNew && !x.removed)) rows.push({ id: e.id, name: e.name, mode: e.mode, required: e.required, options: e.options, state: "added" });
	return rows;
}

// ------------------------------------------------------------------------------ subcategories ----
/**
 * Subcategories of one category as the draft leaves them: [{ id, name, original, state }].
 * `group` is the category's key (its live name, or its new name when it is itself new); `liveSubs` are the live subcategory rows.
 */
export function workingSubcategories(liveSubs = [], edits = [], group = "") {
	const mine = list(edits);
	const rows = liveSubs.filter((s) => categoryKey(s.parent) === group).map((s) => {
		const e = mine.find((x) => x.id === s.id);
		if (!e) return { id: s.id, name: s.name, original: s.name, state: "live" };
		return { id: s.id, name: e.removed ? s.name : e.name, original: s.name, state: e.removed ? "removed" : "renamed" };
	});
	for (const e of mine.filter((x) => x.isNew && !x.removed && x.group === group)) rows.push({ id: e.id, name: e.name, original: "", state: "added" });
	return rows;
}
/** The draft entries for one category's subcategories, from the list the person edited: [{ id?, name }] against the live rows. */
export function subcategoryEntries(liveSubs, group, parent, wanted, newId) {
	const have = liveSubs.filter((s) => categoryKey(s.parent) === group);
	const out = [];
	const seen = new Set();
	for (const w of wanted) {
		const name = text(w.name, 60);
		if (!name) continue;
		const live = have.find((s) => s.id === w.id);
		if (live) {
			seen.add(live.id);
			if (live.name !== name) out.push({ id: live.id, group, parent, name, original: live.name });
		} else out.push({ id: w.id || newId(), group, parent, name, original: "", isNew: true });
	}
	for (const s of have) if (!seen.has(s.id)) out.push({ id: s.id, group, parent, name: s.name, original: s.name, removed: true });
	return out;
}
export function subcategoryError(wanted) {
	const names = wanted.map((w) => text(w.name, 60).toLowerCase()).filter(Boolean);
	return new Set(names).size !== names.length ? "Two subcategories have the same name." : "";
}

// ------------------------------------------------------------------------- publish preview ----
/** One line per unpublished catalogue change, for the Review list: [{ page, id, name, kind, fields }]. */
export function catalogDraftChanges(settings = {}) {
	const out = [];
	for (const e of draftList(settings, "categoryEdits")) {
		if (e.removed) out.push({ page: "categoryEdits", id: e.id, name: e.original, kind: "removed", fields: e.moveTo ? [{ field: "Items move to", before: "", after: e.moveTo }] : [] });
		else if (!e.original) out.push({ page: "categoryEdits", id: e.id, name: e.name, kind: "added", fields: [] });
		else out.push({ page: "categoryEdits", id: e.id, name: e.original, kind: "edited", fields: [{ field: "Name", before: e.original, after: e.name }] });
	}
	for (const e of draftList(settings, "itemEdits")) {
		const label = { name: "Name", price: "Price", cost: "Cost", category: "Category", subcategory: "Subcategory", code: "Code", description: "Description", stationIds: "Stations", modifierIds: "Modifier groups", image: "Photo" };
		const show = (v, f) => (f === "image" ? (v ? "photo" : "none") : Array.isArray(v) ? `${v.length} chosen` : String(v ?? ""));
		out.push({ page: "itemEdits", id: e.id, name: e.original || e.name, kind: e.isNew ? "added" : "edited", fields: e.isNew ? [{ field: "Price", before: "", after: String(e.changes.price) }, { field: "Category", before: "", after: e.changes.category }] : Object.entries(e.changes).map(([f, v]) => ({ field: label[f], before: show(e.was?.[f], f), after: show(v, f) })) });
	}
	for (const e of draftList(settings, "subcategoryEdits")) {
		out.push({ page: "subcategoryEdits", id: e.id, name: `${e.parent}: ${e.original || e.name}`, kind: e.removed ? "removed" : e.isNew ? "added" : "edited", fields: !e.removed && !e.isNew ? [{ field: "Name", before: e.original, after: e.name }] : [] });
	}
	for (const e of draftList(settings, "groupEdits")) {
		if (e.removed) out.push({ page: "groupEdits", id: e.id, name: e.name, kind: "removed", fields: [] });
		else out.push({ page: "groupEdits", id: e.id, name: e.name, kind: e.isNew ? "added" : "edited", fields: [{ field: "Options", before: "", after: e.options.map((o) => o.name).join(", ") }] });
	}
	return out;
}

/**
 * The settings that must follow a category rename (or removal when `next` is null): availability menus, tax by category and category settings
 * (published and draft). Returns only the keys that change, as { key: value }.
 */
export function carryCategoryRename(settings = {}, oldName, next) {
	const oldKey = categoryKey(oldName);
	const patch = {};
	const menus = (m) => list(m).map((x) => ({ ...x, categories: list(x.categories).flatMap((c) => (categoryKey(c) === oldKey ? (next ? [next] : []) : [c])) }));
	if (Array.isArray(settings.availabilityMenus)) patch.availabilityMenus = menus(settings.availabilityMenus);
	if (Array.isArray(settings.menuDraft?.availabilityMenus)) patch.menuDraft = { ...(patch.menuDraft || settings.menuDraft), availabilityMenus: menus(settings.menuDraft.availabilityMenus) };
	const rule = list(settings.taxRules)[0];
	if (rule?.categoryTaxes?.[oldKey]) {
		const { [oldKey]: moved, ...rest } = rule.categoryTaxes;
		patch.taxRules = [{ ...rule, categoryTaxes: next ? { ...rest, [categoryKey(next)]: moved } : rest }];
	}
	if (list(settings.menuDraft?.taxRules)[0]?.categoryTaxes?.[oldKey]) {
		const r = settings.menuDraft.taxRules[0];
		const { [oldKey]: moved, ...rest } = r.categoryTaxes;
		patch.menuDraft = { ...(patch.menuDraft || settings.menuDraft), taxRules: [{ ...r, categoryTaxes: next ? { ...rest, [categoryKey(next)]: moved } : rest }] };
	}
	const rules = (rows) => list(rows).flatMap((c) => (c.id === oldKey ? (next ? [{ ...c, id: categoryKey(next), name: next }] : []) : [c]));
	if (list(settings.categorySettings).some((c) => c.id === oldKey)) patch.categorySettings = rules(settings.categorySettings);
	if (list(settings.menuDraft?.categorySettings).some((c) => c.id === oldKey)) patch.menuDraft = { ...(patch.menuDraft || settings.menuDraft), categorySettings: rules(settings.menuDraft.categorySettings) };
	return patch;
}
