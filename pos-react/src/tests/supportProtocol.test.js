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
