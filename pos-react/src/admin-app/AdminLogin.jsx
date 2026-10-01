import { useState } from "react";
import { env } from "../config/env";
import { DEV_ADMIN } from "./localAdmin";

/** Administrative sign-in (separate from the business / staff login of the POS). */
export function AdminLogin({ onSignIn, error, busy }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [show, setShow] = useState(false);
	const submit = () => onSignIn(email.trim().toLowerCase(), password);
	return (
		<div className="admin-login">
			<div className="admin-login-card">
				<div className="admin-brand">
					Ceylonry<span>POS</span>
				</div>
				<div className="admin-badge">Administration</div>
				<h1>Administrator sign in</h1>
				<p className="muted">Restricted area.</p>
				{env.authProvider === "local" && (
					<div className="print-note">
						Local dev instance. Email: <strong>{DEV_ADMIN.email}</strong> · Password: <strong>{DEV_ADMIN.password}</strong>
					</div>
				)}
				<div className="field">
					<label>Administrator email</label>
					<input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
				</div>
				<div className="field">
					<label>Password</label>
					<div className="account-password-wrap">
						<input className="input" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
						<button className="account-password-toggle" type="button" onClick={() => setShow((s) => !s)}>
							{show ? "Hide" : "Show"}
						</button>
					</div>
				</div>
				<button className="btn gold" style={{ width: "100%", marginTop: 14 }} disabled={busy || !email || !password} onClick={submit}>
					{busy ? "Signing in…" : "Sign in to Administration"}
				</button>
				{error && <div className="login-error" style={{ display: "block" }}>{error}</div>}
				<a className="account-home" href={env.basePath} style={{ display: "block", marginTop: 16 }}>
					← POS business sign in
				</a>
			</div>
		</div>
	);
}
