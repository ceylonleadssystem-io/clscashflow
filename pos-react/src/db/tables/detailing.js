/**
 * Table definitions for the Automobile (car detailing) business type: customer vehicles, service packages and
 * detailing jobs (booking -> job -> invoice). Customers, staff, inventory and sales reuse the existing POS tables.
 */
import { defineTable } from "../defineTable";

export const vehicles = defineTable("vehicles", {
	customerId: "string",
	registration: "string",
	make: "string",
	model: "string",
	year: "string",
	colour: "string",
	category: "string",
	notes: "string",
	createdAt: "string",
	updatedAt: "string",
});

export const detailPackages = defineTable(
	"detail_packages",
	{
		name: "string",
		category: "string",
		price: "number",
		durationMin: "number",
		description: "string",
		supplies: "json", // [{ itemId, qty }] taken from inventory when a job is completed
		active: "boolean",
		createdAt: "string",
		updatedAt: "string",
	},
	{ legacyKey: "detailPackages" },
);

export const detailJobs = defineTable(
	"detail_jobs",
	{
		customerId: "string",
		vehicleId: "string",
		packageId: "string",
		packageName: "string",
		price: "number",
		discount: "number",
		scheduledAt: "string",
		address: "string",
		technicianId: "string",
		status: "string", // Booked, Confirmed, Assigned, Travelling, Arrived, In Progress, Quality Check, Completed, Invoiced, Cancelled
		paused: "boolean",
		notes: "string",
		inspection: "string",
		signedBy: "string",
		startedAt: "string",
		completedAt: "string",
		stockDeducted: "boolean",
		invoiceNumber: "string",
		invoicedAt: "string",
		payments: "json", // [{ method, amount, at }]
		saleId: "string",
		createdAt: "string",
		updatedAt: "string",
	},
	{ legacyKey: "detailJobs" },
);
