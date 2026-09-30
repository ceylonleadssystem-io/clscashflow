import { useState } from "react";
import { env } from "../config/env";
import { useSession } from "../store/SessionProvider";

/** Business account sign-in (Appwrite) or local owner login (offline/dev provider). */
export function BusinessGate() {
	const { authKind, auth, authError, setAuthError, signIn, register, resetPassword, phase } = useSession();
	const local = authKind === "local";
	const hasAccount = auth.hasAccount();
	const [email, setEmail] = useState(local && hasAccount ? auth.accountEmail?.() || "" : "");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState(false);
	const developer = email.trim().toLowerCase() === env.developerEmail;
	const creating = local && !hasAccount;
	const busy = phase === "activating" || authError === "Signing in securely…";

	const submit = async () => {
		const mail = email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setAuthError("Enter a valid business email.");
		if (password.length < 8) return setAuthError("Password must contain at least 8 characters.");
		if (creating) {
			if (password !== confirm) return setAuthError("Passwords do not match.");
			return register(mail, password);
		}
		return signIn(mail, password);
	};

	const heading = developer ? "POS developer sign in" : creating ? "Create the main business login" : local ? "Business owner sign in" : "POS business sign in";
	const copy = developer
		? "Sign in to open the separate POS Developer Portal."
		: creating
			? "Set the main email and password for this business. Staff PIN access appears next."
			: local
				? "Sign in with the business email and password before staff access the register."
				: "Enter your business email and password to continue.";

	return (
		<div className="account-gate" id="account-gate">
			<div className="account-card">
				<a className="account-home" href={env.homeUrl}>
					← Back to Home
				</a>
				<h1>
					Ceylonry<span>POS</span>
				</h1>
				<div className="muted">Business account access</div>
				<h2 id="account-heading">{heading}</h2>
				<p className="muted" id="account-copy">
					{copy}
				</p>
				<div className="field">
					<label>Business email</label>
					<input className="input" id="account-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
				</div>
				<div className="field">
					<label>Password</label>
					<div className="account-password-wrap">
						<input
							className="input"
							id="account-password"
							type={show ? "text" : "password"}
							minLength={8}
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && submit()}
						/>
						<button className="account-password-toggle" type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
							{show ? "Hide" : "Show"}
						</button>
					</div>
				</div>
				{creating && (
					<div className="field" id="account-confirm-field">
						<label>Confirm password</label>
						<input className="input" id="account-confirm" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
					</div>
				)}
				<button className="btn gold" id="account-submit" style={{ width: "100%", marginTop: 14 }} onClick={submit} disabled={busy}>
					{busy ? "Signing in…" : creating ? "Create Business Login" : local ? "Sign In" : "Sign In to POS"}
				</button>
				{!local && (
					<button type="button" className="pos-forgot-password" id="pos-forgot-password" onClick={() => resetPassword(email.trim().toLowerCase())}>
						Forgot password?
					</button>
				)}
				<div className="login-error" id="account-error">
					{authError}
				</div>
				{!local && !developer && (
					<div className="pos-auth-note" id="pos-new-account-note">
						New to POS? <a href={env.onboardingUrl}>Start a 15-day POS trial</a> · Your sales are stored on this device if the internet drops and sync when it returns.
					</div>
				)}
				<div className="print-note">After business sign-in, each staff member signs into the POS using their own PIN.</div>
			</div>
		</div>
	);
}
