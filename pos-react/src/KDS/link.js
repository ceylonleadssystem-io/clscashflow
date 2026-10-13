/**
 * POS side of the Kitchen Display link. After pairing (6-digit code shown on the KDS page, entered once on the POS) the POS keeps
 * a direct WebRTC data channel to the KDS over the local Wi-Fi and sends every prep ticket through it. Tickets wait in an outbox
 * (this device's storage) until the KDS acknowledges them, so a dropped Wi-Fi never loses an order. When the KDS marks a ticket
 * preparing / ready / done the status comes back here and is saved on the ticket.
 */
import { LAN_RTC, pairApi, readJson, waitIce, writeJson } from "./net";

const PAIR_KEY = "pos.kds.pairId";
const OUT_KEY = "pos.kds.outbox";
const MAX_OUTBOX = 200;
const MAX_AGE_MS = 12 * 3600 * 1000;
const POLL_MS = 5000;

let pc = null;
let dc = null;
let timer = null;
let busy = false;
let running = null; // { getHello, onStatus }
let state = { paired: !!localStorage.getItem(PAIR_KEY), connected: false, note: "" };
const listeners = new Set();
const set = (patch) => {
	state = { ...state, ...patch };
	listeners.forEach((fn) => fn(state));
};

const outbox = () => readJson(OUT_KEY, []).filter((o) => Date.now() - o.at < MAX_AGE_MS);
const sendRaw = (obj) => {
	try {
		if (dc?.readyState === "open") dc.send(JSON.stringify(obj));
	} catch {
		/* channel closing: the outbox resends on the next connection */
	}
};
const flush = () => outbox().forEach((o) => sendRaw({ type: "ticket", ticket: o.ticket }));

function closeLink() {
	try {
		dc?.close();
		pc?.close();
	} catch {
		/* already closed */
	}
	dc = pc = null;
}

function attach(channel) {
	dc = channel;
	channel.onopen = () => {
		set({ connected: true, note: "" });
		sendRaw({ type: "hello", ...(running?.getHello?.() || {}) });
		flush();
	};
	channel.onmessage = (m) => {
		let msg;
		try {
			msg = JSON.parse(m.data);
		} catch {
			return;
		}
		if (msg.type === "ack") writeJson(OUT_KEY, outbox().filter((o) => o.ticket.id !== msg.id));
		else if (msg.type === "status") running?.onStatus?.(msg.id, msg.status);
	};
	channel.onclose = () => {
		if (dc === channel) {
			set({ connected: false });
			closeLink();
		}
	};
}

/** Fetches the KDS offer stored under `key`, answers it and waits for the channel. Resolves true when connected. */
async function answer(key) {
	const got = await pairApi("get", { key });
	if (!got.found) return { ok: false, pairId: "" };
	closeLink();
	pc = new RTCPeerConnection(LAN_RTC);
	pc.ondatachannel = (e) => attach(e.channel);
	await pc.setRemoteDescription({ type: "offer", sdp: got.offer });
	await pc.setLocalDescription(await pc.createAnswer());
	await waitIce(pc);
	await pairApi("answer", { key, answer: pc.localDescription.sdp });
	const mine = pc;
	const connected = await new Promise((resolve) => {
		const t = setTimeout(() => resolve(false), 20000);
		const check = () => {
			if (state.connected) {
				clearTimeout(t);
				resolve(true);
			} else if (pc !== mine || mine.connectionState === "failed") {
				clearTimeout(t);
				resolve(false);
			} else setTimeout(check, 300);
		};
		check();
	});
	if (!connected && pc === mine) closeLink();
	return { ok: connected, pairId: got.pairId };
}

async function tick() {
	const pairId = localStorage.getItem(PAIR_KEY);
	if (busy || state.connected || !pairId || !running) return;
	busy = true;
	try {
		await answer(pairId);
	} catch (e) {
		set({ note: e.message });
	} finally {
		busy = false;
	}
}

export const kdsLink = {
	state: () => state,
	subscribe(fn) {
		listeners.add(fn);
		return () => listeners.delete(fn);
	},
	/** Starts reconnecting to the paired KDS in the background. `onStatus(ticketId, status)` receives the kitchen's progress. */
	start(handlers) {
		running = handlers;
		clearInterval(timer);
		timer = setInterval(tick, POLL_MS);
		tick();
	},
	stop() {
		running = null;
		clearInterval(timer);
		closeLink();
		set({ connected: false });
	},
	/** First pairing: the code shown on the KDS page. Throws an Error with a message for the screen. */
	async pairWithCode(code) {
		if (busy) throw new Error("Still connecting. Wait a moment and try again.");
		busy = true;
		try {
			const r = await answer(String(code).trim());
			if (!r.pairId) throw new Error("That code was not found. Check the code on the Kitchen Display.");
			if (!r.ok) throw new Error("Found the Kitchen Display but could not connect. Both devices must be on the same Wi-Fi.");
			localStorage.setItem(PAIR_KEY, r.pairId);
			set({ paired: true });
		} finally {
			busy = false;
		}
	},
	unpair() {
		localStorage.removeItem(PAIR_KEY);
		closeLink();
		set({ paired: false, connected: false, note: "" });
	},
	/** Queues a ticket for the KDS and sends it now if connected; it is kept until the KDS acknowledges it. */
	send(ticket) {
		writeJson(OUT_KEY, [...outbox().filter((o) => o.ticket.id !== ticket.id), { at: Date.now(), ticket }].slice(-MAX_OUTBOX));
		sendRaw({ type: "ticket", ticket });
	},
	pending: () => outbox().length,
};
