/**
 * Guest Manager (GM) pure logic: time maths, table availability, waitlist estimate, guest stats and loyalty,
 * POS bill matching, reports and message templates. No DOM, no network, so it can be tested in Node.
 */
export const STATUSES = { booked: "Booked", confirmed: "Confirmed", arrived: "Arrived", seated: "Seated", completed: "Completed", cancelled: "Cancelled", no_show: "No-show" };
/** Statuses that hold a table. */
export const ACTIVE = ["booked", "confirmed", "arrived", "seated"];
export const SOURCES = ["Phone", "Walk-in", "WhatsApp", "Website", "Instagram", "Google", "Staff", "Other"];

export const DEFAULT_SETTINGS = {
	id: "settings",
	services: [
		{ name: "Lunch", start: "11:30", end: "15:00", duration: 90 },
		{ name: "Dinner", start: "18:00", end: "22:30", duration: 120 },
	],
	slotStep: 30,
	buffer: 10,
	noShowLimit: 3,
	spendPerPoint: 100,
	silverVisits: 5,
	goldVisits: 15,
	countryCode: "94",
	posSync: true,
	layoutFrom: "pos",
	locationId: "",
	ownFloors: [{ id: "main", name: "Main floor" }],
	ownTables: [],
	templates: {
		confirm: "Hi {name}, your table for {party} at {business} is booked for {date} at {time}. Reply to change or cancel.",
		reminder: "Hi {name}, a reminder of your table for {party} at {business} on {date} at {time}. See you soon!",
		change: "Hi {name}, your booking at {business} has changed: {party} guests on {date} at {time}.",
		cancel: "Hi {name}, your booking at {business} on {date} at {time} has been cancelled. We hope to see you another time.",
		followup: "Hi {name}, thank you for dining with {business}. We would love to hear how it was!",
		waitlist: "Hi {name}, your table for {party} at {business} is ready. Please come to the host stand.",
	},
};

// ---------------------------------------------------------------- time
const pad = (n) => String(n).padStart(2, "0");
export const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (s, n) => {
	const d = new Date(s + "T12:00:00");
	d.setDate(d.getDate() + n);
	return dateStr(d);
};
export const toMin = (t) => {
	const [h, m] = String(t || "0:0").split(":");
	return (+h || 0) * 60 + (+m || 0);
};
export const fromMin = (n) => `${pad(Math.floor(n / 60) % 24)}:${pad(n % 60)}`;
export const monthOf = (s) => String(s).slice(0, 7);
export const nowMin = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
export const endMin = (r) => toMin(r.time) + (+r.duration || 90);

// ---------------------------------------------------------------- availability
// ponytail: bookings are treated within one calendar day (no overnight stays); add a date-time span if a venue needs after-midnight seatings.
/** Active reservations that hold this table on this date and overlap [time, time+duration) including the turnaround buffer. */
export function conflicts(tableId, date, time, duration, reservations, { exclude = "", buffer = 0 } = {}) {
	const s = toMin(time),
		e = s + (+duration || 90);
	return reservations.filter(
		(r) => r.id !== exclude && r.date === date && ACTIVE.includes(r.status) && (r.tableIds || []).includes(tableId) && s < endMin(r) + buffer && toMin(r.time) < e + buffer,
	);
}

export const isFree = (tableId, date, time, duration, reservations, opts) => conflicts(tableId, date, time, duration, reservations, opts).length === 0;

/** Best tables for a party: the smallest free table that fits, else the smallest free pair that fits together, else []. */
export function suggestTables(tables, reservations, { date, time, party, duration, exclude = "", buffer = 0 }) {
	const free = tables.filter((t) => t.active !== false && isFree(t.id, date, time, duration, reservations, { exclude, buffer }));
	const single = free.filter((t) => t.seats >= party).sort((a, b) => a.seats - b.seats)[0];
	if (single) return [single.id];
	let best = null;
	for (let i = 0; i < free.length; i++)
		for (let j = i + 1; j < free.length; j++) {
			if ((free[i].floor || "main") !== (free[j].floor || "main")) continue; // tables are only joined on the same floor
			const seats = free[i].seats + free[j].seats;
			if (seats >= party && (!best || seats < best.seats)) best = { seats, ids: [free[i].id, free[j].id] };
		}
	return best ? best.ids : [];
}

