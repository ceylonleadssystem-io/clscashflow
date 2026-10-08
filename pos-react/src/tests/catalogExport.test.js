import { describe, expect, it } from "vitest";
import { parseCatalogueRows } from "../domain/catalog";
import { CATALOGUE_HEADERS, catalogueExportMatrix, exportStock, menuFileName } from "../domain/catalogExport";

const products = [
	{ id: "p2", name: "Iced Coffee", type: "Service", code: "DRK-002", category: "Drinks", subcategory: "Cold", description: "Cold brew", cost: 200, price: 550, unit: "cup", supplier: "Beans Ltd" },
	{ id: "p1", name: "Chicken Sandwich", type: "Product", code: "FOD-001", category: "Food", subcategory: "", cost: 430, price: 850, stock: 12 },
	{ id: "p3", name: "Tea", type: "Product", code: "DRK-003", category: "Drinks > Hot, Cold", subcategory: "", cost: 50, price: 100, trackStock: false },
];
const inventory = [{ productId: "p1", qty: 7 }, { productId: "p1", sizeName: "L", qty: 3 }];

describe("menu export", () => {
	it("uses exactly the catalogue template headers, sorted by category then name", () => {
		const m = catalogueExportMatrix(products, inventory);
		expect(m[0]).toEqual(CATALOGUE_HEADERS);
		expect(m.slice(1).map((r) => r[0])).toEqual(["Iced Coffee", "Tea", "Chicken Sandwich"]);
	});

	it("exports counted stock from the stock rows, the item's own stock, or nothing when untracked", () => {
		expect(exportStock(products[1], inventory)).toBe(10);
		expect(exportStock({ id: "x", stock: 4 }, [])).toBe(4);
		expect(exportStock(products[2], [])).toBe("");
	});

	it("can be read back by the catalogue importer without losing anything", () => {
		const rows = parseCatalogueRows(catalogueExportMatrix(products, inventory));
		expect(rows).toHaveLength(3);
		const by = Object.fromEntries(rows.map((r) => [r.code, r]));
		expect(by["DRK-002"]).toMatchObject({ name: "Iced Coffee", type: "Service", category: "Drinks", subcategory: "Cold", description: "Cold brew", cost: 200, price: 550, unit: "cup", supplier: "Beans Ltd" });
		expect(by["FOD-001"]).toMatchObject({ name: "Chicken Sandwich", type: "Product", category: "Food", cost: 430, price: 850, stock: 10 });
		expect(by["DRK-003"].category).toBe("Drinks Hot Cold"); // "," and ">" would be read as a category path, so they become spaces
		expect(rows.every((r) => r.include)).toBe(true);
	});

	it("names the file after the business and the date", () => {
		expect(menuFileName("Café & Co.", "xlsx", new Date("2026-10-08T10:00:00Z"))).toBe("caf-co-menu-2026-10-08.xlsx");
		expect(menuFileName("", "csv", new Date("2026-10-08T10:00:00Z"))).toBe("business-menu-2026-10-08.csv");
	});
});
