import { useState } from "react";
import { DEFAULT_WELCOME } from "../config/welcome";

export function WelcomeTab({ settings, save, saving }) {
	const current = { ...DEFAULT_WELCOME, ...(settings.welcome || {}) };
	const [w, setW] = useState(current);
	const set = (k) => (e) => setW((v) => ({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
	return (
		<div className="admin-two">
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">First-login message</div>
						<div className="muted">Shown once to every POS user the first time they sign in.</div>
					</div>
				</div>
				<div className="modal-body">
					<label className="muted admin-check">
						<input type="checkbox" checked={w.enabled} onChange={set("enabled")} /> Show the welcome message
					</label>
					<div className="field" style={{ marginTop: 12 }}>
						<label>Title</label>
						<input className="input" value={w.title} onChange={set("title")} maxLength={120} />
					</div>
					<div className="field" style={{ marginTop: 12 }}>
						<label>Message</label>
						<textarea className="input" rows={6} value={w.message} onChange={set("message")} maxLength={1500} />
					</div>
					<div className="tools" style={{ marginTop: 14 }}>
						<button className="btn gold" disabled={saving} onClick={() => save({ welcome: { ...w, showPlans: false, version: current.version } }, "Welcome message updated")}>
							Save message
						</button>
						<button className="btn out" disabled={saving} onClick={() => save({ welcome: { ...w, showPlans: false, version: (Number(current.version) || 1) + 1 } }, "Welcome message re-published to all users")}>
							Save & show again to every user
						</button>
					</div>
					<p className="muted">Version {current.version}. “Show again” raises the version so each user sees the message at their next sign-in.</p>
				</div>
			</div>
			<div className="panel">
				<div className="panel-head">
					<div className="panel-title">Preview</div>
				</div>
				<div className="modal-body">
					<h3 style={{ marginTop: 0 }}>{w.title}</h3>
					<p className="welcome-message">{w.message}</p>
				</div>
			</div>
		</div>
	);
}
