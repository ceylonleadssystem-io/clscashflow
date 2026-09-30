import { defineTable } from "../defineTable";

export const inventoryItems = defineTable(
	"inventory_items",
	{
		name: "string",
		sku: "string",
		type: "string",
		unit: "string",
		qty: "number",
		reorder: "number",
		cost: "number",
		supplier: "string",
		productId: "string",
		autoProductStock: "boolean",
		locationQuantities: "json", // { [locationId]: qty }
		locationQuantityUpdatedAt: "json",
		createdAt: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["productId", "sku"], legacyKey: "inventory" },
);

export const stockMovements = defineTable(
	"stock_movements",
	{
		itemId: "string",
		itemName: "string",
		at: "string",
		change: "number",
		balance: "number",
		reason: "string",
		note: "string",
		userId: "string",
		locationId: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["itemId"], legacyKey: "stockMovements" },
);

/** Reserved by the legacy data model (no UI in the original either). */
export const stockTransfers = defineTable(
	"stock_transfers",
	{
		itemId: "string",
		fromLocationId: "string",
		toLocationId: "string",
		qty: "number",
		status: "string",
		note: "string",
		createdAt: "string",
		userId: "string",
		updatedAt: "string",
	},
	{ legacyKey: "stockTransfers" },
);
