/**
 * Converts between the relational WatermelonDB snapshot and the legacy cloud payload format, and lists
 * which arrays are merged by id and timestamp.
 */
import { TABLE_LIST, T } from "../../db/tables";
import { EMPTY_SNAPSHOT } from "../../db/PosStore";

/**
 * Converts between the relational snapshot (WatermelonDB) and the legacy
 * cloud payload (`users/{uid}/pos/main.payload`). Keeping the payload format
 * unchanged means the new React POS and the legacy HTML POS can read/write
 * the same cloud document.
 */

/** Payload keys that map to tables (legacy array names). */
export const PAYLOAD_ARRAYS = TABLE_LIST.filter(
	(t) => t.legacyKey && t !== T.categories && t !== T.sales,
).map((t) => t.legacyKey);

/** Arrays whose rows are merged by id + updatedAt during cloud sync. */
export const MERGE_ARRAYS = [
	"products",
	"modifiers",
	"customers",
	"sales",
	"users",
	"locations",
	"locationAudit",
	"stockTransfers",
	"timeEntries",
	"cashShifts",
	"supportAudit",
	"subcategories",
	"inventory",
	"stockMovements",
	"voidOrders",
	"openOrders",
	"customerCommunications",
	"appointments",
	"memberships",
	"prescriptions",
	"medicineBatches",
	"commissionPayments",
	"kitchenTickets",
];

const KNOWN_TOP_LEVEL = new Set([
	...PAYLOAD_ARRAYS,
	"categories",
	"sales",
	"settings",
	"syncMeta",
]);

export function snapshotToPayload(snapshot, { stripLocalOnly = true } = {}) {
	const payload = {};
	for (const key of PAYLOAD_ARRAYS) payload[key] = clone(snapshot[key] || []);
	payload.categories = [...(snapshot.categories || [])];
	payload.sales = clone(snapshot.sales || []);
	payload.settings = clone(snapshot.settings || {});
	if (stripLocalOnly) delete payload.settings.ownerAuth;
	const meta = snapshot.meta || {};
	for (const [key, value] of Object.entries(meta)) {
		if (key === "syncUpdatedAt") continue;
		payload[key] = clone(value);
	}
	payload.syncMeta = {
		updatedAt: meta.syncUpdatedAt,
		settings: { ...(snapshot.settingsUpdatedAt || {}) },
	};
	return payload;
}

export function payloadToSnapshot(payload) {
	const snap = EMPTY_SNAPSHOT();
	payload = payload && typeof payload === "object" ? payload : {};
	for (const key of PAYLOAD_ARRAYS)
		snap[key] = clone(Array.isArray(payload[key]) ? payload[key] : []);
	snap.categories = (Array.isArray(payload.categories) ? payload.categories : [])
		.map((c) => (typeof c === "string" ? c : c?.name))
		.filter(Boolean);
	snap.sales = clone(Array.isArray(payload.sales) ? payload.sales : []);
	snap.settings = clone(payload.settings || {});
	snap.settingsUpdatedAt = { ...(payload.syncMeta?.settings || {}) };
	for (const [key, value] of Object.entries(payload)) {
		if (KNOWN_TOP_LEVEL.has(key)) continue;
		snap.meta[key] = clone(value);
	}
	if (payload.syncMeta?.updatedAt) snap.meta.syncUpdatedAt = payload.syncMeta.updatedAt;
	return snap;
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
