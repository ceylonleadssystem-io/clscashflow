import { describe, expect, it } from "vitest";
import { cleanAnnotation, frameReader, toFrames, unit } from "../domain/supportProtocol";
import support from "../../../netlify/lib/support-session.js";

describe("live support frames", () => {
	it("cuts a large message into frames and puts it back together, in any order", () => {
		const message = { k: "ev", data: "x".repeat(50000), n: [1, 2, 3] };
		const frames = toFrames(message, 12000);
		expect(frames.length).toBe(5);
		const reader = frameReader();
		const out = [...frames].reverse().map((f) => reader.push(f)).filter(Boolean);
		expect(out).toEqual([message]);
	});
	it("a small message is one frame, and two messages do not mix", () => {
		const reader = frameReader();
		const a = toFrames({ k: "a" });
		const b = toFrames({ k: "b" });
		expect(a).toHaveLength(1);
		expect(reader.push(a[0])).toEqual({ k: "a" });
		expect(reader.push(b[0])).toEqual({ k: "b" });
	});
	it("ignores anything that is not a frame", () => {
		const reader = frameReader();
		expect(reader.push("not json")).toBe(null);
		expect(reader.push(JSON.stringify({ m: "x", i: 9, n: 2, d: "a" }))).toBe(null);
		expect(reader.push(JSON.stringify({ m: "x", i: 0, n: 99999, d: "a" }))).toBe(null);
	});
});

describe("what the agent may draw on the client's screen", () => {
	it("keeps positions inside the screen and colours inside the list", () => {
		expect(unit(-3)).toBe(0);
		expect(unit(7)).toBe(1);
		expect(cleanAnnotation({ k: "pointer", x: 2, y: -1 })).toEqual({ k: "pointer", x: 1, y: 0, on: true });
		expect(cleanAnnotation({ k: "stroke", id: "s1", tool: "arrow", color: "javascript:1", points: [[0.1, 0.2], [2, 3]] })).toEqual({ k: "stroke", id: "s1", tool: "arrow", color: "#ff4d0a", points: [[0.1, 0.2], [1, 1]] });
	});
	it("limits strokes and notes, and refuses everything else", () => {
		const many = Array.from({ length: 1000 }, (_, i) => [i / 1000, 0.5]);
		expect(cleanAnnotation({ k: "stroke", tool: "highlighter", points: many }).points).toHaveLength(400);
		expect(cleanAnnotation({ k: "stroke", tool: "highlighter", points: [[0.1, 0.1]] })).toBe(null);
		expect(cleanAnnotation({ k: "stroke", tool: "eval", points: many })).toBe(null);
		expect(cleanAnnotation({ k: "note", x: 0.5, y: 0.5, text: "<img src=x onerror=1>" + "y".repeat(300) }).text).toHaveLength(120);
		expect(cleanAnnotation({ k: "note", x: 0.5, y: 0.5, text: "  " })).toBe(null);
		expect(cleanAnnotation({ k: "click", x: 0.5, y: 0.5 })).toBe(null);
		expect(cleanAnnotation(null)).toBe(null);
		expect(cleanAnnotation({ k: "clear" })).toEqual({ k: "clear" });
	});
});

