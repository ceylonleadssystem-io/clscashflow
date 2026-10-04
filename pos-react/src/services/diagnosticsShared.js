/**
 * Shared by the POS (diagnostics.service.js) and the admin portal (diagnosticsPeer.js): WebRTC settings,
 * pure chunking/reassembly/back-pressure helpers and the local-dev signalling store. No log data ever
 * touches a server: only the SDP offer/answer handshake goes through a signalling client.
 */
import { env } from "../config/env";

export const RTC_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };
export const CHANNEL = "pos-log";
export const CHUNK_CHARS = 16384;
export const MAX_LOG_CHARS = 2000000;
export const HIGH_WATER = 1048576;
export const LOW_WATER = 262144;
export const POLL_POS_MS = 15000;
export const POLL_ADMIN_MS = 3000;
export const SIGNAL_TTL_MS = 600000;
export const CONNECT_TIMEOUT_MS = 60000;
export const MAX_SDP = 8000;

export const newRequestId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");

/** Keeps the newest `max` characters (the tail). */
export const capTail = (text, max = MAX_LOG_CHARS) => (text.length > max ? text.slice(text.length - max) : text);

/** Splits text into chunks of at most `size` UTF-16 units without cutting a surrogate pair. */
export function chunkText(text, size = CHUNK_CHARS) {
	const out = [];
	for (let i = 0; i < text.length; ) {
		let end = Math.min(i + size, text.length);
		const c = text.charCodeAt(end - 1);
		if (end < text.length && c >= 0xd800 && c <= 0xdbff) end--; // high surrogate at the cut: keep the pair together
		out.push(text.slice(i, end));
		i = end;
	}
	return out;
}

/**
 * Receiver state machine: idle -> receiving -> complete (or error). After the JSON `start` header every
 * string is log data until `total` characters have arrived, so log text can never be mistaken for a header.
 */
export function createReassembler() {
	let state = "idle";
	let total = 0;
	let got = 0;
	let parts = [];
	const snap = () => ({ state, got, total, ...(state === "complete" ? { text: parts.join("") } : {}) });
	return {
		push(msg) {
			if (state === "complete" || state === "error") return snap();
			if (typeof msg !== "string") return (state = "error"), snap();
			if (state === "idle") {
				try {
					const h = JSON.parse(msg);
					if (h.type !== "start" || !Number.isInteger(h.total) || h.total < 0) throw new Error("bad header");
					total = h.total;
					state = "receiving";
				} catch {
					state = "error";
				}
			} else if (got < total) {
				parts.push(msg);
				got += msg.length;
				if (got > total) state = "error";
			} else {
				try {
					state = JSON.parse(msg).type === "end" ? "complete" : "error";
				} catch {
					state = "error";
				}
			}
			return snap();
		},
	};
}

/** True when the send buffer is full enough to wait for `bufferedamountlow`. */
export const shouldPause = (buffered, high = HIGH_WATER) => buffered > high;

/** Sends the chunks in order, pausing while the channel's buffer is above the high-water mark. */
export async function sendAll(dc, chunks, { high = HIGH_WATER, low = LOW_WATER, onSent } = {}) {
	dc.bufferedAmountLowThreshold = low;
	for (let i = 0; i < chunks.length; i++) {
		if (shouldPause(dc.bufferedAmount, high)) await new Promise((res) => (dc.onbufferedamountlow = res));
		dc.send(chunks[i]);
		onSent?.(i + 1, chunks.length);
	}
}

/** Resolves once ICE gathering finished (or after `ms`), so the local description carries all candidates. */
export function waitIce(pc, ms = 4000) {
	return new Promise((resolve) => {
		if (pc.iceGatheringState === "complete") return resolve();
		const t = setTimeout(done, ms);
		function done() {
			clearTimeout(t);
			pc.removeEventListener("icegatheringstatechange", check);
			resolve();
		}
		function check() {
			if (pc.iceGatheringState === "complete") done();
		}
		pc.addEventListener("icegatheringstatechange", check);
	});
}

// ---- Local dev signalling (VITE_AUTH_PROVIDER=local): both tabs share one localStorage key per account ----
const KEY = (uid) => "ceylonry-dev-diag-signal-" + uid;
export const LOCAL_UID = "local";

function readLocal(uid, now = Date.now()) {
	try {
		const v = JSON.parse(localStorage.getItem(KEY(uid)) || "null");
		if (v && now - Date.parse(v.createdAt) <= SIGNAL_TTL_MS) return v;
		localStorage.removeItem(KEY(uid));
	} catch {
		/* unreadable: treat as none */
	}
	return null;
}
const sizeOk = (sdp) => {
	if (typeof sdp !== "string" || !sdp || sdp.length > MAX_SDP) throw new Error("The connection description is invalid or too large.");
	return sdp;
};

/** Same shape as the cloud clients; admin uses offer/status/cancel/done, the POS uses check/answer. */
export const localSignals = {
	async offer(uid, requestId, offer) {
		localStorage.setItem(KEY(uid), JSON.stringify({ uid, requestId, offer: sizeOk(offer), answer: "", createdAt: new Date().toISOString() }));
		return { ok: true, state: "waiting", requestId };
	},
	async status(uid) {
		const v = readLocal(uid);
		if (!v) return { ok: true, state: "idle" };
		return v.answer ? { ok: true, state: "answered", requestId: v.requestId, answer: v.answer } : { ok: true, state: "waiting", requestId: v.requestId };
	},
	async cancel(uid) {
		localStorage.removeItem(KEY(uid));
		return { ok: true, state: "idle" };
	},
	done: (uid) => localSignals.cancel(uid),
	async check(uid) {
		const v = readLocal(uid);
		return v && v.offer && !v.answer ? { ok: true, requested: true, requestId: v.requestId, offer: v.offer } : { ok: true, requested: false };
	},
	async answer(uid, requestId, answer) {
		const v = readLocal(uid);
		if (!v || v.requestId !== requestId || v.answer) throw new Error("No matching log request is pending.");
		localStorage.setItem(KEY(uid), JSON.stringify({ ...v, answer: sizeOk(answer) }));
		return { ok: true };
	},
};

export const isLocalMode = () => env.authProvider === "local";
