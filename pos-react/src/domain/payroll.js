/**
 * Payroll hours (pure): splits each employee's worked time into regular hours and overtime, from the Payroll settings.
 * Order of the rules, per payroll week: unpaid break time is taken off; each day is split by the daily overtime tiers; a 7th consecutive
 * day in the week uses the 7th-day tiers instead; then hours beyond the weekly limit turn regular hours into weekly overtime
 * (counting daily overtime toward the limit only when "carryover" is on). A shift belongs to the day it began.
 * TODO(spec): the 7th-day tiers have no hour thresholds in the spec; the first 8 hours use tier 1 and the rest tier 2.
 */
export const SEVENTH_DAY_TIER_HOURS = 8;
const HOUR = 3600000;
const DAY = 24 * HOUR;

/** Local date key (YYYY-MM-DD) of an instant. */
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Start of the payroll week containing `date`: the latest "weekDay at weekTime" (0 = Sunday ... 6 = Saturday) at or before it. */
export function payrollWeekStart(date, { weekDay = 1, weekTime = "00:00" } = {}) {
	const [h, m] = String(weekTime).split(":").map(Number);
	const start = new Date(date);
	start.setHours(h || 0, m || 0, 0, 0);
	start.setDate(start.getDate() - ((start.getDay() - weekDay + 7) % 7));
	if (start > date) start.setDate(start.getDate() - 7);
	return start;
}

/** Hours worked in one time entry: end (or `now`) minus start, less the unpaid part of breaks (all of a break, or only what exceeds the paid break length). */
export function entryHours(entry, opts = {}, now = new Date()) {
	const end = entry.clockOut ? new Date(entry.clockOut) : now;
	const paidMs = opts.paidBreaksOn ? Math.max(0, Number(opts.paidBreakMin) || 0) * 60000 : 0;
	const unpaid = (entry.breaks || []).reduce((a, b) => {
		const len = Math.max(0, new Date(b.end || end) - new Date(b.start));
		return a + Math.max(0, len - paidMs);
	}, 0);
	return Math.max(0, end - new Date(entry.clockIn) - unpaid) / HOUR;
}

const split = (h, a1, a2) => {
	const ot2 = Math.max(0, h - a2);
	const ot1 = Math.max(0, Math.min(h, a2) - a1);
	return { regular: h - ot1 - ot2, ot1, ot2 };
};

/** One employee's days of a payroll week: `days` = [{ date, hours }] in date order. Returns [{ date, regular, weeklyOt, ot1, ot2, s1, s2 }]. */
export function splitWeek(days, opts, weekStart) {
	const worked = new Set(days.filter((d) => d.hours > 0).map((d) => d.date));
	const seventh = opts.seventhOn && Array.from({ length: 7 }, (_, i) => key(new Date(weekStart.getTime() + i * DAY + 12 * HOUR))).every((k) => worked.has(k));
	const seventhDate = seventh ? key(new Date(weekStart.getTime() + 6 * DAY + 12 * HOUR)) : "";
	let counted = 0;
	return [...days]
		.sort((a, b) => a.date.localeCompare(b.date))
		.map(({ date, hours: h }) => {
			let row = { date, regular: h, weeklyOt: 0, ot1: 0, ot2: 0, s1: 0, s2: 0 };
			if (date === seventhDate) {
				const s1 = Math.min(h, SEVENTH_DAY_TIER_HOURS);
				row = { ...row, regular: 0, s1, s2: h - s1 };
			} else if (opts.dailyOn) {
				const t = split(h, Number(opts.d1After), Number(opts.d2After));
				row = { ...row, regular: t.regular, ot1: t.ot1, ot2: t.ot2 };
			}
			if (opts.weeklyOn) {
				const add = opts.carryover ? h : row.regular;
				const limit = Number(opts.weeklyAfter);
				const over = Math.max(0, counted + add - limit) - Math.max(0, counted - limit);
				const move = Math.min(over, row.regular);
				row = { ...row, regular: row.regular - move, weeklyOt: move };
				counted += add;
			}
			return row;
		});
}

/**
 * Every employee-day inside a date range ({from, to}, YYYY-MM-DD), split into pay buckets, using whole payroll weeks so a week that starts
 * before the range is still counted correctly. Returns [{ userId, date, regular, weeklyOt, ot1, ot2, s1, s2 }].
 */
export function payrollDays(entries, range, opts, now = new Date()) {
	const byUser = new Map();
	for (const e of entries) {
		const start = new Date(e.clockIn);
		if (Number.isNaN(+start)) continue;
		const wk = payrollWeekStart(start, opts);
		const u = byUser.get(e.userId) || new Map();
		const w = u.get(+wk) || { start: wk, days: new Map() };
		const d = key(start);
		w.days.set(d, (w.days.get(d) || 0) + entryHours(e, opts, now));
		u.set(+wk, w);
		byUser.set(e.userId, u);
	}
	const out = [];
	for (const [userId, weeks] of byUser)
		for (const w of weeks.values())
			for (const r of splitWeek([...w.days].map(([date, hours]) => ({ date, hours })), opts, w.start)) if (r.date >= range.from && r.date <= range.to) out.push({ userId, ...r });
	return out;
}

const sumBuckets = (rows) => rows.reduce((b, r) => ({ regular: b.regular + r.regular, weeklyOt: b.weeklyOt + r.weeklyOt, ot1: b.ot1 + r.ot1, ot2: b.ot2 + r.ot2, s1: b.s1 + r.s1, s2: b.s2 + r.s2 }), { regular: 0, weeklyOt: 0, ot1: 0, ot2: 0, s1: 0, s2: 0 });
export const bucketHours = (b) => b.regular + b.weeklyOt + b.ot1 + b.ot2 + b.s1 + b.s2;

/**
 * Hours per employee for a date range. Returns [{ userId, regular, ot, ot2, total, buckets }]: `ot` = weekly + daily tier 1 + 7th-day tier 1,
 * `ot2` = daily tier 2 + 7th-day tier 2.
 */
export function payrollHours(entries, range, opts, now = new Date()) {
	const days = payrollDays(entries, range, opts, now);
	const ids = [...new Set(days.map((d) => d.userId))];
	return ids
		.map((userId) => {
			const b = sumBuckets(days.filter((d) => d.userId === userId));
			return { userId, regular: b.regular, ot: b.weeklyOt + b.ot1 + b.s1, ot2: b.ot2 + b.s2, total: bucketHours(b), buckets: b };
		})
		.filter((r) => r.total > 0);
}

/** Pay for the hours in `buckets` at an hourly `rate`, applying the multipliers from the settings. */
export const payCost = (b, rate, o) => rate * (b.regular + b.weeklyOt * Number(o.weeklyMult) + b.ot1 * Number(o.d1Mult) + b.ot2 * Number(o.d2Mult) + b.s1 * Number(o.s1Mult) + b.s2 * Number(o.s2Mult));
