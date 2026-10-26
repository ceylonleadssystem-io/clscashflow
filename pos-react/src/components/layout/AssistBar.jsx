/**
 * Assist mode bar (admin portal "Open client's POS"): this POS is a copy of the client's configuration, not a live view. Changes
 * reach the client only when "Send changes to client" is pressed, and only menu and shop configuration is sent.
 */
import { useState } from "react";
import { adminApi } from "../../admin-app/adminApi";
import { describeConfig, isEmptyConfig } from "../../domain/assistConfig";
import { assistInfo, endAssist, markSent, pendingConfig } from "../../services/assist";
import { useUi } from "../../store/UiProvider";
import { createLogger } from "../../utils/logger";

const log = createLogger("assist");

export function AssistBar() {
	const ui = useUi();
	const info = assistInfo();
	const [busy, setBusy] = useState(false);
	if (!info) return null;

	const send = async () => {
		setBusy(true);
		try {
			const cfg = await pendingConfig(info);
			if (isEmptyConfig(cfg)) return void ui.notice("No configuration changes to send yet.");
			const lines = describeConfig(cfg);
			if (!(await ui.confirm(`Send these changes to ${info.business || "the client"}?\n\n• ${lines.join("\n• ")}\n\nTheir POS picks them up within a few seconds. A backup of the previous menu is kept. Sales, customers and staff are never touched.`))) return;
			const res = await adminApi({ action: "saveConfig", userId: info.accountId, config: cfg });
			await markSent(info);
			log.info("assist changes sent", { accountId: info.accountId, summary: res.summary });
			ui.notice("Sent to " + (info.business || "the client") + ". Their POS updates on its next sync.");
		} catch (e) {
			await ui.alert("Could not send the changes: " + e.message + " Nothing was lost; they are still in this copy.");
		} finally {
			setBusy(false);
		}
	};

	const close = async () => {
		const cfg = await pendingConfig(info).catch(() => null);
		const unsent = cfg && !isEmptyConfig(cfg);
		const ok = await ui.confirm(unsent ? "You have changes that were not sent to the client. Close and discard them?" : "Close this copy of the client's POS? It is removed from this browser.");
		if (!ok) return;
		await endAssist(info);
		window.close();
		location.href = "/posv2/admin"; // when the browser will not close a tab it did not open
	};

	return (
		<div className="assist-bar" id="assist-bar" role="region" aria-label="Assist mode">
			<span className="assist-bar-text">
				<b>Assist copy</b> of {info.business || "the client's POS"} · not live. Changes reach the client only when you send them.
			</span>
			<button className="btn gold" type="button" id="assist-send" disabled={busy} onClick={send}>
				{busy ? "Sending…" : "Send changes to client"}
			</button>
			<button className="btn out" type="button" id="assist-close" disabled={busy} onClick={close}>
				Close
			</button>
		</div>
	);
}

/** Shown when `?assist=1` was opened without the copy or the administrator's sign-in (not from the admin portal), or the copy failed to load. */
export function AssistMissing({ message }) {
	return (
		<div className="account-gate">
			<div className="account-card">
				<h2>Open this from the admin portal</h2>
				<p className="muted">{message || "The assist copy of a client's POS can only be opened with the “Open client's POS” button in the administration portal, while you are signed in there."}</p>
				<a className="btn gold" href="/posv2/admin">
					Go to the admin portal
				</a>
			</div>
		</div>
	);
}
