/**
 * Staff actions: clock in/out, breaks, the cash register (it opens when the person clocks in and closes, with the
 * expected-versus-counted variance, when they clock out), and saving or deleting POS users (PIN rules, last-owner protection).
 */
import { T } from "../../db/tables";
import { nowIso } from "../../domain/format";
import { autoClockOutDue, resolveOptions } from "../../domain/systemOptions";
import { activeTimeEntry, currentCashShift, expectedCash } from "../../domain/sales";
import { subscriptionOf, userLimitError } from "../../config/subscription";
import { createLogger } from "../../utils/logger";
import { markDeleted, newId, stamp } from "./common";
import { patchSettings } from "./settings";

const log = createLogger("staff");

/** Attendance, cash-register shifts and user management. */

export async function clockInAndOpenRegister(ctx, openingCash) {
	const { session } = ctx;
	const s = session();
	if (!Number.isFinite(openingCash) || openingCash < 0) {
		await ctx.ui.alert("Enter a valid cash amount.");
		return false;
	}
	const now = nowIso();
	await ctx.store.write((tx) => {
		tx.put(T.timeEntries, stamp({ id: newId("t"), userId: s.userId, clockIn: now, breaks: [] }, s));
		tx.put(T.cashShifts, stamp({ id: newId("cs"), userId: s.userId, openedAt: now, openingCash, status: "open" }, s));
	});
	log.info("clocked in and register opened", { userId: s.userId, openingCash });
	return true;
}

/** Clock in without a cash register (businesses that do not use register shifts). */
export async function clockIn(ctx) {
	const s = ctx.session();
	if (activeTimeEntry(ctx.data().timeEntries, s.userId)) return false;
	await ctx.store.write((tx) => tx.put(T.timeEntries, stamp({ id: newId("t"), userId: s.userId, clockIn: nowIso(), breaks: [] }, s)));
	log.info("clocked in", { userId: s.userId });
	return true;
}

/**
 * Clock out. A person with an open cash register closes it at the same time: `actualCash` is the cash counted in the drawer, and the
 * difference from the expected cash is recorded on the shift. Returns false (nothing changes) when a count is needed and is missing.
 */
export async function clockOut(ctx, actualCash) {
	const s = ctx.session();
	const d = ctx.data();
	const entry = activeTimeEntry(d.timeEntries, s.userId);
	const shift = currentCashShift(d.cashShifts, s.userId);
	if (!entry && !shift) return false;
	if (shift && (!Number.isFinite(actualCash) || actualCash < 0)) {
		await ctx.ui.alert("Count the cash in the drawer to clock out.");
		return false;
	}
	const at = nowIso();
	const expected = shift ? expectedCash(shift, d.sales) : 0;
	await ctx.store.write((tx) => {
		if (shift) tx.put(T.cashShifts, { ...shift, expectedCash: expected, actualCash, variance: actualCash - expected, closedAt: at, status: "closed" });
		if (entry) {
			const breaks = (entry.breaks || []).map((b) => ({ ...b }));
			const last = breaks[breaks.length - 1];
			if (last && !last.end) last.end = at;
			tx.put(T.timeEntries, { ...entry, breaks, clockOut: at });
		}
	});
	log.info("clocked out", { userId: s.userId, registerClosed: !!shift, expected, actual: actualCash });
	return true;
}

/**
 * Settings > System Options > Clock In / Out: clocks out whoever has been on too long, or is still on after the daily clock-out time.
 * Their cash register closes with them, counted as exactly the expected cash (no difference is recorded; the drawer still needs counting).
 * Returns how many people were clocked out.
 */
export async function autoClockOutAll(ctx, now = new Date()) {
	const d = ctx.data();
	const due = d.timeEntries.filter((e) => !e.clockOut && autoClockOutDue(e, resolveOptions(d.settings, "clock", e.locationId || "all"), now));
	if (!due.length) return 0;
	const at = now.toISOString();
	await ctx.store.write((tx) =>
		due.forEach((e) => {
			const breaks = (e.breaks || []).map((b) => ({ ...b }));
			const last = breaks[breaks.length - 1];
			if (last && !last.end) last.end = at;
			tx.put(T.timeEntries, { ...e, breaks, clockOut: at });
			const shift = currentCashShift(d.cashShifts, e.userId);
			if (shift) {
				const expected = expectedCash(shift, d.sales);
				tx.put(T.cashShifts, { ...shift, expectedCash: expected, actualCash: expected, variance: 0, closedAt: at, status: "closed" });
			}
		}),
	);
	log.info("auto clocked out", { people: due.length });
	return due.length;
}

