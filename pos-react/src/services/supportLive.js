/**
 * Live support, the client's side: Settings > Plan & Support > Live support. The client gets a one-time 6-digit code and reads it to support; once
 * an administrator joins with it, the two browsers connect directly and the client's POS page is sent live (inputs are masked). The agent's
 * pointer, highlighter, spotlight and notes are drawn on this screen by components/support/SupportOverlay.jsx. The client can end the session at any time.
 * One session at a time; this module is the single source of its state (read with useSupport()).
 */
import { useSyncExternalStore } from "react";
import { env } from "../config/env";
import { cleanAnnotation } from "../domain/supportProtocol";
import { createPeer } from "./supportPeer";
import { createLogger } from "../utils/logger";

const log = createLogger("support-live");
const POLL_MS = 1500;
const LIVE_POLL_MS = 8000;

const IDLE = { status: "idle", code: "", expiresAt: "", endsAt: "", error: "" };
let state = IDLE; // status: idle | creating | waiting | connecting | live | ended | error
const subs = new Set();
const annotationSubs = new Set();
let sid = "";
let peer = null;
let stopRecording = null;
let timer = null;
let offered = false;
let answered = false;
let epoch = 0; // each session has its own number, so a late reply from an old one is ignored

const set = (patch) => {
	state = { ...state, ...patch };
	subs.forEach((f) => f());
};
const subscribe = (f) => (subs.add(f), () => subs.delete(f));
export const supportState = () => state;
/** The state of the live support session, kept up to date. */
export const useSupport = () => useSyncExternalStore(subscribe, supportState);
/** `fn(annotation)` is called for everything the agent draws (already cleaned). Returns the unsubscribe function. */
export const onAnnotation = (fn) => (annotationSubs.add(fn), () => annotationSubs.delete(fn));

async function call(body) {
	const { getAppwriteCompat } = await import("./appwrite/appwriteCompat");
	const user = getAppwriteCompat().auth().currentUser;
	if (!user) throw new Error("Sign in to the cloud account to use live support.");
	const res = await fetch(env.supportSessionUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await user.getIdToken()) }, body: JSON.stringify(body) });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw new Error(json.error || "Live support failed (" + res.status + ")");
	return json;
}

function finish(status, error = "") {
	epoch += 1;
	clearTimeout(timer);
	timer = null;
	stopRecording?.();
	stopRecording = null;
	peer?.close();
	peer = null;
	sid = "";
	offered = answered = false;
	set({ status, error });
}

/** Sends the page to the agent as it changes. rrweb is loaded only now, so the rest of the POS does not carry it. */
async function startRecording(mine) {
	const { record } = await import("rrweb");
	if (mine !== epoch || !peer) return;
	const send = (m) => peer?.send(m);
	const view = () => send({ k: "view", w: window.innerWidth, h: window.innerHeight });
	view();
	window.addEventListener("resize", view);
	const stop = record({
		emit: (event) => send({ k: "ev", e: event }),
		maskAllInputs: true, // typed values (PINs, passwords, customer details) never leave this device
		blockClass: "support-block",
		blockSelector: "[data-support-block]",
		maskTextClass: "support-mask",
		inlineStylesheet: true,
		recordCanvas: false,
		collectFonts: false,
		sampling: { mousemove: 50, scroll: 100, input: "last" },
	});
	stopRecording = () => {
		window.removeEventListener("resize", view);
		stop?.();
	};
}

async function poll(mine) {
	try {
		const r = await call({ action: "poll", code: state.code, sid });
		if (mine !== epoch) return;
		if (r.state === "ended") return finish("ended", "The support session has ended.");
		if (r.state === "joined" && !offered) {
			offered = true;
			set({ status: "connecting", endsAt: r.endsAt });
			peer = createPeer({
				initiator: true,
				onOpen: () => {
					if (mine !== epoch) return;
					set({ status: "live" });
					startRecording(mine).catch((e) => log.warn("could not start the live view", e));
				},
				onMessage: (m) => {
					const a = cleanAnnotation(m);
					if (a) annotationSubs.forEach((f) => f(a));
				},
				onClose: () => mine === epoch && state.status !== "idle" && finish("ended", "The connection was closed."),
			});
			await call({ action: "offer", code: state.code, sid, sdp: await peer.makeOffer() });
		}
		if (r.answer && !answered && peer) {
			answered = true;
			await peer.acceptAnswer(r.answer);
		}
		if (state.status === "waiting" && Date.parse(state.expiresAt) <= Date.now()) return finish("ended", "The code expired. Get a new one.");
	} catch (e) {
		if (mine !== epoch) return;
		log.warn("live support poll failed", e);
		if (state.status === "waiting" || state.status === "connecting") return finish("error", e.message);
	}
	if (mine === epoch) timer = setTimeout(() => poll(mine), state.status === "live" ? LIVE_POLL_MS : POLL_MS);
}

/** Gets a one-time code and waits for support to join. */
export async function startSupport() {
	if (["creating", "waiting", "connecting", "live"].includes(state.status)) return;
	const mine = ++epoch;
	set({ ...IDLE, status: "creating" });
	try {
		const r = await call({ action: "create" });
		if (mine !== epoch) return;
		sid = r.sid;
		set({ status: "waiting", code: r.code, expiresAt: r.expiresAt });
		timer = setTimeout(() => poll(mine), POLL_MS);
	} catch (e) {
		if (mine === epoch) finish("error", e.message);
	}
}

/** Ends the session (or cancels the code) now. */
export async function endSupport() {
	const code = state.code;
	const id = sid;
	finish("idle");
	if (code && id) await call({ action: "end", code, sid: id }).catch((e) => log.warn("could not tell the server the session ended", e));
}

/** Clears an ended or failed session so a new code can be made. */
export const resetSupport = () => state.status === "ended" || state.status === "error" ? set({ ...IDLE }) : undefined;
