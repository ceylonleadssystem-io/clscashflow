/**
 * Live support, the agent's side (admin portal): join a client's session with the 6-digit code, connect directly to the client's browser, and
 * receive the live copy of their POS page. The agent's pointer, highlighter, spotlight and notes are sent back to be drawn on the client's screen.
 * One session at a time; this module holds its state (read with useSupportViewer()).
 */
import { useSyncExternalStore } from "react";
import { env } from "../config/env";
import { createPeer } from "../services/supportPeer";
import { adminSession } from "./adminSession";
import { createLogger } from "../utils/logger";

const log = createLogger("support-viewer");
const POLL_MS = 1500;
const LIVE_POLL_MS = 10000;
const IDLE = { status: "idle", business: "", endsAt: "", error: "" };
let state = IDLE; // status: idle | joining | connecting | live | ended | error
const subs = new Set();
const eventSubs = new Set();
let buffer = []; // page events that arrived before the viewer was ready
let code = "";
let sid = "";
let peer = null;
let timer = null;
let epoch = 0;

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
	if (!res.ok || json.ok === false) throw new Error(json.error || "Live support failed (" + res.status + ")");
	return json;
}

function finish(status, error = "") {
	epoch += 1;
	clearTimeout(timer);
	timer = null;
	peer?.close();
	peer = null;
	buffer = [];
	code = sid = "";
	set({ status, error });
}

function onMessage(m) {
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
		if (r.offer && !peer) {
			peer = createPeer({
				initiator: false,
				onOpen: () => mine === epoch && set({ status: "live" }),
				onMessage,
				onClose: () => mine === epoch && state.status !== "idle" && finish("ended", "The client's connection closed."),
			});
			await call({ action: "answer", code, sid, sdp: await peer.answer(r.offer) });
		}
	} catch (e) {
		if (mine !== epoch) return;
		log.warn("live support poll failed", e);
		if (state.status === "connecting") return finish("error", e.message);
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

export async function endViewer() {
	const c = code;
	const id = sid;
	finish("idle");
	if (c && id) await call({ action: "agentEnd", code: c, sid: id }).catch((e) => log.warn("could not tell the server the session ended", e));
}

export const resetViewer = () => (state.status === "ended" || state.status === "error" ? set({ ...IDLE }) : undefined);
