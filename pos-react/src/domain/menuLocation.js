/**
 * Which locations (branches) an item or a category is sold at. `locationIds` on an item, or on a category's setting
 * (settings.categorySettings), lists the locations it is limited to; empty (or only locations that no longer exist) means every location.
 * An item shows at a location when both its own list and its category's list allow it. "All locations" shows everything.
 */
import { categoryKey } from "./catalog";

const list = (v) => (Array.isArray(v) ? v : []);

/** The ids of the active locations. */
export const activeLocationIds = (locations) => list(locations).filter((l) => l.active !== false).map((l) => String(l.id));

/** The ids of `ids` that are real locations (all of them when `validIds` is not given), without repeats. */
export const cleanLocationIds = (ids, validIds) => [...new Set(list(ids).map(String))].filter((id) => !validIds || validIds.includes(id));

/** The single location someone is signed in to ("" for All locations or no location). */
export const branchOf = (locationId) => (locationId && locationId !== "all" ? String(locationId) : "");

/** The limits a newly added item starts with: the signed-in branch when the business has several locations, otherwise none. */
export const newItemLocationIds = (locationId, validIds) => (list(validIds).length > 1 && list(validIds).includes(branchOf(locationId)) ? [branchOf(locationId)] : []);

const allows = (ids, branch, validIds) => {
	const limit = cleanLocationIds(ids, validIds);
	return !limit.length || limit.includes(branch);
};

/** Whether a location may sell/show this category (settings = published settings). */
export function categoryAllowedAt(settings, category, locationId, validIds) {
	const branch = branchOf(locationId);
	if (!branch) return true;
	const rule = list(settings?.categorySettings).find((c) => c.id === categoryKey(category));
	return allows(rule?.locationIds, branch, validIds);
}

/** Whether this item shows at the location: its own limits and its category's limits must both allow it. */
export function itemAllowedAt(product, settings, locationId, validIds) {
	const branch = branchOf(locationId);
	if (!branch) return true;
	return allows(product?.locationIds, branch, validIds) && categoryAllowedAt(settings, product?.category, locationId, validIds);
}

/** The items of the list that show at the location. */
export const itemsAt = (products, settings, locationId, validIds) => (branchOf(locationId) ? list(products).filter((p) => itemAllowedAt(p, settings, locationId, validIds)) : list(products));
