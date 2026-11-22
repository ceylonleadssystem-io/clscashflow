/**
 * Admin portal > Live support: enter the client's 6-digit code, see their POS page live, and point, highlight, draw and write notes on their screen.
 * The page copy is replayed here (rrweb); the drawing tools send small messages that the client's POS draws over its own screen.
 */
import { useEffect, useRef, useState } from "react";
import { COLORS, unit } from "../domain/supportProtocol";
import { applyAnnotation, draw, pruneScene } from "../components/support/drawScene";
import { endViewer, joinSupport, onPageEvent, resetViewer, sendAnnotation, useSupportViewer } from "./supportViewerState";

const TOOLS = [
	{ id: "pointer", label: "Pointer" },
	{ id: "highlighter", label: "Highlighter" },
	{ id: "pen", label: "Pen" },
	{ id: "arrow", label: "Arrow" },
	{ id: "spot", label: "Spotlight" },
	{ id: "note", label: "Note" },
];
const newId = () => Math.random().toString(36).slice(2, 10);

/** The live copy of the client's page with a drawing layer on top. */
function Stage() {
	const host = useRef(null);
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
	const down = (e) => {
		const [x, y] = at(e);
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
			</div>
			<div style={{ position: "relative", width: w, maxWidth: "100%", height: h, background: "#fff", border: "1px solid var(--ui-line)", overflow: "hidden" }}>
				<div ref={host} style={{ position: "absolute", left: 0, top: 0, width: w, height: h }} />
				<canvas ref={canvas} width={w} height={h} id="support-draw" style={{ position: "absolute", left: 0, top: 0, width: w, height: h, cursor: tool === "pointer" ? "pointer" : "crosshair", touchAction: "none" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={leave} />
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

export function SupportViewer({ onClose }) {
	const s = useSupportViewer();
	const [code, setCode] = useState("");
	const busy = s.status === "joining" || s.status === "connecting";
	const close = () => (endViewer(), onClose());
	return (
		<div className="panel" id="support-viewer" style={{ marginBottom: 16 }}>
			<div className="panel-head">
				<div>
					<div className="panel-title">Live support</div>
					<div className="muted">{s.status === "live" ? `Connected to ${s.business || "the client"}. Everything you draw appears on their screen.` : "Ask the client for the 6-digit code from Settings > Plan & Support > Live support."}</div>
				</div>
				<button type="button" className="btn out" onClick={close}>
					{s.status === "live" ? "End session" : "Close"}
				</button>
			</div>
			<div className="modal-body">
				{(s.status === "idle" || s.status === "error" || s.status === "ended" || busy) && (
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
				{s.status === "live" && <Stage />}
			</div>
		</div>
	);
}
