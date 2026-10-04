/**
 * Application logger: createLogger(scope) with debug/info/warn/error, an in-memory ring buffer mirrored
 * to localStorage, redaction of sensitive values, log download for support, and global error/offline capture.
 */
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

import { capJson, createRateLimiter, createTapTracker, describeTarget, descriptorString, isDisabledTarget, LOGGED_KEYS, relPos, safePath } from "./interactionLog";

const STORAGE_KEY = "pos-log-buffer";
const MAX_MEMORY = 3000; // entries kept in memory
const MAX_PERSISTED = 800; // entries mirrored to localStorage
const MAX_PERSISTED_BYTES = 400 * 1024; // persisted JSON cap (oldest dropped first)
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

/** Write the buffer to localStorage now (also used on pagehide so logs survive a kill). */
function flushNow() {
	if (persistTimer) clearTimeout(persistTimer);
	persistTimer = null;
	try {
		localStorage.setItem(STORAGE_KEY, capJson(buffer, MAX_PERSISTED, MAX_PERSISTED_BYTES));
	} catch {
		// Storage full or unavailable (private mode): keep logging in memory only.
	}
}

function persistSoon() {
	if (persistTimer) return;
	persistTimer = setTimeout(flushNow, PERSIST_DELAY_MS);
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
	const header = `# Ceylonry POS diagnostics\n# Exported ${new Date().toISOString()}\n# User agent: ${navigator.userAgent}\n# Online: ${navigator.onLine}\n# Snapshot: ${JSON.stringify(diagnosticsSnapshot())}\n\n`;
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

/** Device/app context for remote diagnosis. Safe to call anytime; every probe is guarded. */
export function diagnosticsSnapshot() {
	const g = (fn) => {
		try {
			return fn();
		} catch {
			return undefined;
		}
	};
	const nav = g(() => navigator) || {};
	const conn = nav.connection;
	const heap = g(() => performance.memory?.usedJSHeapSize);
	return {
		build: import.meta.env?.MODE,
		userAgent: nav.userAgent,
		platform: nav.platform,
		screen: g(() => `${screen.width}x${screen.height}`),
		dpr: g(() => window.devicePixelRatio),
		viewport: g(() => `${window.innerWidth}x${window.innerHeight}`),
		touchPoints: nav.maxTouchPoints,
		language: nav.language,
		timezone: g(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
		online: nav.onLine,
		connection: conn ? { type: conn.effectiveType, saveData: conn.saveData } : undefined,
		localStorage: !!g(() => {
			localStorage.setItem("__t", "1");
			localStorage.removeItem("__t");
			return true;
		}),
		indexedDB: g(() => typeof indexedDB !== "undefined"),
		deviceMemoryGB: nav.deviceMemory,
		jsHeapMB: heap ? Math.round(heap / 1048576) : undefined,
		serviceWorker: g(() => !!navigator.serviceWorker?.controller),
		standalone: g(() => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true),
	};
}

const uiLog = createLogger("ui");
const netLog = createLogger("net");

function currentContext() {
	const c = {};
	try {
		const view = document.querySelector(".nav button.active")?.getAttribute("data-view") || document.querySelector('[id^="view-"].active')?.id;
		if (view) c.view = view;
		if (location.hash) c.hash = location.hash.slice(0, 40);
		const modals = document.querySelectorAll(".modal.open");
		if (modals.length) c.modal = modals[modals.length - 1].id || "(unnamed)";
	} catch {
		// ignore
	}
	return c;
}

/** Privacy-safe interaction breadcrumbs, navigation/modal lifecycle and page lifecycle. Idempotent. */
export function installInteractionLogging() {
	if (typeof window === "undefined" || !window.addEventListener || window.__posInteractionLogging) return;
	window.__posInteractionLogging = true;
	const limiter = createRateLimiter(20, 1000);
	const tracker = createTapTracker();
	const emit = (level, message, data) => {
		const now = Date.now();
		if (level === "debug" && !limiter.allow(now)) return;
		const dropped = limiter.takeDropped();
		if (dropped && limiter.allow(now)) uiLog.warn("interaction log rate-limited", { dropped });
		uiLog[level](message, { ...data, ...currentContext() });
	};
	const hasPointer = typeof window.PointerEvent !== "undefined";

	const onTap = (kind, isDown) => (e) => {
		try {
			const target = e.target;
			const d = describeTarget(target);
			const desc = descriptorString(d);
			const { duplicate, repeated } = tracker.see(kind, desc, performance.now(), isDown);
			const point = e.touches?.[0] || e;
			const data = { target: desc, ptr: e.pointerType || (kind === "touchstart" ? "touch" : undefined), pos: relPos(point.clientX, point.clientY, window.innerWidth, window.innerHeight) };
			if (repeated) emit("warn", "repeated taps", { target: desc, hint: "possibly unresponsive control" });
			if (duplicate) return;
			if (kind !== "click" && isDisabledTarget(target)) emit("warn", "tap on disabled control", data);
			else emit("debug", kind === "click" ? "click" : "tap", data);
		} catch {
			// never break the app
		}
	};
	const opts = { capture: true, passive: true };
	if (hasPointer) window.addEventListener("pointerdown", onTap("pointerdown", true), opts);
	else window.addEventListener("touchstart", onTap("touchstart", true), opts);
	window.addEventListener("click", onTap("click", false), opts);
	window.addEventListener(
		"keydown",
		(e) => {
			if (LOGGED_KEYS.has(e.key)) emit("debug", "key", { key: e.key, target: descriptorString(describeTarget(e.target)) });
		},
		opts,
	);

	// Navigation / modal lifecycle.
	window.addEventListener("hashchange", (e) => {
		try {
			emit("info", "hash changed", { to: new URL(e.newURL).hash.slice(0, 40) });
		} catch {
			// ignore
		}
	});
	try {
		const seen = (nodes, verb) => {
			for (const n of nodes) {
				if (n.nodeType !== 1 || !n.classList) continue;
				if (n.classList.contains("modal")) emit("debug", "modal " + verb, { id: n.id || "(unnamed)" });
				else if (verb === "opened" && n.id && n.id.startsWith("view-")) emit("info", "view shown", { id: n.id });
			}
		};
		new MutationObserver((muts) => {
			for (const m of muts) {
				if (m.addedNodes.length) seen(m.addedNodes, "opened");
				if (m.removedNodes.length) seen(m.removedNodes, "closed");
			}
		}).observe(document.body, { childList: true, subtree: true });
	} catch {
		// ignore
	}

	// Page lifecycle: flush synchronously so logs survive a crash/kill.
	document.addEventListener("visibilitychange", () => {
		uiLog.info("visibility " + document.visibilityState);
		if (document.visibilityState === "hidden") flushNow();
	});
	window.addEventListener("pagehide", (e) => {
		uiLog.info("pagehide", { persisted: e.persisted });
		flushNow();
	});
	window.addEventListener("beforeunload", () => {
		uiLog.info("beforeunload");
		flushNow();
	});
	let resizeTimer = null;
	const onResize = () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => uiLog.info("viewport changed", { viewport: `${window.innerWidth}x${window.innerHeight}`, orientation: screen.orientation?.type }), 400);
	};
	window.addEventListener("resize", onResize);
	window.addEventListener("orientationchange", onResize);

	// Slow main thread + CSP.
	try {
		new PerformanceObserver((list) => {
			for (const t of list.getEntries()) if (t.duration > 200) uiLog[t.duration > 1000 ? "warn" : "info"]("long task", { ms: Math.round(t.duration) });
		}).observe({ type: "longtask" });
	} catch {
		// longtask unsupported
	}
	document.addEventListener("securitypolicyviolation", (e) => {
		uiLog.warn("CSP violation", { directive: e.violatedDirective, blocked: safePath(e.blockedURI, location.origin).path });
	});
}