/** Bookable start times of a service on a date for a party: [{ time, tableIds }]. */
export function slotsFor(service, tables, reservations, { date, party, buffer = 0, step = 30 }) {
	const duration = +service.duration || 90,
		out = [];
	for (let m = toMin(service.start); m + duration <= toMin(service.end) + 1; m += step) {
		const time = fromMin(m),
			tableIds = suggestTables(tables, reservations, { date, time, party, duration, buffer });
		if (tableIds.length) out.push({ time, tableIds });
	}
	return out;
}

/** Minutes a party of this size must wait for a table right now (0 = a table is free), or null when no table is big enough. */
export function waitMinutes(tables, reservations, { date, party, now, duration = 90, buffer = 0 }) {
	const fit = tables.filter((t) => t.active !== false && t.seats >= party);
	if (!fit.length) return null;
	let best = Infinity;
	for (const t of fit) {
		const busy = conflicts(t.id, date, fromMin(now), duration, reservations, { buffer });
		best = Math.min(best, busy.length ? Math.max(0, Math.max(...busy.map((r) => endMin(r))) + buffer - now) : 0);
	}
	return best;
}

/** Service whose window contains this time, else the first. */
export const serviceAt = (services, time) => services.find((s) => toMin(time) >= toMin(s.start) && toMin(time) <= toMin(s.end)) || services[0];

// ---------------------------------------------------------------- guests, loyalty, POS bills
export const phoneKey = (v) => String(v || "").replace(/\D/g, "");
export const samePhone = (a, b) => phoneKey(a).length >= 7 && phoneKey(a).slice(-9) === phoneKey(b).slice(-9);
export const waPhone = (v, cc = "94") => {
	let d = phoneKey(v);
	if (d.startsWith("0")) d = cc + d.slice(1);
	return d;
};

/** The sales that belong to a reservation: same table check, rung up after the party was seated (until 3 h after it finished). */
export function billsFor(res, sales, guest, nums = {}) {
	if (!res.seatedAt) return [];
	const refs = new Set((res.tableIds || []).map((id) => nums[id]).filter(Boolean).map((n) => "Table " + n));
	const from = Date.parse(res.seatedAt),
		to = (res.completedAt ? Date.parse(res.completedAt) : Date.now()) + 3 * 3600000;
	return sales.filter((s) => {
		const at = Date.parse(s.createdAt || s.date + "T12:00:00");
		const mine = refs.has(s.orderReference) || (guest?.posCustomerId && s.customerId === guest.posCustomerId);
		return mine && at >= from - 60000 && at <= to;
	});
}

export const billTotals = (bills) => ({
	count: bills.length,
	paid: bills.filter((s) => s.status !== "voided").reduce((a, s) => a + (+s.total || 0), 0),
	discount: bills.reduce((a, s) => a + (+s.discount?.amount || 0), 0),
	refunded: bills.reduce((a, s) => a + (s.refunds || []).reduce((x, r) => x + (+r.amount || 0), 0), 0),
});

/** Visits, no-shows, spend, loyalty points and tier of one guest. `spend` comes from matched POS bills (0 when not linked). */
export function guestStats(guest, reservations, settings, spend = 0) {
	const mine = reservations.filter((r) => r.guestId === guest.id);
	const visits = mine.filter((r) => r.status === "completed").length;
	const noShows = mine.filter((r) => r.status === "no_show").length;
	const cancels = mine.filter((r) => r.status === "cancelled").length;
	const last = mine.filter((r) => r.status === "completed").map((r) => r.date).sort().pop() || "";
	const points = visits * 10 + Math.floor(spend / (settings.spendPerPoint || 100));
	const tier = visits >= settings.goldVisits ? "Gold" : visits >= settings.silverVisits ? "Silver" : "Bronze";
	return { visits, noShows, cancels, last, spend, points, tier, risky: noShows >= settings.noShowLimit };
}