export async function toggleBreak(ctx) {
	const s = ctx.session();
	const entry = activeTimeEntry(ctx.data().timeEntries, s.userId);
	if (!entry) return;
	const breaks = (entry.breaks || []).map((b) => ({ ...b }));
	const last = breaks[breaks.length - 1];
	if (last && !last.end) last.end = nowIso();
	else breaks.push({ start: nowIso() });
	await ctx.store.write((tx) => tx.put(T.timeEntries, { ...entry, breaks }));
}

export async function saveUser(ctx, form) {
	const d = ctx.data();
	const { id, name, pin, role, active } = form;
	if (!name.trim()) return void (await ctx.ui.alert("Enter the user name."));
	if (!/^\d{4,6}$/.test(pin.trim())) return void (await ctx.ui.alert("PIN must contain 4 to 6 digits."));
	if (d.users.some((u) => u.id !== id && u.pin === pin.trim()))
		return void (await ctx.ui.alert("This PIN is already used by another user."));
	const access = form.locationAccess || "selected";
	const ids = form.locationIds || [];
	if (ctx.features()["business.locations"] && access === "selected" && !ids.length && role !== "owner")
		return void (await ctx.ui.alert("Choose at least one location for this user."));
	const existing = d.users.find((u) => u.id === id);
	// only an owner or admin can give the owner or admin role
	if (["owner", "admin"].includes(role) && !["owner", "admin"].includes(ctx.session().user?.role) && existing?.role !== role)
		return void (await ctx.ui.alert("Only an owner or admin can give the owner or admin role."));
	// the plan assigned in the admin portal limits how many users can be active
	if (active !== false && (!existing || existing.active === false)) {
		const limit = userLimitError(subscriptionOf(d.settings), d.users, id);
		if (limit) return void (await ctx.ui.alert(limit));
	}
	const user = {
		...(existing || { id: newId("u"), createdAt: nowIso() }),
		name: name.trim(),
		pin: pin.trim(),
		role,
		active,
		clockInBehaviour: form.clockInBehaviour || "prompt",
		registerBehaviour: form.registerBehaviour || "prompt",
		locationAccess: role === "owner" ? "all" : access,
		locationIds: role === "owner" || access === "all" ? [] : ids,
	};
	await ctx.store.write((tx) => tx.put(T.users, user));
	// Never log the PIN; role/active changes are the audit-relevant facts.
	log.info(existing ? "user updated" : "user created", {
		userId: user.id,
		role: user.role,
		active: user.active,
		previousRole: existing?.role,
		by: ctx.session().userId,
	});
	return user;
}

export async function deleteUser(ctx, id) {
	const s = ctx.session();
	const d = ctx.data();
	const actor = s.user;
	if (!actor || !["owner", "admin"].includes(actor.role)) return void ctx.ui.notice("Only the owner or an admin can delete users.");
	const user = d.users.find((u) => String(u.id) === String(id));
	if (!user) return;
	if (user.id === s.userId) return void (await ctx.ui.alert("You cannot delete the user currently signed in."));
	if (user.role === "owner" && d.users.filter((u) => u.role === "owner" && u.active !== false).length <= 1)
		return void (await ctx.ui.alert("The last active owner cannot be deleted."));
	if (!(await ctx.ui.confirm("Permanently delete " + user.name + "?"))) return;
	await ctx.store.write(async (tx) => {
		await markDeleted(tx, "users", user.id);
		tx.remove(T.users, user.id);
	});
	// their jobs and permission changes go with them
	if (d.settings.userAccess?.[user.id]) await patchSettings(ctx, { userAccess: Object.fromEntries(Object.entries(d.settings.userAccess).filter(([k]) => k !== user.id)) });
	log.warn("user deleted", { userId: user.id, role: user.role, by: s.userId });
	ctx.ui.notice(user.name + " was permanently deleted.");
}
