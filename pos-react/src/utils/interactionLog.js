/**
 * Pure helpers behind the interaction/network breadcrumbs in logger.js (kept DOM-free so they unit-test in Node).
 * Privacy rule: only element descriptors are produced, never typed text, input values or request bodies.
 */

const FIELD_TAGS = new Set(["input", "textarea", "select"]);
const TEXT_TAGS = new Set(["button", "a", "summary"]);
const TEXT_ROLES = new Set(["button", "tab", "link", "menuitem"]);
const INTERACTIVE = "button,a,[role=button],[role=tab],[role=link],[role=menuitem],input,select,textarea,label,[data-view],summary";
// Anything that looks like an email / phone / long number never leaves the device, even in a button label.
const SENSITIVE_TEXT = /@|\d{5,}|\d[\d\s().-]{7,}\d/;

const cut = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/** The nearest meaningful element for a tap (a click on an icon inside a button describes the button). */
export function interactiveTarget(el) {
	try {
		return (el && el.closest && el.closest(INTERACTIVE)) || el;
	} catch {
		return el;
	}
}

/** Compact, value-free description of a DOM element: `button#pay.btn.primary data-view=checkout "Pay now"`. */
export function describeTarget(rawEl) {
	const el = interactiveTarget(rawEl);
	if (!el || !el.tagName) return { tag: "?" };
	const tag = String(el.tagName).toLowerCase();
	const get = (n) => (el.getAttribute ? el.getAttribute(n) : null);
	const d = { tag };
	if (el.id) d.id = cut(el.id, 40);
	if (FIELD_TAGS.has(tag) || get("contenteditable") === "" || get("contenteditable") === "true") {
		// Fields: type / name only. NEVER value, placeholder, label text or contents.
		if (get("type")) d.type = cut(get("type"), 15);
		if (get("name")) d.name = cut(get("name"), 30);
		return d;
	}
	const role = get("role");
	if (role) d.role = cut(role, 15);
	const classes = String(typeof el.className === "string" ? el.className : "").split(/\s+/).filter(Boolean).slice(0, 3);
	if (classes.length) d.cls = classes.join(".");
	const aria = get("aria-label");
	if (aria) d.aria = cut(aria, 30);
	const view = get("data-view");
	if (view) d.view = cut(view, 30);
	const dataKeys = ["data-action", "data-tab", "data-id", "data-testid"];
	for (const k of dataKeys) if (get(k)) d[k.slice(5)] = cut(get(k), 30);
	if (TEXT_TAGS.has(tag) || TEXT_ROLES.has(role)) {
		const text = cut(el.textContent, 30);
		if (text && !SENSITIVE_TEXT.test(text)) d.text = text;
	}
	return d;
}

/** `{tag:"button",id:"pay",text:"Pay"}` -> `button#pay "Pay"` (stable key + readable message). */
export function descriptorString(d) {
	let s = (d.tag || "?") + (d.id ? "#" + d.id : "") + (d.cls ? "." + d.cls : "");
	for (const k of ["role", "type", "name", "view", "action", "tab", "aria"]) if (d[k]) s += ` ${k}=${d[k]}`;
	if (d.text) s += ` "${d.text}"`;
	return s;
}

export function isDisabledTarget(rawEl) {
	try {
		const el = rawEl && rawEl.closest ? rawEl.closest('[disabled],[aria-disabled="true"]') : null;
		return !!el;
	} catch {
		return false;
	}
}

/** Only these keys are ever logged, and only by name. */
export const LOGGED_KEYS = new Set(["Enter", "Escape", "Tab"]);

/** Viewport-relative position in percent (no pixel coordinates tied to content). */
export function relPos(x, y, w, h) {
	if (!w || !h || !Number.isFinite(x) || !Number.isFinite(y)) return undefined;
	return [Math.round((x / w) * 100), Math.round((y / h) * 100)];
}

/** Token-bucket style limiter: at most `max` events per `windowMs`. */
export function createRateLimiter(max = 20, windowMs = 1000) {
	let start = 0;
	let count = 0;
	let dropped = 0;
	return {
		/** true = allowed. */
		allow(now) {
			if (now - start >= windowMs) {
				start = now;
				count = 0;
			}
			if (count < max) {
				count++;
				return true;
			}
			dropped++;
			return false;
		},
		/** Number dropped since the last call (so the caller can log one summary). */
		takeDropped() {
			const n = dropped;
			dropped = 0;
			return n;
		},
	};
}

/**
 * Per-tap bookkeeping: drops duplicates (touchstart+pointerdown of one physical tap) and flags
 * `repeatCount`+ taps on the same target inside `repeatMs` exactly once per burst.
 */
export function createTapTracker({ dupMs = 120, repeatMs = 1500, repeatCount = 4 } = {}) {
	let lastKey = "";
	let lastAt = -Infinity;
	let stamps = [];
	let stampKey = "";
	let flagged = false;
	return {
		/** Returns { duplicate, repeated }. `isDown` = counts toward repeated-tap detection. */
		see(kind, target, now, isDown = true) {
			const key = kind + "|" + target;
			const duplicate = key === lastKey && now - lastAt < dupMs;
			lastKey = key;
			lastAt = now;
			let repeated = false;
			if (isDown && !duplicate) {
				if (target !== stampKey) {
					stampKey = target;
					stamps = [];
					flagged = false;
				}
				stamps = stamps.filter((t) => now - t <= repeatMs);
				stamps.push(now);
				if (stamps.length < repeatCount) flagged = false;
				else if (!flagged) repeated = flagged = true;
			}
			return { duplicate, repeated };
		},
	};
}

/** URL -> `{ path, external }`: no host, query string or hash ever kept. */
export function safePath(url, origin = "") {
	try {
		const u = new URL(String(url), origin || "http://localhost");
		return { path: u.pathname.slice(0, 120), external: !!origin && u.origin !== origin };
	} catch {
		return { path: "[unparsable]", external: false };
	}
}

/** Serialize the newest entries within `maxBytes` of JSON (drops oldest first). */
export function capJson(entries, maxEntries, maxBytes) {
	let list = entries.slice(-maxEntries);
	let json = JSON.stringify(list);
	while (json.length > maxBytes && list.length > 1) {
		list = list.slice(Math.max(1, Math.ceil(list.length * 0.1)));
		json = JSON.stringify(list);
	}
	return json;
}
