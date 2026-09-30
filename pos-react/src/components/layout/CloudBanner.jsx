import { useSession } from "../../store/SessionProvider";
import { useFeature } from "../../store/FeatureProvider";

const COLOURS = { saved: "#169b62", syncing: "#d88a16", retry: "#d88a16", offline: "#c23b32" };

/** Online / offline / synced indicator + billing reminder (legacy `pos-cloud-banner`). */
export function CloudBanner() {
	const { cloudStatus, billing, retrySync, authKind } = useSession();
	const on = useFeature("settings.cloudBanner");
	if (!on || authKind !== "appwrite") return null;
	const retry = cloudStatus.state === "retry";
	return (
		<div
			id="pos-cloud-banner"
			className="pos-cloud-banner"
			style={{ cursor: retry ? "pointer" : undefined }}
			title={retry ? "Cloud sync failed. Tap to retry now." : ""}
			onClick={retry ? retrySync : undefined}
		>
			<span className="pos-cloud-state">
				<span
					className="pos-cloud-dot"
					style={{ background: COLOURS[cloudStatus.state] || COLOURS.syncing, boxShadow: cloudStatus.state === "offline" ? "0 0 0 3px rgba(194,59,50,.12)" : "" }}
				/>
				<span id="pos-connection-label">{cloudStatus.message}</span>
			</span>
			{billing.warning && <span className="pos-billing-warning">{billing.warning}</span>}
		</div>
	);
}
