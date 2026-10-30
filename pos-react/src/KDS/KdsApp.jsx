/**
 * The Kitchen Display page (/KDS): shows the pairing code until a POS is paired, then a live board of the prep tickets the POS sends
 * over the local Wi-Fi (new / preparing / ready). Tickets are kept in this device's storage, so a reload loses nothing.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { KDS_COLUMNS, ageLabel, ageMinutes, kdsStatus, kdsTickets, nextStatus, prevStatus, recentDone, urgency } from "./kds";
import { readJson, writeJson } from "./net";
import { hostKds } from "./peer";
import "./kds.css";

const STORE = "kds.tickets";
const KEEP_MS = 12 * 3600 * 1000;

function beep() {
	try {
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const osc = ctx.createOscillator();
		osc.connect(ctx.destination);
		osc.frequency.value = 880;
		osc.start();
		osc.stop(ctx.currentTime + 0.25);
		osc.onended = () => ctx.close();
	} catch {
		/* audio not allowed yet: the board still updates */
	}
}

export function KdsApp() {
	const [tickets, setTickets] = useState(() => readJson(STORE, []).filter((t) => Date.now() - new Date(t.createdAt).getTime() < KEEP_MS));
	const [link, setLink] = useState({ phase: "pairing", code: "" });
	const [business, setBusiness] = useState("");
	const [now, setNow] = useState(Date.now());
	const [sound, setSound] = useState(true);
	const [showDone, setShowDone] = useState(false);
	const host = useRef(null);
	const soundRef = useRef(sound);
	soundRef.current = sound;

	useEffect(() => writeJson(STORE, tickets), [tickets]);
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 30000);
		return () => clearInterval(id);
	}, []);
	useEffect(() => {
		const h = hostKds({
			onState: setLink,
			onMessage: (msg) => {
				if (msg.type === "hello") setBusiness(msg.business || "");
				if (msg.type !== "ticket" || !msg.ticket?.id) return;
				h.send({ type: "ack", id: msg.ticket.id });
				setTickets((list) => {
					if (list.some((t) => t.id === msg.ticket.id)) return list;
					if (soundRef.current) beep();
					return [...list, { ...msg.ticket, destination: "KDS", status: "new" }];
				});
			},
		});
		host.current = h;
		return () => h.stop();
	}, []);

	const open = useMemo(() => kdsTickets(tickets, ""), [tickets]);
	const done = useMemo(() => recentDone(tickets), [tickets]);
	const move = (t, status) => {
		setTickets((list) => list.map((x) => (x.id === t.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)));
		host.current?.send({ type: "status", id: t.id, status });
	};
	const unpair = () => {
		if (window.confirm("Disconnect this screen from its POS? You will need a new pairing code.")) host.current?.unpair();
	};

	if (link.phase === "pairing")
		return (
			<main className="kds-pair">
				<h1>Kitchen Display</h1>
				<p>On the POS open Settings → Printing → Kitchen Display and enter this code. Both devices must be on the same Wi-Fi.</p>
				<div className="kds-code" aria-live="polite">{link.code ? link.code.replace(/(\d{3})(\d{3})/, "$1 $2") : "…"}</div>
				{link.error && <p role="alert">{link.error}</p>}
			</main>
		);

	const card = (t) => {
		const status = kdsStatus(t);
		const mins = ageMinutes(t, now);
		const next = nextStatus(status);
		const back = prevStatus(status);
		const col = KDS_COLUMNS.find((c) => c.status === status);
		return (
			<article key={t.id} className={"kds-card " + (status === "ready" ? "" : urgency(mins))} aria-label={"Ticket " + t.orderNumber}>
				<div className="kds-head">
					<span>{t.orderNumber}</span>
					<span>{ageLabel(mins)}</span>
				</div>
				{t.station && t.station !== "Kitchen Display" && <div className="kds-station">{t.station}</div>}
				{t.reference && <div className="kds-ref">{t.reference}</div>}
				{(t.lines || [])
					.filter((l) => !l.isDiscount && !l.isServiceCharge)
					.map((l, i) => (
						<div className="kds-item" key={i}>
							{l.qty} × {l.name}
							{(l.modifiers || []).map((m, j) => (
								<span key={j}>
									• {m.groupName ? m.groupName + ": " : ""}{m.optionName}
								</span>
							))}
						</div>
					))}
				<div className="kds-actions">
					{back && (
						<button className="btn out" onClick={() => move(t, back)} aria-label="Move back one step">
							↩
						</button>
					)}
					{next && col && (
						<button className="btn" onClick={() => move(t, next)}>
							{col.action}
						</button>
					)}
				</div>
			</article>
		);
	};

	return (
		<main className="kds-page">
			<div className="kds-bar">
				<strong>
					Kitchen Display{business ? " · " + business : ""} · {open.length} open
				</strong>
				<div className="kds-actions">
					<span className={"kds-conn " + (link.phase === "connected" ? "on" : "off")} role="status">
						{link.phase === "connected" ? "● Connected to POS" : "○ POS not connected, reconnecting…"}
					</span>
					<button className="btn out" onClick={() => setSound((s) => !s)} aria-pressed={sound}>
						{sound ? "🔔 Sound on" : "🔕 Sound off"}
					</button>
					<button className="btn out" onClick={() => setShowDone((s) => !s)} aria-pressed={showDone}>
						Recall done
					</button>
					<button className="btn out" onClick={unpair}>
						Unpair
					</button>
				</div>
			</div>
			{showDone && (
				<div className="kds-list" style={{ marginBottom: 12 }}>
					{done.length ? (
						done.map((t) => (
							<div className="kds-card" key={t.id}>
								<div className="kds-head">
									<span>{t.orderNumber}</span>
									<button className="btn out" onClick={() => move(t, "ready")}>
										Recall
									</button>
								</div>
							</div>
						))
					) : (
						<div className="kds-empty">No finished tickets to recall.</div>
					)}
				</div>
			)}
			<div className="kds-board">
				{KDS_COLUMNS.map((c) => {
					const list = open.filter((t) => kdsStatus(t) === c.status);
					return (
						<section className="kds-col" key={c.status} aria-label={c.label}>
							<h3>
								<span>{c.label}</span>
								<span>{list.length}</span>
							</h3>
							<div className="kds-list">{list.length ? list.map(card) : <div className="kds-empty">Nothing here</div>}</div>
						</section>
					);
				})}
			</div>
		</main>
	);
}
