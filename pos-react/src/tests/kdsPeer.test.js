import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// the pairing service: one offer slot per key, answered by whichever register gets there first
const slots = new Map();
vi.mock("../KDS/net", () => ({
	CHANNEL: "kds",
	LAN_RTC: { iceServers: [] },
	newCode: () => "123456",
	newPairId: () => "p".repeat(24),
	waitIce: async () => {},
	pairApi: async (action, { key, offer, answer }) => {
		if (action === "offer") slots.set(key, { offer, answer: "" });
		if (action === "status") return { answered: !!slots.get(key)?.answer, answer: slots.get(key)?.answer || "" };
		if (action === "answer") slots.get(key).answer = answer;
		if (action === "done") slots.delete(key);
		return { ok: true };
	},
}));

// a data channel that opens as soon as the answer is applied
class FakePc {
	constructor() {
		this.remoteDescription = null;
		this.dc = { readyState: "connecting", sent: [], send: (m) => this.dc.sent.push(JSON.parse(m)), close: () => this.dc.onclose?.() };
	}
	createDataChannel() {
		return this.dc;
	}
	async createOffer() {
		return { type: "offer", sdp: "offer-" + Math.random() };
	}
	async setLocalDescription(d) {
		this.localDescription = d;
	}
	async setRemoteDescription(d) {
		this.remoteDescription = d;
		this.dc.readyState = "open";
		this.dc.onopen?.();
	}
	close() {}
}

describe("Kitchen Display accepts several registers", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		slots.clear();
		localStorage.removeItem("kds.pairId");
		globalThis.RTCPeerConnection = FakePc;
	});
	afterEach(() => vi.useRealTimers());

	it("pairs by code, then keeps offering under the pair id so every register connects and stays connected", async () => {
		const { hostKds } = await import("../KDS/peer");
		const states = [];
		const h = hostKds({ onState: (s) => states.push(s), onMessage: () => {} });
		await vi.advanceTimersByTimeAsync(0);
		expect(states.at(-1)).toMatchObject({ phase: "pairing", code: "123456" });

		slots.get("123456").answer = "register-1"; // first register enters the code
		await vi.advanceTimersByTimeAsync(2100);
		expect(localStorage.getItem("kds.pairId")).toBe("p".repeat(24));
		expect(states.at(-1)).toMatchObject({ phase: "connected", registers: 1 });

		const pairKey = "p".repeat(24);
		expect(slots.get(pairKey)?.offer).toBeTruthy(); // a fresh offer is waiting for the next register
		slots.get(pairKey).answer = "register-2";
		await vi.advanceTimersByTimeAsync(2100);
		expect(states.at(-1)).toMatchObject({ phase: "connected", registers: 2 });

		h.send({ type: "status", id: "t1" });
		h.stop();
	});
});
