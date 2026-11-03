/**
 * Kitchen Display side of the link: publishes a connection offer (under a 6-digit code until paired, then under the secret pair id)
 * and waits for a POS register to answer. Every register of the business connects: as soon as one connection opens, a fresh offer is
 * published for the next register, and all open connections stay up. Re-offers on its own whenever one drops, so the screen
 * reconnects without anyone touching it.
 */
import { CHANNEL, LAN_RTC, newCode, newPairId, pairApi, waitIce } from "./net";

const PAIR_KEY = "kds.pairId";
const OFFER_LIFE_MS = 4 * 60 * 1000;
const CONNECT_MS = 20000;

/**
 * hostKds({ onMessage(obj, reply), onState({phase, registers, code?, error?}) }) -> { send(obj), unpair(), stop() }
 * phase: "pairing" (show code) | "waiting" (paired, no register connected) | "connected" (`registers` = how many)
 * `reply(obj)` answers only the register that sent the message; `send(obj)` goes to every connected register.
 */
export function hostKds({ onMessage, onState }) {
	let stopped = false;
	let pending = null; // the offer waiting for the next register
	let timers = [];
	const conns = new Set();
	const later = (fn, ms) => timers.push(setTimeout(fn, ms));
	const clear = () => {
		timers.forEach(clearTimeout);
		timers = [];
	};
	const report = (extra = {}) =>
		onState({ phase: conns.size ? "connected" : localStorage.getItem(PAIR_KEY) ? "waiting" : "pairing", registers: conns.size, ...extra });
	const sendTo = (conn, obj) => {
		try {
			if (conn.dc.readyState === "open") conn.dc.send(JSON.stringify(obj));
		} catch {
			/* the register resends unacknowledged tickets on the next connection */
		}
	};
	const dropPending = () => {
		clear();
		try {
			pending?.pc.close();
		} catch {
			/* already closed */
		}
		pending = null;
	};

	async function offer() {
		if (stopped) return;
		dropPending();
		const paired = localStorage.getItem(PAIR_KEY);
		const code = paired ? "" : newCode();
		const key = paired || code;
		const pairId = paired || newPairId();
		const pc = new RTCPeerConnection(LAN_RTC);
		const conn = { pc, dc: pc.createDataChannel(CHANNEL) };
		pending = conn;
		conn.dc.onopen = () => {
			if (pending !== conn) return;
			pending = null;
			clear();
			if (!paired) {
				localStorage.setItem(PAIR_KEY, pairId);
				pairApi("done", { key }).catch(() => {}); // the code is used up; a pair id offer is simply replaced by the next one
			}
			conns.add(conn);
			report();
			offer(); // ready for the next register
		};
		conn.dc.onmessage = (m) => {
			let msg;
			try {
				msg = JSON.parse(m.data);
			} catch {
				return; // ignore a malformed message
			}
			onMessage(msg, (obj) => sendTo(conn, obj));
		};
		conn.dc.onclose = () => {
			if (conns.delete(conn)) {
				try {
					pc.close();
				} catch {
					/* already closed */
				}
				report();
			} else if (pending === conn && !stopped) later(offer, 2000);
		};
		try {
			await pc.setLocalDescription(await pc.createOffer());
			await waitIce(pc);
			if (pending !== conn) return;
			await pairApi("offer", { key, offer: pc.localDescription.sdp, pairId: paired ? undefined : pairId });
			if (pending !== conn) return;
			report(paired ? {} : { code });
			const poll = async () => {
				if (stopped || pending !== conn || pc.remoteDescription) return;
				try {
					const s = await pairApi("status", { key });
					if (s.answered && pending === conn && !pc.remoteDescription) {
						await pc.setRemoteDescription({ type: "answer", sdp: s.answer });
						later(() => pending === conn && offer(), CONNECT_MS); // that register could not reach this screen: offer again
						return;
					}
				} catch {
					/* offline for a moment: keep polling */
				}
				later(poll, 2000);
			};
			later(poll, 2000);
			later(() => pending === conn && offer(), OFFER_LIFE_MS); // a stale offer is replaced (a new code when not yet paired)
		} catch (e) {
			if (pending !== conn) return;
			report({ code, error: e.message });
			later(offer, 5000);
		}
	}
	offer();

	const closeAll = () => {
		dropPending();
		conns.forEach((c) => {
			try {
				c.pc.close();
			} catch {
				/* already closed */
			}
		});
		conns.clear();
	};

	return {
		send(obj) {
			conns.forEach((c) => sendTo(c, obj));
		},
		unpair() {
			localStorage.removeItem(PAIR_KEY);
			closeAll();
			offer();
		},
		stop() {
			stopped = true;
			closeAll();
		},
	};
}
