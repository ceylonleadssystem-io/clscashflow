/**
 * Merge rules for cloud sync: per-row last-writer-wins lists, per-location inventory merging, tombstoned
 * deletions, per-setting timestamps, and payloadCovers() to confirm a push landed.
 */
import { MERGE_ARRAYS } from "./payload";

/** Ported 1:1 from the legacy cloud layer (mergeList/mergePayload/...). */

export function itemTime(item) {
	return (
		Date.parse(item?.updatedAt || item?.createdAt || item?.at || item?.date || "") || 0
	);
}

const keyOf = (item) =>
	item && item.id != null ? String(item.id) : "value:" + JSON.stringify(item);

export function mergeList(remote, local) {
	const map = new Map();
	(remote || []).forEach((item) => map.set(keyOf(item), item));
	(local || []).forEach((item) => {
		const key = keyOf(item);
		const old = map.get(key);
		if (!old || itemTime(item) >= itemTime(old)) map.set(key, item);
	});
	return Array.from(map.values());
}

export function mergeInventoryList(remote, local) {
	const map = new Map();
	(remote || []).forEach((item) => map.set(keyOf(item), item));
	(local || []).forEach((item) => {
		const key = keyOf(item);
		const old = map.get(key);
		if (!old) {
			map.set(key, item);
			return;
		}
		const base =
			itemTime(item) >= itemTime(old)
				? Object.assign({}, old, item)
				: Object.assign({}, item, old);
		const remoteQty = old.locationQuantities || {};
		const localQty = item.locationQuantities || {};
		const remoteTimes = old.locationQuantityUpdatedAt || {};
		const localTimes = item.locationQuantityUpdatedAt || {};
		const mergedQty = Object.assign({}, remoteQty, localQty);
		const mergedTimes = Object.assign({}, remoteTimes, localTimes);
		new Set(Object.keys(remoteQty).concat(Object.keys(localQty))).forEach((loc) => {
			const remoteTime = Date.parse(remoteTimes[loc] || old.updatedAt || old.createdAt || "") || 0;
			const localTime = Date.parse(localTimes[loc] || item.updatedAt || item.createdAt || "") || 0;
			mergedQty[loc] = localTime >= remoteTime ? localQty[loc] : remoteQty[loc];
			mergedTimes[loc] =
				localTime >= remoteTime
					? localTimes[loc] || item.updatedAt || ""
					: remoteTimes[loc] || old.updatedAt || "";
		});
		base.locationQuantities = mergedQty;
		base.locationQuantityUpdatedAt = mergedTimes;
		map.set(key, base);
	});
	return Array.from(map.values());
}

const DELETED_KEYS = [
	"products",
	"modifiers",
	"inventory",
	"sales",
	"saleReceipts",
	"users",
	"categories",
	"subcategories",
];

/**
 * Deletions are tombstoned in `deletedIds` and always win over a live copy of the row;
 * `preferLocal` only breaks ties (equal timestamps) and decides top-level key precedence.
 */
