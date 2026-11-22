/**
 * Live support, remote control on the client's side (only while the client has switched control on): click, type into a field and scroll, inside the
 * POS page only. What may be touched is decided here, on the client, whatever the agent sends: sign-in and PIN screens, payment screens, password
 * fields and anything that voids, refunds, deletes, signs out or takes a payment are left to the client to tap. A refused action is shown to the
 * client as a ring around the control, so they know what to press.
 */

/** Controls whose names mean something that must be done by the client themselves. */
const SENSITIVE = /\b(void|refund|delete|remove|erase|reset|sign\s*out|log\s*out|lock\s*pos|close\s*(the\s*)?(shift|register)|cash\s*out|pay\s*now|quick\s*pay|take\s*payment|complete\s*(sale|order|payment)|exact\s*cash|confirm\s*payment|approve|permanently)\b/i;

/** Why a control must not be operated by support, or "" when it may. `name` is its visible name or label. */
export function sensitiveName(name) {
	return SENSITIVE.test(String(name || "")) ? "This one changes money or data, so you need to tap it yourself." : "";
}

// areas that are private to the client: marked blocks, payment screens and the screens where a manager types a PIN
const PRIVATE = "[data-support-block], .support-block, [data-support-deny], .support-banner, #pay-now-modal, #quick-pay-modal, #split-bill-modal, #item-approval-modal, #stock-approval-modal";
const NEVER_TYPES = ["password", "file", "hidden"];

/** The reason an element must be left to the client, or "". */
export function denyReason(el) {
	if (!el || !(el instanceof Element) || !el.isConnected) return "That control is no longer on the screen.";
	if (el.closest(PRIVATE)) return "This area is private, so you need to use it yourself.";
	if (el instanceof HTMLInputElement && NEVER_TYPES.includes(el.type)) return "Passwords and files are only for you.";
	const holder = el.closest("button, a, [role=button], label, input[type=submit], input[type=button]") || el;
	const name = holder.getAttribute("aria-label") || holder.getAttribute("title") || holder.textContent || holder.getAttribute("value") || "";
	return sensitiveName(String(name).trim().slice(0, 80));
}

function setValue(el, value) {
	if (el instanceof HTMLSelectElement) {
		const option = [...el.options].find((o) => o.value === value || o.textContent.trim() === value);
		if (!option) return false;
		el.value = option.value;
	} else {
		const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
		Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value); // the page's own value setter, so React sees the change
	}
	el.dispatchEvent(new Event("input", { bubbles: true }));
	el.dispatchEvent(new Event("change", { bubbles: true }));
	return true;
}

const scrollable = (el) => {
	for (let n = el; n && n !== document.body; n = n.parentElement) {
		const o = getComputedStyle(n).overflowY;
		if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) return n;
	}
	return document.scrollingElement || document.documentElement;
};

/**
 * Carries out one (clean) action on the element it names. Returns { ok, reason, rect }: `rect` is the control's place on the screen as shares of the
 * window, so the client can see what was touched.
 */
export function runAction(cmd, el) {
	const reason = cmd.a === "scroll" ? (el instanceof Element && el.isConnected && !el.closest("[data-support-block], .support-block, .support-banner") ? "" : "That area is not available.") : denyReason(el);
	if (reason) return { ok: false, reason, rect: el instanceof Element && el.isConnected ? place(el) : null };
	const rect = place(el);
	if (cmd.a === "click") {
		el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
		el.focus?.({ preventScroll: true });
		el.click();
		return { ok: true, reason: "", rect };
	}
	if (cmd.a === "input") {
		const field = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
		if (!field) return { ok: false, reason: "That is not a field you can type into.", rect };
		el.focus?.({ preventScroll: true });
		return setValue(el, cmd.value) ? { ok: true, reason: "", rect } : { ok: false, reason: "That choice is not in the list.", rect };
	}
	scrollable(el).scrollBy({ left: cmd.dx, top: cmd.dy });
	return { ok: true, reason: "", rect };
}

function place(el) {
	const r = el.getBoundingClientRect();
	const w = window.innerWidth || 1;
	const h = window.innerHeight || 1;
	return { x: Math.max(0, r.left / w), y: Math.max(0, r.top / h), w: Math.min(1, r.width / w), h: Math.min(1, r.height / h) };
}
