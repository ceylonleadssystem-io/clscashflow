/**
 * Provides the resolved feature switches (business-wide, overridden per location) and the
 * useFeature(id) hook used across the app.
 */
import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { resolveFeatures } from "../config/features";
import { flagsWithPlan, subscriptionOf } from "../config/subscription";
import { useData } from "./DataProvider";
import { locationStore } from "./locationStore";

/** Resolved feature switches (Admin Dashboard) available to every component. */
const FeatureContext = createContext({ enabled: {}, raw: {}, blockedBy: {} });

export function FeatureProvider({ children }) {
	const { settings } = useData();
	const locationId = useSyncExternalStore(locationStore.subscribe, locationStore.get);
	// business-wide switches, overridden per location by the administrator
	const value = useMemo(() => {
		const override = locationId && locationId !== "all" ? settings.locationFeatures?.[locationId] : null;
		// the plan assigned in the admin portal wins over the switches: its excluded features stay off
		return resolveFeatures(flagsWithPlan({ ...(settings.features || {}), ...(override || {}) }, subscriptionOf(settings)));
	}, [settings.features, settings.locationFeatures, settings.subscription, locationId]);
	return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
}

export const useFeatures = () => useContext(FeatureContext);
/** `const splitBill = useFeature("checkout.splitBill")` */
export const useFeature = (id) => !!useContext(FeatureContext).enabled[id];
