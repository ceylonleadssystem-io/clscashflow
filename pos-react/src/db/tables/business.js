/**
 * Table definitions for business-level data: locations, location and support audit logs, key/value
 * settings (one row per key so each merges independently in cloud sync) and app metadata.
 */
import { defineTable } from "../defineTable";

export const locations = defineTable("locations", {
	name: "string",
	code: "string",
	address: "string",
	phone: "string",
	email: "string",
	openingHours: "string",
	active: "boolean",
	receiptHeader: "string",
	receiptFooter: "string",
	createdAt: "string",
	updatedAt: "string",
});

export const locationAudit = defineTable(
	"location_audit",
	{
		businessId: "string",
		userId: "string",
		locationId: "string",
		sessionId: "string",
		deviceId: "string",
		action: "string",
		details: "string",
		at: "string",
		updatedAt: "string",
	},
	{ order: "newest", legacyKey: "locationAudit" },
);

export const supportAudit = defineTable(
	"support_audit",
	{
		at: "string",
		action: "string",
		details: "string",
		session: "string",
		userId: "string",
		locationId: "string",
		sessionId: "string",
		updatedAt: "string",
	},
	{ order: "newest", legacyKey: "supportAudit" },
);

/**
 * Key/value settings (one row per key so each key carries its own `updatedAt`
 * and can be merged independently during cloud sync).
 */
export const settings = defineTable(
	"settings",
	{ value: "json", updatedAt: "string" },
	{ legacyKey: null },
);

/** Non-tabular application metadata (order sequence, tombstones, sync info). */
export const appMeta = defineTable(
	"app_meta",
	{ value: "json" },
	{ legacyKey: null },
);
