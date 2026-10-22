/**
 * POS bridge. Reads the POS business document (table layout, customers, open checks, sales) and writes guests back as POS
 * customers. Only the `customers` rows are sent back: the server merges them by id into the POS document.
 */
import { call } from "./store.mjs";
import { MAIN_FLOOR, ownLayout } from "./logic.mjs";

const emptyPos = { found: false, business: "", locations: [], settings: {}, customers: [], openOrders: [], sales: [], users: [] };

/** Reads the POS document and the sales of the given YYYY-MM months. */
export async function readPos(ws, months) {
	const j = await call("get", `users/${ws}/pos`, "main");
	const p = j.doc?.data?.payload;
	if (!p) return emptyPos;
	let sales = Array.isArray(p.sales) ? p.sales : [];
	for (const m of months) {
		try {
			const s = await call("get", `users/${ws}/pos/main/sales`, m);
			sales = sales.concat(s.doc?.data?.rows || []);
		} catch {
			/* month not stored (sales are not split): the main document sales above already cover it */
		}
	}
	const seen = new Set();
	sales = sales.filter((s) => (s.receipt ? !seen.has(s.receipt) && seen.add(s.receipt) : true));
	return { found: true, business: p.settings?.business || "", locations: (p.locations || []).filter((l) => l.active !== false), settings: p.settings || {}, customers: p.customers || [], openOrders: p.openOrders || [], sales, users: (p.users || []).filter((u) => u.active !== false) };
}

/**
 * Guest Manager is a feature switch in the POS admin portal (view.guestManager): off unless the business switch (or the location's)
 * is on and the plan does not exclude it. Returns { allowed, why } where `why` says in plain words what blocks it.
 */
export function gmStatus(p, locationId) {
	const s = p.settings || {}, id = "view.guestManager";
	if (!p.found) return { allowed: false, why: "No POS data was found for this account." };
	const off = s.subscription?.enforced ? s.subscription.featuresOff || [] : [];
	if (off.includes(id)) return { allowed: false, why: `The assigned plan (${s.subscription.name || "plan"}) does not include Guest Manager. Change the plan on the Subscription tab in the admin portal.` };
	const override = locationId ? s.locationFeatures?.[locationId]?.[id] : undefined;
	if (override === false) return { allowed: false, why: "It is switched off for this location (a location override in the admin portal Features tab)." };
	if (override === true || s.features?.[id] === true) return { allowed: true, why: "" };
	return { allowed: false, why: s.features && id in s.features ? "The Guest Manager switch is off in the admin portal (Features tab)." : "The Guest Manager switch has not been saved for this account yet. In the admin portal open the account, Features tab, switch on Guest Manager and press Save features." };
}
export const gmAllowed = (p, locationId) => gmStatus(p, locationId).allowed;

// Floors and layouts use the same settings keys as the POS (pos-react/src/domain/tables.js): the main floor keeps tableLayout_<location>,
// the others tableLayout_<location>__<floor id>, and the floor list is tableFloors_<location>.
const layoutKey = (loc) => "tableLayout_" + loc;
const floorsKey = (loc) => "tableFloors_" + loc;
const floorKey = (loc, floorId) => (floorId === MAIN_FLOOR ? layoutKey(loc) : layoutKey(loc) + "__" + floorId);

/** The POS location GM works with: the one chosen in Settings, else the POS's first location (the one its Tables screen opens on). */
export const effectiveLocation = (pos, cfg) => cfg.locationId || (pos.locations || [])[0]?.id || "";

const fromPos = (cfg) => cfg.layoutFrom !== "own";

/** The floors in use: [{ id, name }], main first. */
export function floorsOf(pos, cfg) {
	if (!fromPos(cfg) || !pos.found) {
		const list = (cfg.ownFloors || []).filter((f) => f && f.id && f.name);
		return list.some((f) => f.id === MAIN_FLOOR) ? list : [{ id: MAIN_FLOOR, name: "Main floor" }, ...list];
	}
	const loc = effectiveLocation(pos, cfg), saved = loc ? pos.settings[floorsKey(loc)] : null;
	const list = (Array.isArray(saved) ? saved : []).filter((f) => f && f.id && String(f.name || "").trim());
	return [list.find((f) => f.id === MAIN_FLOOR) || { id: MAIN_FLOOR, name: "Main floor" }, ...list.filter((f) => f.id !== MAIN_FLOOR)];
}

