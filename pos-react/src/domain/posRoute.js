/**
 * Which POS address a business belongs on. The live site has two: the main POS (ceylonrylabs.io/posv2/, used by restaurants, shops, salons and
 * the other types) and the Automobile (car detailing) POS (automobile.ceylonrylabs.io, also ceylonrylabs.io/Automobile). Both are the same app
 * and the same login; the business type, chosen by the Ceylonry team, decides which address the business should use. After the business
 * signs in, the session moves to the right address (services/handoff.js). Anywhere else (local development, previews, the admin address)
 * nothing is redirected.
 */
import { businessTypeLocked } from "./businessType";

export const POS_BASE_HOST = "ceylonrylabs.io";
export const POS_URLS = {
	main: "https://" + POS_BASE_HOST + "/posv2/",
	automobile: "https://automobile." + POS_BASE_HOST + "/",
};

/** "automobile" or "main" for a business whose type has been chosen; "" while the business has not chosen one yet. */
export function addressForType(settings = {}) {
	if (!settings.businessType || !businessTypeLocked(settings)) return "";
	return settings.businessType === "automobile" ? "automobile" : "main";
}

/** The POS address this page is on: "automobile", "main", or "" for anything that is not one of the two live addresses. */
export function addressOfPage({ hostname = "", pathname = "" } = {}) {
	const host = String(hostname).toLowerCase();
	if (host === "automobile." + POS_BASE_HOST) return "automobile";
	if (host !== POS_BASE_HOST && host !== "www." + POS_BASE_HOST) return "";
	if (/^\/automobile\/?$/i.test(pathname)) return "automobile";
	return /^\/posv2(\/|$)/i.test(pathname) ? "main" : "";
}

/** The address to move to after sign-in, or "" when the business is already where it belongs (or there is nothing to decide). */
export function posRedirect(settings, page) {
	const want = addressForType(settings);
	const at = addressOfPage(page);
	return want && at && want !== at ? POS_URLS[want] : "";
}
