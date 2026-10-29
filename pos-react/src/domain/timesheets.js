/**
 * Timesheets (pure): one row per clock-in with the employee, times, break and worked hours, plus a total per employee.
 * Hours are worked time minus breaks; an entry still clocked in counts up to `now`.
 */
const day = (iso) => String(iso || "").slice(0, 10);

export function timesheetRows(entries = [], users = [], { from, to }, { now = new Date(), locationId = "all", userId = "" } = {}) {
	const rows = entries
		.filter((e) => day(e.clockIn) >= from && day(e.clockIn) <= to)
		.filter((e) => !locationId || locationId === "all" || !e.locationId || e.locationId === locationId)
		.filter((e) => !userId || e.userId === userId)
		.map((e) => {
			const end = e.clockOut ? new Date(e.clockOut) : now;
			const breaks = (e.breaks || []).reduce((a, b) => a + Math.max(0, new Date(b.end || now) - new Date(b.start)), 0);
			const worked = Math.max(0, end - new Date(e.clockIn) - breaks);
			const u = users.find((x) => x.id === e.userId);
			return { id: e.id, userId: e.userId, employee: u?.name || "Unknown", role: u?.role || "", date: day(e.clockIn), clockIn: e.clockIn, clockOut: e.clockOut || "", open: !e.clockOut, breakHours: breaks / 3600000, hours: worked / 3600000 };
		})
		.sort((a, b) => String(b.clockIn).localeCompare(String(a.clockIn)));
	const totals = new Map();
	for (const r of rows) {
		const t = totals.get(r.userId) || { userId: r.userId, employee: r.employee, shifts: 0, hours: 0, breakHours: 0 };
		t.shifts += 1;
		t.hours += r.hours;
		t.breakHours += r.breakHours;
		totals.set(r.userId, t);
	}
	return { rows, totals: [...totals.values()].sort((a, b) => b.hours - a.hours), hours: rows.reduce((a, r) => a + r.hours, 0) };
}