/** Tables of every floor of the venue (the POS location's floors, or GM's own), each with its floor id. Inactive ones (bar, podium) are included with active: false. */
export function tablesFor(pos, cfg) {
	if (!fromPos(cfg) || !pos.found) return ownLayout(cfg.ownTables || []);
	const loc = effectiveLocation(pos, cfg);
	return floorsOf(pos, cfg).flatMap((f) => {
		const own = loc ? pos.settings[floorKey(loc, f.id)] : null;
		const list = Array.isArray(own) ? own : f.id === MAIN_FLOOR ? pos.settings.tableLayout || [] : [];
		return list.map((t) => ({ ...t, seats: +t.seats || 2, active: t.active !== false, floor: f.id }));
	});
}

/** Writes floors and their layouts to the POS settings (each key merged by its own timestamp). Floors that were removed are emptied. */
export async function pushLayout(ws, loc, floors, byFloor, removedIds = []) {
	const at = new Date().toISOString(), settings = { [floorsKey(loc)]: floors }, times = { [floorsKey(loc)]: at };
	for (const f of floors) (settings[floorKey(loc, f.id)] = (byFloor[f.id] || []).map(({ floor, ...t }) => t)), (times[floorKey(loc, f.id)] = at);
	for (const id of removedIds) (settings[floorKey(loc, id)] = []), (times[floorKey(loc, id)] = at);
	await call("set", `users/${ws}/pos`, "main", { data: { payload: { settings, syncMeta: { settings: times } } } });
}

const GM_BLOCK = /\n?\[GM\][\s\S]*?\[\/GM\]/;
const GM_TAG = /^GM:/;

/** The POS customer row for a guest: keeps everything POS already has, adds contact details, GM tier tag and a notes block. */
export function toPosCustomer(guest, existing, tier) {
	const now = new Date().toISOString();
	const tags = String(existing?.tags || "").split(",").map((t) => t.trim()).filter((t) => t && !GM_TAG.test(t));
	tags.push("GM:" + tier);
	const notes = (existing?.notes || "").replace(GM_BLOCK, "").trim();
	const info = [guest.allergies && "Allergies: " + guest.allergies, guest.preferences && "Preferences: " + guest.preferences].filter(Boolean).join("\n");
	return {
		discountEligible: false,
		discountType: "percent",
		discountValue: 0,
		discountExpiry: "",
		discountNote: "",
		company: "",
		address: "",
		type: "regular",
		...(existing || { id: guest.posCustomerId || "c-gm-" + guest.id, createdAt: now }),
		name: guest.name,
		phone: guest.phone,
		email: guest.email || "",
		birthday: guest.birthday || existing?.birthday || "",
		tags: tags.join(", "),
		notes: (notes + (info ? "\n[GM]\n" + info + "\n[/GM]" : "")).trim(),
		updatedAt: now,
	};
}

export async function pushCustomers(ws, customers) {
	if (!customers.length) return;
	await call("set", `users/${ws}/pos`, "main", { data: { payload: { customers } } });
}

/**
 * Writes who is seated where (settings.gmSeating) and the upcoming bookings per table (settings.gmBookings) to the POS, merged
 * per setting by its timestamp, so its Tables screen shows seated and reserved tables.
 */
export async function pushSeating(ws, map, bookings = {}) {
	const at = new Date().toISOString();
	await call("set", `users/${ws}/pos`, "main", { data: { payload: { settings: { gmSeating: map, gmBookings: bookings }, syncMeta: { settings: { gmSeating: at, gmBookings: at } } } } });
}

/** Floor status of a table at a given minute of the selected day, from GM bookings and POS open checks. */
export const openCheck = (pos, table) => pos.openOrders.find((o) => o.status === "open" && o.orderReference === "Table " + table.number) || null;