/**
 * Who is seated at which table, for the POS: { [tableId]: { name (first name), party, resId, at, customerId?, phone? } }.
 * customerId is the guest's POS customer (or the id GM will give them), with fullName, phone and email, so the POS can put that
 * customer on the table's check and add them to its customer list if they are not there yet. Guests without a usable phone number have none.
 */
export function seatingMap(reservations, guests) {
	const out = {};
	for (const r of reservations.filter((x) => x.status === "seated")) {
		const g = guests.find((x) => x.id === r.guestId);
		const entry = { name: String(r.name || "").trim().split(/\s+/)[0] || "Guest", party: +r.party || 0, resId: r.id, at: r.seatedAt || r.updatedAt || "", ...(g && phoneKey(g.phone).length >= 7 ? { customerId: g.posCustomerId || "c-gm-" + g.id, fullName: g.name, phone: g.phone, email: g.email || "" } : {}) };
		for (const id of r.tableIds || []) out[id] = entry;
	}
	return out;
}

export function mergeRows(remote, local) {
	const rows = new Map((remote || []).map((r) => [r.id, r]));
	for (const r of local || []) {
		const old = rows.get(r.id);
		if (!old || (r.updatedAt || "") >= (old.updatedAt || "")) rows.set(r.id, r);
	}
	return [...rows.values()];
}

// ---------------------------------------------------------------- reports
/** Open minutes in a day: from the first service start to the last service end. */
export const openMinutes = (services) => (services.length ? Math.max(...services.map((s) => toMin(s.end))) - Math.min(...services.map((s) => toMin(s.start))) : 720);

/** Report over reservations already filtered to the range. `revenue` maps reservation id -> POS revenue. */
export function buildReport(reservations, tables, settings, { from, to, revenue = {}, allReservations = reservations }) {
	const count = (f) => reservations.filter(f).length;
	const days = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1);
	const served = reservations.filter((r) => ["seated", "completed"].includes(r.status));
	const bySource = {};
	for (const r of reservations) {
		const s = (bySource[r.source || "Other"] ||= { bookings: 0, covers: 0, revenue: 0 });
		s.bookings++;
		s.covers += +r.party || 0;
		s.revenue += revenue[r.id] || 0;
	}
	const cap = openMinutes(settings.services) * days;
	const util = tables.map((t) => {
		const mins = reservations.filter((r) => ACTIVE.includes(r.status) || r.status === "completed").filter((r) => (r.tableIds || []).includes(t.id)).reduce((a, r) => a + (+r.duration || 90), 0);
		return { table: t.number, seats: t.seats, minutes: mins, pct: Math.min(100, Math.round((mins / cap) * 100)) };
	});
	const byDay = {};
	for (const r of reservations) byDay[r.date] = (byDay[r.date] || 0) + 1;
	const reasons = {};
	for (const r of reservations.filter((x) => x.status === "cancelled")) reasons[r.cancelReason || "No reason given"] = (reasons[r.cancelReason || "No reason given"] || 0) + 1;
	const guests = new Set(served.filter((r) => r.guestId).map((r) => r.guestId));
	const repeat = [...guests].filter((g) => allReservations.filter((r) => r.guestId === g && r.status === "completed").length >= 2).length;
	return {
		total: reservations.length,
		covers: reservations.reduce((a, r) => a + (+r.party || 0), 0),
		completed: count((r) => r.status === "completed"),
		cancelled: count((r) => r.status === "cancelled"),
		noShows: count((r) => r.status === "no_show"),
		walkIns: count((r) => r.walkIn),
		cancelRate: reservations.length ? Math.round((count((r) => r.status === "cancelled") / reservations.length) * 100) : 0,
		noShowRate: reservations.length ? Math.round((count((r) => r.status === "no_show") / reservations.length) * 100) : 0,
		revenue: Object.values(revenue).reduce((a, b) => a + b, 0),
		repeatGuests: repeat,
		guestsServed: guests.size,
		bySource,
		util,
		byDay,
		reasons,
	};
}

