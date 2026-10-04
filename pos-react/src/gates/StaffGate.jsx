/**
 * Staff PIN gate after business sign-in: staff only type their PIN. The PIN identifies the user (PINs are unique per
 * user, enforced when users are saved) and signs them in as soon as it is complete. The location is no longer chosen
 * here: staffLogin picks the last used location the user is allowed to work at.
 */
import { useMemo, useState } from "react";
import { env } from "../config/env";
import { usePos } from "../store/PosProvider";
import { useData } from "../store/DataProvider";

/** Staff PIN gate: type the PIN to sign in. */
export function StaffGate() {
	const { staffLogin } = usePos();
	const data = useData();
	const [pin, setPin] = useState("");
	const [error, setError] = useState("");
	const [pickId, setPickId] = useState("");

	const activeUsers = useMemo(() => data.users.filter((u) => u.active !== false && u.pin), [data.users]);
	// Normally exactly one user per PIN. Older data may still share a PIN: then (and only then) ask who is signing in.
	const matches = useMemo(() => (pin ? activeUsers.filter((u) => u.pin === pin) : []), [activeUsers, pin]);

	const signIn = async (value, userId) => {
		const found = activeUsers.filter((u) => u.pin === value);
		const user = userId ? found.find((u) => u.id === userId) : found.length === 1 ? found[0] : null;
		if (!user) {
			setError(found.length > 1 ? "More than one user has this PIN. Choose who you are." : "Incorrect PIN.");
			return;
		}
		const message = await staffLogin({ userId: user.id, pin: value, location: "" });
		setError(message);
		if (!message) setPin("");
	};

	const onChange = (raw) => {
		const value = raw.replace(/\D/g, "").slice(0, 6);
		setPin(value);
		setError("");
		setPickId("");
		// Sign in automatically once the typed PIN is exactly one user's PIN, unless a longer PIN could still be
		// meant (e.g. 1234 and 123456 both exist): then Enter / Sign In confirms.
		const exact = activeUsers.filter((u) => u.pin === value);
		const longer = activeUsers.some((u) => u.pin.length > value.length && u.pin.startsWith(value));
		if (value.length >= 4 && exact.length === 1 && !longer) signIn(value);
	};

	return (
		<div className="login-gate" id="login-gate">
			<div className="login-card">
				<a className="account-home" href={env.homeUrl}>
					← Back to Home
				</a>
				<div className="login-brand">
					Ceylonry<span>POS</span>
				</div>
				<div className="muted">Staff access</div>
				<h2>Sign in to the register</h2>
				<div className="field" style={{ marginTop: 10 }}>
					<label>Enter your PIN</label>
					<input
						className="input"
						id="login-pin"
						type="password"
						inputMode="numeric"
						autoComplete="off"
						maxLength={6}
						value={pin}
						onChange={(e) => onChange(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && signIn(pin, pickId)}
						autoFocus
					/>
				</div>
				{matches.length > 1 && (
					<div className="field">
						<label>Who is signing in?</label>
						<select className="input" id="login-user" value={pickId} onChange={(e) => setPickId(e.target.value)}>
							<option value="">Choose your name</option>
							{matches.map((u) => (
								<option key={u.id} value={u.id}>
									{u.name} — {u.role}
								</option>
							))}
						</select>
					</div>
				)}
				<button className="btn gold" style={{ width: "100%", marginTop: 15 }} onClick={() => signIn(pin, pickId)}>
					Sign In
				</button>
				<div className="login-error" id="login-error">
					{error}
				</div>
				<div className="print-note">
					First-time owner PIN: <strong>1234</strong>. Change it under Staff & Shifts.
				</div>
			</div>
		</div>
	);
}
