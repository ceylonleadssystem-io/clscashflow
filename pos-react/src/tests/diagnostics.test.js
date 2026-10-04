import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetForTests, checkIn } from "../services/diagnostics.service";
import { capTail, chunkText, createReassembler, sendAll, shouldPause } from "../services/diagnosticsShared";

const start = (text) => JSON.stringify({ type: "start", bytes: text.length, total: text.length });

describe("chunking and reassembly", () => {
	it("round-trips text, including emoji and header-looking lines", () => {
		const text = ("line " + "😀".repeat(7) + '\n{"type":"end"}\n').repeat(2000);
		const chunks = chunkText(text, 1000);
		expect(chunks.every((c) => c.length <= 1000)).toBe(true);
		expect(chunks.join("")).toBe(text);
		const rx = createReassembler();
		rx.push(start(text));
		let r;
		for (const c of chunks) r = rx.push(c);
		expect(r.state).toBe("receiving");
		expect(r.got).toBe(text.length);
		r = rx.push('{"type":"end"}');
		expect(r).toMatchObject({ state: "complete", text });
	});
	it("never splits a surrogate pair", () => {
		for (const c of chunkText("a😀😀😀😀", 2)) expect(c).not.toMatch(/^[\udc00-\udfff]|[\ud800-\udbff]$/);
	});
	it("handles empty text and keeps the tail when capping", () => {
		const rx = createReassembler();
		rx.push(start(""));
		expect(rx.push('{"type":"end"}').state).toBe("complete");
		expect(chunkText("")).toEqual([]);
		expect(capTail("abcdef", 3)).toBe("def");
	});
	it("errors on bad headers, overruns and non-strings", () => {
		expect(createReassembler().push("hello").state).toBe("error");
		expect(createReassembler().push(new ArrayBuffer(1)).state).toBe("error");
		const rx = createReassembler();
		rx.push(JSON.stringify({ type: "start", total: 2 }));
		expect(rx.push("abc").state).toBe("error");
		const rx2 = createReassembler();
		rx2.push(JSON.stringify({ type: "start", total: 1 }));
		rx2.push("a");
		expect(rx2.push('{"type":"nope"}').state).toBe("error");
	});
});

describe("back-pressure", () => {
	it("pauses above the high-water mark", () => {
		expect(shouldPause(10, 100)).toBe(false);
		expect(shouldPause(101, 100)).toBe(true);
	});
	it("waits for bufferedamountlow before sending more", async () => {
		const sent = [];
		const dc = { bufferedAmount: 0, send: (c) => { sent.push(c); dc.bufferedAmount += 60; } };
		const p = sendAll(dc, ["a", "b", "c", "d"], { high: 100, low: 10 });
		await Promise.resolve();
		await Promise.resolve();
		expect(sent).toEqual(["a", "b"]); // 120 buffered: paused before "c"
		dc.bufferedAmount = 0;
		dc.onbufferedamountlow();
		await p;
		expect(sent).toEqual(["a", "b", "c", "d"]);
		expect(dc.bufferedAmountLowThreshold).toBe(10);
	});
});

describe("POS check-in", () => {
	beforeEach(() => _resetForTests());
	const req = { ok: true, requested: true, requestId: "r1", offer: "SDP" };
	it("stays idle when nothing is requested", async () => {
		const serve = vi.fn();
		expect(await checkIn({ check: async () => ({ ok: true, requested: false }) }, serve)).toBe("idle");
		expect(serve).not.toHaveBeenCalled();
	});
	it("serves a request once per requestId and not concurrently", async () => {
		let done;
		const serve = vi.fn(() => new Promise((r) => (done = r)));
		const signals = { check: async () => req };
		expect(await checkIn(signals, serve)).toBe("serving");
		expect(await checkIn(signals, serve)).toBe("skipped"); // busy
		done();
		await new Promise((r) => setTimeout(r, 0));
		expect(await checkIn(signals, serve)).toBe("idle"); // already handled r1
		expect(serve).toHaveBeenCalledTimes(1);
	});
	it("never throws", async () => {
		expect(await checkIn({ check: async () => { throw new Error("x"); } }, vi.fn())).toBe("error");
	});
});
