/**
 * Shared plumbing for the POS action services: the ctx builder, id generation, stamping rows with
 * location/device metadata, audit entries, deletion tombstones, stock-change helpers and business-type checks.
 */
import { T } from "../../db/tables";
import { nowIso } from "../../domain/format";

/**
 * Shared plumbing for the POS action services.
 *
 * Every service function receives a `ctx` built by `makeCtx()`:
 *   ctx.store            PosStore (WatermelonDB facade, atomic multi-table writes)
 *   ctx.repos            repositories (queries / single-entity saves)
 *   ctx.data()           latest plain snapshot (legacy `db` shape)
 *   ctx.session()        { userId, user, locationId, sessionId, deviceId, businessId }
 *   ctx.features()       resolved feature flags
 *   ctx.ui               { notice, alert, confirm, prompt }
 */
export function makeCtx({ store, getData, getSession, getFeatures, ui, repos }) {
	return { store, repos, data: getData, session: getSession, features: getFeatures, ui };
}

let idCounter = 0;
export const newId = (prefix) =>
	prefix + Date.now().toString() + String(idCounter++ % 1000).padStart(3, "0");

/** Legacy `stampRecords`: tag new operational rows with location/device metadata. */
export function stamp(record, session) {
	if (record.locationId || !session.locationId || session.locationId === "all") return record;
	return {
		...record,
		businessId: session.businessId,
		locationId: session.locationId,
		sessionId: record.sessionId || session.sessionId,
		deviceId: record.deviceId || session.deviceId,
	};
}

export function audit(tx, session, action, details, locationId) {
	tx.put(T.locationAudit, {
		id: "la" + Date.now() + Math.random(),
		businessId: session.businessId,
		userId: session.userId || "",
		locationId: locationId || (session.locationId !== "all" ? session.locationId : "") || "",
		sessionId: session.sessionId || "",
		deviceId: session.deviceId || "",
		action,
		details: details || "",
		at: nowIso(),
	});
}

export function supportAuditEntry(tx, session, action, details) {
	tx.put(T.supportAudit, {
		id: "sa" + Date.now() + Math.random(),
		at: nowIso(),
		action,
		details,
		userId: session.userId || "",
		locationId: session.locationId || "",
		sessionId: session.sessionId || "",
		session: "support",
	});
}

/** Adds a tombstone so the deletion survives cloud merges. */
export async function markDeleted(tx, group, id) {
	const meta = (await tx.get(T.appMeta, "deletedIds")) || { id: "deletedIds", value: {} };
	const value = { ...(meta.value || {}) };
	const list = Array.isArray(value[group]) ? [...value[group]] : [];
	const key = String(id);
	if (!list.includes(key)) list.push(key);
	value[group] = list;
	tx.setMeta("deletedIds", value);
}

export async function unmarkDeletedCategory(tx, name) {
	const meta = await tx.get(T.appMeta, "deletedIds");
	if (!meta) return;
	const key = String(name).trim().toLowerCase();
	const value = { ...(meta.value || {}) };
	value.categories = (value.categories || []).filter((c) => String(c).trim().toLowerCase() !== key);
	tx.setMeta("deletedIds", value);
}

/** Stock change helpers shared by checkout, refunds, adjustments. */
export function applyStockChange(item, change, locationId, now = nowIso()) {
	const q = { ...(item.locationQuantities || {}) };
	const base = locationId && q[locationId] != null ? Number(q[locationId]) || 0 : Number(item.qty) || 0;
	const after = base + change;
	const next = { ...item, qty: after };
	if (locationId) {
		next.locationQuantities = { ...q, [locationId]: after };
		next.locationQuantityUpdatedAt = { ...(item.locationQuantityUpdatedAt || {}), [locationId]: now };
	}
	return { item: next, balance: after };
}

export function movementRow(item, balance, change, reason, note, session) {
	return {
		id: "sm" + Date.now() + Math.random(),
		itemId: item.id,
		itemName: item.name,
		at: nowIso(),
		change: +change,
		balance: +balance,
		reason,
		note: note || "",
		userId: session.userId || "",
		...(session.locationId && session.locationId !== "all"
			? { locationId: session.locationId, businessId: session.businessId }
			: {}),
	};
}

export const kitchenMode = (settings) => ["restaurant", "cafe"].includes(settings.businessType);
export const serviceChargeSupported = (settings) =>
	["restaurant", "cafe", "salon", "services"].includes(settings.businessType);
