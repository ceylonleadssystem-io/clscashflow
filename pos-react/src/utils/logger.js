/**
 * POS application logger.
 *
 *   const log = createLogger("sync");
 *   log.info("cloud push started", { docs: 12 });
 *   log.error("cloud push failed", error, { attempt: 2 });
 *
 * - Every entry goes to an in-memory ring buffer that is mirrored to localStorage, so the
 *   last few hundred events survive a reload or crash and can be exported from
 *   Settings > Plan & Support > Diagnostics as a plain `.log` file.
 * - Sensitive values (passwords, PINs, tokens, card data) are redacted before storage.
 * - The logger never throws and never blocks the UI: logging problems are swallowed.
 *
 * Levels: debug (dev console only), info, warn, error.
 */

const STORAGE_KEY = "pos-log-buffer";
const MAX_MEMORY = 1000; // entries kept in memory
const MAX_PERSISTED = 300; // entries mirrored to localStorage
const PERSIST_DELAY_MS = 1500; // coalesce bursts of writes
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const REDACT_KEY = /pass(word)?|pin|token|secret|authorization|api[-_]?key|card|cvv|otp/i;

let buffer = loadPersisted();
let persistTimer = null;
const listeners = new Set();

function loadPersisted() {
	try {
		const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
		return Array.isArray(raw) ? raw.slice(-MAX_MEMORY) : [];
	} catch {
		return [];
	}
}

function persistSoon() {
	if (persistTimer) return;
	persistTimer = setTimeout(() => {
		persistTimer = null;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer.slice(-MAX_PERSISTED)));
		} catch {
			// Storage full or unavailable (private mode): keep logging in memory only.
		}
	}, PERSIST_DELAY_MS);
}

/** Replace sensitive values and flatten errors/large objects into JSON-safe data. */
function sanitize(value, depth = 0) {
	if (value instanceof Error) return { name: value.name, message: value.message, stack: String(value.stack || "").split("\n").slice(0, 6).join("\n") };
	if (value == null || typeof value !== "object") return typeof value === "string" && value.length > 500 ? value.slice(0, 500) + "…" : value;
	if (depth > 3) return "[nested]";
	if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
	const out = {};
	for (const [key, v] of Object.entries(value).slice(0, 30)) out[key] = REDACT_KEY.test(key) ? "[redacted]" : sanitize(v, depth + 1);
	return out;
}

function write(level, scope, message, args) {
	try {
		let error;
		let context;
		for (const a of args) {
			if (a instanceof Error) error = a;
			else if (a && typeof a === "object") context = { ...context, ...a };
		}
		const entry = { t: new Date().toISOString(), level, scope, message: String(message) };
		if (error) entry.error = sanitize(error);
		if (context) entry.context = sanitize(context);
		buffer.push(entry);
		if (buffer.length > MAX_MEMORY) buffer = buffer.slice(-MAX_MEMORY);
		persistSoon();
		listeners.forEach((fn) => fn(entry));
		// Console mirror: debug only in development builds; everything else always.
		if (level === "debug" && !import.meta.env?.DEV) return;
		const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
		fn(`[POS:${scope}] ${message}`, ...(error ? [error] : []), ...(context ? [entry.context] : []));
	} catch {
		// Logging must never break the app.
	}
}

export function createLogger(scope) {
	return {
		debug: (message, ...args) => write("debug", scope, message, args),
		info: (message, ...args) => write("info", scope, message, args),
		warn: (message, ...args) => write("warn", scope, message, args),
		error: (message, ...args) => write("error", scope, message, args),
	};
}

/** Entries at or above `minLevel`, oldest first. */
export function getLogs(minLevel = "debug") {
	return buffer.filter((e) => LEVELS[e.level] >= LEVELS[minLevel]);
}

export function clearLogs() {
	buffer = [];
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}

export function subscribeLogs(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

/** One line per entry: `2026-10-02T09:15:00.000Z ERROR [sync] message {context} | error`. */
export function formatLogs(entries = buffer) {
	return entries
		.map((e) => {
			const ctx = e.context ? " " + JSON.stringify(e.context) : "";
			const err = e.error ? " | " + e.error.name + ": " + e.error.message : "";
			return `${e.t} ${e.level.toUpperCase().padEnd(5)} [${e.scope}] ${e.message}${ctx}${err}`;
		})
		.join("\n");
}

/** Save the log buffer as `pos-log-YYYY-MM-DD.log`. Returns the number of entries exported. */
export function downloadLogFile() {
	const header = `# Ceylonry POS diagnostics\n# Exported ${new Date().toISOString()}\n# User agent: ${navigator.userAgent}\n# Online: ${navigator.onLine}\n\n`;
	const blob = new Blob([header + formatLogs() + "\n"], { type: "text/plain;charset=utf-8" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = `pos-log-${new Date().toISOString().slice(0, 10)}.log`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	return buffer.length;
}

/** Capture crashes that never reach a React error boundary. Call once at startup. */
export function installGlobalLogging() {
	const log = createLogger("app");
	window.addEventListener("error", (e) => log.error("uncaught error", e.error instanceof Error ? e.error : new Error(e.message), { source: e.filename, line: e.lineno }));
	window.addEventListener("unhandledrejection", (e) => log.error("unhandled promise rejection", e.reason instanceof Error ? e.reason : new Error(String(e.reason))));
	window.addEventListener("online", () => log.info("network online"));
	window.addEventListener("offline", () => log.warn("network offline: working from local data"));
	log.info("POS started", { build: import.meta.env?.MODE, online: navigator.onLine });
}
