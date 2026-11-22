/**
 * Live support, the client's side: Settings > Plan & Support > Live support. The client gets a one-time 6-digit code and reads it to support; once
 * an administrator joins with it, the two browsers connect directly and the client's POS page is sent live (inputs are masked). The agent's
 * pointer, highlighter, spotlight and notes are drawn on this screen by components/support/SupportOverlay.jsx. The client can end the session at any time.
 * The agent can also ask to open a POS screen (the client says yes or no) and ask for control: only while the client has switched control on, clicks,
 * typing and scrolling are carried out inside the POS page, with the rules in services/supportControl.js. One session at a time; this module is the
 * single source of its state (read with useSupport()).
 */
import { useSyncExternalStore } from "react";
import { env } from "../config/env";
import { cleanAnnotation, cleanCommand } from "../domain/supportProtocol";
import { GIVE_UP, droppable, keepTrying, reconnectDelay } from "../domain/supportLink";
import { runAction } from "./supportControl";
import { createPeer } from "./supportPeer";
import { createLogger } from "../utils/logger";

const log = createLogger("support-live");
const POLL_MS = 1500;
const LIVE_POLL_MS = 8000;

const IDLE = { status: "idle", code: "", expiresAt: "", endsAt: "", error: "", request: null, control: false, link: null }; // request: what support asked of the client and is waiting for an answer; link: how the connection is doing (see peer.stats)
let state = IDLE; // status: idle | creating | waiting | connecting | live | reconnecting | ended | error
const subs = new Set();
const annotationSubs = new Set();
let sid = "";
let peer = null;
let stopRecording = null;
let timer = null;
let offered = false;
let answered = false;
let epoch = 0;
let mirror = null; // rrweb's map of page elements to the ids the agent uses to point at them
let bridge = null; // the POS screens and the log, registered by hooks/useSupportBridge.js
let requestTimer = null;
let statsTimer = null;
let reconnectFrom = 0; // when a live connection dropped (0 = not reconnecting)
let attempt = 0;
const recent = []; // times of recent remote actions, to keep them to a sensible pace // each session has its own number, so a late reply from an old one is ignored

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
	mirror = null;
	clearTimeout(requestTimer);
	clearInterval(statsTimer);
	reconnectFrom = attempt = 0;
	const old = peer;
	peer = null;
	old?.close();
	sid = "";
	offered = answered = false;
	set({ status, error, request: null, control: false, link: null });
}

