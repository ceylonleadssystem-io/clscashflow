/**
 * Tests for shifts, attendance and user management: clock-in with register, breaks, closing with variance, and
 * user validation, PIN rules and deletion permissions.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createHarness } from "./harness";

describe("shifts & attendance", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("Clock In & Open Register records attendance and the opening float together", async () => {
		expect(await h.svc.staff.clockInAndOpenRegister(2000)).toBe(true);
		expect(h.data().timeEntries).toHaveLength(1);
		expect(h.data().cashShifts[0]).toMatchObject({ openingCash: 2000, status: "open", userId: "u-owner" });
	});
	it("rejects an invalid opening amount", async () => {
		expect(await h.svc.staff.clockInAndOpenRegister(NaN)).toBe(false);
		expect(await h.svc.staff.clockInAndOpenRegister(-5)).toBe(false);
		expect(h.data().timeEntries).toHaveLength(0);
	});
	it("opening the register needs a clock-in", async () => {
		expect(await h.svc.staff.openRegister(500)).toBe(false);
		expect(h.lastAlert()).toMatch(/Clock in/);
	});
	it("tracks breaks", async () => {
		await h.svc.staff.clockInAndOpenRegister(0);
		await h.svc.staff.toggleBreak();
		expect(h.data().timeEntries[0].breaks[0].end).toBeUndefined();
		await h.svc.staff.toggleBreak();
		expect(h.data().timeEntries[0].breaks[0].end).toBeTruthy();
	});
	it("cannot clock out with the register open", async () => {
		await h.svc.staff.clockInAndOpenRegister(0);
		expect(await h.svc.staff.clockOut()).toBe(false);
		expect(h.lastAlert()).toMatch(/Close the cash register/);
	});
	it("closes the register with the variance, then clocks out", async () => {
		await h.svc.staff.clockInAndOpenRegister(1000);
		expect(await h.svc.staff.closeRegister(950)).toBe(true);
		const shift = h.data().cashShifts[0];
		expect(shift).toMatchObject({ status: "closed", expectedCash: 1000, actualCash: 950, variance: -50 });
		expect(await h.svc.staff.clockOut()).toBe(true);
		expect(h.data().timeEntries[0].clockOut).toBeTruthy();
	});
});

describe("user management", () => {
	let h;
	const form = (o = {}) => ({ name: "Sam", pin: "4321", role: "cashier", active: true, locationAccess: "all", ...o });
	beforeEach(async () => (h = await createHarness()));

	it("validates name and PIN format", async () => {
		expect(await h.svc.staff.saveUser(form({ name: " " }))).toBeUndefined();
		expect(h.lastAlert()).toMatch(/Enter the user name/);
		await h.svc.staff.saveUser(form({ pin: "12" }));
		expect(h.lastAlert()).toMatch(/4 to 6 digits/);
		await h.svc.staff.saveUser(form({ pin: "12ab" }));
		expect(h.data().users).toHaveLength(1);
	});
	it("creates a user and blocks a duplicate PIN", async () => {
		const u = await h.svc.staff.saveUser(form());
		expect(u.id).toBeTruthy();
		await h.svc.staff.saveUser(form({ name: "Other" }));
		expect(h.lastAlert()).toMatch(/already used/);
		expect(h.data().users).toHaveLength(2);
	});
	it("updates an existing user without a PIN clash with itself", async () => {
		const u = await h.svc.staff.saveUser(form());
		await h.svc.staff.saveUser(form({ id: u.id, name: "Samantha" }));
		expect(h.data().users.find((x) => x.id === u.id).name).toBe("Samantha");
	});
	it("requires a location for staff when locations are enabled", async () => {
		await h.svc.staff.saveUser(form({ locationAccess: "selected", locationIds: [] }));
		expect(h.lastAlert()).toMatch(/at least one location/);
	});
	it("cannot delete yourself or the last owner; deletes others", async () => {
		await h.svc.staff.deleteUser("u-owner");
		expect(h.lastAlert()).toMatch(/currently signed in/);
		const u = await h.svc.staff.saveUser(form());
		await h.svc.staff.deleteUser(u.id);
		expect(h.data().users.find((x) => x.id === u.id)).toBeUndefined();
		expect(h.data().meta.deletedIds.users).toContain(u.id);
	});
	it("only owners/admins may delete users", async () => {
		const c = await createHarness({ role: "cashier" });
		const u = await c.svc.staff.saveUser(form());
		await c.svc.staff.deleteUser(u.id);
		expect(c.messages.notices.at(-1)).toMatch(/Only the owner or an admin/);
	});
});