/** Wrap window.fetch once to log method, URL path, status and timing (never bodies/headers). */
export function installFetchLogging() {
	if (typeof window === "undefined" || typeof window.fetch !== "function" || window.fetch.__posLogged) return;
	const orig = window.fetch;
	const wrapped = function (input, init) {
		const t0 = performance.now();
		let info = { method: "GET", path: "?" };
		try {
			const url = typeof input === "string" ? input : input?.url ?? String(input);
			info = { method: String(init?.method || input?.method || "GET").toUpperCase(), ...safePath(url, location.origin) };
		} catch {
			// logging only
		}
		const p = orig.apply(this, arguments);
		p.then(
			(res) => {
				const ctx = { ...info, status: res.status, ms: Math.round(performance.now() - t0) };
				netLog[res.status >= 500 ? "error" : res.status >= 400 ? "warn" : "debug"]("fetch " + info.method + " " + info.path, ctx);
			},
			(err) => netLog.warn("fetch failed " + info.method + " " + info.path, { ...info, ms: Math.round(performance.now() - t0), errorName: err?.name, errorMessage: String(err?.message || err).slice(0, 200) }),
		);
		return p;
	};
	wrapped.__posLogged = true;
	window.fetch = wrapped;
}

/** Capture crashes that never reach a React error boundary. Call once at startup. */
export function installGlobalLogging() {
	const log = createLogger("app");
	window.addEventListener("error", (e) => log.error("uncaught error", e.error instanceof Error ? e.error : new Error(e.message), { source: e.filename, line: e.lineno }));
	window.addEventListener("unhandledrejection", (e) => log.error("unhandled promise rejection", e.reason instanceof Error ? e.reason : new Error(String(e.reason))));
	window.addEventListener("online", () => log.info("network online"));
	window.addEventListener("offline", () => log.warn("network offline: working from local data"));
	log.info("POS started", diagnosticsSnapshot());
	installInteractionLogging();
	installFetchLogging();
}
