/**
 * Live support, the agent's side (admin portal): join a client's session with the 6-digit code, connect directly to the client's browser, and
 * receive the live copy of their POS page. The agent's pointer, highlighter, spotlight and notes are sent back to be drawn on the client's screen.
 * One session at a time; this module holds its state (read with useSupportViewer()).
 */
import { useSyncExternalStore } from "react";
import { env } from "../config/env";
import { cleanReply } from "../domain/supportProtocol";
import { GIVE_UP, keepTrying } from "../domain/supportLink";
import { createPeer } from "../services/supportPeer";
import { adminSession } from "./adminSession";
import { createLogger } from "../utils/logger";

const log = createLogger("support-viewer");
const POLL_MS = 1500;
const LIVE_POLL_MS = 10000;
const IDLE = { status: "idle", business: "", endsAt: "", error: "", control: false, notice: "", link: null }; // control: the client has allowed control; notice: the client's latest answer
let state = IDLE; // status: idle | joining | connecting | live | reconnecting | ended | error
const subs = new Set();
const eventSubs = new Set();
let buffer = []; // page events that arrived before the viewer was ready
let code = "";
let sid = "";
let peer = null;
let timer = null;
let epoch = 0;
let lastOffer = ""; // the key of the offer this side last answered: a different one means the client is reconnecting
let statsTimer = null;
let reconnectFrom = 0;

const set = (patch) => {
	state = { ...state, ...patch };
	subs.forEach((f) => f());
};
const subscribe = (f) => (subs.add(f), () => subs.delete(f));
export const useSupportViewer = () => useSyncExternalStore(subscribe, () => state);
/** `fn(rrwebEvent)` for every page event from the client; earlier events are delivered first. */
export function onPageEvent(fn) {
	buffer.forEach(fn);
	buffer = [];
	eventSubs.add(fn);
	return () => eventSubs.delete(fn);
}

async function call(body) {
	const session = adminSession.get();
	if (!session) throw new Error("Live support needs the administrator sign-in. Please sign in again.");
	const res = await fetch(env.supportSessionUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.token }, body: JSON.stringify(body) });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw Object.assign(new Error(json.error || "Live support failed (" + res.status + ")"), { status: res.status });
	return json;
}

function finish(status, error = "") {
	epoch += 1;
	clearTimeout(timer);
	timer = null;
	clearInterval(statsTimer);
	reconnectFrom = 0;
	lastOffer = "";
	const old = peer;
	peer = null;
	old?.close();
	buffer = [];
	code = sid = "";
	set({ status, error, control: false, link: null });
}

/** The connection dropped without the session ending: wait for the client's new offer and answer it (control has to be allowed again). */
function lost(mine, p) {
	if (mine !== epoch || p !== peer) return;
	peer = null;
	clearInterval(statsTimer);
	if (state.status === "live") reconnectFrom = Date.now();
	if (state.status === "live" || state.status === "reconnecting") set({ status: "reconnecting", control: false, link: null, notice: "" });
	else finish("ended", "The client's connection closed.");
	lastOffer = "";
}

function onReply(r) {
	if (r.k === "ctl") return set({ control: r.on, notice: r.on ? "The client allowed control." : "Control is off." });
	if (r.for === "act") return set({ notice: r.ok ? "" : r.reason || "The client has to do that one." });
	if (r.for === "goto") return set({ notice: r.ok ? "Opened on the client's screen." : r.reason || "The client said not now." });
	set({ notice: r.ok ? "" : r.reason || "The client said no." });
}

function onMessage(m) {
	const reply = cleanReply(m);
	if (reply) return onReply(reply);
	if (m?.k === "ev" && m.e) {
		// the replay schedules events by their time stamps, and the two computers' clocks never agree: each event is stamped with the time it arrives here
		const event = { ...m.e, timestamp: Date.now() };
		if (eventSubs.size) eventSubs.forEach((f) => f(event));
		else buffer.push(event);
	}
}

async function poll(mine) {
	try {
		const r = await call({ action: "agentPoll", code, sid });
		if (mine !== epoch) return;
		if (r.state === "ended") return finish("ended", "The support session has ended.");
		if (state.status === "reconnecting" && !keepTrying(reconnectFrom, Date.now() - 30000)) return finish("ended", GIVE_UP);
		if (r.offer && r.offerKey && r.offerKey !== lastOffer) {
			lastOffer = r.offerKey; // a first offer, or a new one after the client's connection dropped
			const old = peer;
			peer = null;
			old?.close();
			const ice = await call({ action: "agentIce" }).then((x) => x.ice, () => undefined);
			if (mine !== epoch) return;
			const p = createPeer({
				initiator: false,
				ice,
				onOpen: () => {
					if (mine !== epoch || p !== peer) return;
					reconnectFrom = 0;
					set({ status: "live" });
					clearInterval(statsTimer);
					statsTimer = setInterval(() => p.stats().then((link) => mine === epoch && p === peer && set({ link })), 4000);
				},
				onMessage,
				onClose: () => lost(mine, p),
			});
			peer = p;
			await call({ action: "answer", code, sid, sdp: await p.answer(r.offer), offerKey: r.offerKey });
		}
	} catch (e) {
		if (mine !== epoch) return;
		log.warn("live support poll failed", e);
		if (e.status === 409) lastOffer = ""; // the client made a newer offer while this one was being answered: answer the new one
		else if (state.status === "connecting") return finish("error", e.message);
	}
	if (mine === epoch) timer = setTimeout(() => poll(mine), state.status === "live" ? LIVE_POLL_MS : POLL_MS);
}

/** Joins the session of this code. */
export async function joinSupport(value) {
	const entered = String(value || "").replace(/\D/g, "");
	if (entered.length !== 6) return set({ status: "error", error: "Enter the 6-digit code." });
	const mine = ++epoch;
	set({ ...IDLE, status: "joining" });
	try {
		const r = await call({ action: "join", code: entered });
		if (mine !== epoch) return;
		code = entered;
		sid = r.sid;
		set({ status: "connecting", business: r.business, endsAt: r.endsAt });
		timer = setTimeout(() => poll(mine), POLL_MS);
	} catch (e) {
		if (mine === epoch) finish("error", e.message);
	}
}

/** Sends something to draw on the client's screen. */
export const sendAnnotation = (a) => peer?.send(a);
/** Asks the client's POS for something (open a screen, control, a click...). The client says yes or no and sees every action. */
export const sendCommand = (c) => peer?.send(c);
export const clearNotice = () => set({ notice: "" });

export async function endViewer() {
	const c = code;
	const id = sid;
	finish("idle");
	if (c && id) await call({ action: "agentEnd", code: c, sid: id }).catch((e) => log.warn("could not tell the server the session ended", e));
}

export const resetViewer = () => (state.status === "ended" || state.status === "error" ? set({ ...IDLE }) : undefined);