describe("live support session rules", () => {
	const now = Date.parse("2026-11-22T10:00:00Z");
	const make = () => support.newSession({ id: "u1", ownerUid: "o1" }, now, { business: "Cafe" });

	it("codes are 6 digits, and the session is looked up by a hash of its code", () => {
		const code = support.generateCode();
		expect(code).toMatch(/^\d{6}$/);
		expect(support.isCode(code)).toBe(true);
		expect(support.isCode("12345")).toBe(false);
		expect(support.codeKey(code)).not.toContain(code);
		expect(support.codeKey("123456")).toBe(support.codeKey("123456"));
	});
	it("a code works for 10 minutes and once", () => {
		const s = make();
		expect(support.joinProblem(s, now + 9 * 60000)).toBe("");
		expect(support.joinProblem(s, now + 11 * 60000)).toMatch(/not valid or has expired/);
		const joined = support.join(s, "agent@ceylonrylabs.io", now + 60000);
		expect(joined).toMatchObject({ state: "joined", agent: "agent@ceylonrylabs.io" });
		expect(support.joinProblem(joined, now + 120000)).toMatch(/not valid or has expired/); // single use
		expect(support.joinProblem(null, now)).toMatch(/not valid or has expired/); // same wording for an unknown code
	});
	it("a joined session runs for at most 60 minutes", () => {
		const joined = support.join(make(), "a@ceylonrylabs.io", now);
		expect(support.running(joined, now + 59 * 60000)).toBe(true);
		expect(support.settle(joined, now + 61 * 60000).state).toBe("ended");
		expect(support.settle(make(), now + 11 * 60000).state).toBe("ended");
	});
	it("each side sees only what it needs", () => {
		const s = { ...support.join(make(), "a@ceylonrylabs.io", now), offer: "v=0 offer", answer: "v=0 answer" };
		expect(support.clientView(s)).toMatchObject({ agent: "Ceylonry Support", answer: "v=0 answer" });
		expect(JSON.stringify(support.clientView(s))).not.toContain("a@ceylonrylabs.io");
		expect(support.agentView(s)).toMatchObject({ business: "Cafe", offer: "v=0 offer" });
		expect(support.agentView(s)).not.toHaveProperty("userId");
	});
	it("only a connection description is accepted", () => {
		expect(support.cleanSdp("v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n")).toBeTruthy();
		expect(support.cleanSdp("hello")).toBe("");
		expect(support.cleanSdp("v=0\n" + "a".repeat(70000))).toBe("");
		expect(support.cleanSdp("v=0\n<script>")).toBeTruthy(); // printable text is kept as is: it is only ever handed to the browser's connection code
	});
	it("a few wrong codes block an administrator for a while", () => {
		const l = support.createAttemptLimiter(5, 600000);
		for (let i = 0; i < 5; i++) {
			expect(l.blocked("a", now + i)).toBe(false);
			l.fail("a", now + i);
		}
		expect(l.blocked("a", now + 10)).toBe(true);
		expect(l.blocked("b", now + 10)).toBe(false);
		expect(l.blocked("a", now + 11 * 60000)).toBe(false);
		l.fail("a", now); l.clear("a");
		expect(l.blocked("a", now + 1)).toBe(false);
	});
});

import { cleanCommand, cleanReply } from "../domain/supportProtocol";
import { sensitiveName } from "../services/supportControl";

describe("what the agent may ask the client's POS to do", () => {
	it("opens a screen by name, and nothing that is not a plain screen or page name", () => {
		expect(cleanCommand({ k: "goto", view: "settings", page: "serviceCharge" })).toEqual({ k: "goto", view: "settings", page: "serviceCharge" });
		expect(cleanCommand({ k: "goto", view: "orders" })).toEqual({ k: "goto", view: "orders", page: "" });
		expect(cleanCommand({ k: "goto", view: "javascript:alert(1)" })).toBe(null);
		expect(cleanCommand({ k: "goto", view: "settings", page: "../../x" })).toBe(null);
		expect(cleanCommand({ k: "goto", view: 5 })).toBe(null);
	});
	it("asks for and releases control", () => {
		expect(cleanCommand({ k: "ask", what: "control" })).toEqual({ k: "ask", what: "control" });
		expect(cleanCommand({ k: "ask", what: "files" })).toBe(null);
		expect(cleanCommand({ k: "release" })).toEqual({ k: "release" });
	});
	it("clicks, types and scrolls only on a numeric element id, with limited sizes", () => {
		expect(cleanCommand({ k: "act", a: "click", id: 12 })).toEqual({ k: "act", a: "click", id: 12 });
		expect(cleanCommand({ k: "act", a: "click", id: "12" })).toBe(null);
		expect(cleanCommand({ k: "act", a: "click", id: 0 })).toBe(null);
		expect(cleanCommand({ k: "act", a: "input", id: 3, value: "y".repeat(500) }).value).toHaveLength(200);
		expect(cleanCommand({ k: "act", a: "input", id: 3, value: 5 })).toBe(null);
		expect(cleanCommand({ k: "act", a: "scroll", id: 3, dx: 0, dy: 99999 })).toEqual({ k: "act", a: "scroll", id: 3, dx: 0, dy: 3000 });
		expect(cleanCommand({ k: "act", a: "eval", id: 3 })).toBe(null);
		expect(cleanCommand({ k: "run", code: "alert(1)" })).toBe(null);
		expect(cleanCommand(null)).toBe(null);
	});
	it("replies to the agent are limited too", () => {
		expect(cleanReply({ k: "ctl", on: true })).toEqual({ k: "ctl", on: true });
		expect(cleanReply({ k: "ack", for: "act", ok: false, reason: "no" })).toEqual({ k: "ack", for: "act", ok: false, reason: "no" });
		expect(cleanReply({ k: "ack", for: "other" })).toBe(null);
	});
});

