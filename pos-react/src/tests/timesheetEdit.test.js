import { beforeEach, describe, expect, it } from "vitest";
import { createHarness } from "./harness";
import { T } from "../db/tables";
import { diffEntry, entryError, entryLocked, fromLocalInput, lockDate, readAudit, toLocalInput } from "../domain/timesheetEdit";
import { can } from "../domain/access";
import { buildReport } from "../domain/reportBuilders";

const now = new Date("2026-10-30T12:00:00Z");
const at = (days, hhmm = "09:00") => new Date(new Date("2026-10-30T00:00:00Z").getTime() - days * 86400000 + (Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))) * 60000).toISOString();
const user = { id: "u1", name: "Kehara", createdAt: "2026-09-01T00:00:00Z" };

describe("shift rules", () => {
	it("locks a shift one calendar month after it began", () => {
		expect(lockDate(now).toISOString().slice(0, 10)).toBe("2026-09-30");
		expect(entryLocked({ clockIn: "2026-09-29T10:00:00Z" }, now)).toBe(true);
		expect(entryLocked({ clockIn: "2026-10-01T10:00:00Z" }, now)).toBe(false);
		expect(entryLocked({}, now)).toBe(false);
	});
	it("accepts a good shift and explains a bad one", () => {
		const ok = { clockIn: at(2), clockOut: at(2, "17:00"), breaks: [{ start: at(2, "12:00"), end: at(2, "12:30") }] };
		expect(entryError(ok, { user, now })).toBe("");
		const e = (patch, ctx = {}) => entryError({ ...ok, ...patch }, { user, now, ...ctx });
		expect(entryError(ok, { now })).toMatch(/Choose the employee/);
		expect(e({ clockIn: "" })).toMatch(/started/);
		expect(e({ clockOut: at(2, "08:00") })).toMatch(/end after/);
		expect(e({ clockIn: at(1), clockOut: at(0, "20:00") })).toMatch(/future|24 hours/);
		expect(e({ clockIn: at(0, "11:00"), clockOut: at(0, "13:00") })).toMatch(/future/);
		expect(e({ clockIn: at(40), clockOut: at(40, "17:00"), breaks: [] })).toMatch(/last month/);
		expect(e({ clockIn: at(60), clockOut: at(60, "17:00") }, { user: { ...user, createdAt: "2026-10-28T00:00:00Z" } })).toMatch(/last month/);
		expect(e({ clockIn: at(5), clockOut: at(5, "17:00"), breaks: [] }, { user: { ...user, createdAt: "2026-10-28T00:00:00Z" } })).toMatch(/was added on 2026-10-28/);
		expect(e({ breaks: [{ start: at(2, "07:00"), end: at(2, "08:00") }] })).toMatch(/inside the shift/);
		expect(e({ breaks: [{ start: at(2, "12:00"), end: at(2, "13:00") }, { start: at(2, "12:30"), end: at(2, "13:30") }] })).toMatch(/overlap/);
		expect(e({}, { others: [{ id: "x", clockIn: at(2, "16:00"), clockOut: at(2, "20:00") }] })).toMatch(/overlaps another shift/);
		expect(e({ clockOut: "" }, { others: [{ id: "x", clockIn: at(9), clockOut: "" }] })).toMatch(/already clocked in/);
	});
	it("will not change a shift that is already locked, and can change one in time", () => {
		const old = { id: "o", clockIn: at(45), clockOut: at(45, "17:00") };
		expect(entryError({ clockIn: at(2), clockOut: at(2, "17:00") }, { user, now, existing: old })).toMatch(/more than a month old/);
		const fresh = { id: "f", clockIn: at(2), clockOut: at(2, "17:00") };
		expect(entryError({ clockIn: at(2, "08:00"), clockOut: at(2, "17:30") }, { user, now, existing: fresh, others: [fresh] })).toBe("");
	});
	it("describes what changed and reads the audit text back", () => {
		const a = { clockIn: at(2), clockOut: at(2, "17:00"), breaks: [] };
		const b = { clockIn: at(2, "08:30"), clockOut: at(2, "17:00"), breaks: [{ start: at(2, "12:00"), end: at(2, "12:30") }] };
		expect(diffEntry(a, b).map((c) => c.field)).toEqual(["Clock in", "Breaks"]);
		expect(diffEntry(a, a)).toEqual([]);
		expect(diffEntry(null, a)[0]).toMatchObject({ field: "Shift", old: "" });
		expect(diffEntry(a, null)[0].new).toBe("Deleted");
		expect(readAudit("not json")).toBeNull();
		const iso = "2026-10-28T09:05:00.000Z";
		expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
		expect(toLocalInput("")).toBe("");
	});
	it("only managers, admins and owners may edit by default", () => {
		expect(can({ id: "m", role: "manager" }, "time.edit_entries")).toBe(true);
		expect(can({ id: "c", role: "cashier" }, "time.edit_entries")).toBe(false);
		expect(can({ id: "a", role: "accountant" }, "time.edit_entries")).toBe(false);
	});
});

