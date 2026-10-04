/**
 * Admin Diagnostics tab: ask a POS to send its log directly to this browser (WebRTC), then download it.
 * The log never touches a server; the received copy lives in this browser's cache until downloaded or discarded.
 */
import { useEffect, useRef, useState } from "react";
import { discardLog, loadLog, requestLog } from "./diagnosticsPeer";

const BUSY = ["waiting", "connecting", "receiving"];

export function DiagnosticsTab({ account, ui }) {
	const [st, setSt] = useState({ state: "idle" });
	const req = useRef(null);

	// A log received earlier but not yet downloaded is still in the cache.
	useEffect(() => {
		let on = true;
		loadLog(account.id).then((l) => on && l && setSt((cur) => (cur.state === "idle" ? { state: "received", ...l } : cur)));
		return () => {
			on = false;
			req.current?.detach();
			req.current = null;
		};
	}, [account.id]);

	const request = () => {
		req.current?.detach();
		setSt({ state: "waiting" });
		req.current = requestLog(account.id, setSt);
	};
	const cancel = () => req.current?.cancel();

	const download = async () => {
		const l = st.text != null ? st : await loadLog(account.id);
		if (!l) return;
		const safe = String(account.business || account.id).replace(/[^\w.-]+/g, "-").slice(0, 40);
		const a = document.createElement("a");
		a.href = URL.createObjectURL(new Blob([l.text], { type: "text/plain;charset=utf-8" }));
		a.download = `pos-log-${safe}-${new Date().toISOString().slice(0, 10)}.log`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
		if (await ui.confirm("Log downloaded. Remove the copy held in this browser?")) discard();
	};
	const discard = async () => {
		await discardLog(account.id);
		setSt({ state: "idle" });
	};

	const label = {
		idle: "No request.",
		waiting: "Waiting for the POS to check in (it checks every ~15 seconds).",
		connecting: "Connecting directly to the POS...",
		receiving: `Receiving log... ${st.percent ?? 0}%`,
		received: `Received ${st.receivedAt ? new Date(st.receivedAt).toLocaleString() : ""}, ${((st.size || 0) / 1024).toFixed(1)} KB.`,
		failed: st.reason,
	}[st.state];

	return (
		<div className="panel">
			<div className="panel-head">
				<div>
					<div className="panel-title">POS log file</div>
					<div className="muted">Sent directly from the POS to this browser. It is not stored on any server.</div>
				</div>
			</div>
			<div className="modal-body">
				<p className={"diag-state diag-" + st.state} data-state={st.state}>{label}</p>
				{st.state === "receiving" && <progress max="100" value={st.percent ?? 0} />}
				<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
					<button type="button" className="btn gold" disabled={BUSY.includes(st.state)} onClick={request}>
						Request logs from this POS
					</button>
					{BUSY.includes(st.state) && (
						<button type="button" className="btn" onClick={cancel}>
							Cancel request
						</button>
					)}
					{st.state === "received" && (
						<>
							<button type="button" className="btn gold" onClick={download}>
								Download log file
							</button>
							<button type="button" className="btn" onClick={discard}>
								Discard
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
