/**
 * Restaurant floor plan helpers (pure): table normalising, numbering and live status from open orders.
 * A table's open order is the one whose order reference is "Table <number>".
 */
export const TABLE_SHAPES = ["square", "round", "rect"];
export const GRID = { w: 900, h: 560, min: 50, max: 300, step: 10 };

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+n) ? +n : lo));
const snap = (n) => Math.round(n / GRID.step) * GRID.step;

export const tableReference = (t) => "Table " + t.number;

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

/** { open: open order | null, free } for an active table. */
export function tableStatus(table, openOrders) {
	const open = openOrders.find((o) => o.status === "open" && o.orderReference === tableReference(table)) || null;
	return { open, free: !open };
}