describe("controls the client has to use themselves", () => {
	it("leaves anything that voids, refunds, deletes, signs out or takes a payment to the client", () => {
		for (const name of ["Void Order", "Refund", "Delete item", "Sign Out Business", "Lock POS", "Pay Now · LKR 1,000", "Quick Pay", "Take Payment", "Complete sale", "Exact Cash", "Remove", "Close shift", "Approve and add"]) expect(sensitiveName(name)).not.toBe("");
	});
	it("allows ordinary controls", () => {
		for (const name of ["Save", "Settings", "Service Charge", "Add item", "Products", "Open / Pay", "Discard", "Next", "Search products", "Publish"]) expect(sensitiveName(name)).toBe("");
	});
});

import { droppable, keepTrying, linkLabel, reconnectDelay, RECONNECT_MS } from "../domain/supportLink";

describe("a poor network", () => {
	it("may skip movement events when the link is busy, never anything that changes the page", () => {
		expect(droppable({ type: 3, data: { source: 1 } })).toBe(true); // mouse move
		expect(droppable({ type: 3, data: { source: 6 } })).toBe(true); // touch move
		expect(droppable({ type: 3, data: { source: 0 } })).toBe(false); // page change
		expect(droppable({ type: 3, data: { source: 2 } })).toBe(false); // click
		expect(droppable({ type: 3, data: { source: 5 } })).toBe(false); // typing
		expect(droppable({ type: 2, data: {} })).toBe(false); // a full copy of the page
		expect(droppable(null)).toBe(false);
	});
	it("waits longer between reconnect attempts and gives up after two minutes", () => {
		expect([0, 1, 2, 3, 4, 9].map(reconnectDelay)).toEqual([1, 2, 4, 8, 10, 10]);
		expect(keepTrying(1000, 1000 + RECONNECT_MS - 1)).toBe(true);
		expect(keepTrying(1000, 1000 + RECONNECT_MS)).toBe(false);
	});
	it("describes the connection", () => {
		expect(linkLabel({ relay: false, rtt: 41.2 })).toBe("Direct, 41 ms");
		expect(linkLabel({ relay: true, rtt: 180 })).toBe("Through the relay, 180 ms");
		expect(linkLabel({ relay: true, rtt: 900 })).toBe("Slow: Through the relay, 900 ms");
		expect(linkLabel({ relay: false })).toBe("Direct");
		expect(linkLabel(null)).toBe("");
	});
});

import relay from "../../../netlify/lib/support-session.js";

describe("relay servers and reconnecting (server rules)", () => {
	const secret = "0123456789abcdef0123";
	it("without a relay configured only the public STUN server is used", () => {
		expect(relay.iceServers({}, 1700000000000, "client")).toEqual([{ urls: "stun:stun.l.google.com:19302" }]);
		expect(relay.iceServers({ urls: "turn:t.example.com:3478", secret: "short" }, 1700000000000, "client")).toHaveLength(1); // a weak secret is not used
	});
	it("with a relay configured each side gets time-limited credentials, and only valid server addresses", () => {
		const list = relay.iceServers({ urls: "turn:t.example.com:3478?transport=udp, turns:t.example.com:5349, http://evil.example.com, javascript:alert(1)", secret }, 1700000000000, "agent");
		expect(list).toHaveLength(2);
		expect(list[1].urls).toEqual(["turn:t.example.com:3478?transport=udp", "turns:t.example.com:5349"]);
		expect(list[1].username).toBe("1700007200:agent"); // expires two hours later
		expect(list[1].credential).toBe(relay.turnCredentials(secret, "agent", 1700000000000).credential);
		expect(relay.turnCredentials(secret, "agent", 1700000000000).credential).not.toBe(relay.turnCredentials(secret, "client", 1700000000000).credential);
	});
	it("a new offer replaces the old one and clears its answer, so the agent answers again", () => {
		const s = { sid: "s", state: "connected", offer: "v=0 old", answer: "v=0 answer" };
		const again = relay.reoffer(s, "v=0 new");
		expect(again).toMatchObject({ state: "joined", offer: "v=0 new", answer: "" });
		expect(relay.offerKey("v=0 new")).not.toBe(relay.offerKey("v=0 old"));
		expect(relay.offerKey("v=0 new")).toBe(relay.offerKey("v=0 new"));
	});
});
