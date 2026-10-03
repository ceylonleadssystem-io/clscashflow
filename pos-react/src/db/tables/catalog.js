/**
 * Table definitions for the catalogue: products, categories, subcategories and modifier groups.
 */
import { defineTable } from "../defineTable";

export const products = defineTable(
	"products",
	{
		name: "string",
		type: "string", // Product | Service
		code: "string",
		category: "string",
		subcategory: "string",
		description: "string",
		cost: "number",
		price: "number",
		image: "string", // data-URL (compressed in the browser)
		imageFit: "string", // cover | contain
		imagePositionX: "number",
		imagePositionY: "number",
		imageSource: "string",
		stock: "number",
		unit: "string",
		supplier: "string",
		trackStock: "boolean", // false = stock row deleted: always sellable
		barcode: "string",
		modifierIds: "json", // string[]
		modifierRules: "json", // { [modifierId]: required? }
		recipe: "json", // [{ itemId, qty }]
		createdAt: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["code", "category"] },
);

/** Main categories (legacy payload keeps them as an array of names). */
export const categories = defineTable(
	"categories",
	{ name: "string", updatedAt: "string" },
	{ indexed: ["name"] },
);

export const subcategories = defineTable(
	"subcategories",
	{ name: "string", parent: "string", updatedAt: "string" },
	{ indexed: ["parent"] },
);

export const modifierGroups = defineTable(
	"modifier_groups",
	{
		name: "string",
		mode: "string", // single | multiple
		required: "boolean",
		options: "json", // [{ name, price }]
		createdAt: "string",
		updatedAt: "string",
	},
	{ order: "newest", legacyKey: "modifiers" },
);
