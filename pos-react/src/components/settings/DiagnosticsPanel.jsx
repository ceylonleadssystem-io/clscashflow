/**
 * Settings panel for support: download or clear the on-device log file. Nothing leaves the device unless shared.
 */
import { useState } from "react";
import { Panel } from "../ui";
import { clearLogs, downloadLogFile, getLogs } from "../../utils/logger";

/** Support tool: export or clear the on-device log file (no data leaves the device unless the user shares it). */
export function DiagnosticsPanel() {
	const [count, setCount] = useState(() => getLogs().length);
	return (
		<Panel title="Diagnostics" subtitle="Download the POS log file to share with support. Passwords and PINs are never recorded.">
			<div className="modal-body">
				<p className="muted">{count} log entries stored on this device.</p>
				<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
					<button type="button" className="btn gold" onClick={() => setCount(downloadLogFile())}>
						Download log file
					</button>
					<button
						type="button"
						className="btn"
						onClick={() => {
							clearLogs();
							setCount(0);
						}}
					>
						Clear logs
					</button>
				</div>
			</div>
		</Panel>
	);
}
