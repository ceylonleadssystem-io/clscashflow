import { defineTable } from "../defineTable";

export const users = defineTable(
	"users",
	{
		name: "string",
		role: "string", // owner | admin | manager | accountant | cashier
		pin: "string",
		active: "boolean",
		commissionRate: "number",
		locationAccess: "string", // all | selected
		locationIds: "json",
		clockInBehaviour: "string",
		registerBehaviour: "string",
		createdAt: "string",
		updatedAt: "string",
	},
	{ indexed: ["role"] },
);

export const timeEntries = defineTable(
	"time_entries",
	{
		userId: "string",
		clockIn: "string",
		clockOut: "string",
		breaks: "json", // [{ start, end }]
		locationId: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["userId"], legacyKey: "timeEntries" },
);

export const cashShifts = defineTable(
	"cash_shifts",
	{
		userId: "string",
		openedAt: "string",
		openingCash: "number",
		status: "string", // open | closed
		expectedCash: "number",
		actualCash: "number",
		variance: "number",
		closedAt: "string",
		cashTenderedTotal: "number",
		changeGivenTotal: "number",
		netCashSales: "number",
		locationId: "string",
		businessId: "string",
		sessionId: "string",
		deviceId: "string",
		updatedAt: "string",
	},
	{ order: "newest", indexed: ["userId", "status"], legacyKey: "cashShifts" },
);
