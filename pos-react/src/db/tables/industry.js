import { defineTable } from "../defineTable";

export const appointments = defineTable("appointments", {
	customerId: "string",
	serviceId: "string",
	time: "string",
	staffId: "string",
	status: "string",
	notes: "string",
	createdAt: "string",
	updatedAt: "string",
});

export const memberships = defineTable("memberships", {
	customerId: "string",
	name: "string",
	discount: "number",
	status: "string",
	start: "string",
	end: "string",
	createdAt: "string",
	updatedAt: "string",
});

export const prescriptions = defineTable("prescriptions", {
	customerId: "string",
	reference: "string",
	date: "string",
	prescriber: "string",
	status: "string",
	notes: "string",
	createdAt: "string",
	updatedAt: "string",
});

export const medicineBatches = defineTable(
	"medicine_batches",
	{
		itemId: "string",
		batchNumber: "string",
		quantity: "number",
		expiry: "string",
		received: "string",
		supplier: "string",
		createdAt: "string",
		updatedAt: "string",
	},
	{ legacyKey: "medicineBatches" },
);

export const commissionPayments = defineTable(
	"commission_payments",
	{
		userId: "string",
		amount: "number",
		from: "string",
		to: "string",
		paidAt: "string",
		recordedBy: "string",
		updatedAt: "string",
	},
	{ legacyKey: "commissionPayments" },
);
