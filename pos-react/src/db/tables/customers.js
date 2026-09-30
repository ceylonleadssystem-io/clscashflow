import { defineTable } from "../defineTable";

export const customers = defineTable(
	"customers",
	{
		name: "string",
		phone: "string",
		email: "string",
		birthday: "string",
		company: "string",
		address: "string",
		tags: "string",
		notes: "string",
		type: "string", // regular | vip | wholesale | corporate
		discountEligible: "boolean",
		discountType: "string",
		discountValue: "number",
		discountExpiry: "string",
		discountNote: "string",
		lastFeedbackAt: "string",
		lastContactAt: "string",
		createdAt: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["phone"] },
);

export const customerCommunications = defineTable(
	"customer_communications",
	{
		customerId: "string",
		type: "string",
		message: "string",
		at: "string",
		userId: "string",
		locationId: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["customerId"], legacyKey: "customerCommunications" },
);
