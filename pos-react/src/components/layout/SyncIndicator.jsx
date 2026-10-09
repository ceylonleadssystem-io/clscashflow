/**
 * Cloud sync indicator: a circular-arrows icon that turns while the POS syncs and stands still when it is synced (green),
 * and shows red when the device is offline or the last sync failed (tap to retry). Replaces the green "Syncing POS with cloud…" bar.
 */
import { useSession } from "../../store/SessionProvider";

const ICON = (
	<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M20 11a8 8 0 0 0-14.5-4.4L4 8.5" />
		<path d="M4 4v4.5h4.5" />
		<path d="M4 13a8 8 0 0 0 14.5 4.4L20 15.5" />
		<path d="M20 20v-4.5h-4.5" />
	</svg>
);

/** `variant` only changes a CSS class: one copy sits in the actions row, one beside the "..." button on small screens. */
export function SyncIndicator({ variant = "row" }) {
	const { cloudStatus, retrySync, authKind } = useSession();
	if (authKind !== "appwrite") return null; // local mode has no cloud to sync with
	const state = cloudStatus.state;
	const tone = state === "offline" || state === "retry" ? "bad" : "good";
	const spinning = state === "syncing";
	const retry = state === "retry";
	const label = retry ? "Cloud sync failed. Tap to retry." : cloudStatus.message;
	return (
		<button
			type="button"
			className={"sync-indicator btn out sync-" + tone + (spinning ? " spinning" : "") + " sync-" + variant}
			data-state={state}
			title={label}
			aria-label={label}
			role="status"
			disabled={!retry}
			onClick={retry ? retrySync : undefined}
		>
			{ICON}
			<span className="sync-text">{tone === "bad" ? (retry ? "Sync failed" : "Offline") : spinning ? "Syncing…" : "Synced"}</span>
		</button>
	);
}
