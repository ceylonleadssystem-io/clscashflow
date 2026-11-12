/**
 * The menu as the signed-in branch sees it: the items (and categories) that are sold at the current location. Everything shows when
 * "All locations" is chosen or an item has no location limits (see domain/menuLocation.js).
 */
import { useMemo } from "react";
import { activeLocationIds, categoryAllowedAt, itemAllowedAt, itemsAt } from "../domain/menuLocation";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

export function useBranchMenu() {
	const data = useData();
	const { locationId } = usePos();
	return useMemo(() => {
		const validIds = activeLocationIds(data.locations);
		return {
			locationId,
			products: itemsAt(data.products, data.settings, locationId, validIds),
			allows: (product) => itemAllowedAt(product, data.settings, locationId, validIds),
			allowsCategory: (name) => categoryAllowedAt(data.settings, name, locationId, validIds),
		};
	}, [data.products, data.settings, data.locations, locationId]);
}
