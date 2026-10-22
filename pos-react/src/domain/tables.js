/**
 * Restaurant floor plan helpers (pure): table normalising, numbering and live status from open orders.
 * A table's open order is the one whose order reference is "Table <number>".
 */
export const TABLE_SHAPES = ["square", "round", "rect"];
export const GRID = { w: 900, h: 560, min: 50, max: 300, step: 10 };

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+n) ? +n : lo));
const snap = (n) => Math.round(n / GRID.step) * GRID.step;

/** Settings key that holds one location's floor plan (a key per location, so two branches never overwrite each other when they sync). */
export const layoutKey = (locationId) => "tableLayout_" + locationId;

/**
 * The floor plan of one location: its own saved layout, or - until that location saves one - the shared layout that
 * was saved before layouts became per location (settings.tableLayout), so no existing floor disappears.
 */
export function layoutFor(settings, locationId) {
	const own = locationId ? (settings || {})[layoutKey(locationId)] : null;
	return Array.isArray(own) ? own : (settings || {}).tableLayout || [];
}

/** Open checks that belong to a location (checks saved without a location count for every location). */
export const locationOrders = (openOrders, locationId) => openOrders.filter((o) => !o.locationId || o.locationId === locationId);

export const tableReference = (t) => "Table " + t.number;

/**
 * Floors: a location can have several, each with its own table layout. The main floor keeps the original layout key
 * (layoutKey), so layouts saved before floors existed are simply the main floor. Other floors keep their tables under
 * layoutKey + "__" + floor id, and the floor list under floorsKey. Table numbers are unique across all floors of a
 * location, because a check's reference is "Table <number>".
 */
export const MAIN_FLOOR = "main";
export const floorsKey = (locationId) => "tableFloors_" + locationId;
export const floorLayoutKey = (locationId, floorId) => (floorId === MAIN_FLOOR ? layoutKey(locationId) : layoutKey(locationId) + "__" + floorId);

/** The floors of a location as [{ id, name }], the main floor first. A location that never added a floor has just the main one. */
export function floorsFor(settings, locationId) {
	const saved = locationId ? (settings || {})[floorsKey(locationId)] : null;
	const list = (Array.isArray(saved) ? saved : []).filter((f) => f && f.id && String(f.name || "").trim());
	const main = list.find((f) => f.id === MAIN_FLOOR) || { id: MAIN_FLOOR, name: "Main floor" };
	return [main, ...list.filter((f) => f.id !== MAIN_FLOOR)];
}

/** The saved tables of one floor of a location. */
export function floorLayout(settings, locationId, floorId) {
	if (floorId === MAIN_FLOOR) return layoutFor(settings, locationId);
	const own = locationId ? (settings || {})[floorLayoutKey(locationId, floorId)] : null;
	return Array.isArray(own) ? own : [];
}

/** Every table of every floor of a location, each marked with its floor id. */
export const allFloorTables = (settings, locationId) =>
	floorsFor(settings, locationId).flatMap((f) => floorLayout(settings, locationId, f.id).map((t) => ({ ...t, floor: f.id })));

/** Safe table from user input / saved data: snapped size and position kept inside the floor. */
export function normalizeTable(t) {
	const w = clamp(snap(t.w || 100), GRID.min, GRID.max);
	const h = t.shape === "rect" ? clamp(snap(t.h || 70), GRID.min, GRID.max) : w;
	return {
		id: t.id,
		number: String(t.number ?? "").trim().slice(0, 12),
		seats: clamp(Math.round(t.seats || 2), 1, 40),
		shape: TABLE_SHAPES.includes(t.shape) ? t.shape : "square",
		active: t.active !== false,
		w,
		h,
		x: clamp(snap(t.x || 0), 0, GRID.w - w),
		y: clamp(snap(t.y || 0), 0, GRID.h - h),
	};
}

/** True when the table's box shares floor area with any other table (touching edges is fine). */
export function overlapsOthers(tables, t) {
	return tables.some((o) => o.id !== t.id && t.x < o.x + o.w && t.x + t.w > o.x && t.y < o.y + o.h && t.y + t.h > o.y);
}

/** First free spot (left to right, top to bottom, one grid step apart) for a table of the given size, or null when the floor is full. */
export function findFreeSpot(tables, w = 100, h = w) {
	for (let y = 0; y <= GRID.h - h; y += GRID.step)
		for (let x = 0; x <= GRID.w - w; x += GRID.step) if (!overlapsOthers(tables, { id: "", x, y, w, h })) return { x, y };
	return null;
}

/** Next free numeric table number ("1", "2", ...). */
export function nextTableNumber(tables) {
	const used = new Set(tables.map((t) => String(t.number)));
	let n = 1;
	while (used.has(String(n))) n++;
	return String(n);
}

/** Error text when the number is empty or already used by another table, else "". */
export function tableNumberError(tables, table) {
	if (!table.number) return "Enter a table number.";
	return tables.some((t) => t.id !== table.id && t.number === table.number) ? "Table " + table.number + " already exists." : "";
}

/**
 * The guest Guest Manager (/GM) has seated at a table, as written to settings.gmSeating: { name (first name), fullName, customerId (POS customer id), phone, email, at },
 * or null. A record older than 12 hours is ignored, so a seating that was never closed in GM cannot linger on the floor.
 */
export function gmSeating(settings, tableId, now = Date.now()) {
	const g = (settings || {}).gmSeating?.[tableId];
	return g && now - Date.parse(g.at || 0) < 12 * 3600000 ? g : null;
}

/** How long before a booking the table already shows as reserved (the same hour as the GM Floor view). */
export const RESERVED_BEFORE_MIN = 60;

/**
 * The Guest Manager booking that holds this table at `now`, from settings.gmBookings ({ [tableId]: [{ name, party, date, time,
 * duration, status }] }), or null. A table is reserved only during the booking and the hour before it, never all day.
 */
export function gmBooking(settings, tableId, now = Date.now()) {
	const list = (settings || {}).gmBookings?.[tableId];
	if (!Array.isArray(list)) return null;
	return (
		list.find((b) => {
			const start = Date.parse(b.date + "T" + b.time); // local time, like the GM booking
			const end = start + (+b.duration || 90) * 60000;
			return start - RESERVED_BEFORE_MIN * 60000 <= now && now < end;
		}) || null
	);
}

/** { open: open order | null, free } for an active table. */
export function tableStatus(table, openOrders) {
	const open = openOrders.find((o) => o.status === "open" && o.orderReference === tableReference(table)) || null;
	return { open, free: !open };
}

/**
 * Where a check can go: every other active table (free = move there, busy = merge into its check) and open
 * orders that are not on a table (merge only). The check itself is excluded.
 */
export function moveTargets(order, tables, openOrders) {
	const open = openOrders.filter((o) => o.status === "open" && o.id !== order.id);
	const refs = new Set(tables.map(tableReference));
	const byTable = tables
		.filter((t) => t.active && tableReference(t) !== order.orderReference)
		.map((t) => ({ kind: "table", table: t, into: open.find((o) => o.orderReference === tableReference(t)) || null }));
	const loose = open.filter((o) => !refs.has(o.orderReference)).map((o) => ({ kind: "order", into: o }));
	return [...byTable, ...loose];
}
