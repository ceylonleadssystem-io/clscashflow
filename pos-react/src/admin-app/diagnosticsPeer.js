/**
 * Admin side of remote diagnostics: asks a POS for its log over a WebRTC data channel and keeps the received
 * text in this browser's Cache API until it is downloaded or discarded. The server only relays the SDP
 * handshake (see pos-admin-diagnostics); the log never touches it.
 */
import { createLogger } from "../utils/logger";
import { adminApi } from "./adminApi";
import { CHANNEL, CONNECT_TIMEOUT_MS, POLL_ADMIN_MS, RTC_CONFIG, SIGNAL_TTL_MS, createReassembler, isLocalMode, localSignals, newRequestId, waitIce } from "../services/diagnosticsShared";

const log = createLogger("diagnostics");
const URL = "/.netlify/functions/pos-admin-diagnostics";

/** Signalling client for one account: offer/status/cancel/done (cloud function, or localStorage in local dev). */
export function adminSignals(uid) {
	if (isLocalMode()) {
		const wrap = (fn) => (...a) => fn(uid, ...a);
		return { offer: wrap(localSignals.offer), status: wrap(localSignals.status), cancel: wrap(localSignals.cancel), done: wrap(localSignals.done) };
	}
	const call = (action, extra) => adminApi({ action, userId: uid, ...extra }, URL);
	return {
		offer: (requestId, offer) => call("offer", { requestId, offer }),
		status: () => call("status"),
		cancel: () => call("cancel"),
		done: () => call("done"),
	};
}

// ---- received log, kept in the Cache API (in-memory fallback) ----
const memory = new Map();
const keyFor = (uid) => "/diagnostics/" + uid + ".log";
const openCache = () => (typeof caches !== "undefined" ? caches.open("pos-diagnostics") : Promise.reject(new Error("no Cache API")));

export async function saveLog(uid, text) {
	const entry = { text, receivedAt: new Date().toISOString(), size: new Blob([text]).size };
	memory.set(uid, entry);
	try {
		const c = await openCache();
		await c.put(keyFor(uid), new Response(text, { headers: { "Content-Type": "text/plain", "x-received-at": entry.receivedAt } }));
	} catch (e) {
		log.warn("Cache API unavailable, log kept in memory only", e);
	}
	return entry;
}
/** The cached log {text, receivedAt, size} for this account, or null. */
export async function loadLog(uid) {
	try {
		const r = await (await openCache()).match(keyFor(uid));
		if (r) {
			const text = await r.text();
			return { text, receivedAt: r.headers.get("x-received-at") || "", size: new Blob([text]).size };
		}
	} catch {
		/* fall back to memory */
	}
	return memory.get(uid) || null;
}
export async function discardLog(uid) {
	memory.delete(uid);
	try {
		await (await openCache()).delete(keyFor(uid));
	} catch {
		/* nothing cached */
	}
}

/**
 * Starts a request. `onState` receives {state: waiting|connecting|receiving|received|failed, ...}.
 * Returns { cancel }. Stops on completion, failure, cancel, or after 10 minutes.
 */
export function requestLog(uid, onState, signals = adminSignals(uid)) {
	const requestId = newRequestId();
	let dead = false;
	let pc;
	let poll;
	let overall;
	let connectTimer;
	const cleanup = () => {
		dead = true;
		clearInterval(poll);
		clearTimeout(overall);
		clearTimeout(connectTimer);
	};
	const closePc = (delay = 0) => setTimeout(() => { try { pc?.close(); } catch { /* ignore */ } }, delay);
	const fail = (reason) => {
		if (dead) return;
		cleanup();
		log.warn("log request failed", { reason });
		signals.cancel().catch(() => {});
		closePc();
		onState({ state: "failed", reason });
	};
	const connectFail = () => fail("Could not connect directly to the POS (strict network?). Try again.");

	(async () => {
		try {
			pc = new RTCPeerConnection(RTC_CONFIG);
			const dc = pc.createDataChannel(CHANNEL, { ordered: true });
			const rx = createReassembler();
			dc.onopen = () => {
				if (dead) return;
				clearTimeout(connectTimer);
				log.info("data channel open");
				onState({ state: "receiving", percent: 0 });
			};
			dc.onmessage = async (m) => {
				if (dead) return;
				const r = rx.push(m.data);
				if (r.state === "error") return fail("The log transfer was corrupted. Try again.");
				if (r.state === "receiving") onState({ state: "receiving", percent: r.total ? Math.floor((r.got / r.total) * 100) : 100 });
				if (r.state === "complete") {
					cleanup();
					const entry = await saveLog(uid, r.text);
					try { dc.send(JSON.stringify({ type: "ack" })); } catch { /* channel gone */ }
					signals.done().catch(() => {});
					closePc(500);
					log.info("log received", { size: entry.size });
					onState({ state: "received", ...entry });
				}
			};
			dc.onclose = () => { if (!dead) fail("The connection closed before the log arrived. Try again."); };
			pc.onconnectionstatechange = () => { if (pc.connectionState === "failed") connectFail(); };

			await pc.setLocalDescription(await pc.createOffer());
			await waitIce(pc);
			if (dead) return closePc();
			await signals.offer(requestId, pc.localDescription.sdp);
			if (dead) return signals.cancel().catch(() => {});
			onState({ state: "waiting" });
			log.info("log requested; waiting for the POS to check in");

			let applying = false;
			overall = setTimeout(() => fail("The POS did not respond. It may be offline or closed."), SIGNAL_TTL_MS);
			poll = setInterval(async () => {
				if (dead || applying) return;
				try {
					const s = await signals.status();
					if (dead) return;
					if (s.state === "idle" || (s.requestId && s.requestId !== requestId)) return fail("The request expired or was replaced. Try again.");
					if (s.state !== "answered") return;
					applying = true;
					clearInterval(poll);
					clearTimeout(overall);
					await pc.setRemoteDescription({ type: "answer", sdp: s.answer });
					log.info("answer applied; connecting");
					onState({ state: "connecting" });
					connectTimer = setTimeout(connectFail, CONNECT_TIMEOUT_MS);
				} catch (e) {
					log.warn("status poll failed", e);
				}
			}, POLL_ADMIN_MS);
		} catch (e) {
			fail(e?.message || "Could not start the request.");
		}
	})();

	return {
		cancel() {
			if (dead) return;
			cleanup();
			signals.cancel().catch(() => {});
			closePc();
			onState({ state: "idle" });
		},
		/** Stops without touching the server request (component unmounted). */
		detach() {
			if (!dead) { cleanup(); signals.cancel().catch(() => {}); closePc(); }
		},
	};
}
