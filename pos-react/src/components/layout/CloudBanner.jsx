/**
 * Billing reminder bar under the top bar. The cloud sync state is no longer shown here: it has its own icon next to the
 * Full Screen button (see SyncIndicator).
 */
import { useSession } from "../../store/SessionProvider";
import { useFeature } from "../../store/FeatureProvider";

/** Billing reminder (legacy `pos-cloud-banner`), shown only when there is something to say. */
export function CloudBanner() {
	const { billing, authKind } = useSession();
	const on = useFeature("settings.cloudBanner");
	if (!on || authKind !== "appwrite" || !billing.warning) return null;
	return (
		<div id="pos-cloud-banner" className="pos-cloud-banner">
			<span className="pos-billing-warning">{billing.warning}</span>
		</div>
	);
}
