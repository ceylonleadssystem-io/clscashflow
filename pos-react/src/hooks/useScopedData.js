/**
 * Hook returning sales, cash shifts and time entries limited to the active location (everything when
 * "All Locations" is selected), used by the dashboard, reports and sales history.
 */
import { useMemo } from "react";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

/**
 * Sales / shifts / attendance limited to the active location (legacy behaviour
 * of the dashboard, reports and sales history). "All Locations" shows everything.
 */
export function useScopedData() {
	const data = useData();
	const { locationId } = usePos();
	return useMemo(() => {
		if (locationId === "all" || !locationId) return { sales: data.sales, cashShifts: data.cashShifts, timeEntries: data.timeEntries };
		const keep = (x) => !x.locationId || x.locationId === locationId;
		return {
			sales: data.sales.filter(keep),
			cashShifts: data.cashShifts.filter(keep),
			timeEntries: data.timeEntries.filter(keep),
		};
	}, [data.sales, data.cashShifts, data.timeEntries, locationId]);
}
