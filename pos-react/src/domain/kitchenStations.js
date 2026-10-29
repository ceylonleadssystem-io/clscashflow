/**
 * Kitchen stations: the kitchen printers and Kitchen Displays (KDS) a business sends prep tickets to. Each item can go to one or
 * more stations (product.stationIds); an item with none goes to the first station. Saved in settings.kitchenStations.
 * Businesses that never set the list keep their old single destination (the KDS when it is switched on, else the KOT printer name).
 */

export const STATION_TYPES = [
	{ value: "printer", label: "Kitchen printer" },
	{ value: "kds", label: "Kitchen Display (KDS)" },
];

const named = (s) => s && s.id && String(s.name || "").trim();

/** The business' stations, in order (the first one also receives items that have no station). */
export function kitchenStations(settings = {}, kdsOn = false) {
	if (Array.isArray(settings.kitchenStations)) return settings.kitchenStations.filter(named).map((s) => ({ id: String(s.id), name: String(s.name).trim(), type: s.type === "kds" ? "kds" : "printer" }));
	if (kdsOn) return [{ id: "kds", name: "Kitchen Display", type: "kds" }];
	const printer = String(settings.kotPrinter || "").trim();
	return printer ? [{ id: "kot", name: printer, type: "printer" }] : [];
}

/** Splits an order's prep lines by station: [{ station, lines }] in station order. Discount and service-charge lines never go. */
export function routeKitchenLines(lines = [], products = [], stations = []) {
	if (!stations.length) return [];
	const known = new Set(stations.map((s) => s.id));
	const byId = new Map(products.map((p) => [String(p.id), p]));
	const out = new Map();
	for (const line of lines) {
		if (line.isDiscount || line.isServiceCharge) continue;
		const chosen = (byId.get(String(line.productId))?.stationIds || []).map(String).filter((id) => known.has(id));
		for (const id of chosen.length ? chosen : [stations[0].id]) {
			if (!out.has(id)) out.set(id, []);
			out.get(id).push(line);
		}
	}
	return stations.filter((s) => out.has(s.id)).map((station) => ({ station, lines: out.get(station.id) }));
}

/** Cleans the list typed in Settings: named rows only, unique ids, known types. Returns { stations, error }. */
export function cleanStations(rows = []) {
	const stations = [];
	const names = new Set();
	for (const r of rows) {
		const name = String(r.name || "").trim().slice(0, 40);
		if (!name) continue;
		if (names.has(name.toLowerCase())) return { stations: [], error: `There are two kitchen stations called "${name}". Give each one its own name.` };
		names.add(name.toLowerCase());
		stations.push({ id: String(r.id || "st-" + Math.random().toString(36).slice(2, 9)), name, type: r.type === "kds" ? "kds" : "printer" });
	}
	return { stations, error: "" };
}
