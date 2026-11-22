/**
 * Admin portal > Live support: enter the client's 6-digit code, see their POS page live, and point, highlight, draw and write notes on their screen.
 * The page copy is replayed here (rrweb); the drawing tools send small messages that the client's POS draws over its own screen.
 */
import { useEffect, useRef, useState } from "react";
import { COLORS, unit } from "../domain/supportProtocol";
import { linkLabel } from "../domain/supportLink";
import { applyAnnotation, draw, pruneScene } from "../components/support/drawScene";
import { clearNotice, endViewer, joinSupport, onPageEvent, resetViewer, sendAnnotation, sendCommand, useSupportViewer } from "./supportViewerState";

const TOOLS = [
	{ id: "pointer", label: "Pointer" },
	{ id: "highlighter", label: "Highlighter" },
	{ id: "pen", label: "Pen" },
	{ id: "arrow", label: "Arrow" },
	{ id: "spot", label: "Spotlight" },
	{ id: "note", label: "Note" },
	{ id: "control", label: "Control" },
];

// where the agent can send the client (the client's POS opens it only for people allowed to see it, and only after they say yes)
const DESTINATIONS = [
	{ label: "Checkout", view: "checkout" },
	{ label: "Order Queue", view: "orders" },
	{ label: "Table Layout", view: "tables" },
	{ label: "Receipts & Refunds", view: "receipts" },
	{ label: "Inventory & Stock", view: "inventory" },
	{ label: "Sales History", view: "sales" },
	{ label: "Reports", view: "reports" },
	{ label: "Dashboard", view: "dashboard" },
	{ label: "Settings", view: "settings" },
	{ label: "Settings > Service Charge", view: "settings", page: "serviceCharge" },
	{ label: "Settings > Order Entry", view: "settings", page: "orderEntry" },
	{ label: "Settings > Receipts", view: "settings", page: "receipts" },
	{ label: "Settings > Users", view: "settings", page: "users" },
	{ label: "Settings > Items", view: "settings", page: "items" },
	{ label: "Settings > Categories", view: "settings", page: "categories" },
	{ label: "Settings > Printers", view: "settings", page: "printers" },
	{ label: "Settings > QR Menu", view: "settings", page: "qrMenu" },
	{ label: "Settings > Ceylo AI", view: "settings", page: "ceyloAi" },
];
const TEXT_TYPES = ["text", "search", "email", "tel", "url", "number", "date", "time", ""];
const newId = () => Math.random().toString(36).slice(2, 10);

