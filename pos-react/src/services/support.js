/**
 * Read-only support session helpers: detect an active session from the developer portal, end it, and the
 * support user identity. Every action in this mode is audited and mutations are blocked.
 */
import { STORAGE } from "../config/constants";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";

const log = createLogger("support");

/**
 * Read-only "support session": the developer portal opens the POS with
 * `?support=1` after storing a short-lived token in sessionStorage. Everything
 * is audited and all mutations are blocked.
 */
export function supportSession() {
	try {
		const s = JSON.parse(sessionStorage.getItem(STORAGE.supportSession) || "null");
		return s && s.expiresAt > Date.now() ? s : null;
	} catch {
		return null;
	}
}

export const supportModeActive = () =>
	new URLSearchParams(location.search).get("support") === "1" && !!supportSession();

export function endSupportSession() {
	log.info("support session ended");
	sessionStorage.removeItem(STORAGE.supportSession);
	location.href = env.supportPortalUrl;
}

export const SUPPORT_USER = { id: "support-admin", name: "Ceylonry Support", role: "owner", active: true };
