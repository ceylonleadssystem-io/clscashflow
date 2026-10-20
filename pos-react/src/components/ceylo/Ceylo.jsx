/**
 * Ceylo, the setup checker: the top-bar button (orange dot when something needs attention) and the panel with the report.
 * The checks are domain/ceylo.js; this file only gathers what is already loaded and shows the result. Read-only:
 * each fix button only opens the screen where the person makes the change.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { runSetupChecks, summarize } from "../../domain/ceylo";
import { FULL_SETTINGS_ROLES } from "../../config/roles";
import { useData } from "../../store/DataProvider";
import { useFeatures } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { kdsLink } from "../../KDS/link";
import { receiptPrinter } from "../../services/printing/receiptPrinter";
import { labelPrinter } from "../../services/printing/labelPrinter";
import { barcodeScanner } from "../../services/printing/scanner";
import { openSettingsTab } from "../../store/settingsTab";
import { askCeylo, checksForAi } from "../../services/ceyloAi";
import { useFeature } from "../../store/FeatureProvider";

// each mood is [left eye, right eye] so a single eye can wink
const EYES = {
	ready: [<rect key="l" x="40" y="53" width="12" height="16" rx="6" fill="var(--ui-accent)" />, <rect key="r" x="68" y="53" width="12" height="16" rx="6" fill="var(--ui-accent)" />],
	glad: [
		<path key="l" d="M39 64 Q46 54 53 64" stroke="var(--ui-accent)" strokeWidth="5" fill="none" strokeLinecap="round" />,
		<path key="r" d="M67 64 Q74 54 81 64" stroke="var(--ui-accent)" strokeWidth="5" fill="none" strokeLinecap="round" />,
	],
	think: [<rect key="l" x="40" y="58" width="12" height="7" rx="3.5" fill="var(--ui-accent)" />, <rect key="r" x="68" y="54" width="12" height="13" rx="6" fill="var(--ui-accent)" />],
	alert: [<rect key="l" x="40" y="51" width="12" height="19" rx="6" fill="var(--ui-warning, #e99a18)" />, <rect key="r" x="68" y="51" width="12" height="19" rx="6" fill="var(--ui-warning, #e99a18)" />],
};

/** Little things Ceylo does now and then while idle. Each is a CSS animation named after it (see app.css, "Ceylo idle moves"). */
const MOVES = ["wink", "look", "hop", "nod", "wiggle", "blink2"];
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Picks a random idle move every 7-15 s (never while thinking, never with reduced motion). */
function useIdleMove(active) {
	const [move, setMove] = useState("");
	useEffect(() => {
		if (!active || reducedMotion()) return;
		let timer;
		const next = () => {
			timer = setTimeout(() => {
				setMove(MOVES[Math.floor(Math.random() * MOVES.length)]);
				timer = setTimeout(() => {
					setMove("");
					next();
				}, 1600);
			}, 7000 + Math.random() * 8000);
		};
		next();
		return () => clearTimeout(timer);
	}, [active]);
	return move;
}

/** Ceylo's face: dark head, visor eyes (the mood), tea-leaf antenna. Subtle CSS motion: the leaf sways, the eyes blink, the head bobs
 * while thinking, and every few seconds Ceylo does a small idle move (wink, look around, hop, nod, leaf wiggle, double blink). */
export function CeyloMascot({ mood = "ready", size = 32 }) {
	const move = useIdleMove(mood !== "think");
	const [left, right] = EYES[mood] || EYES.ready;
	return (
		<svg className={"ceylo-mascot is-" + mood + (move ? " do-" + move : "")} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
			<g className="ceylo-leaf">
				<path d="M60 22 C60 14 64 8 72 6 C72 14 68 20 60 22Z" fill="#2f9b5a" />
				<path d="M60 22 L60 30" stroke="#2f9b5a" strokeWidth="3" strokeLinecap="round" />
			</g>
			<rect x="18" y="30" width="84" height="72" rx="26" fill="#111920" />
			<rect x="28" y="44" width="64" height="34" rx="15" fill="#1b252d" />
			<circle cx="12" cy="66" r="7" fill="#111920" />
			<circle cx="108" cy="66" r="7" fill="#111920" />
			<path d="M50 90 Q60 95 70 90" stroke="#c6ced4" strokeWidth="3" fill="none" strokeLinecap="round" />
			<g className="ceylo-eyes">
				<g className="ceylo-eye-l">{left}</g>
				<g className="ceylo-eye-r">{right}</g>
			</g>
		</svg>
	);
}