export function mergePayload(remote, local, preferLocal) {
	remote = remote && typeof remote === "object" ? remote : {};
	local = local && typeof local === "object" ? local : {};
	const merged = preferLocal ? Object.assign({}, remote, local) : Object.assign({}, local, remote);
	merged.deletedIds = {};
	for (const key of DELETED_KEYS)
		merged.deletedIds[key] = Array.from(
			new Set([].concat(remote.deletedIds?.[key] || [], local.deletedIds?.[key] || []).map(String)),
		);
	const arrays = [...MERGE_ARRAYS];
	for (const key of arrays) {
		merged[key] = key === "inventory" ? mergeInventoryList(remote[key], local[key]) : mergeList(remote[key], local[key]);
		if (merged.deletedIds[key]) {
			const removed = new Set(merged.deletedIds[key]);
			merged[key] = merged[key].filter((item) => !removed.has(String(item?.id)));
		}
	}
	// categories: union minus tombstones
	const removedCategories = new Set(merged.deletedIds.categories.map((n) => String(n).trim().toLowerCase()));
	merged.categories = Array.from(new Set([].concat(remote.categories || [], local.categories || []))).filter(
		(name) => !removedCategories.has(String(name).trim().toLowerCase()),
	);
	const deletedReceipts = new Set(merged.deletedIds.saleReceipts || []);
	merged.sales = (merged.sales || []).filter((sale) => !deletedReceipts.has(String(sale.receipt || "")));

	// settings: per-key last-writer-wins using syncMeta.settings timestamps
	const remoteSettings = remote.settings || {};
	const localSettings = local.settings || {};
	const remoteTimes = remote.syncMeta?.settings || {};
	const localTimes = local.syncMeta?.settings || {};
	merged.settings = {};
	new Set(Object.keys(remoteSettings).concat(Object.keys(localSettings))).forEach((key) => {
		const rt = Date.parse(remoteTimes[key] || "") || 0;
		const lt = Date.parse(localTimes[key] || "") || 0;
		merged.settings[key] =
			lt > rt
				? localSettings[key]
				: rt > lt
					? remoteSettings[key]
					: preferLocal && Object.prototype.hasOwnProperty.call(localSettings, key)
						? localSettings[key]
						: remoteSettings[key];
	});
	merged.syncMeta = Object.assign({}, remote.syncMeta || {}, local.syncMeta || {});
	merged.syncMeta.settings = {};
	new Set(Object.keys(remoteTimes).concat(Object.keys(localTimes))).forEach((key) => {
		merged.syncMeta.settings[key] =
			(Date.parse(localTimes[key] || "") || 0) >= (Date.parse(remoteTimes[key] || "") || 0)
				? localTimes[key]
				: remoteTimes[key];
	});
	merged.syncMeta.updatedAt =
		(Date.parse(local.syncMeta?.updatedAt || "") || 0) >= (Date.parse(remote.syncMeta?.updatedAt || "") || 0)
			? local.syncMeta?.updatedAt
			: remote.syncMeta?.updatedAt;
	merged.nextOrderSequence = Math.max(+remote.nextOrderSequence || 0, +local.nextOrderSequence || 0);
	return merged;
}

/**
 * True when `remote` already contains everything in `local`. Used to confirm a push landed
 * (and to clear the pending flag), so it errs on the side of returning false.
 */
export function payloadCovers(remote, local) {
	if (!remote || !local) return false;
	const arrays = MERGE_ARRAYS.filter((k) => k !== "kitchenTickets");
	for (const key of arrays) {
		const remoteById = new Map(
			(remote[key] || []).filter((i) => i && i.id != null).map((i) => [String(i.id), i]),
		);
		for (const item of local[key] || []) {
			if (!item || item.id == null) continue;
			const saved = remoteById.get(String(item.id));
			if ((remote.deletedIds?.[key] || []).map(String).includes(String(item.id))) continue;
			if (key === "sales" && (remote.deletedIds?.saleReceipts || []).map(String).includes(String(item.receipt || "")))
				continue;
			if (!saved || itemTime(saved) < itemTime(item)) return false;
		}
	}
	for (const dk of DELETED_KEYS) {
		const savedDeleted = new Set(remote.deletedIds?.[dk] || []);
		if ((local.deletedIds?.[dk] || []).some((id) => !savedDeleted.has(String(id)) && !savedDeleted.has(id)))
			return false;
	}
	const remoteTimes = remote.syncMeta?.settings || {};
	const localTimes = local.syncMeta?.settings || {};
	for (const setting of Object.keys(local.settings || {})) {
		const lt = Date.parse(localTimes[setting] || "") || 0;
		const rt = Date.parse(remoteTimes[setting] || "") || 0;
		if (rt < lt) return false;
		if (!lt && !rt && JSON.stringify(remote.settings?.[setting]) !== JSON.stringify(local.settings[setting])) return false;
	}
	return true;
}
