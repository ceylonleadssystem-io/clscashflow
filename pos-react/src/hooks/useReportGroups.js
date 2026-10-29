/**
 * The report groups the signed-in user can open (role, kitchen tickets, number of locations); used by the Reports page and the sidebar.
 */
import { useMemo } from "react";
import { visibleGroups } from "../domain/reportsCatalog";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";

export function useReportGroups() {
	const { role } = usePos();
	const data = useData();
	const kitchen = useFeature("checkout.kitchenTickets");
	const locations = data.locations.filter((l) => l.active !== false).length;
	// Payments and Loyalty need their own modules, which this POS does not have yet
	return useMemo(() => visibleGroups({ role, modules: { kitchen, locations, payments: false, loyalty: false } }), [role, kitchen, locations]);
}
