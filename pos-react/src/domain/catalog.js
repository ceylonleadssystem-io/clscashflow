/**
 * Catalogue helpers: category/subcategory lists and visibility rules, margin, and parsing of Excel/CSV
 * (Ceylonry template or Square export) and stock-count sheets for import.
 */
import { STALE_PRESET_CATEGORIES } from "../config/presets";

/** Category / subcategory helpers and spreadsheet parsing for catalogue import. */

export const categoryKey = (name) => String(name || "").trim().toLowerCase();

/** All known category names (configured + derived from products), sorted. */
export function productCategories(categories, products) {
	return [...new Set([...categories, ...products.map((p) => p.category)].filter(Boolean))].sort((a, b) =>
		a.localeCompare(b),
	);
}

export const stalePresetCategory = (name) => STALE_PRESET_CATEGORIES.includes(categoryKey(name));

/**
 * Preset categories stay hidden while empty; categories the user added (`userCategories`, saved by "Add Category")
 * always show, even when they share a preset name such as "Clothing".
 */
export function visibleProductCategories(categories, products, subcategories, userCategories = []) {
	const mine = new Set(userCategories.map(categoryKey));
	return productCategories(categories, products).filter((name) => {
		const key = categoryKey(name);
		const count = products.filter((p) => categoryKey(p.category) === key).length;
		const subs = subcategories.filter((s) => categoryKey(s.parent) === key).length;
		return count || subs || mine.has(key) || !stalePresetCategory(name);
	});
}

export const subcategoriesFor = (subcategories, parent) =>
	subcategories.filter((s) => s.parent === parent).sort((a, b) => a.name.localeCompare(b.name));

export const productMargin = (p) => (p.price ? (((p.price - p.cost) / p.price) * 100).toFixed(1) : "0");

// ------------------------------------------------------------ import --------
const normalHeader = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
const firstColumn = (headers, names) => headers.findIndex((h) => names.includes(normalHeader(h)));
const cell = (row, index) => (index < 0 ? "" : (row[index] ?? ""));
export const catalogueNumber = (value) => {
	const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
	return Number.isFinite(n) ? n : 0;
};

/** Parses a sheet matrix (Ceylonry template or Square export) into import rows. */
export function parseCatalogueRows(matrix) {
	const headerIndex = matrix.slice(0, 20).findIndex((row) => {
		const n = row.map(normalHeader);
		return (
			n.some((v) => ["name", "item name", "product name", "customer facing name"].includes(v)) &&
			n.some((v) => ["price", "selling price", "sale price", "online sale price"].includes(v))
		);
	});
	if (headerIndex < 0) throw new Error("Could not find a header row containing item name and price.");
	const headers = matrix[headerIndex];
	const idx = {
		name: firstColumn(headers, ["name", "item name", "product name", "customer facing name"]),
		type: firstColumn(headers, ["type", "item type", "product type"]),
		code: firstColumn(headers, ["sku code", "sku", "code", "barcode", "gtin"]),
		category: firstColumn(headers, ["main category", "category", "categories", "group", "reporting category"]),
		sub: firstColumn(headers, ["subcategory", "sub category"]),
		description: firstColumn(headers, ["description", "item description"]),
		cost: firstColumn(headers, ["cost", "cost price", "buying price"]),
		price: firstColumn(headers, ["selling price", "price", "sale price", "online sale price"]),
		stock: headers.findIndex((v) => /^(stock quantity|stock|quantity|new quantity|current quantity)/.test(normalHeader(v))),
		unit: firstColumn(headers, ["unit", "unit type"]),
		supplier: firstColumn(headers, ["supplier", "vendor"]),
		variation: firstColumn(headers, ["variation name", "variant", "variation"]),
		archived: firstColumn(headers, ["archived"]),
	};
	return matrix
		.slice(headerIndex + 1)
		.map((row, index) => {
			const baseName = String(cell(row, idx.name)).trim();
			const variation = String(cell(row, idx.variation)).trim();
			if (!baseName) return null;
			if (String(cell(row, idx.archived)).trim().toUpperCase() === "Y") return null;
			const path = String(cell(row, idx.category))
				.split(",")[0]
				.split(">")
				.map((v) => v.trim())
				.filter(Boolean);
			const explicitSub = String(cell(row, idx.sub)).trim();
			const rawType = String(cell(row, idx.type)).toLowerCase();
			return {
				include: true,
				rowNumber: headerIndex + index + 2,
				name: variation && variation.toLowerCase() !== "regular" ? baseName + " — " + variation : baseName,
				type: /service|membership|event|donation/.test(rawType) ? "Service" : "Product",
				code: String(cell(row, idx.code)).trim() || "POS-" + Date.now() + "-" + index,
				category: path[0] || "Uncategorized",
				subcategory: explicitSub || path.slice(1).join(" > "),
				description: String(cell(row, idx.description)).trim(),
				cost: catalogueNumber(cell(row, idx.cost)),
				price: catalogueNumber(cell(row, idx.price)),
				stock: catalogueNumber(cell(row, idx.stock)),
				unit: String(cell(row, idx.unit)).trim() || "item",
				supplier: String(cell(row, idx.supplier)).trim(),
			};
		})
		.filter(Boolean);
}

/** Stock-count sheet rows: [{key, count}] from sheet_to_json output. */
export function parseStockCountRows(rows) {
	const out = [];
	rows.forEach((row) => {
		const key = Object.keys(row).find((k) => /sku|code|barcode|item.?name|product|name/i.test(k));
		const countKey = Object.keys(row).find((k) => /count|stock|quantity|qty|on.?hand/i.test(k));
		if (!key || !countKey) return;
		const value = Number(String(row[countKey]).replace(/[^0-9.-]/g, ""));
		if (!Number.isFinite(value)) return;
		out.push({ needle: String(row[key]).trim().toLowerCase(), value });
	});
	return out;
}

/**
 * The modifier group that holds an item's sizes: the group named "Size" first, else any assigned group with "size"
 * in its name. null when the item has none.
 */
export function productSizeGroup(product, modifierGroups) {
	const groups = (modifierGroups || []).filter((m) => (product?.modifierIds || []).includes(m.id) && /size/i.test(m.name));
	return groups.find((m) => m.name.trim().toLowerCase() === "size") || groups[0] || null;
}
