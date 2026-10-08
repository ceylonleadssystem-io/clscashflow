/**
 * Menu export (pure): turns a business' products into the rows of the Ceylonry catalogue template, so the file can be
 * uploaded again with the POS "Import Catalogue" option (see parseCatalogueRows in catalog.js, which reads these headers).
 * Images, modifiers, recipes and per-size stock are not part of that format and are not exported.
 */
export const CATALOGUE_HEADERS = ["Name", "Type", "SKU / Code", "Main Category", "Subcategory", "Description", "Cost Price", "Selling Price", "Stock Quantity", "Unit", "Supplier"];

// the importer reads "Main > Sub, Other" in the category column as a path, so those two characters cannot stay in a name
const plain = (v) => String(v ?? "").replace(/[,>]/g, " ").replace(/\s+/g, " ").trim();

/** Stock to export: the counted quantity from the stock rows (all sizes added up), else the item's own stock; empty when not counted. */
export function exportStock(product, inventory = []) {
	const rows = inventory.filter((i) => String(i.productId || "") === String(product.id));
	if (rows.length) return rows.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
	return product.trackStock === false ? "" : Number(product.stock) || 0;
}

/** Header row plus one row per product, sorted by category then name. */
export function catalogueExportMatrix(products = [], inventory = []) {
	const rows = [...products]
		.sort((a, b) => String(a.category || "").localeCompare(String(b.category || "")) || String(a.name || "").localeCompare(String(b.name || "")))
		.map((p) => [
			String(p.name ?? "").trim(),
			/service/i.test(String(p.type || "")) ? "Service" : "Product",
			String(p.code ?? "").trim(),
			plain(p.category) || "Uncategorized",
			plain(p.subcategory),
			String(p.description ?? "").trim(),
			Number(p.cost) || 0,
			Number(p.price) || 0,
			exportStock(p, inventory),
			String(p.unit || "item").trim(),
			String(p.supplier ?? "").trim(),
		]);
	return [CATALOGUE_HEADERS, ...rows];
}

/** File name such as "my-cafe-menu-2026-10-08.xlsx". */
export const menuFileName = (business, ext, date = new Date()) =>
	(String(business || "business").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business") + "-menu-" + date.toISOString().slice(0, 10) + "." + ext;
