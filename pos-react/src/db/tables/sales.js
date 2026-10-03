/**
 * Table definitions for sales: completed sales (header), their order lines, open orders, void orders
 * and kitchen tickets.
 */
import { defineTable } from "../defineTable";

/** A completed sale (order header). Lines live in `sale_lines`. */
export const sales = defineTable(
	"sales",
	{
		receipt: "string",
		orderNumber: "string",
		date: "string", // YYYY-MM-DD
		createdAt: "string",
		customerId: "string",
		customerName: "string",
		customerPhone: "string",
		payment: "string", // Cash | Card | ... | Split
		payments: "json", // split-bill shares
		total: "number",
		cost: "number",
		profit: "number",
		receiptEmail: "string",
		receiptSentAt: "string",
		staffId: "string",
		cashShiftId: "string",
		status: "string", // completed | partially_refunded | refunded | voided
		orderReference: "string",
		orderChannel: "string",
		platformOrderId: "string",
		openOrderId: "string",
		discount: "json",
		serviceCharge: "json",
		cashAmount: "number",
		cashDue: "number",
		cashTendered: "number",
		changeGiven: "number",
		originalTotal: "number",
		originalCost: "number",
		refunds: "json",
		refundAt: "string",
		refundReason: "string",
		refundBy: "string",
		voidAt: "string",
		voidReason: "string",
		voidBy: "string",
		voidAmount: "number",
		voidCashShiftId: "string",
		voidCashAmount: "number",
		inventoryDeducted: "boolean",
		inventoryRestored: "boolean",
		productStockDeducted: "boolean",
		productStockRestored: "boolean",
		printRequested: "boolean",
		committedAt: "string",
		locationId: "string",
		locationName: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["date", "customerId", "status", "locationId", "receipt"] },
);

/** Order line of a sale (snapshot of the cart line at checkout time). */
export const saleLines = defineTable(
	"sale_lines",
	{
		saleId: "string",
		lineIndex: "number",
		productId: "string",
		key: "string",
		name: "string",
		code: "string",
		category: "string",
		type: "string",
		cost: "number",
		price: "number",
		basePrice: "number",
		qty: "number",
		image: "string",
		modifiers: "json", // [{ groupId, groupName, optionName, price }]
		recipe: "json",
		isDiscount: "boolean",
		isServiceCharge: "boolean",
	},
	{ indexed: ["saleId", "productId"], legacyKey: null },
);

export const openOrders = defineTable(
	"open_orders",
	{
		orderNumber: "string",
		openedAt: "string",
		updatedAt: "string",
		createdAt: "string",
		status: "string", // open | paid | voided
		staffId: "string",
		customerId: "string",
		orderReference: "string",
		orderChannel: "string",
		platformOrderId: "string",
		lines: "json", // cart snapshot
		discount: "json",
		kitchenSentAt: "string",
		kitchenSendCount: "number",
		saleId: "string",
		closedAt: "string",
		voidedAt: "string",
		voidedBy: "string",
		voidReason: "string",
		locationId: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
	},
	{ order: "newest", indexed: ["status"], legacyKey: "openOrders" },
);

export const voidOrders = defineTable(
	"void_orders",
	{
		at: "string",
		staffId: "string",
		lines: "json",
		total: "number",
		locationId: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
		updatedAt: "string",
	},
	{ order: "newest", legacyKey: "voidOrders" },
);

export const kitchenTickets = defineTable(
	"kitchen_tickets",
	{
		orderId: "string",
		orderNumber: "string",
		reference: "string",
		destination: "string",
		status: "string",
		createdAt: "string",
		lines: "json",
		locationId: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
		updatedAt: "string",
	},
	{ order: "newest", legacyKey: "kitchenTickets" },
);
