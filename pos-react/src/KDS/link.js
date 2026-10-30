/**
 * POS side of the Kitchen Display links. Each KDS station (Stations page) pairs with its own kitchen screen: the 6-digit code shown on
 * the KDS page is entered once on the POS, then the POS keeps a direct WebRTC data channel to that screen over the local Wi-Fi and
 * sends that station's prep tickets through it. Tickets wait in an outbox per station (this device's storage) until the screen
 * acknowledges them, so a dropped Wi-Fi never loses an order. When a screen marks a ticket preparing / ready / done the status comes
 * back here and is saved on the ticket.
 */
import { LAN_RTC, pairApi, readJson, waitIce, writeJson } from "./net";

const PAIRS_KEY = "pos.kds.pairs"; // { stationId: pairId }
const LEGACY_PAIR_KEY = "pos.kds.pairId"; // before several screens: one pairing, given to the first KDS station
const LEGACY_OUT_KEY = "pos.kds.outbox";
const MAX_OUTBOX = 200;
const MAX_AGE_MS = 12 * 3600 * 1000;
const POLL_MS = 5000;

let running = null; // { getHello, onStatus }
let timer = null;
const links = new Map();
const listeners = new Set();
const notify = () => {
	const s = aggregate();
	listeners.forEach((fn) => fn(s));
};

const pairs = () => readJson(PAIRS_KEY, {});
const setPair = (id, pairId) => {
	const next = { ...pairs() };
	if (pairId) next[id] = pairId;
	else delete next[id];
	writeJson(PAIRS_KEY, next);
};

// the pairing made before stations existed belongs to the first KDS station that starts
function adoptLegacy(id) {
	const legacy = localStorage.getItem(LEGACY_PAIR_KEY);
	if (!legacy || Object.keys(pairs()).length) return;
	setPair(id, legacy);
	writeJson("pos.kds.outbox." + id, readJson(LEGACY_OUT_KEY, []));
	localStorage.removeItem(LEGACY_PAIR_KEY);
	localStorage.removeItem(LEGACY_OUT_KEY);
}

function createLink(id) {
	adoptLegacy(id);
	const OUT_KEY = "pos.kds.outbox." + id;
	let pc = null;
	let dc = null;
	let busy = false;
	let state = { paired: !!pairs()[id], connected: false, note: "" };
	const own = new Set();
	const set = (patch) => {
		state = { ...state, ...patch };
		own.forEach((fn) => fn(state));
		notify();
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
	const close = () => {
		try {
			dc?.close();
			pc?.close();
		} catch {
			/* already closed */
		}
		dc = pc = null;
	};
	const attach = (channel) => {
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
				close();
			}
		};
	};
	/** Fetches the KDS offer stored under `key`, answers it and waits for the channel. */
	const answer = async (key) => {
		const got = await pairApi("get", { key });
		if (!got.found) return { ok: false, pairId: "" };
		close();
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
		if (!connected && pc === mine) close();
		return { ok: connected, pairId: got.pairId };
	};
	return {
		id,
		state: () => state,
		subscribe(fn) {
			own.add(fn);
			return () => own.delete(fn);
		},
		async tick() {
			const pairId = pairs()[id];
			if (busy || state.connected || !pairId || !running) return;
			busy = true;
			try {
				await answer(pairId);
			} catch (e) {
				set({ note: e.message });
			} finally {
				busy = false;
			}
		},
		/** First pairing: the code shown on the KDS page. Throws an Error with a message for the screen. */
		async pairWithCode(code) {
			if (busy) throw new Error("Still connecting. Wait a moment and try again.");
			busy = true;
			try {
				const r = await answer(String(code).trim());
				if (!r.pairId) throw new Error("That code was not found. Check the code on the Kitchen Display.");
				if (!r.ok) throw new Error("Found the Kitchen Display but could not connect. Both devices must be on the same Wi-Fi.");
				setPair(id, r.pairId);
				set({ paired: true });
			} finally {
				busy = false;
			}
		},
		unpair() {
			setPair(id, "");
			close();
			set({ paired: false, connected: false, note: "" });
		},
		send(ticket) {
			writeJson(OUT_KEY, [...outbox().filter((o) => o.ticket.id !== ticket.id), { at: Date.now(), ticket }].slice(-MAX_OUTBOX));
			sendRaw({ type: "ticket", ticket });
		},
		pending: () => outbox().length,
		/** Sends the welcome message again (the business name and the Kitchen Display settings) to a connected screen. */
		hello() {
			sendRaw({ type: "hello", ...(running?.getHello?.() || {}) });
		},
		close() {
			close();
			if (state.connected) set({ connected: false });
		},
	};
}

const linkFor = (id) => {
	const key = String(id || "kds");
	if (!links.has(key)) links.set(key, createLink(key));
	return links.get(key);
};

// all screens together: paired when any is paired, connected when every paired screen is connected
function aggregate() {
	const all = [...links.values()].map((l) => l.state());
	const paired = all.filter((s) => s.paired);
	return { paired: paired.length > 0, connected: paired.length > 0 && paired.every((s) => s.connected), screens: all.length, pairedCount: paired.length, note: all.find((s) => s.note)?.note || "" };
}

export const kdsLink = {
	/** Combined state of every KDS station on this device. */
	state: aggregate,
	subscribe(fn) {
		listeners.add(fn);
		return () => listeners.delete(fn);
	},
	/** The link of one KDS station (created on first use). */
	station: linkFor,
	/** Keeps one link per KDS station; links of removed stations are closed (their pairing is kept in case it comes back). */
	sync(ids) {
		const keep = new Set(ids.map(String));
		for (const [id, l] of links) if (!keep.has(id)) (l.close(), links.delete(id));
		keep.forEach(linkFor);
		notify();
		if (running) links.forEach((l) => l.tick());
	},
	/** Starts reconnecting to the paired screens in the background. `onStatus(ticketId, status)` receives the kitchen's progress. */
	start(handlers) {
		running = handlers;
		clearInterval(timer);
		const tick = () => links.forEach((l) => l.tick());
		timer = setInterval(tick, POLL_MS);
		tick();
	},
	stop() {
		running = null;
		clearInterval(timer);
		links.forEach((l) => l.close());
	},
	/** Sends the current settings to every connected screen now. */
	refresh() {
		links.forEach((l) => l.hello());
	},
	/** Queues a ticket for a station's screen and sends it now if connected; it is kept until the screen acknowledges it. */
	send(ticket, stationId) {
		linkFor(stationId).send(ticket);
	},
};
