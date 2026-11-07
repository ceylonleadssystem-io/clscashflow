/**
 * Which POS address a business belongs on. The live site has three: the main POS (pos.ceylonrylabs.io, used by restaurants, shops, salons and
 * the other types), the Automobile (car detailing) POS (automobile.ceylonrylabs.io, also ceylonrylabs.io/Automobile) and the Restaurant (OGF) POS
 * (ogf.ceylonrylabs.io). The old ceylonrylabs.io/posv2/ redirects to the main POS. All are the same app
 * and the same login; the business type, chosen by the Ceylonry team, decides which address the business should use. After the business
 * signs in, the session moves to the right address (services/handoff.js). Anywhere else (local development, previews, the admin address)
 * nothing is redirected.
 */
import { businessTypeLocked } from "./businessType";

export const POS_BASE_HOST = "ceylonrylabs.io";
export const POS_URLS = {
	main: "https://pos." + POS_BASE_HOST + "/",
	automobile: "https://automobile." + POS_BASE_HOST + "/",
	ogf: "https://ogf." + POS_BASE_HOST + "/",
};

/** "automobile", "ogf" or "main" for a business whose type has been chosen; "" while the business has not chosen one yet. */
export function addressForType(settings = {}) {
	if (!settings.businessType || !businessTypeLocked(settings)) return "";
	return settings.businessType === "automobile" ? "automobile" : settings.businessType === "ogf" ? "ogf" : "main";
}

/** The POS address this page is on: "automobile", "ogf", "main", or "" for anything that is not one of the live addresses. */
export function addressOfPage({ hostname = "", pathname = "" } = {}) {
	const host = String(hostname).toLowerCase();
	if (host === "automobile." + POS_BASE_HOST) return "automobile";
	if (host === "ogf." + POS_BASE_HOST) return "ogf";
	if (host === "pos." + POS_BASE_HOST) return "main";
	if (host !== POS_BASE_HOST && host !== "www." + POS_BASE_HOST) return "";
	return /^\/automobile\/?$/i.test(pathname) ? "automobile" : "";
}

/** True on the addresses whose root page is the POS (the main POS, Automobile and OGF): the service worker then controls the whole address. */
export const servesPosAtRoot = (hostname = "") => ["pos.", "automobile.", "ogf."].some((prefix) => String(hostname).toLowerCase() === prefix + POS_BASE_HOST);

/** The address to move to after sign-in, or "" when the business is already where it belongs (or there is nothing to decide). */
export function posRedirect(settings, page) {
	const want = addressForType(settings);
	const at = addressOfPage(page);
	return want && at && want !== at ? POS_URLS[want] : "";
}
