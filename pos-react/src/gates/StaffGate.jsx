/**
 * Staff PIN gate after business sign-in: choose location (when multiple locations are on), user and PIN to open the register.
 */
import { useEffect, useMemo, useState } from "react";
import { env } from "../config/env";
import { usePos } from "../store/PosProvider";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { activeLocations, userLocationIds } from "../services/pos/locations";

/** Staff PIN gate: location, user and PIN. */
export function StaffGate() {
	const { staffLogin } = usePos();
	const data = useData();
	const multi = useFeature("business.locations");
	const locations = useMemo(() => activeLocations(data), [data]);
	const [location, setLocation] = useState("");
	const [userId, setUserId] = useState("");
	const [pin, setPin] = useState("");
	const [error, setError] = useState("");

	const allowedUsers = useMemo(
		() =>
			data.users.filter((u) => {
				if (u.active === false) return false;
				if (!multi || !location) return true;
				return userLocationIds(u, data).includes(location);
			}),
		[data, multi, location],
	);
	useEffect(() => {
		if (!allowedUsers.some((u) => u.id === userId)) setUserId(allowedUsers[0]?.id || "");
	}, [allowedUsers, userId]);

	const user = data.users.find((u) => u.id === userId);
	const userLocations = useMemo(() => {
		const ids = user ? userLocationIds(user, data) : locations.map((l) => l.id);
		return locations.filter((l) => ids.includes(l.id));
	}, [user, locations, data]);
	useEffect(() => {
		if (!userLocations.some((l) => l.id === location)) setLocation(userLocations.length === 1 ? userLocations[0].id : location && userLocations.some((l) => l.id === location) ? location : "");
	}, [userLocations, location]);

	const submit = async () => {
		const message = await staffLogin({ userId, pin, location });
		setError(message);
		if (!message) setPin("");
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
				{multi && (
					<div className="field" style={{ marginTop: 10 }}>
						<label>Location</label>
						<select className="input" id="login-location" value={location} onChange={(e) => setLocation(e.target.value)}>
							<option value="">Select location</option>
							{userLocations.map((l) => (
								<option key={l.id} value={l.id}>
									{l.name} — {l.code}
								</option>
							))}
						</select>
						<div className="plan-settings-note" id="login-location-note">
							Choose the branch first. Only staff allowed at that location are shown.
						</div>
					</div>
				)}
				<div className="field">
					<label>User</label>
					<select className="input" id="login-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
						{allowedUsers.map((u) => (
							<option key={u.id} value={u.id}>
								{u.name} — {u.role}
							</option>
						))}
					</select>
				</div>
				<div className="field" style={{ marginTop: 10 }}>
					<label>PIN</label>
					<input
						className="input"
						id="login-pin"
						type="password"
						inputMode="numeric"
						maxLength={6}
						value={pin}
						onChange={(e) => setPin(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && submit()}
						autoFocus
					/>
				</div>
				<button className="btn gold" style={{ width: "100%", marginTop: 15 }} onClick={submit}>
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
