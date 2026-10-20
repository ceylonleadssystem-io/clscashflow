/**
 * Ceylo, the setup checker: the top-bar button (orange dot when something needs attention) and the panel with the report.
 * The checks are domain/ceylo.js; this file only gathers what is already loaded and shows the result. Read-only:
 * each fix button only opens the screen where the person makes the change.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { runSetupChecks, summarize } from "../../domain/ceylo";
import { subscriptionOf } from "../../config/subscription";
import { FULL_SETTINGS_ROLES } from "../../config/roles";
import { useData } from "../../store/DataProvider";
import { useFeatures } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { kdsLink } from "../../KDS/link";
import { openSettingsTab } from "../../store/settingsTab";

const EYES = {
	ready: (
		<g fill="var(--ui-accent)">
			<rect x="40" y="53" width="12" height="16" rx="6" />
			<rect x="68" y="53" width="12" height="16" rx="6" />
		</g>
	),
	glad: (
		<g stroke="var(--ui-accent)" strokeWidth="5" fill="none" strokeLinecap="round">
			<path d="M39 64 Q46 54 53 64" />
			<path d="M67 64 Q74 54 81 64" />
		</g>
	),
	alert: (
		<g fill="var(--ui-warning, #e99a18)">
			<rect x="40" y="51" width="12" height="19" rx="6" />
			<rect x="68" y="51" width="12" height="19" rx="6" />
		</g>
	),
};

/** Ceylo's face: dark head, visor eyes (the mood), tea-leaf antenna. */
export function CeyloMascot({ mood = "ready", size = 32 }) {
	return (
		<svg className="ceylo-mascot" viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
			<path d="M60 22 C60 14 64 8 72 6 C72 14 68 20 60 22Z" fill="#2f9b5a" />
			<path d="M60 22 L60 30" stroke="#2f9b5a" strokeWidth="3" strokeLinecap="round" />
			<rect x="18" y="30" width="84" height="72" rx="26" fill="#111920" />
			<rect x="28" y="44" width="64" height="34" rx="15" fill="#1b252d" />
			<circle cx="12" cy="66" r="7" fill="#111920" />
			<circle cx="108" cy="66" r="7" fill="#111920" />
			<path d="M50 90 Q60 95 70 90" stroke="#c6ced4" strokeWidth="3" fill="none" strokeLinecap="round" />
			{EYES[mood] || EYES.ready}
		</svg>
	);
}

/** Runs the checks on the data already in memory; re-runs by itself whenever settings, data, sync or KDS state change. */
function useSetupChecks() {
	const data = useData();
	const { enabled } = useFeatures();
	const { cloudStatus, billing, authKind } = useSession();
	const [kds, setKds] = useState(kdsLink.state());
	useEffect(() => kdsLink.subscribe(setKds), []);
	return useMemo(
		() =>
			runSetupChecks({
				settings: data.settings,
				users: data.users,
				locations: data.locations,
				products: data.products,
				features: enabled,
				subscription: subscriptionOf(data.settings),
				billingProfile: billing?.profile || null,
				cloud: authKind === "appwrite",
				cloudState: cloudStatus?.state || "",
				kds,
			}),
		[data.settings, data.users, data.locations, data.products, enabled, billing, authKind, cloudStatus?.state, kds],
	);
}

/** Top-bar button. Shows an orange dot when a check finds a problem or warning. */
export function CeyloButton() {
	const { setLayout } = usePos();
	const sum = summarize(useSetupChecks());
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

function Item({ r, onFix, canFix }) {
	return (
		<li className={"ceylo-item is-" + r.status}>
			<span className="ceylo-status" aria-hidden="true">{DOT[r.status]}</span>
			<div className="ceylo-item-copy">
				<b>{r.title}</b>
				{r.text && r.status !== "ok" && <p>{r.text}</p>}
			</div>
			{canFix && r.fix && r.status !== "ok" && (
				<button type="button" className="btn out ceylo-fix" onClick={() => onFix(r.fix)}>
					Fix
				</button>
			)}
		</li>
	);
}

/** The report panel: side panel on wide screens, full screen on phones. Cashiers see a short summary without fix buttons. */
export function CeyloPanel() {
	const { layout, setLayout, go, currentUser } = usePos();
	const results = useSetupChecks();
	const [showPassed, setShowPassed] = useState(false);
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
	const sum = summarize(results);
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
					<CeyloMascot mood={attention ? "alert" : "glad"} size={44} />
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
									<ul className="ceylo-list">{sum.problems.map((r) => <Item key={r.id} r={r} onFix={fix} canFix />)}</ul>
								</section>
							)}
							{sum.warnings.length > 0 && (
								<section aria-label="Warnings">
									<h3>Warnings</h3>
									<ul className="ceylo-list">{sum.warnings.map((r) => <Item key={r.id} r={r} onFix={fix} canFix />)}</ul>
								</section>
							)}
							<section aria-label="Passed">
								<button type="button" className="ceylo-toggle" aria-expanded={showPassed} onClick={() => setShowPassed((v) => !v)}>
									{showPassed ? "Hide" : "Show"} {sum.passed.length} passed check{sum.passed.length === 1 ? "" : "s"}
								</button>
								{showPassed && <ul className="ceylo-list">{sum.passed.map((r) => <Item key={r.id} r={r} />)}</ul>}
							</section>
						</>
					)}
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
