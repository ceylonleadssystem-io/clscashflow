/**
 * POS bridge. Reads the POS business document (table layout, customers, open checks, sales) and writes guests back as POS
 * customers. Only the `customers` rows are sent back: the server merges them by id into the POS document.
 */
import { call } from "./store.mjs";
import { gridTables } from "./logic.mjs";

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

/** Tables of one POS location (its own layout, else the shared one), or GM's own tables. */
export function tablesFor(pos, cfg) {
	if (cfg.layoutFrom === "own" || !pos.found) return gridTables(cfg.ownTables);
	const own = cfg.locationId ? pos.settings["tableLayout_" + cfg.locationId] : null;
	const list = Array.isArray(own) ? own : pos.settings.tableLayout || [];
	return list.filter((t) => t.active !== false).map((t) => ({ ...t, seats: +t.seats || 2 }));
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

/** Floor status of a table at a given minute of the selected day, from GM bookings and POS open checks. */
export const openCheck = (pos, table) => pos.openOrders.find((o) => o.status === "open" && o.orderReference === "Table " + table.number) || null;