/** The live copy of the client's page with a drawing layer on top. */
function Stage({ control, notice }) {
	const host = useRef(null);
	const replayerRef = useRef(null);
	const lastScroll = useRef(0);
	const canvas = useRef(null);
	const [native, setNative] = useState({ w: 1024, h: 768 });
	const [scale, setScale] = useState(1);
	const [tool, setTool] = useState("pointer");
	const [color, setColor] = useState(COLORS[0]);
	const [note, setNote] = useState(null); // { x, y, text }
	const scene = useRef({ items: [], pointer: null, spot: null });
	const stroke = useRef(null);
	const lastPointer = useRef(0);
	const raf = useRef(0);

	// the replayed page
	useEffect(() => {
		let replayer;
		let off = () => {};
		let gone = false;
		(async () => {
			const { Replayer } = await import("rrweb");
			await import("rrweb/dist/style.css");
			if (gone) return;
			replayer = new Replayer([], { root: host.current, liveMode: true, mouseTail: false, UNSAFE_replayCanvas: false });
			replayerRef.current = replayer;
			replayer.on("resize", (d) => setNative({ w: d.width || 1024, h: d.height || 768 }));
			replayer.startLive();
			off = onPageEvent((e) => replayer.addEvent(e));
		})();
		return () => {
			gone = true;
			off();
			replayer?.destroy?.();
		};
	}, []);

	// fit the client's screen into the space available
	useEffect(() => {
		const fit = () => setScale(Math.min(1, (host.current?.parentElement?.clientWidth || native.w) / native.w));
		fit();
		window.addEventListener("resize", fit);
		return () => window.removeEventListener("resize", fit);
	}, [native.w]);
	useEffect(() => {
		const wrapper = host.current?.querySelector(".replayer-wrapper");
		if (wrapper) {
			wrapper.style.transformOrigin = "top left";
			wrapper.style.transform = `scale(${scale})`;
		}
	});

	const w = Math.round(native.w * scale);
	const h = Math.round(native.h * scale);
	const paint = () => {
		const el = canvas.current;
		if (!el) return;
		const ctx = el.getContext("2d");
		draw(ctx, w, h, scene.current, Date.now());
		pruneScene(scene.current);
		raf.current = scene.current.items.length || scene.current.spot ? requestAnimationFrame(paint) : 0;
	};
	const wake = () => !raf.current && (raf.current = requestAnimationFrame(paint));
	useEffect(() => () => cancelAnimationFrame(raf.current), []);
	useEffect(() => {
		if (canvas.current) {
			canvas.current.width = w;
			canvas.current.height = h;
			paint();
		}
	}, [w, h]); // eslint-disable-line react-hooks/exhaustive-deps

	const at = (e) => {
		const r = canvas.current.getBoundingClientRect();
		return [unit((e.clientX - r.left) / r.width), unit((e.clientY - r.top) / r.height)];
	};
	const send = (a) => {
		sendAnnotation(a);
		if (a.k !== "pointer") (applyAnnotation(scene.current, a), wake());
	};
	// the element of the client's page under the pointer, as the id the client's POS knows it by
	const target = (e) => {
		const rp = replayerRef.current;
		const doc = rp?.iframe?.contentDocument;
		if (!doc) return null;
		const r = canvas.current.getBoundingClientRect();
		let el = doc.elementFromPoint((e.clientX - r.left) / scale, (e.clientY - r.top) / scale);
		while (el) {
			const id = rp.getMirror().getId(el);
			if (id > 0) return { id, el };
			el = el.parentElement;
		}
		return null;
	};
	const typeable = (el) => el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && TEXT_TYPES.includes((el.getAttribute("type") || "").toLowerCase()));
	const [field, setField] = useState(null); // { id, x, y, value }: a field of the client's page the agent is typing into
	const act = (e) => {
		const t = target(e);
		if (!t) return;
		if (typeable(t.el)) return setField({ id: t.id, x: at(e)[0], y: at(e)[1], value: "" });
		sendCommand({ k: "act", a: "click", id: t.id });
	};
	const sendField = () => {
		if (field && field.value !== "") sendCommand({ k: "act", a: "input", id: field.id, value: field.value });
		setField(null);
	};
	// the mouse wheel scrolls the client's page while Control is the tool
	useEffect(() => {
		const el = canvas.current;
		if (!el || tool !== "control" || !control) return undefined;
		const onWheel = (e) => {
			e.preventDefault();
			if (Date.now() - lastScroll.current < 80) return;
			lastScroll.current = Date.now();
			const t = target(e);
			if (t) sendCommand({ k: "act", a: "scroll", id: t.id, dx: e.deltaX, dy: e.deltaY });
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}); // eslint-disable-line react-hooks/exhaustive-deps

	const down = (e) => {
		const [x, y] = at(e);
		if (tool === "control") return control ? act(e) : sendCommand({ k: "ask", what: "control" });
		if (tool === "spot") return send({ k: "spot", x, y, r: 0.12 });
		if (tool === "note") return setNote({ x, y, text: "" });
		if (["pen", "highlighter", "arrow"].includes(tool)) {
			canvas.current.setPointerCapture?.(e.pointerId);
			stroke.current = { k: "stroke", id: newId(), tool, color, points: [[x, y]] };
		}
	};
	const move = (e) => {
		const [x, y] = at(e);
		if (stroke.current) {
			const s = stroke.current;
			if (s.tool === "arrow") s.points = [s.points[0], [x, y]];
			else s.points.push([x, y]);
			// show it as it is drawn (without sending until it is finished)
			scene.current.items = scene.current.items.filter((it) => it.id !== "live");
			scene.current.items.push({ ...s, id: "live", t: Date.now() });
			wake();
		} else if (tool === "pointer" && Date.now() - lastPointer.current > 40) {
			lastPointer.current = Date.now();
			sendAnnotation({ k: "pointer", x, y, on: true });
		}
	};
	const up = () => {
		const s = stroke.current;
		stroke.current = null;
		scene.current.items = scene.current.items.filter((it) => it.id !== "live");
		if (s && s.points.length >= 2) send(s);
		else wake();
	};
	const leave = () => tool === "pointer" && sendAnnotation({ k: "pointer", x: 0, y: 0, on: false });
	const sendNote = () => {
		if (note?.text.trim()) send({ k: "note", id: newId(), x: note.x, y: note.y, text: note.text, color });
		setNote(null);
	};
	const clear = () => {
		sendAnnotation({ k: "clear" });
		applyAnnotation(scene.current, { k: "clear" });
		wake();
		paint();
	};

	return (
		<>
			<div className="tools" role="toolbar" aria-label="Drawing tools" style={{ marginBottom: 10, alignItems: "center" }}>
				{TOOLS.map((t) => (
					<button key={t.id} type="button" className={"btn " + (tool === t.id ? "gold" : "out")} aria-pressed={tool === t.id} onClick={() => setTool(t.id)}>
						{t.label}
					</button>
				))}
				<span style={{ display: "inline-flex", gap: 6, marginLeft: 8 }} role="group" aria-label="Colour">
					{COLORS.map((c) => (
						<button key={c} type="button" aria-label={"Colour " + c} aria-pressed={color === c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 999, background: c, border: color === c ? "3px solid #1f1c18" : "2px solid #fff", boxShadow: "0 0 0 1px #bbb" }} />
					))}
				</span>
				<button type="button" className="btn out" onClick={clear}>
					Clear
				</button>
				<span style={{ display: "inline-flex", gap: 6, marginLeft: 8, alignItems: "center" }}>
					<select className="input" aria-label="Take the client to" id="support-goto" style={{ maxWidth: 230 }} defaultValue="">
						<option value="" disabled>
							Take the client to…
						</option>
						{DESTINATIONS.map((d) => (
							<option key={d.label} value={d.label}>
								{d.label}
							</option>
						))}
					</select>
					<button
						type="button"
						className="btn out"
						onClick={() => {
							const d = DESTINATIONS.find((x) => x.label === document.getElementById("support-goto").value);
							if (d) sendCommand({ k: "goto", view: d.view, page: d.page || "" });
						}}
					>
						Send
					</button>
				</span>
				<span className="muted" id="support-control-state" style={{ marginLeft: 8 }}>
					{control ? "Control allowed" : "Control off"}
					{!control && (
						<>
							{" · "}
							<button type="button" className="sk-link" onClick={() => sendCommand({ k: "ask", what: "control" })}>
								Ask to control
							</button>
						</>
					)}
					{control && (
						<>
							{" · "}
							<button type="button" className="sk-link" onClick={() => sendCommand({ k: "release" })}>
								Release
							</button>
						</>
					)}
				</span>
			</div>
			{notice && (
				<div role="status" id="support-notice" className="plan-settings-note" style={{ marginBottom: 8 }}>
					{notice}{" "}
					<button type="button" className="sk-link" onClick={clearNotice}>
						Dismiss
					</button>
				</div>
			)}
			<div style={{ position: "relative", width: w, maxWidth: "100%", height: h, background: "#fff", border: "1px solid var(--ui-line)", overflow: "hidden" }}>
				<div ref={host} style={{ position: "absolute", left: 0, top: 0, width: w, height: h }} />
				<canvas ref={canvas} width={w} height={h} id="support-draw" style={{ position: "absolute", left: 0, top: 0, width: w, height: h, cursor: tool === "pointer" ? "pointer" : "crosshair", touchAction: "none" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={leave} />
				{field && (
					<input
						autoFocus
						className="input"
						style={{ position: "absolute", left: Math.min(field.x * w, w - 220), top: Math.min(field.y * h, h - 44), width: 210 }}
						placeholder="Type into their field, press Enter"
						maxLength={200}
						value={field.value}
						onChange={(e) => setField({ ...field, value: e.target.value })}
						onKeyDown={(e) => (e.key === "Enter" ? sendField() : e.key === "Escape" && setField(null))}
						onBlur={sendField}
					/>
				)}
				{note && (
					<input
						autoFocus
						className="input"
						style={{ position: "absolute", left: Math.min(note.x * w, w - 220), top: Math.min(note.y * h, h - 44), width: 210 }}
						placeholder="Type a note, press Enter"
						maxLength={120}
						value={note.text}
						onChange={(e) => setNote({ ...note, text: e.target.value })}
						onKeyDown={(e) => (e.key === "Enter" ? sendNote() : e.key === "Escape" && setNote(null))}
						onBlur={sendNote}
					/>
				)}
			</div>
		</>
	);
}

export function SupportViewer({ onClose, standalone = false }) {
	const s = useSupportViewer();
	const [code, setCode] = useState("");
	const busy = s.status === "joining" || s.status === "connecting";
	const close = () => (endViewer(), onClose());
	return (
		<div className="panel" id="support-viewer" style={{ marginBottom: 16 }}>
			<div className="panel-head">
				<div>
					<div className="panel-title">Live support</div>
					<div className="muted">{s.status === "live" ? `Connected to ${s.business || "the client"}. Everything you draw appears on their screen. Control and redirects always need their yes.` : "Ask the client for the 6-digit code from Settings > Plan & Support > Live support."}</div>
				</div>
				{(!standalone || s.status === "live" || s.status === "reconnecting") && (
					<button type="button" className="btn out" onClick={close}>
						{s.status === "live" || s.status === "reconnecting" ? "End session" : "Close"}
					</button>
				)}
			</div>
			<div className="modal-body">
				{(s.status === "idle" || s.status === "error" || s.status === "ended" || busy) && s.status !== "reconnecting" && (
					<form
						className="tools"
						onSubmit={(e) => {
							e.preventDefault();
							resetViewer();
							joinSupport(code);
						}}
					>
						<input className="input" id="support-code-input" inputMode="numeric" autoComplete="off" maxLength={7} placeholder="6-digit code" aria-label="Support code" style={{ maxWidth: 180, letterSpacing: "0.2em", fontSize: 20 }} value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))} />
						<button type="submit" className="btn gold" id="support-join" disabled={busy || code.replace(/\D/g, "").length !== 6}>
							{s.status === "joining" ? "Joining…" : s.status === "connecting" ? "Connecting…" : "Join"}
						</button>
					</form>
				)}
				{s.status === "ended" && <p className="muted">{s.error || "The session has ended."}</p>}
				{s.status === "error" && (
					<p className="ceylo-error" role="alert">
						{s.error}
					</p>
				)}
				{s.status === "connecting" && <p className="muted">Waiting for the client's screen to connect…</p>}
				{s.status === "reconnecting" && (
					<p className="plan-settings-note" role="status" id="support-reconnecting">
						The client's connection dropped. Waiting for it to come back (up to 2 minutes). Control has to be allowed again afterwards.
					</p>
				)}
				{s.status === "live" && s.link && (
					<p className="muted" id="support-link" style={{ marginTop: 0 }}>
						Connection: {linkLabel(s.link)}
					</p>
				)}
				{s.status === "live" && <Stage control={s.control} notice={s.notice} />}
			</div>
		</div>
	);
}
