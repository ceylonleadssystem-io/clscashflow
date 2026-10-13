/**
 * Kitchen Display side of the link: publishes a connection offer (under a 6-digit code until paired, then under the secret pair id)
 * and waits for the POS to answer. Re-offers on its own whenever the link drops, so the screen reconnects without anyone touching it.
 */
import { CHANNEL, LAN_RTC, newCode, newPairId, pairApi, waitIce } from "./net";

const PAIR_KEY = "kds.pairId";
const OFFER_LIFE_MS = 4 * 60 * 1000;

/**
 * hostKds({ onMessage(obj), onState({phase, code?, error?}) }) -> { send(obj), unpair(), stop() }
 * phase: "pairing" (show code) | "waiting" (paired, POS not connected) | "connected"
 */
export function hostKds({ onMessage, onState }) {
	let stopped = false;
	let pc = null;
	let dc = null;
	let timers = [];
	const later = (fn, ms) => timers.push(setTimeout(fn, ms));
	const clear = () => {
		timers.forEach(clearTimeout);
		timers = [];
	};
	const drop = () => {
		clear();
		try {
			dc?.close();
			pc?.close();
		} catch {
			/* already closed */
		}
		dc = pc = null;
	};

	async function run() {
		if (stopped) return;
		drop();
		const paired = localStorage.getItem(PAIR_KEY);
		const code = paired ? "" : newCode();
		const key = paired || code;
		const mine = new RTCPeerConnection(LAN_RTC);
		pc = mine;
		try {
			const channel = mine.createDataChannel(CHANNEL);
			dc = channel;
			channel.onopen = () => {
				if (!paired) localStorage.setItem(PAIR_KEY, mine.__pairId);
				clear();
				pairApi("done", { key }).catch(() => {});
				onState({ phase: "connected" });
			};
			channel.onmessage = (m) => {
				try {
					onMessage(JSON.parse(m.data));
				} catch {
					/* ignore a malformed message */
				}
			};
			channel.onclose = () => {
				if (pc === mine && !stopped) {
					onState({ phase: localStorage.getItem(PAIR_KEY) ? "waiting" : "pairing" });
					later(run, 2000);
				}
			};
			mine.__pairId = paired || newPairId();
			await mine.setLocalDescription(await mine.createOffer());
			await waitIce(mine);
			await pairApi("offer", { key, offer: mine.localDescription.sdp, pairId: paired ? undefined : mine.__pairId });
			onState(paired ? { phase: "waiting" } : { phase: "pairing", code });
			const poll = async () => {
				if (stopped || pc !== mine || mine.remoteDescription) return;
				try {
					const s = await pairApi("status", { key });
					if (s.answered && !mine.remoteDescription) return void (await mine.setRemoteDescription({ type: "answer", sdp: s.answer }));
				} catch {
					/* offline for a moment: keep polling */
				}
				later(poll, 2000);
			};
			later(poll, 2000);
			later(run, OFFER_LIFE_MS); // a stale offer is replaced (a new code when not yet paired)
		} catch (e) {
			onState({ phase: paired ? "waiting" : "pairing", code, error: e.message });
			later(run, 5000);
		}
	}
	run();

	return {
		send(obj) {
			try {
				if (dc?.readyState === "open") dc.send(JSON.stringify(obj));
			} catch {
				/* the POS resends unacknowledged tickets on the next connection */
			}
		},
		unpair() {
			localStorage.removeItem(PAIR_KEY);
			run();
		},
		stop() {
			stopped = true;
			drop();
		},
	};
}