/** Runs the checks on the data already in memory; re-runs by itself whenever settings, data, sync or KDS state change. */
function useSetupChecks() {
	const data = useData();
	const { enabled } = useFeatures();
	const { cloudStatus, authKind } = useSession();
	const { locationId } = usePos();
	const [kds, setKds] = useState(kdsLink.state());
	useEffect(() => kdsLink.subscribe(setKds), []);
	const [receipt, setReceipt] = useState(receiptPrinter.status.connected);
	const [label, setLabel] = useState(labelPrinter.status.connected);
	const [scanner, setScanner] = useState(() => ({ connected: barcodeScanner.status.connected, lastScanAt: barcodeScanner.lastScanAt }));
	useEffect(() => {
		const subs = [
			receiptPrinter.subscribe((st) => setReceipt(!!st.connected)),
			labelPrinter.subscribe((st) => setLabel(!!st.connected)),
			barcodeScanner.subscribe((st) => setScanner({ connected: !!st.connected, lastScanAt: barcodeScanner.lastScanAt })),
		];
		return () => subs.forEach((u) => u?.());
	}, []);
	return useMemo(
		() =>
			runSetupChecks({
				settings: data.settings,
				users: data.users,
				locations: data.locations,
				products: data.products,
				features: enabled,
				cloud: authKind === "appwrite",
				cloudState: cloudStatus?.state || "",
				kds,
				printers: { receipt, label },
				scanner,
				customers: data.customers,
				inventory: data.inventory,
				modifiers: data.modifiers,
				openOrders: data.openOrders,
				timeEntries: data.timeEntries,
				cashShifts: data.cashShifts,
				locationId,
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[data.settings, data.users, data.locations, data.products, data.customers, data.inventory, data.modifiers, data.openOrders, data.timeEntries, data.cashShifts, locationId, enabled, authKind, cloudStatus?.state, kds, receipt, label, scanner],
	);
}

/** Check ids the business chose to ignore (kept in the synced settings, so every device agrees) and a toggle to change them. */
function useIgnored() {
	const list = useData().settings.ceyloIgnored;
	const { svc } = usePos();
	const ignored = Array.isArray(list) ? list : [];
	const set = (id, on) => svc.settings.patchSettings({ ceyloIgnored: on ? [...new Set([...ignored, id])] : ignored.filter((x) => x !== id) });
	return [ignored, set];
}

/** Top-bar button. Shows an orange dot when a check finds a problem or warning that is not ignored. */
export function CeyloButton() {
	const { setLayout } = usePos();
	const [ignored] = useIgnored();
	const sum = summarize(useSetupChecks(), ignored);
	const open = sum.problems.length + sum.warnings.length;
	return (
		<button
			type="button"
			id="ceylo-button"
			className="btn out ceylo-button"
			aria-label={open ? `Ceylo setup checker: ${open} thing${open === 1 ? "" : "s"} need attention` : "Ceylo setup checker: everything in order"}
			onClick={() => setLayout((l) => ({ ...l, ceyloOpen: true }))}
		>
			<CeyloMascot mood={open ? "alert" : "ready"} size={24} />
			<span className="ceylo-button-label">Ceylo</span>
			{open > 0 && <i className="ceylo-dot" aria-hidden="true" />}
		</button>
	);
}

const DOT = { ok: "✓", warn: "!", problem: "!" };

function Item({ r, onFix, canFix, onIgnore, onRestore }) {
	return (
		<li className={"ceylo-item is-" + r.status + (onRestore ? " is-ignored" : "")}>
			<span className="ceylo-status" aria-hidden="true">{DOT[r.status]}</span>
			<div className="ceylo-item-copy">
				<b>{r.title}</b>
				{r.text && r.status !== "ok" && <p>{r.text}</p>}
			</div>
			{(canFix || onIgnore || onRestore) && (
				<div className="ceylo-actions">
					{canFix && r.fix && r.status !== "ok" && (
						<button type="button" className="btn out ceylo-fix" onClick={() => onFix(r.fix)}>
							Fix
						</button>
					)}
					{onIgnore && (
						<button type="button" className="ceylo-ignore" onClick={() => onIgnore(r.id)} aria-label={"Ignore: " + r.title}>
							Ignore
						</button>
					)}
					{onRestore && (
						<button type="button" className="ceylo-ignore" onClick={() => onRestore(r.id)} aria-label={"Stop ignoring: " + r.title}>
							Restore
						</button>
					)}
				</div>
			)}
		</li>
	);
}

const SUGGESTIONS = ["How do I fix the first problem?", "What should I set up first?", "Why didn't the receipt print?"];

/** Ask Ceylo: a short chat answered by Claude from the check results. The thread lives only in this panel. */
function AskCeylo({ results, ignored, role, view, locationId, onThinking }) {
	const [thread, setThread] = useState([]); // [{ role: "user" | "assistant", text }]
	const [q, setQ] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const endRef = useRef(null);
	useEffect(() => {
		endRef.current?.scrollIntoView?.({ block: "nearest" });
	}, [thread, busy]);
	const ask = async (question) => {
		const text = question.trim();
		if (!text || busy) return;
		setError("");
		setQ("");
		const history = thread.slice(-6);
		setThread((t) => [...t, { role: "user", text }]);
		setBusy(true);
		onThinking(true);
		try {
			const answer = await askCeylo({ question: text, history, checks: checksForAi(results, ignored), role, view, locationId });
			setThread((t) => [...t, { role: "assistant", text: answer }]);
		} catch (e) {
			setError(e.message);
		} finally {
			setBusy(false);
			onThinking(false);
		}
	};
	return (
		<section className="ceylo-ask" aria-label="Ask Ceylo">
			<h3>Ask Ceylo</h3>
			{!thread.length && (
				<div className="ceylo-suggest">
					{SUGGESTIONS.map((s) => (
						<button key={s} type="button" className="chip" onClick={() => ask(s)} disabled={busy}>
							{s}
						</button>
					))}
				</div>
			)}
			<div className="ceylo-thread" aria-live="polite">
				{thread.map((m, i) => (
					<p key={i} className={"ceylo-bubble is-" + m.role}>
						{m.text}
					</p>
				))}
				{busy && (
					<p className="ceylo-bubble is-assistant ceylo-typing" aria-label="Ceylo is thinking">
						<i />
						<i />
						<i />
					</p>
				)}
				{error && (
					<p className="ceylo-error" role="alert">
						{error}
					</p>
				)}
				<span ref={endRef} />
			</div>
			<form
				className="ceylo-ask-form"
				onSubmit={(e) => {
					e.preventDefault();
					ask(q);
				}}
			>
				<label htmlFor="ceylo-question" className="sr-only">
					Ask Ceylo a question
				</label>
				<input id="ceylo-question" className="input" maxLength={600} placeholder="Ask about your setup…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
				<button type="submit" className="btn gold" disabled={busy || !q.trim()}>
					Ask
				</button>
			</form>
			<small className="ceylo-ai-note">Answers are written by AI from your setup checks and can be wrong. Never type PINs or passwords.</small>
		</section>
	);
}

/** The report panel: side panel on wide screens, full screen on phones. Cashiers see a short summary without fix buttons. */
export function CeyloPanel() {
	const { layout, setLayout, go, currentUser, view, locationId } = usePos();
	const aiOn = useFeature("settings.ceyloAi");
	const [thinking, setThinking] = useState(false);
	const results = useSetupChecks();
	const [showPassed, setShowPassed] = useState(false);
	const [showIgnored, setShowIgnored] = useState(false);
	const [ignored, setIgnored] = useIgnored();
	const [checkedAt, setCheckedAt] = useState(() => new Date());
	const closeRef = useRef(null);
	const open = !!layout.ceyloOpen;
	const close = () => setLayout((l) => ({ ...l, ceyloOpen: false }));
	useEffect(() => {
		if (!open) return;
		setCheckedAt(new Date());
		closeRef.current?.focus();
		const onKey = (e) => e.key === "Escape" && close();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);
	if (!open) return null;
	const sum = summarize(results, ignored);
	const ignore = (id) => setIgnored(id, true);
	const restore = (id) => setIgnored(id, false);
	const manager = FULL_SETTINGS_ROLES.includes(currentUser?.role);
	const attention = sum.problems.length + sum.warnings.length;
	const fix = (target) => {
		close();
		if (target.tab) openSettingsTab(target.tab);
		go(target.view);
	};
	const headline = !attention ? "You're ready to trade" : `${attention} thing${attention === 1 ? "" : "s"} need${attention === 1 ? "s" : ""} your attention`;
	return (
		<div className="ceylo-layer" onClick={(e) => e.target === e.currentTarget && close()}>
			<aside className="ceylo-panel" id="ceylo-panel" role="dialog" aria-modal="true" aria-labelledby="ceylo-title">
				<header className="ceylo-head">
					<CeyloMascot mood={thinking ? "think" : attention ? "alert" : "glad"} size={44} />
					<div>
						<b id="ceylo-title">{headline}</b>
						<small>
							Checked {sum.checked} settings · {checkedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
						</small>
					</div>
					<button type="button" className="ceylo-close" aria-label="Close Ceylo" ref={closeRef} onClick={close}>
						×
					</button>
				</header>
				<div className="ceylo-body">
					{!manager ? (
						<p className="ceylo-msg">{attention ? "Some settings need a manager. Ask your manager or the owner to open Ceylo." : "Everything is set up. You're good to go."}</p>
					) : (
						<>
							<p className="ceylo-msg">
								{attention ? "I checked your setup. Problems stop something from working; warnings work today but may cause trouble." : `All ${sum.checked} checks passed. I'll keep an eye on it and show an orange dot if something changes.`}
							</p>
							<div className="ceylo-pills" aria-label="Summary">
								<span className="ceylo-pill is-problem">{sum.problems.length} problem{sum.problems.length === 1 ? "" : "s"}</span>
								<span className="ceylo-pill is-warn">{sum.warnings.length} warning{sum.warnings.length === 1 ? "" : "s"}</span>
								<span className="ceylo-pill is-ok">{sum.passed.length} passed</span>
							</div>
							{sum.problems.length > 0 && (
								<section aria-label="Problems">
									<h3>Problems</h3>
									<ul className="ceylo-list">{sum.problems.map((r) => <Item key={r.id} r={r} onFix={fix} canFix onIgnore={ignore} />)}</ul>
								</section>
							)}
							{sum.warnings.length > 0 && (
								<section aria-label="Warnings">
									<h3>Warnings</h3>
									<ul className="ceylo-list">{sum.warnings.map((r) => <Item key={r.id} r={r} onFix={fix} canFix onIgnore={ignore} />)}</ul>
								</section>
							)}
							<section aria-label="Passed">
								<button type="button" className="ceylo-toggle" aria-expanded={showPassed} onClick={() => setShowPassed((v) => !v)}>
									{showPassed ? "Hide" : "Show"} {sum.passed.length} passed check{sum.passed.length === 1 ? "" : "s"}
								</button>
								{showPassed && <ul className="ceylo-list">{sum.passed.map((r) => <Item key={r.id} r={r} />)}</ul>}
							</section>
							{sum.ignored.length > 0 && (
								<section aria-label="Ignored">
									<button type="button" className="ceylo-toggle" id="ceylo-show-ignored" aria-expanded={showIgnored} onClick={() => setShowIgnored((v) => !v)}>
										{showIgnored ? "Hide" : "Show"} {sum.ignored.length} ignored check{sum.ignored.length === 1 ? "" : "s"}
									</button>
									{showIgnored && <ul className="ceylo-list">{sum.ignored.map((r) => <Item key={r.id} r={r} onFix={fix} canFix onRestore={restore} />)}</ul>}
								</section>
							)}
						</>
					)}
					{aiOn && <AskCeylo results={results} ignored={ignored} role={currentUser?.role || ""} view={view} locationId={locationId} onThinking={setThinking} />}
				</div>
				<footer className="ceylo-foot">
					<button type="button" className="btn out" onClick={close}>
						Close
					</button>
					<button type="button" className="btn gold" onClick={() => setCheckedAt(new Date())}>
						Check again
					</button>
				</footer>
			</aside>
		</div>
	);
}