// ---------------------------------------------------------------- messages, csv
export const fill = (tpl, v) => String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
export const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

// ---------------------------------------------------------------- floors and table layout
// Same rules as the POS floor plan (pos-react/src/domain/tables.js): a 900 x 560 floor on a 10 unit grid; keep the two in step.
export const GRID = { w: 900, h: 560, min: 50, max: 300, step: 10 };
export const TABLE_SHAPES = ["square", "round", "rect"];
export const MAIN_FLOOR = "main";
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+n) ? +n : lo));
const snap = (n) => Math.round(n / GRID.step) * GRID.step;

/** Safe table from user input or saved data: snapped size and position kept inside the floor. */
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
export const overlapsOthers = (tables, t) => tables.some((o) => o.id !== t.id && t.x < o.x + o.w && t.x + t.w > o.x && t.y < o.y + o.h && t.y + t.h > o.y);
export function findFreeSpot(tables, w = 100, h = w) {
	for (let y = 0; y <= GRID.h - h; y += GRID.step)
		for (let x = 0; x <= GRID.w - w; x += GRID.step) if (!overlapsOthers(tables, { id: "", x, y, w, h })) return { x, y };
	return null;
}
export function nextTableNumber(tables) {
	const used = new Set(tables.map((t) => String(t.number)));
	let n = 1;
	while (used.has(String(n))) n++;
	return String(n);
}
/** First problem with a layout (floors: [{id,name}], byFloor: { floorId: tables }), or "". Numbers are unique across all floors. */
export function layoutError(floors, byFloor) {
	if (!floors.length) return "Keep at least one floor.";
	const names = new Set();
	for (const f of floors) {
		const n = String(f.name || "").trim().toLowerCase();
		if (!n) return "Every floor needs a name.";
		if (names.has(n)) return "Two floors are called " + f.name + ".";
		names.add(n);
	}
	const seen = new Set();
	for (const f of floors)
		for (const t of byFloor[f.id] || []) {
			if (!t.number) return "Every table needs a number.";
			if (seen.has(t.number)) return "Table " + t.number + " appears twice. Table numbers must be different on every floor.";
			seen.add(t.number);
		}
	return "";
}

/**
 * The venue's own tables (used when the layout does not come from the POS), each with its floor. Tables that have no position yet
 * (made before the editor existed) are laid out on a grid on their floor: five to a row, round for two-seaters.
 */
export function ownLayout(list) {
	const placed = new Map();
	return list.map((t) => {
		const floor = t.floor || MAIN_FLOOR;
		if (t.x != null && t.y != null) return { ...normalizeTable(t), floor };
		const i = placed.get(floor) || 0;
		placed.set(floor, i + 1);
		const peers = list.filter((x) => (x.floor || MAIN_FLOOR) === floor).length;
		const cols = 5, rows = Math.max(1, Math.ceil(peers / cols)), cw = 170, ch = Math.min(160, Math.floor(540 / rows)), size = Math.min(110, ch - 30), seats = +t.seats || 2;
		return { ...normalizeTable({ id: t.id, number: t.number, seats, shape: seats <= 2 ? "round" : "square", w: size, h: size, x: 25 + (i % cols) * cw + Math.floor((cw - size) / 2) - 10, y: 15 + Math.floor(i / cols) * ch }), floor };
	});
}
