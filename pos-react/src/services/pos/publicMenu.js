/**
 * QR digital menu: publishes a snapshot of the menu to the cloud under one fixed link per location, so the printed QR code never changes
 * while the menu behind it does. Turning a link on or off, and sending the latest menu, goes through the Netlify function menu-share.
 */
import { env, isAppwrite } from "../../config/env";
import { buildMenuSnapshot, enabledKeys, linkKey, linkOf } from "../../domain/publicMenu";
import { createLogger } from "../../utils/logger";

const log = createLogger("publicMenu");

async function call(body) {
	const { getAppwriteCompat } = await import("../appwrite/appwriteCompat");
	const user = getAppwriteCompat().auth().currentUser;
	if (!user) throw new Error("Sign in to the cloud account to use the QR menu.");
	const res = await fetch(env.menuShareUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await user.getIdToken()) }, body: JSON.stringify(body) });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw new Error(json.error || "The QR menu service failed (" + res.status + ")");
	return json;
}

const saveLink = (ctx, key, link) => {
	const current = ctx.data().settings.publicMenu || {};
	return ctx.store.write((tx) => tx.setSetting("publicMenu", { ...current, links: { ...(current.links || {}), [key]: link } }));
};

/** Sends the current menu of a location to its public link and returns { token, url }. */
export async function sendPublicMenu(ctx, locationId) {
	const key = linkKey(locationId);
	const out = await call({ action: "publish", locationId: key, menu: { ...buildMenuSnapshot(ctx.data(), key), updatedAt: new Date().toISOString() } });
	return { token: out.token, url: out.url };
}

/** Switches the QR menu on for a location (creates its link the first time) and returns the link. */
export async function enablePublicMenu(ctx, locationId) {
	if (!isAppwrite()) return void (await ctx.ui.alert("The QR menu needs a cloud (Appwrite) account. It is not available in local mode."));
	try {
		const { token, url } = await sendPublicMenu(ctx, locationId);
		await saveLink(ctx, linkKey(locationId), { token, url, enabled: true });
		ctx.ui.notice("QR menu is on.");
		return { token, url };
	} catch (e) {
		log.warn("QR menu could not be turned on", e);
		await ctx.ui.alert(e.message);
	}
}

/** Switches a location's QR menu off: the link stops showing the menu, and the same link works again if it is switched back on. */
export async function disablePublicMenu(ctx, locationId) {
	const key = linkKey(locationId);
	const link = linkOf(ctx.data().settings, key);
	if (!link) return false;
	try {
		await call({ action: "disable", locationId: key });
		await saveLink(ctx, key, { ...link, enabled: false });
		ctx.ui.notice("QR menu is off.");
		return true;
	} catch (e) {
		log.warn("QR menu could not be turned off", e);
		await ctx.ui.alert(e.message);
		return false;
	}
}

/** Sends the latest menu to every location whose link is on (after the menu changes). Failures are logged; the next change tries again. */
export async function refreshPublicMenus(ctx) {
	if (!isAppwrite()) return;
	for (const key of enabledKeys(ctx.data().settings)) {
		try {
			await sendPublicMenu(ctx, key);
		} catch (e) {
			log.warn("QR menu not refreshed", e, { key });
		}
	}
}
