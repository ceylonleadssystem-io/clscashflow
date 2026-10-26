/**
 * Assist copy of a client's POS. From the admin portal an administrator opens the POS on a COPY of the client's configuration
 * (menu, modifiers, locations, settings, table layouts) to help set it up. It is not a live view and nothing reaches the client until
 * the administrator presses "Send changes": only menu and shop configuration is sent and merged by the server (see domain/assistConfig.js).
 * Sales, customers, staff PINs and cash records are never copied to the administrator's browser.
 *
 * Two local databases hold the copy: the one being edited and a pristine one used to work out what changed. The copy is built in the
 * assist tab itself from the server (the admin tab only passes the account id), so nothing depends on another tab finishing a write.
 */
import { createDatabase } from "../db/database";
import { PosStore, EMPTY_SNAPSHOT } from "../db/PosStore";
import { payloadToSnapshot, snapshotToPayload } from "./sync/payload";
import { freshAccountDb, normalizeAccountDb } from "./sync/account";
import { diffConfig } from "../domain/assistConfig";
import { adminSession } from "../admin-app/adminSession";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";

const log = createLogger("assist");
const INFO = "ceylonry-pos-assist";
const dbNames = (id) => ({ work: "ceylonry-pos-assist-" + id, base: "ceylonry-pos-assist-base-" + id });

// what the administrator needs to configure the POS; everything else stays with the client
const COPIED = ["products", "modifiers", "subcategories", "locations", "categories", "settings", "inventory", "appointments", "memberships", "prescriptions", "medicineBatches"];
const safeId = (id) => String(id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60);

const readInfo = () => {
	try {
		const info = JSON.parse(localStorage.getItem(INFO) || "null");
		return info?.accountId && info?.dbName ? info : null;
	} catch {
		return null;
	}
};
/** The assist copy this tab was opened for ({ accountId, business, dbName, baseName, ready }), or null. */
export const assistInfo = () => (new URLSearchParams(location.search).get("assist") === "1" ? readInfo() : null);
/** `?assist=1` without a copy or without the administrator's sign-in (the page was not opened from the admin portal). */
export const assistRequested = () => new URLSearchParams(location.search).get("assist") === "1";
export const assistSignedIn = () => !!adminSession.get() || env.authProvider === "local";
export const assistActive = () => !!assistInfo() && assistSignedIn();

/** The configuration part of a client's workspace payload; staff keep only their names and roles (no PINs). */
export function configCopy(payload, accountId) {
	const out = freshAccountDb({ name: "Owner" }, { uid: "assist-" + accountId, email: "" });
	for (const key of COPIED) if (payload?.[key] !== undefined) out[key] = JSON.parse(JSON.stringify(payload[key]));
	for (const key of ["supportCode", "supportCodeExpiresAt", "ownerAuth"]) delete out.settings?.[key];
	out.users = (payload?.users || []).map((u) => ({ id: u.id, name: u.name, role: u.role, active: u.active !== false, locationAccess: u.locationAccess, locationIds: u.locationIds, createdAt: u.createdAt }));
	if (!out.users.some((u) => u.role === "owner")) out.users.unshift({ id: "u-owner", name: "Owner", role: "owner", active: true, locationAccess: "all", locationIds: [] });
	out.deletedIds = JSON.parse(JSON.stringify(payload?.deletedIds || {}));
	return out;
}

/** Admin tab: remembers which business the new tab is for. The copy itself is built by that tab (prepareAssist). */
export function beginAssist({ accountId, business }) {
	const names = dbNames(safeId(accountId));
	localStorage.setItem(INFO, JSON.stringify({ accountId, business: business || "", dbName: names.work, baseName: names.base, ready: false, startedAt: new Date().toISOString() }));
}

/** Builds both local databases from the client's workspace payload and marks the copy ready. */
export async function createAssistCopy({ accountId, business, payload }) {
	const id = safeId(accountId);
	const names = dbNames(id);
	const user = { uid: "assist-" + id, email: "" };
	const snapshot = payloadToSnapshot(normalizeAccountDb(configCopy(payload, id), {}, user));
	for (const name of [names.work, names.base]) await assistStore(name).replaceAll(snapshot, { preserveTimestamps: true });
	localStorage.setItem(INFO, JSON.stringify({ accountId, business: business || "", dbName: names.work, baseName: names.base, ready: true, startedAt: new Date().toISOString() }));
	log.info("assist copy created", { accountId });
	return names.work;
}

/**
 * Assist tab, on start: makes sure the copy exists. A copy that is ready and not empty (a reload of this tab) is kept, so unsent
 * work survives; otherwise it is built from `fetchPayload()` (the client's current configuration from the server).
 */
export async function prepareAssist(info, fetchPayload) {
	if (info.ready) {
		const snap = await assistStore(info.dbName).readSnapshot();
		if (snap.products.length || snap.settings.business) return info;
	}
	const res = await fetchPayload();
	await createAssistCopy({ accountId: info.accountId, business: res?.settings?.business || info.business, payload: res || {} });
	return readInfo();
}

// one store per database name in this tab, so every read sees the writes just made (the database persists on a timer)
const stores = new Map();
export const assistStore = (name) => {
	if (!stores.has(name)) stores.set(name, new PosStore(createDatabase(name)));
	return stores.get(name);
};

const payloadOf = async (name) => snapshotToPayload(await assistStore(name).readSnapshot());

/** What the administrator has changed since the copy was made (or last sent): a configuration change for the server. */
export async function pendingConfig(info = assistInfo()) {
	if (!info) return null;
	return diffConfig(await payloadOf(info.baseName), await payloadOf(info.dbName));
}

/** After a successful send: the copy becomes the new starting point, so the next send carries only what changes after it. */
export async function markSent(info = assistInfo()) {
	const work = await assistStore(info.dbName).readSnapshot();
	await assistStore(info.baseName).replaceAll(work, { preserveTimestamps: true });
}

/** Removes the copy from this browser. */
export async function endAssist(info = assistInfo()) {
	if (!info) return;
	for (const name of [info.dbName, info.baseName]) {
		try {
			await assistStore(name).replaceAll(EMPTY_SNAPSHOT(), { keepSettings: [], preserveTimestamps: true });
		} catch (e) {
			log.warn("assist copy could not be emptied", e);
		}
	}
	localStorage.removeItem(INFO);
	log.info("assist copy removed");
}
