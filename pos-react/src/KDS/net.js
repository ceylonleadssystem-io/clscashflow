/**
 * Shared by the POS link (link.js) and the Kitchen Display page (peer.js).
 * LAN_RTC has no STUN/TURN servers, so the browsers can only offer local-network (host) candidates: if the two devices are not
 * on the same Wi-Fi/LAN the connection simply does not form. Only the offer/answer handshake goes through the server.
 */
export { waitIce } from "../services/diagnosticsShared";

export const LAN_RTC = { iceServers: [] };
export const CHANNEL = "kds";
const URL = "/.netlify/functions/kds-pair";

const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");
export const newPairId = () => hex(12);
export const newCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");

/** Calls the pairing function; throws Error(message) on a failed request. */
export async function pairApi(action, body) {
	const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...body }) });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw new Error(json.error || "Could not reach the pairing service.");
	return json;
}

export const readJson = (key, fallback) => {
	try {
		return JSON.parse(localStorage.getItem(key)) ?? fallback;
	} catch {
		return fallback;
	}
};
export const writeJson = (key, value) => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* storage full or blocked: the link still works until the page is closed */
	}
};
