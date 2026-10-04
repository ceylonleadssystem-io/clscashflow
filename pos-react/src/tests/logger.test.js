/** Logger + interaction breadcrumb helpers: privacy (no typed text), rate limiting, repeated taps, URL stripping, persist cap. */
import { describe, expect, it } from "vitest";
import { capJson, createRateLimiter, createTapTracker, describeTarget, descriptorString, isDisabledTarget, relPos, safePath } from "../utils/interactionLog";
import { createLogger, getLogs, clearLogs } from "../utils/logger";

const el = (tag, attrs = {}, extra = {}) => ({
	tagName: tag.toUpperCase(),
	id: attrs.id || "",
	className: attrs.class || "",
	textContent: extra.text || "",
	value: extra.value,
	getAttribute: (n) => (n in attrs ? attrs[n] : null),
	closest() {
		return this;
	},
});

describe("describeTarget", () => {
	it("describes buttons with truncated text and data hooks", () => {
		const d = describeTarget(el("button", { id: "pay", class: "btn primary big extra", "data-view": "checkout", "aria-label": "Pay" }, { text: "Pay now for this very long label indeed" }));
		expect(d).toMatchObject({ tag: "button", id: "pay", cls: "btn.primary.big", view: "checkout", aria: "Pay" });
		expect(d.text.length).toBeLessThanOrEqual(30);
	});
	it("never logs input values, placeholders or text", () => {
		const d = describeTarget(el("input", { type: "password", name: "pw", placeholder: "secret" }, { value: "hunter2", text: "hunter2" }));
		expect(JSON.stringify(d)).not.toMatch(/hunter2|secret/);
		expect(d).toEqual({ tag: "input", type: "password", name: "pw" });
		expect(describeTarget(el("div", { contenteditable: "true" }, { text: "typed words" }))).not.toHaveProperty("text");
	});
	it("drops button text that looks like an email or phone number", () => {
		expect(describeTarget(el("button", {}, { text: "a@b.com" }))).not.toHaveProperty("text");
		expect(describeTarget(el("button", {}, { text: "0771234567" }))).not.toHaveProperty("text");
	});
	it("builds a readable descriptor and flags disabled targets", () => {
		expect(descriptorString({ tag: "button", id: "x", text: "Go" })).toBe('button#x "Go"');
		expect(isDisabledTarget({ closest: () => ({}) })).toBe(true);
		expect(isDisabledTarget({ closest: () => null })).toBe(false);
	});
});

describe("rate limiting and tap tracking", () => {
	it("limits events per window and counts drops", () => {
		const rl = createRateLimiter(3, 1000);
		expect([0, 1, 2, 3, 4].map((t) => rl.allow(t))).toEqual([true, true, true, false, false]);
		expect(rl.takeDropped()).toBe(2);
		expect(rl.allow(1500)).toBe(true);
	});
	it("flags 4 taps on one target within 1.5s once, and drops duplicates", () => {
		const tr = createTapTracker();
		expect(tr.see("pointerdown", "b", 0).duplicate).toBe(false);
		expect(tr.see("touchstart", "b", 0).duplicate).toBe(false); // different kind
		const flags = [300, 600, 900, 1200].map((t) => tr.see("pointerdown", "b", t).repeated);
		expect(flags.filter(Boolean)).toHaveLength(1);
		expect(tr.see("pointerdown", "b", 1210).duplicate).toBe(true);
		expect(tr.see("pointerdown", "other", 5000).repeated).toBe(false);
	});
});

describe("network + persistence helpers", () => {
	it("keeps only the path, never host/query/hash", () => {
		expect(safePath("https://api.example.com/v1/docs?token=abc#x", "http://localhost")).toEqual({ path: "/v1/docs", external: true });
		expect(safePath("/posv2/api/x?email=a@b.com", "http://localhost")).toEqual({ path: "/posv2/api/x", external: false });
	});
	it("caps persisted JSON, dropping oldest first", () => {
		const entries = Array.from({ length: 100 }, (_, i) => ({ i, pad: "x".repeat(100) }));
		const json = capJson(entries, 800, 5000);
		const out = JSON.parse(json);
		expect(json.length).toBeLessThanOrEqual(5000);
		expect(out.at(-1).i).toBe(99);
		expect(relPos(50, 25, 100, 100)).toEqual([50, 25]);
	});
	it("redacts sensitive context values", () => {
		clearLogs();
		createLogger("t").info("x", { pin: "1234", password: "p", otp: "9", ok: "fine" });
		expect(getLogs().at(-1).context).toEqual({ pin: "[redacted]", password: "[redacted]", otp: "[redacted]", ok: "fine" });
	});
});
