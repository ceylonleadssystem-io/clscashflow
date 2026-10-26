/**
 * Assist copy of a client's POS (admin portal): works out what the administrator changed in the copy, as a small configuration
 * change that the server applies to the client's real data (netlify/lib/config-merge.js, which has the same rules).
 * Only menu and shop configuration travels: products, modifiers, subcategories, locations, categories and the business settings.
 * Sales, customers, staff and stock levels never do.
 */

import { ORDER_CHANNELS } from "../config/constants";

export const ROW_TYPES = ["products", "modifiers", "subcategories", "locations"];
export const DELETE_TYPES = ["products", "modifiers", "subcategories"];
// settings that belong to a device, the platform or the account, never to the menu and shop configuration (same list as the server)
export const BLOCKED_SETTINGS = /^(ownerAuth|subscription|features|locationFeatures|plan|welcome|businessCategory|support.*|gm.*|dev.*|usbPrinter|barcodePrinter|usbScanner|ceylo.*|invoice.*|onboardingComplete)$/;

// Saving the Settings page writes every field, including ones the business never set. A value that was never set and equals the empty or
// default value is not a change, so it is not sent (and cannot overwrite what the client sets in the meantime).
const DEFAULTS = { printerType: "system", receiptFooter: "Thank you for your purchase", posUsers: 1, orderChannels: ORDER_CHANNELS };
const isEmptyValue = (v) => v === "" || v === false || v === 0 || v === null || (Array.isArray(v) && !v.length) || (v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(isEmptyValue));
const unchangedDefault = (key, old, value) => old === undefined && (isEmptyValue(value) || (key in DEFAULTS && same(value, DEFAULTS[key])));

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const STAMPS = new Set(["updatedAt", "createdAt"]);
const lower = (s) => String(s).trim().toLowerCase();

/** The configuration change that turns `base` (the copy as it was sent to the admin) into `work` (the copy now). Payload shapes. */
export function diffConfig(base, work) {
	const cfg = { rows: {}, deleted: {}, categories: { add: [], remove: [] }, settings: {} };
	for (const type of ROW_TYPES) {
		const before = new Map((base[type] || []).map((r) => [String(r.id), r]));
		const now = work[type] || [];
		cfg.rows[type] = [];
		for (const row of now) {
			const old = before.get(String(row.id));
			if (!old) {
				cfg.rows[type].push(row);
				continue;
			}
			const patch = {};
			for (const key of Object.keys(row)) if (!STAMPS.has(key) && !same(row[key], old[key])) patch[key] = row[key];
			if (Object.keys(patch).length) cfg.rows[type].push({ id: row.id, ...patch });
		}
		if (DELETE_TYPES.includes(type)) {
			const kept = new Set(now.map((r) => String(r.id)));
			cfg.deleted[type] = [...before.keys()].filter((id) => !kept.has(id));
		}
	}
	const had = new Set((base.categories || []).map(lower));
	const has = new Set((work.categories || []).map(lower));
	cfg.categories.add = (work.categories || []).filter((n) => !had.has(lower(n)));
	cfg.categories.remove = (base.categories || []).filter((n) => !has.has(lower(n)));
	const a = base.settings || {};
	const b = work.settings || {};
	for (const key of Object.keys(b)) if (!BLOCKED_SETTINGS.test(key) && !same(a[key], b[key]) && !unchangedDefault(key, a[key], b[key])) cfg.settings[key] = b[key];
	return cfg;
}

/** Numbers for the confirmation dialog and the audit trail. */
export function countConfig(cfg) {
	const rows = ROW_TYPES.reduce((n, t) => n + cfg.rows[t].length, 0);
	const deleted = DELETE_TYPES.reduce((n, t) => n + cfg.deleted[t].length, 0);
	return { rows, deleted, categories: cfg.categories.add.length + cfg.categories.remove.length, settings: Object.keys(cfg.settings).length };
}

export const isEmptyConfig = (cfg) => !Object.values(countConfig(cfg)).some(Boolean);

/** One readable line per kind of change, for the confirmation dialog. */
export function describeConfig(cfg) {
	const n = (c, w) => c + " " + w + (c === 1 ? "" : "s");
	const lines = [];
	for (const [type, label] of [["products", "item"], ["modifiers", "modifier group"], ["subcategories", "subcategory"], ["locations", "location"]]) {
		const changed = cfg.rows[type].length;
		const removed = cfg.deleted[type]?.length || 0;
		if (changed) lines.push(n(changed, label) + " added or changed");
		if (removed) lines.push(n(removed, label) + " removed");
	}
	const cats = cfg.categories.add.length + cfg.categories.remove.length;
	if (cats) lines.push(cats + " category change" + (cats === 1 ? "" : "s"));
	const keys = Object.keys(cfg.settings);
	if (keys.length) lines.push("Settings changed: " + keys.slice(0, 6).join(", ") + (keys.length > 6 ? " and " + (keys.length - 6) + " more" : ""));
	return lines;
}

/**
 * Applies a change to a payload. The real work happens on the server; this is the same rule set for the local development back end.
 * `now` is an ISO time. The input is not modified.
 */
export function applyConfig(payload, cfg, now) {
	const out = { ...payload };
	const deletedIds = { ...(payload.deletedIds || {}) };
	for (const type of ROW_TYPES) {
		const byId = new Map((payload[type] || []).map((r) => [String(r.id), r]));
		for (const row of cfg.rows[type] || []) byId.set(String(row.id), { ...(byId.get(String(row.id)) || { createdAt: now }), ...row, updatedAt: now });
		for (const id of cfg.deleted[type] || []) {
			byId.delete(String(id));
			deletedIds[type] = [...new Set([...(deletedIds[type] || []), String(id)])];
		}
		out[type] = [...byId.values()];
	}
	const removed = new Set(cfg.categories.remove.map(lower));
	const categories = (payload.categories || []).filter((n) => !removed.has(lower(n)));
	for (const name of cfg.categories.add) if (!categories.some((n) => lower(n) === lower(name))) categories.push(name);
	out.categories = categories.sort();
	out.deletedIds = { ...deletedIds, categories: [...new Set([...(deletedIds.categories || []), ...cfg.categories.remove.map(lower)])].filter((n) => !cfg.categories.add.some((a) => lower(a) === n)) };
	const times = { ...(payload.syncMeta?.settings || {}) };
	for (const key of Object.keys(cfg.settings)) times[key] = now;
	out.settings = { ...(payload.settings || {}), ...cfg.settings };
	out.syncMeta = { ...(payload.syncMeta || {}), settings: times, updatedAt: now };
	return out;
}
