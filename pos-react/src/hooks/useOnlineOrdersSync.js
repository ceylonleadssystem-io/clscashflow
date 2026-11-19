/**
 * Looks for new online orders every half minute on a device whose location has a connected store, and once when it starts.
 */
import { useEffect } from "react";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";

const EVERY_MS = 30000;

export function useOnlineOrdersSync() {
	const { settings } = useData();
	const { svc, locationId } = usePos();
	const on = useFeature("online.shopify");
	const here = on && (settings.onlineStore?.shops || []).some((s) => s.locationId === locationId);
	useEffect(() => {
		if (!here) return undefined;
		svc.onlineOrders.pull();
		const timer = setInterval(() => svc.onlineOrders.pull(), EVERY_MS);
		return () => clearInterval(timer);
	}, [here, svc]);
}
