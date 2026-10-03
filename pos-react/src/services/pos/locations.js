/**
 * Location (branch) actions and helpers: active locations, which locations a user may access, saving a
 * location (with stock buckets for new ones) and audit entries for switching location and logging in.
 */
import { T } from "../../db/tables";
import { nowIso } from "../../domain/format";
import { createLogger } from "../../utils/logger";
import { audit } from "./common";

const log = createLogger("locations");

/** Business locations (branches) and per-location helpers. */

export const activeLocations = (data) => data.locations.filter((l) => l.active !== false);

export function userLocationIds(user, data) {
	if (!user) return [];
	const active = activeLocations(data);
	if (user.locationAccess === "all" || user.role === "owner" || user.role === "admin") return active.map((l) => l.id);
	return (Array.isArray(user.locationIds) ? user.locationIds : []).filter((id) => active.some((l) => l.id === id));
}

export const locationLabel = (data, id) => data.locations.find((l) => l.id === id)?.name || "Unknown location";

export async function saveLocation(ctx, form) {
	const d = ctx.data();
	const s = ctx.session();
	const name = form.name.trim();
	const code = form.code.trim().toUpperCase();
	if (!name || !code) return void (await ctx.ui.alert("Enter a location name and code."));
	if (d.locations.some((l) => l.id !== form.id && String(l.code).toLowerCase() === code.toLowerCase()))
		return void (await ctx.ui.alert("That location code is already in use."));
	const existing = d.locations.find((l) => l.id === form.id);
	const isNew = !existing;
	const location = {
		...(existing || { id: "loc-" + Date.now().toString(36), createdAt: nowIso() }),
		name,
		code,
		address: form.address.trim(),
		phone: form.phone.trim(),
		email: form.email.trim(),
		openingHours: form.openingHours.trim(),
		active: form.active,
		receiptHeader: form.receiptHeader.trim(),
		receiptFooter: form.receiptFooter.trim(),
	};
	await ctx.store.write((tx) => {
		tx.put(T.locations, location);
		if (isNew)
			d.inventory.forEach((item) => {
				const q = item.locationQuantities && typeof item.locationQuantities === "object" ? item.locationQuantities : {};
				if (q[location.id] == null) tx.put(T.inventoryItems, { ...item, locationQuantities: { ...q, [location.id]: 0 } });
			});
		audit(tx, s, existing ? "location-updated" : "location-created", name, location.id);
	});
	log.info(isNew ? "location created" : "location updated", { locationId: location.id, active: location.active });
	ctx.ui.notice(name + " saved. " + (isNew ? "Stock buckets are ready for this location." : ""));
	return location;
}

export async function auditLocationSwitch(ctx, from, to) {
	const s = ctx.session();
	const d = ctx.data();
	log.info("location switched", { userId: s.userId, from: from || null, to });
	await ctx.store.write((tx) =>
		audit(tx, s, "location-switch", `${from ? locationLabel(d, from) : "—"} to ${to === "all" ? "All Locations" : locationLabel(d, to)}`, to === "all" ? "" : to),
	);
}

export async function auditLogin(ctx, locationId) {
	const s = ctx.session();
	const d = ctx.data();
	log.info("staff login", { userId: s.userId, role: s.user?.role, locationId });
	await ctx.store.write((tx) => audit(tx, s, "staff-login-location", locationLabel(d, locationId), locationId));
}
