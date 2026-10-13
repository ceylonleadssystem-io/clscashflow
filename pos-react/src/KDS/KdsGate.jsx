/**
 * Business sign-in for the Kitchen Display: the same account and browser session as the POS, so a device that is already
 * signed in to the POS opens the display straight away. Offline devices skip the check (sign-in needs the network).
 */
import { useEffect, useState } from "react";
import { friendlyAuthError, getAuthService } from "../services/auth.service";

export function KdsGate({ children }) {
	const auth = getAuthService();
	const [user, setUser] = useState(undefined); // undefined = still checking the session
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => auth.onChange(setUser), [auth]);

	if (user === undefined) return <main className="kds-pair"><p>Loading…</p></main>;
	if (user || !navigator.onLine) return children;

	const submit = async (e) => {
		e.preventDefault();
		setBusy(true);
		setError("");
		try {
			await auth.signIn(email.trim().toLowerCase(), password);
		} catch (err) {
			setError(friendlyAuthError(err));
		}
		setBusy(false);
	};

	return (
		<div className="account-gate">
			<form className="account-card" onSubmit={submit}>
				<h1>
					Ceylonry<span>POS</span>
				</h1>
				<div className="muted">Kitchen Display</div>
				<h2>POS business sign in</h2>
				<p className="muted">Use the same business email and password as the POS.</p>
				<div className="field">
					<label htmlFor="kds-email">Business email</label>
					<input className="input" id="kds-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
				</div>
				<div className="field">
					<label htmlFor="kds-password">Password</label>
					<input className="input" id="kds-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
				</div>
				<button className="btn gold" style={{ width: "100%", marginTop: 14 }} disabled={busy}>
					{busy ? "Signing in…" : "Sign In"}
				</button>
				<div className="login-error" role="alert">{error}</div>
			</form>
		</div>
	);
}
