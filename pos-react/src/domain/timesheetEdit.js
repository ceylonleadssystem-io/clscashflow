/**
 * Editing timesheets (pure). A shift (clock in, clock out, breaks) can be corrected or added by someone with the "Edit timesheets" permission, with these rules:
 *  - a shift cannot start before the day its employee was created;
 *  - a shift that began more than one month ago is locked: it can no longer be changed, deleted or have a shift added in its place;
 *  - times cannot be in the future, a shift runs at most 24 hours, breaks sit inside the shift and do not overlap, and shifts of one person do not overlap.
 * Every change is written to the audit log (see `diffEntry`), which feeds Reports > Audit Trail > Timesheet Audit.
 */
export const LOCK_MONTHS = 1;
export const MAX_SHIFT_MS = 24 * 3600000;
export const AUDIT_ACTION = "timesheet-edited";

/** The moment before which a shift can no longer be changed: one calendar month before `now`. */
export function lockDate(now = new Date()) {
	const d = new Date(now);
	d.setMonth(d.getMonth() - LOCK_MONTHS);
	return d;
}
export const entryLocked = (entry, now = new Date()) => !!entry?.clockIn && new Date(entry.clockIn) < lockDate(now);

const ms = (iso) => new Date(iso).getTime();
const valid = (iso) => Number.isFinite(ms(iso));
const dayOf = (iso) => String(iso || "").slice(0, 10);

/** Why a shift cannot be saved ("" when it can). `form` is { userId, clockIn, clockOut, breaks: [{ start, end }] }; `others` are the person's other shifts. */
export function entryError(form, { user, others = [], now = new Date(), existing = null } = {}) {
	if (!user) return "Choose the employee.";
	if (existing && entryLocked(existing, now)) return "This shift is more than a month old and can no longer be changed.";
	if (!valid(form.clockIn)) return "Enter the time the shift started.";
	if (entryLocked({ clockIn: form.clockIn }, now)) return `A shift can only be set in the last month (from ${lockDate(now).toLocaleDateString()}).`;
	if (user.createdAt && dayOf(form.clockIn) < dayOf(user.createdAt)) return `${user.name} was added on ${dayOf(user.createdAt)}. A shift cannot start before that day.`;
	if (ms(form.clockIn) > +now + 60000) return "The start time is in the future.";
	const out = form.clockOut ? ms(form.clockOut) : null;
	if (form.clockOut) {
		if (!valid(form.clockOut)) return "Enter the time the shift ended.";
		if (out <= ms(form.clockIn)) return "The shift must end after it started.";
		if (out > +now + 60000) return "The end time is in the future.";
		if (out - ms(form.clockIn) > MAX_SHIFT_MS) return "A shift can be at most 24 hours. Split a longer one into two.";
	}
	if (!form.clockOut && others.some((o) => (!existing || o.id !== existing.id) && !o.clockOut)) return "This person is already clocked in on another shift.";
	const end = out ?? +now;
	for (const o of others) {
		if (existing && o.id === existing.id) continue;
		const oe = o.clockOut ? ms(o.clockOut) : +now;
		if (ms(form.clockIn) < oe && end > ms(o.clockIn)) return "This overlaps another shift of the same person.";
	}
	const breaks = (form.breaks || []).filter((b) => b.start || b.end);
	for (const b of breaks) {
		if (!valid(b.start)) return "Enter when each break started.";
		if (b.end && !valid(b.end)) return "Enter when each break ended.";
		if (ms(b.start) < ms(form.clockIn) || (out != null && ms(b.start) > out)) return "A break must be inside the shift.";
		if (b.end && (ms(b.end) <= ms(b.start) || (out != null && ms(b.end) > out))) return "A break must end after it started, inside the shift.";
		if (!b.end && form.clockOut) return "A break on a finished shift needs an end time.";
	}
	const sorted = [...breaks].sort((a, b) => ms(a.start) - ms(b.start));
	for (let i = 1; i < sorted.length; i++) if (ms(sorted[i].start) < (sorted[i - 1].end ? ms(sorted[i - 1].end) : Infinity)) return "Breaks overlap.";
	return "";
}

/** What changed between two versions of a shift: [{ field, old, new }] with readable values (times as ISO text). */
export function diffEntry(before, after) {
	const out = [];
	const t = (v) => (v ? new Date(v).toISOString() : "");
	if (!before) return [{ field: "Shift", old: "", new: `${t(after.clockIn)} to ${t(after.clockOut) || "still clocked in"}` }];
	if (!after) return [{ field: "Shift", old: `${t(before.clockIn)} to ${t(before.clockOut) || "still clocked in"}`, new: "Deleted" }];
	if (t(before.clockIn) !== t(after.clockIn)) out.push({ field: "Clock in", old: t(before.clockIn), new: t(after.clockIn) });
	if (t(before.clockOut) !== t(after.clockOut)) out.push({ field: "Clock out", old: t(before.clockOut), new: t(after.clockOut) });
	const b = (e) => (e.breaks || []).filter((x) => x.start).map((x) => `${t(x.start)}-${t(x.end)}`).join("; ");
	if (b(before) !== b(after)) out.push({ field: "Breaks", old: b(before), new: b(after) });
	return out;
}

/** The audit text for one change (stored in the audit log's details) and its reading back. */
export const auditDetails = ({ userId, entryId, change, reason }) => JSON.stringify({ u: userId, e: entryId, f: change.field, o: change.old, n: change.new, r: reason || "" });
export function readAudit(details) {
	try {
		const d = JSON.parse(details);
		return { userId: d.u, entryId: d.e, field: d.f, old: d.o, new: d.n, reason: d.r || "" };
	} catch {
		return null;
	}
}

/** `<input type="datetime-local">` value from an ISO time, and back. */
export const toLocalInput = (iso) => {
	if (!iso || !valid(iso)) return "";
	const d = new Date(iso);
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : "");
