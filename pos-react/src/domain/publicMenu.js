/**
 * QR digital menu (pure): the snapshot of the menu that customers see when they scan the QR code, and the settings that remember
 * each location's link. settings.publicMenu = { links: { [locationKey]: { token, enabled } } }; the key is "all" or a location id.
 * The snapshot follows the same branch rules as the till (menuLocation.js): items and categories limited to other locations are left out.
 */
import { categoryKey, visibleProductCategories } from "./catalog";
import { activeLocationIds, itemsAt } from "./menuLocation";

const list = (v) => (Array.isArray(v) ? v : []);
const httpsImage = (v) => (/^https:\/\//i.test(String(v || "")) ? String(v) : ""); // a photo kept only on one device (data URL) is not shown

/** "all" for All locations, otherwise the location id: one link and QR code per key. */
export const linkKey = (locationId) => (locationId && locationId !== "all" ? String(locationId) : "all");

/** The saved link of a location: { token, enabled } or null. */
export const linkOf = (settings, locationId) => settings?.publicMenu?.links?.[linkKey(locationId)] || null;

/** The location keys whose link is switched on. */
export const enabledKeys = (settings) => Object.entries(settings?.publicMenu?.links || {}).filter(([, l]) => l && l.enabled).map(([k]) => k);

/** What a customer sees at this location: categories with their items, no stock, cost or other internal fields. */
export function buildMenuSnapshot(data, locationId) {
	const { products, categories, subcategories, settings, locations } = data;
	const validIds = activeLocationIds(locations);
	const items = itemsAt(list(products), settings, locationId, validIds).filter((p) => p && p.name && p.active !== false && p.price != null);
	const names = visibleProductCategories(list(categories), items, list(subcategories), list(settings?.userCategories));
	const key = linkKey(locationId);
	const place = key === "all" ? "" : list(locations).find((l) => String(l.id) === key)?.name || "";
	const out = [];
	for (const name of names) {
		const here = items
			.filter((p) => categoryKey(p.category) === categoryKey(name))
			.map((p) => ({ name: p.name, description: p.description || "", price: Number(p.price) || 0, sub: p.subcategory || "", image: httpsImage(p.image) }))
			.sort((a, b) => a.sub.localeCompare(b.sub) || a.name.localeCompare(b.name));
		if (here.length) out.push({ name, items: here });
	}
	return { business: String(settings?.business || "").trim() || "Menu", location: place, currency: "LKR", categories: out };
}

/** Compare two snapshots ignoring the time stamp. */
export const sameMenu = (a, b) => JSON.stringify(a) === JSON.stringify(b);
