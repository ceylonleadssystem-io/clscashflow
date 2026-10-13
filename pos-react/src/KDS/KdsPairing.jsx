/**
 * Settings block for the Kitchen Display link: status, pairing with the 6-digit code shown on /KDS, and unpairing.
 */
import { useEffect, useState } from "react";
import { Field } from "../components/ui";
import { kdsLink } from "./link";

export function KdsPairing() {
	const [st, setSt] = useState(kdsLink.state());
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => kdsLink.subscribe(setSt), []);
	const pair = async () => {
		setBusy(true);
		setError("");
		try {
			await kdsLink.pairWithCode(code.replace(/\s/g, ""));
			setCode("");
		} catch (e) {
			setError(e.message);
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="print-note" style={{ marginTop: 12 }}>
			<strong>Kitchen Display (KDS)</strong>
			<p className="muted">
				Open <b>/KDS</b> on the kitchen screen and connect to the same Wi-Fi as this device. Orders go straight to it over the local network.
			</p>
			{st.paired ? (
				<>
					<p role="status">{st.connected ? "● Connected to the Kitchen Display" : "○ Paired, waiting for the Kitchen Display"}{kdsLink.pending() ? ` · ${kdsLink.pending()} waiting to send` : ""}</p>
					<button className="btn out" onClick={() => window.confirm("Disconnect from the Kitchen Display?") && kdsLink.unpair()}>
						Unpair
					</button>
				</>
			) : (
				<Field label="Pairing code shown on the Kitchen Display">
					<div className="kds-actions">
						<input className="input" inputMode="numeric" maxLength={7} placeholder="000 000" value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))} />
						<button className="btn" disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={pair}>
							{busy ? "Connecting…" : "Pair"}
						</button>
					</div>
					{error && <div role="alert">{error}</div>}
				</Field>
			)}
		</div>
	);
}
