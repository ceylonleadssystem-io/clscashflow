/**
 * Settings > Plan & Support > Live support: the client gets a one-time 6-digit code and reads it to Ceylonry Support. Support then sees this POS
 * page live and can point, highlight and draw on it. Nothing connects until the client creates the code, and the session ends from the banner at any time.
 */
import { useEffect, useState } from "react";
import { Panel } from "../ui";
import { isAppwrite } from "../../config/env";
import { endSupport, resetSupport, startSupport, useSupport } from "../../services/supportLive";

const spaced = (code) => String(code || "").replace(/^(\d{3})(\d{3})$/, "$1 $2");

function useCountdown(until, on) {
	const [left, setLeft] = useState(0);
	useEffect(() => {
		if (!on) return undefined;
		const tick = () => setLeft(Math.max(0, Math.round((Date.parse(until) - Date.now()) / 1000)));
		tick();
		const t = setInterval(tick, 1000);
		return () => clearInterval(t);
	}, [until, on]);
	return left;
}

export function LiveSupportPanel() {
	const s = useSupport();
	const left = useCountdown(s.expiresAt, s.status === "waiting");
	if (!isAppwrite()) return null;
	const mm = String(Math.floor(left / 60)).padStart(1, "0") + ":" + String(left % 60).padStart(2, "0");
	return (
		<Panel title="Live support" subtitle="Let Ceylonry Support see this screen and guide you, with a code only you can give.">
			<div className="modal-body" id="live-support">
				{(s.status === "idle" || s.status === "ended" || s.status === "error") && (
					<>
						{s.status === "ended" && <p className="muted">{s.error || "The support session has ended."}</p>}
						{s.status === "error" && (
							<p className="ceylo-error" role="alert">
								{s.error}
							</p>
						)}
						<ol className="muted" style={{ paddingLeft: 18, margin: "0 0 12px" }}>
							<li>Click Get support code and read the 6 digits to support.</li>
							<li>Support joins and can see this POS screen. Typed text, PINs and passwords are hidden from them.</li>
							<li>They can point, highlight and write notes on your screen. You stay in charge: End session stops it at any time.</li>
						</ol>
						<button className="btn gold" type="button" id="live-support-start" onClick={() => (resetSupport(), startSupport())}>
							Get support code
						</button>
					</>
				)}
				{s.status === "creating" && <p className="muted">Getting a code…</p>}
				{s.status === "waiting" && (
					<>
						<div className="label">Your support code</div>
						<div className="plan-settings-price" id="live-support-code" style={{ letterSpacing: "0.15em" }}>
							{spaced(s.code)}
						</div>
						<p className="muted">Read this code to Ceylonry Support. It works once and expires in {mm}.</p>
						<button className="btn out" type="button" onClick={endSupport}>
							Cancel
						</button>
					</>
				)}
				{s.status === "connecting" && <p className="muted">Support is joining…</p>}
				{s.status === "live" && (
					<>
						<p>
							<strong>Ceylonry Support can see this screen.</strong> They can point and draw on it. Typed text, PINs and passwords are hidden from them.
						</p>
						<button className="btn danger" type="button" onClick={endSupport}>
							End session
						</button>
					</>
				)}
			</div>
		</Panel>
	);
}
