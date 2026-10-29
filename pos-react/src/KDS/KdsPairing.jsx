/**
 * Pairing block of one Kitchen Display station: status, pairing with the 6-digit code shown on /KDS, and unpairing.
 * Each KDS station (Stations page) pairs with its own kitchen screen.
 */
import { useEffect, useState } from "react";
import { Field } from "../components/ui";
import { useUi } from "../store/UiProvider";
import { kdsLink } from "./link";

export function KdsPairing({ stationId = "kds", name = "Kitchen Display" }) {
	const ui = useUi();
	const link = kdsLink.station(stationId);
	const [st, setSt] = useState(link.state());
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => {
		setSt(link.state());
		return link.subscribe(setSt);
	}, [link]);
	const pair = async () => {
		setBusy(true);
		setError("");
		try {
			await link.pairWithCode(code.replace(/\s/g, ""));
			setCode("");
		} catch (e) {
			setError(e.message);
		} finally {
			setBusy(false);
		}
	};
	const unpair = async () => {
		if (await ui.confirm(`Disconnect ${name} from its kitchen screen?`)) link.unpair();
	};
	return (
		<div className="kds-pairing" data-station-id={stationId}>
			{st.paired ? (
				<>
					<p role="status">
						{st.connected ? "● Connected to the kitchen screen" : "○ Paired, waiting for the kitchen screen"}
						{link.pending() ? ` · ${link.pending()} waiting to send` : ""}
					</p>
					<button type="button" className="btn out" onClick={unpair}>
						Unpair screen
					</button>
				</>
			) : (
				<Field label={"Pairing code shown on the " + name + " screen"}>
					<div className="kds-actions">
						<input className="input" inputMode="numeric" maxLength={7} placeholder="000 000" aria-label={"Pairing code for " + name} value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))} />
						<button type="button" className="btn" disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={pair}>
							{busy ? "Connecting…" : "Pair"}
						</button>
					</div>
					{error && <div role="alert">{error}</div>}
				</Field>
			)}
		</div>
	);
}

/** Settings, KDS tab: one pairing block per Kitchen Display station. */
export function KdsScreens({ stations, onManage }) {
	const screens = stations.filter((s) => s.type === "kds");
	return (
		<div className="print-note" style={{ marginTop: 12 }}>
			<strong>Kitchen Displays (KDS)</strong>
			<p className="muted">
				Open <b>/KDS</b> on each kitchen screen and connect it to the same Wi-Fi as this device, then pair it with the code it shows. Each
				Kitchen Display station gets its own screen and only its own items.
			</p>
			{screens.map((s) => (
				<div className="kds-screen" key={s.id}>
					<div className="label">{s.name}</div>
					<KdsPairing stationId={s.id} name={s.name} />
				</div>
			))}
			{!screens.length && <p>No Kitchen Display station yet.</p>}
			{onManage && (
				<button type="button" className="btn out" onClick={onManage}>
					Manage stations
				</button>
			)}
		</div>
	);
}
