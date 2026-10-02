import { T } from "../../db/tables";
import { nowIso } from "../../domain/format";
import { activeTimeEntry, currentCashShift, expectedCash } from "../../domain/sales";
import { createLogger } from "../../utils/logger";
import { markDeleted, newId, stamp } from "./common";

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

export async function clockOut(ctx) {
	const s = ctx.session();
	const d = ctx.data();
	const entry = activeTimeEntry(d.timeEntries, s.userId);
	if (!entry) return false;
	if (currentCashShift(d.cashShifts, s.userId)) {
		await ctx.ui.alert("Close the cash register before clocking out.");
		return false;
	}
	const breaks = (entry.breaks || []).map((b) => ({ ...b }));
	const last = breaks[breaks.length - 1];
	if (last && !last.end) last.end = nowIso();
	await ctx.store.write((tx) => tx.put(T.timeEntries, { ...entry, breaks, clockOut: nowIso() }));
	log.info("clocked out", { userId: s.userId });
	return true;
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

export async function openRegister(ctx, amount) {
	const s = ctx.session();
	if (!Number.isFinite(amount) || amount < 0) {
		await ctx.ui.alert("Enter a valid cash amount.");
		return false;
	}
	if (!activeTimeEntry(ctx.data().timeEntries, s.userId)) {
		await ctx.ui.alert("Clock in before opening the register.");
		return false;
	}
	await ctx.store.write((tx) =>
		tx.put(T.cashShifts, stamp({ id: newId("cs"), userId: s.userId, openedAt: nowIso(), openingCash: amount, status: "open" }, s)),
	);
	log.info("register opened", { userId: s.userId, openingCash: amount });
	return true;
}

export async function closeRegister(ctx, actual) {
	const s = ctx.session();
	const d = ctx.data();
	const shift = currentCashShift(d.cashShifts, s.userId);
	if (!shift) return false;
	if (!Number.isFinite(actual) || actual < 0) {
		await ctx.ui.alert("Enter a valid cash amount.");
		return false;
	}
	const expected = expectedCash(shift, d.sales);
	await ctx.store.write((tx) =>
		tx.put(T.cashShifts, {
			...shift,
			expectedCash: expected,
			actualCash: actual,
			variance: actual - expected,
			closedAt: nowIso(),
			status: "closed",
		}),
	);
	log.info("register closed", { userId: s.userId, shiftId: shift.id, expected, actual, variance: actual - expected });
	return true;
}

/** @returns the saved user or null after showing a validation message. */
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
	log.warn("user deleted", { userId: user.id, role: user.role, by: s.userId });
	ctx.ui.notice(user.name + " was permanently deleted.");
}
