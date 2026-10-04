/**
 * Remote diagnostics: while signed in and online, ask the server every 30 s whether an administrator
 * requested this POS's log; if so upload the current log text. Never throws, never logs the log text.
 */
import { createLogger, formatLogs } from "../utils/logger";

const log = createLogger("diagnostics");
const URL = "/.netlify/functions/pos-diagnostics";
export const POLL_MS = 30000;

export function buildLogText() {
	const header = `# Ceylonry POS diagnostics\n# Uploaded ${new Date().toISOString()}\n# User agent: ${navigator.userAgent}\n# Online: ${navigator.onLine}\n\n`;
	return header + formatLogs() + "\n";
}

/** One check-in. `getToken` resolves the Appwrite JWT. Returns "idle" | "uploaded" | "skipped" | "error". */
export async function checkIn(getToken, fetchFn = fetch, text = buildLogText) {
	try {
		if (typeof navigator !== "undefined" && navigator.onLine === false) return "skipped";
		const token = await getToken();
		if (!token) return "skipped";
		const headers = { Authorization: "Bearer " + token };
		const check = await (await fetchFn(URL + "?action=check", { headers, cache: "no-store" })).json();
		if (!check?.ok || !check.requested) return "idle";
		log.info("log requested by support; uploading");
		const res = await fetchFn(URL, {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({ action: "upload", text: text() }),
		});
		log.info("log upload finished", { status: res.status });
		return res.ok ? "uploaded" : "error";
	} catch (e) {
		log.warn("diagnostics check-in failed", e);
		return "error";
	}
}

/** Starts polling; returns a stop function. */
export function startDiagnostics(getToken) {
	const run = () => checkIn(getToken);
	run();
	const id = setInterval(run, POLL_MS);
	window.addEventListener("online", run);
	return () => {
		clearInterval(id);
		window.removeEventListener("online", run);
	};
}