/** Sends the page to the agent as it changes. rrweb is loaded only now, so the rest of the POS does not carry it. */
async function startRecording(mine) {
	const { record } = await import("rrweb");
	if (mine !== epoch || !peer) return;
	stopRecording?.(); // a reconnect starts a fresh copy of the page
	mirror = record.mirror;
	const send = (m) => peer?.send(m);
	const view = () => send({ k: "view", w: window.innerWidth, h: window.innerHeight });
	view();
	window.addEventListener("resize", view);
	const stop = record({
		emit: (event) => !(peer?.busy && droppable(event)) && send({ k: "ev", e: event }), // on a slow link, movement events are skipped first
		maskAllInputs: true, // typed values (PINs, passwords, customer details) never leave this device
		blockClass: "support-block", // anything with this class (the sign-in and PIN screens, the support bar) never leaves this device
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

const tell = (m) => peer?.send(m);
const flash = (rect, ok) => rect && annotationSubs.forEach((f) => f({ k: "flash", ...rect, ok }));
const REQUEST_MS = 60000;

function ask(request) {
	clearTimeout(requestTimer);
	set({ request });
	requestTimer = setTimeout(() => answerRequest(false), REQUEST_MS); // an unanswered request counts as "no"
}

/** The POS screens and log, registered once the POS is running: { canGo(view, page), describe(view, page), go(view, page), audit(action, detail) }. */
export function registerSupportBridge(b) {
	bridge = b;
	return () => bridge === b && (bridge = null);
}

function handleCommand(c) {
	if (c.k === "goto") {
		if (!bridge?.canGo(c.view, c.page)) return tell({ k: "ack", for: "goto", ok: false, reason: "The client's POS cannot open that screen." });
		return ask({ kind: "goto", view: c.view, page: c.page, label: bridge.describe(c.view, c.page) });
	}
	if (c.k === "ask") return state.control ? tell({ k: "ctl", on: true }) : ask({ kind: "control" });
	if (c.k === "release") return setControl(false);
	// click, type, scroll: only while the client has control switched on, a few per second at most
	if (!state.control) return tell({ k: "ack", for: "act", ok: false, reason: "The client has not allowed control." });
	const now = Date.now();
	while (recent.length && now - recent[0] > 1000) recent.shift();
	if (recent.length >= 12) return;
	recent.push(now);
	const el = mirror?.getNode(c.id) || null;
	const r = runAction(c, el);
	flash(r.rect, r.ok);
	tell({ k: "ack", for: "act", ok: r.ok, reason: r.reason });
	if (c.a !== "scroll") bridge?.audit("support-control", `${c.a} ${r.ok ? "done" : "refused"}: ${String(el?.getAttribute?.("aria-label") || el?.textContent || el?.tagName || "").trim().slice(0, 60)}`);
}

/** The client answers what support asked (open a screen, or take control). */
export function answerRequest(accept) {
	const r = state.request;
	clearTimeout(requestTimer);
	if (!r) return;
	set({ request: null });
	if (r.kind === "goto") {
		if (accept) {
			bridge?.go(r.view, r.page);
			bridge?.audit("support-open", "Support opened " + r.label);
		}
		tell({ k: "ack", for: "goto", ok: !!accept, reason: accept ? "" : "The client said not now." });
	} else if (r.kind === "control") {
		setControl(!!accept);
		if (!accept) tell({ k: "ack", for: "ask", ok: false, reason: "The client said no." });
	}
}

/** The client switches control on or off. Off at any moment: nothing from the agent is carried out. */
export function setControl(on) {
	if (state.control === !!on) return;
	set({ control: !!on });
	tell({ k: "ctl", on: !!on });
	bridge?.audit(on ? "support-control-on" : "support-control-off", on ? "The client let support control the screen" : "Control by support stopped");
}

/** Starts the connection (or a new one after a drop): fetch the servers, make the offer, hand it to the server. The agent answers it. */
async function connect(mine) {
	offered = true;
	answered = false;
	const old = peer;
	peer = null;
	old?.close();
	const ice = await call({ action: "ice" }).then((r) => r.ice, () => undefined); // without them the public server alone is used
	if (mine !== epoch) return;
	const p = createPeer({
		initiator: true,
		ice,
		onOpen: () => {
			if (mine !== epoch || p !== peer) return;
			reconnectFrom = attempt = 0;
			set({ status: "live" });
			startRecording(mine).catch((e) => log.warn("could not start the live view", e));
			clearInterval(statsTimer);
			statsTimer = setInterval(() => p.stats().then((link) => mine === epoch && p === peer && set({ link })), 4000);
		},
		onMessage: (m) => {
			const a = cleanAnnotation(m);
			if (a) return annotationSubs.forEach((f) => f(a));
			const c = cleanCommand(m);
			if (c) handleCommand(c);
		},
		onClose: () => lost(mine, p),
	});
	peer = p;
	await call({ action: "offer", code: state.code, sid, sdp: await p.makeOffer() });
}

/** The connection ended without anyone ending the session. A live session reconnects by itself; control has to be allowed again afterwards. */
function lost(mine, p) {
	if (mine !== epoch || p !== peer) return;
	if (state.status === "live") {
		stopRecording?.();
		stopRecording = null;
		clearInterval(statsTimer);
		reconnectFrom = Date.now();
		attempt = 0;
		peer = null;
		offered = answered = false;
		set({ status: "reconnecting", control: false, request: null, link: null });
		bridge?.audit("support-reconnecting", "The connection to support dropped; trying again");
		clearTimeout(timer);
		timer = setTimeout(() => poll(mine), reconnectDelay(0) * 1000);
	} else if (state.status === "reconnecting") {
		peer = null;
		offered = answered = false;
		attempt += 1; // that try did not work: the next poll makes a new offer
	} else finish("ended", "The connection was closed.");
}

async function poll(mine) {
	try {
		const r = await call({ action: "poll", code: state.code, sid });
		if (mine !== epoch) return;
		if (r.state === "ended") return finish("ended", "The support session has ended.");
		if (state.status === "reconnecting" && !keepTrying(reconnectFrom)) return finish("ended", GIVE_UP);
		let justOffered = false;
		if ((r.state === "joined" || r.state === "connected") && !offered) {
			if (state.status === "waiting") set({ status: "connecting", endsAt: r.endsAt });
			await connect(mine);
			justOffered = true; // the answer in this reply was read before the new offer was posted: it belongs to an older offer, so wait for the next reply
		}
		if (r.answer && !answered && peer && offered && !justOffered) {
			answered = true;
			await peer.acceptAnswer(r.answer);
		}
		if (state.status === "waiting" && Date.parse(state.expiresAt) <= Date.now()) return finish("ended", "The code expired. Get a new one.");
	} catch (e) {
		if (mine !== epoch) return;
		log.warn("live support poll failed", e);
		if (state.status === "waiting" || state.status === "connecting") return finish("error", e.message);
		if (state.status === "reconnecting") {
			offered = false;
			attempt += 1;
		}
	}
	if (mine === epoch) timer = setTimeout(() => poll(mine), state.status === "live" ? LIVE_POLL_MS : state.status === "reconnecting" ? reconnectDelay(attempt) * 1000 : POLL_MS);
}

/** Gets a one-time code and waits for support to join. */
export async function startSupport() {
	if (["creating", "waiting", "connecting", "live", "reconnecting"].includes(state.status)) return;
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
