/**
 * Live support: the direct browser-to-browser connection (WebRTC data channel) between a client's POS and the agent's admin portal. No screen
 * capture is involved, so it works on tablets. The two sides swap one offer and one answer (through the support-session function); after that
 * everything travels directly. Messages are cut into small frames (domain/supportProtocol.js).
 */
import { env } from "../config/env";
import { frameReader, toFrames } from "../domain/supportProtocol";

const GATHER_MS = 4000; // wait this long for the connection details to be complete before sending them
const GRACE_MS = 6000; // a connection that drops out is given this long to come back by itself before it counts as lost

/** The servers used when the session did not bring its own (see the support-session function): the public STUN server and any set at build time. */
export function iceServers() {
	const extra = (() => {
		try {
			const list = JSON.parse(env.supportIceServers || "[]");
			return Array.isArray(list) ? list : [];
		} catch {
			return [];
		}
	})();
	return [{ urls: "stun:stun.l.google.com:19302" }, ...extra];
}

const gathered = (pc) =>
	new Promise((resolve) => {
		if (pc.iceGatheringState === "complete") return resolve();
		const done = () => {
			pc.removeEventListener("icegatheringstatechange", check);
			clearTimeout(timer);
			resolve();
		};
		const check = () => pc.iceGatheringState === "complete" && done();
		const timer = setTimeout(done, GATHER_MS);
		pc.addEventListener("icegatheringstatechange", check);
	});

/**
 * One side of the connection. `initiator` (the client) opens the data channel and makes the offer; the other side answers it. `ice` is the list of
 * servers for this session (including the relay when there is one). Callbacks: onOpen(), onMessage(message), onClose().
 */
export function createPeer({ initiator, ice, onOpen, onMessage, onClose }) {
	const pc = new RTCPeerConnection({ iceServers: ice?.length ? ice : iceServers() });
	const reader = frameReader();
	let channel = null;
	let closed = false;
	let tail = Promise.resolve();
	const close = () => {
		if (closed) return;
		closed = true;
		try {
			channel?.close();
			pc.close();
		} catch {
			/* already closed */
		}
		onClose?.();
	};
	const setup = (ch) => {
		channel = ch;
		ch.bufferedAmountLowThreshold = 512 * 1024;
		ch.onopen = () => onOpen?.();
		ch.onclose = close;
		ch.onmessage = (e) => {
			const message = reader.push(typeof e.data === "string" ? e.data : "");
			if (message) onMessage?.(message);
		};
	};
	if (initiator) setup(pc.createDataChannel("support", { ordered: true }));
	else pc.ondatachannel = (e) => setup(e.channel);
	// "failed" and "closed" are final; "disconnected" often mends itself (a moment of poor signal), so it is only lost after a grace period
	let grace = null;
	pc.onconnectionstatechange = () => {
		clearTimeout(grace);
		if (["failed", "closed"].includes(pc.connectionState)) close();
		else if (pc.connectionState === "disconnected") grace = setTimeout(close, GRACE_MS);
	};

	return {
		/** The connection details to send to the other side (the client's offer). */
		async makeOffer() {
			await pc.setLocalDescription(await pc.createOffer());
			await gathered(pc);
			return pc.localDescription.sdp;
		},
		/** The agent: takes the offer and returns the answer to send back. */
		async answer(offerSdp) {
			await pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
			await pc.setLocalDescription(await pc.createAnswer());
			await gathered(pc);
			return pc.localDescription.sdp;
		},
		/** The client: takes the agent's answer. */
		acceptAnswer: (sdp) => pc.setRemoteDescription({ type: "answer", sdp }),
		// messages go out strictly in the order they were given, even while a large one waits for the channel to drain
		send(message) {
			tail = tail.then(async () => {
				if (closed || !channel || channel.readyState !== "open") return;
				for (const frame of toFrames(message)) {
					if (channel.bufferedAmount > 1024 * 1024) await new Promise((r) => channel.addEventListener("bufferedamountlow", r, { once: true }));
					channel.send(frame);
				}
			});
			return tail;
		},
		close,
		get open() {
			return !closed && channel?.readyState === "open";
		},
		/** True while a lot of data is waiting to go out: the link is slow or busy. */
		get busy() {
			return !!channel && channel.bufferedAmount > 256 * 1024;
		},
		/** How the connection is doing: { relay: goes through a relay server, rtt: round trip in milliseconds } (rtt null until known). */
		async stats() {
			try {
				const report = await pc.getStats();
				let pair = null;
				const candidates = new Map();
				report.forEach((r) => {
					if (r.type === "candidate-pair" && (r.nominated || r.selected) && r.state === "succeeded") pair = r;
					if (r.type === "local-candidate" || r.type === "remote-candidate") candidates.set(r.id, r);
				});
				if (!pair) return { relay: false, rtt: null };
				const rtt = Number.isFinite(pair.currentRoundTripTime) ? pair.currentRoundTripTime * 1000 : null;
				const kinds = [candidates.get(pair.localCandidateId)?.candidateType, candidates.get(pair.remoteCandidateId)?.candidateType];
				return { relay: kinds.includes("relay"), rtt };
			} catch {
				return { relay: false, rtt: null };
			}
		},
	};
}
