/**
 * Remote diagnostics (POS side). While signed in and online, every 15 s ask the server whether an administrator
 * requested this POS's log. If so, answer the WebRTC offer and send the log straight to the administrator's
 * browser over a data channel. Only the SDP handshake touches the server; the log text never does.
 * Never throws into the UI; logs progress (never the log text or SDP).
 */
import { createLogger, diagnosticsSnapshot, formatLogs } from "../utils/logger";
import { CHANNEL, LOCAL_UID, POLL_POS_MS, RTC_CONFIG, CHUNK_CHARS, capTail, chunkText, isLocalMode, localSignals, sendAll, waitIce } from "./diagnosticsShared";

const log = createLogger("diagnostics");
const URL = "/.netlify/functions/pos-diagnostics";
const SESSION_TIMEOUT_MS = 60000;
export const POLL_MS = POLL_POS_MS;

export function buildLogText() {
	const header = `# Ceylonry POS diagnostics\n# Sent ${new Date().toISOString()}\n# User agent: ${navigator.userAgent}\n# Online: ${navigator.onLine}\n# Snapshot: ${JSON.stringify(diagnosticsSnapshot())}\n\n`;
	return capTail(header + formatLogs() + "\n");
}

/** Signalling client for the cloud: `check()` and `answer(requestId, sdp)` against pos-diagnostics. */
export function cloudSignals(getToken, fetchFn = fetch) {
	const call = async (method, body, query) => {
		const token = await getToken();
		if (!token) return null;
		const res = await fetchFn(URL + (query || ""), {
			method,
			cache: "no-store",
			headers: { Authorization: "Bearer " + token, ...(body ? { "Content-Type": "application/json" } : {}) },
			body: body ? JSON.stringify(body) : undefined,
		});
		return res.json().catch(() => ({}));
	};
	return {
		check: () => call("GET", null, "?action=check"),
		answer: (requestId, answer) => call("POST", { action: "answer", requestId, answer }),
	};
}
const localPosSignals = { check: () => localSignals.check(LOCAL_UID), answer: (id, a) => localSignals.answer(LOCAL_UID, id, a) };

/** Answers one offer and sends the log. Resolves when the session is over (acked, timed out or failed). */
export async function serveRequest(signals, req, makeText = buildLogText) {
	const pc = new RTCPeerConnection(RTC_CONFIG);
	let finish;
	const over = new Promise((res) => (finish = res));
	const timer = setTimeout(() => finish("timeout"), SESSION_TIMEOUT_MS);
	const sendLog = async (dc) => {
		try {
			const text = makeText();
			const chunks = chunkText(text, CHUNK_CHARS);
			log.info("sending log", { chars: text.length, chunks: chunks.length });
			dc.send(JSON.stringify({ type: "start", bytes: new TextEncoder().encode(text).length, total: text.length }));
			await sendAll(dc, chunks);
			dc.send(JSON.stringify({ type: "end" }));
		} catch (e) {
			log.warn("sending log failed", e);
			finish("send-failed");
		}
	};
	pc.ondatachannel = (ev) => {
		const dc = ev.channel;
		if (dc.label !== CHANNEL) return;
		dc.onmessage = (m) => {
			try {
				if (JSON.parse(m.data).type === "ack") finish("acked");
			} catch {
				/* ignore */
			}
		};
		dc.onclose = () => finish("closed");
		if (dc.readyState === "open") sendLog(dc);
		else dc.onopen = () => sendLog(dc);
	};
	pc.onconnectionstatechange = () => {
		if (pc.connectionState === "failed") finish("connection-failed");
	};
	try {
		await pc.setRemoteDescription({ type: "offer", sdp: req.offer });
		await pc.setLocalDescription(await pc.createAnswer());
		await waitIce(pc);
		const res = await signals.answer(req.requestId, pc.localDescription.sdp);
		if (!res?.ok) {
			log.warn("answer rejected");
			return "rejected";
		}
		log.info("answered log request; waiting for the administrator to connect");
		const why = await over;
		log.info("log session ended", { why });
		return why;
	} catch (e) {
		log.warn("log session failed", e);
		return "error";
	} finally {
		clearTimeout(timer);
		try {
			pc.close();
		} catch {
			/* ignore */
		}
	}
}

let busy = false;
const handled = new Set();

/** One check-in. Returns "idle" | "serving" | "skipped" | "error". The session itself continues in the background. */
export async function checkIn(signals, serve = serveRequest) {
	try {
		if (busy || (typeof navigator !== "undefined" && navigator.onLine === false)) return "skipped";
		const r = await signals.check();
		if (!r?.ok || !r.requested || !r.requestId || !r.offer) return "idle";
		if (handled.has(r.requestId)) return "idle";
		handled.add(r.requestId);
		busy = true;
		log.info("log requested by support");
		serve(signals, r)
			.catch((e) => log.warn("log session crashed", e))
			.finally(() => (busy = false));
		return "serving";
	} catch (e) {
		log.warn("diagnostics check-in failed", e);
		return "error";
	}
}

/** Starts polling every 15 s (and when the browser comes back online); returns a stop function. */
export function startDiagnostics(getToken) {
	const signals = isLocalMode() ? localPosSignals : cloudSignals(async () => (await getToken?.()) || "");
	const run = () => checkIn(signals);
	run();
	const id = setInterval(run, POLL_MS);
	window.addEventListener("online", run);
	return () => {
		clearInterval(id);
		window.removeEventListener("online", run);
	};
}

export const _resetForTests = () => {
	busy = false;
	handled.clear();
};