describe("editing shifts in the POS", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));
	const cashier = async () => {
		await h.svc.staff.saveUser?.({ name: "Cash Ier", role: "cashier", pin: "5151", active: true }).catch(() => {});
		return h.data().users.find((u) => u.role === "cashier");
	};
	const iso = (daysAgo, hhmm) => { const d = new Date(); d.setUTCHours(Number(hhmm.slice(0, 2)), Number(hhmm.slice(3)), 0, 0); return new Date(d.getTime() - daysAgo * 86400000).toISOString(); };

	// a business that has existed for a while: its owner was added 90 days ago
	const agedOwner = async () => {
		const o = h.data().users.find((u) => u.role === "owner");
		await h.store.write((tx) => tx.put(T.users, { ...o, createdAt: iso(90, "00:00") }));
		await h.refresh();
		return h.data().users.find((u) => u.id === o.id);
	};
	it("adds, edits and deletes a shift, writing every change to the audit log", async () => {
		const owner = await agedOwner();
		expect(owner).toBeTruthy();
		const first = await h.svc.staff.saveTimeEntry({ userId: owner.id, clockIn: iso(3, "02:00"), clockOut: iso(3, "10:00"), breaks: [], reason: "forgot to clock in" });
		expect(h.lastAlert() || "", "alert").toBe("");
		expect(first).toBe(true);
		const e = h.data().timeEntries.find((x) => x.clockIn === iso(3, "02:00"));
		expect(e).toMatchObject({ userId: owner.id, clockOut: iso(3, "10:00") });
		expect(await h.svc.staff.saveTimeEntry({ id: e.id, clockIn: iso(3, "03:00"), clockOut: iso(3, "11:00"), breaks: [{ start: iso(3, "06:00"), end: iso(3, "06:30") }], reason: "fix" })).toBe(true);
		expect(h.data().timeEntries.find((x) => x.id === e.id)).toMatchObject({ clockIn: iso(3, "03:00"), breaks: [{ start: iso(3, "06:00"), end: iso(3, "06:30") }] });
		const log = h.data().locationAudit.filter((a) => a.action === "timesheet-edited").map((a) => readAudit(a.details));
		expect(log.map((l) => l.field)).toEqual(expect.arrayContaining(["Shift", "Clock in", "Clock out", "Breaks"]));
		expect(log.some((l) => l.reason === "fix")).toBe(true);
		h.answers.confirm = true;
		expect(await h.svc.staff.deleteTimeEntry(e.id)).toBe(true);
		expect(h.data().timeEntries.some((x) => x.id === e.id)).toBe(false);
		expect(h.data().locationAudit.filter((a) => a.action === "timesheet-edited").some((a) => readAudit(a.details).new === "Deleted")).toBe(true);
		// the audit report lists the changes with the employee and who made them
		const rows = buildReport("audit-trail", "timesheet-audit", { range: { from: "2000-01-01", to: "2999-12-31" }, sales: [], users: h.data().users, timesheetAudit: h.data().locationAudit.filter((a) => a.action === "timesheet-edited") }).rows;
		expect(rows.length).toBeGreaterThanOrEqual(5);
		expect(rows[0]).toMatchObject({ employee: owner.name, by: owner.name });
	});
	it("refuses a shift older than a month, and one that is locked already", async () => {
		const owner = await agedOwner();
		expect(await h.svc.staff.saveTimeEntry({ userId: owner.id, clockIn: iso(50, "02:00"), clockOut: iso(50, "10:00") })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/last month/);
		const young = h.data().users.find((u) => u.id === owner.id); // (the owner was added 90 days ago, so only the month limit applies above)
		expect(young.createdAt).toBeTruthy();
		await h.store.write((tx) => tx.put(T.timeEntries, { id: "old", userId: owner.id, clockIn: iso(45, "02:00"), clockOut: iso(45, "10:00"), breaks: [] }));
		await h.refresh();
		expect(await h.svc.staff.saveTimeEntry({ id: "old", clockIn: iso(2, "02:00"), clockOut: iso(2, "10:00") })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/more than a month old/);
		expect(await h.svc.staff.deleteTimeEntry("old")).toBeUndefined();
		expect(h.data().timeEntries.some((x) => x.id === "old")).toBe(true);
	});
	it("needs the permission", async () => {
		const owner = h.data().users.find((u) => u.role === "owner");
		const h2 = await createHarness({ role: "cashier" });
		expect(await h2.svc.staff.saveTimeEntry({ userId: owner.id, clockIn: iso(3, "02:00"), clockOut: iso(3, "10:00") })).toBeUndefined();
		expect(h2.lastAlert()).toMatch(/permission/);
	});
});
