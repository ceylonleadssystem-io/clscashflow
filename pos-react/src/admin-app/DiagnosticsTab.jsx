/**
 * Admin Diagnostics tab: ask a POS device to upload its log, then download it once (the stored copy is deleted).
 * Logs live in Appwrite Storage for at most 24 h, never in the database.
 */
import { useCallback, useEffect, useState } from "react";
import { diagnosticsApi } from "./adminApi";

const POLL_MS = 10000;

export function DiagnosticsTab({ account, ui }) {
	const [st, setSt] = useState({ state: "none" });
	const [busy, setBusy] = useState(false);

	const refresh = useCallback(async () => {
		try {
			setSt(await diagnosticsApi({ action: "status", userId: account.id }));
		} catch (e) {
			setSt({ state: "error", error: e.message });
		}
	}, [account.id]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// Poll only while waiting for the device; the interval is cleared on unmount or state change.
	useEffect(() => {
		if (st.state !== "waiting") return undefined;
		const id = setInterval(refresh, POLL_MS);
		return () => clearInterval(id);
	}, [st.state, refresh]);

	const act = async (action) => {
		setBusy(true);
		try {
			setSt(await diagnosticsApi({ action, userId: account.id }));
		} catch (e) {
			await ui.alert(e.message);
		}
		setBusy(false);
	};

	const download = async () => {
		setBusy(true);
		try {
			const r = await diagnosticsApi({ action: "download", userId: account.id });
			const safe = String(account.business || account.id).replace(/[^\w.-]+/g, "-").slice(0, 40);
			const a = document.createElement("a");
			a.href = URL.createObjectURL(new Blob([r.text], { type: "text/plain;charset=utf-8" }));
			a.download = `pos-log-${safe}-${new Date().toISOString().slice(0, 10)}.log`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(a.href), 1000);
			ui.notice("Log downloaded. The stored copy was deleted.");
		} catch (e) {
			await ui.alert(e.message);
		}
		await refresh();
		setBusy(false);
	};

	const label =
		st.state === "waiting"
			? "Waiting for the device (it answers when the POS is online, usually within a minute)."
			: st.state === "received"
				? `Received at ${new Date(st.receivedAt).toLocaleString()}, ${(st.size / 1024).toFixed(1)} KB.`
				: st.state === "error"
					? st.error
					: "No request.";

	return (
		<div className="panel">
			<div className="panel-head">
				<div>
					<div className="panel-title">POS log file</div>
					<div className="muted">Logs are held temporarily (24 h, not in the database) and deleted after download.</div>
				</div>
			</div>
			<div className="modal-body">
				<p>{label}</p>
				<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
					<button type="button" className="btn gold" disabled={busy} onClick={() => act("request")}>
						Request logs from this POS
					</button>
					<button type="button" className="btn" disabled={busy} onClick={refresh}>
						Refresh
					</button>
					{st.state === "received" && (
						<button type="button" className="btn gold" disabled={busy} onClick={download}>
							Download log file
						</button>
					)}
					{st.state === "waiting" && (
						<button type="button" className="btn" disabled={busy} onClick={() => act("cancel")}>
							Cancel request
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
