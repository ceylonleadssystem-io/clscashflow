import { describe, expect, it } from "vitest";
import { PERMISSION_KEYS, accessFromKeys, can, effectivePermissions, jobError, jobsOf, rolePreset, userRate } from "../domain/access";
import { ROLE_VIEWS, FULL_SETTINGS_ROLES } from "../config/roles";
import { APPROVER_ROLES } from "../domain/salesLog";

const u = (role, id = role) => ({ id, role });

describe("role presets reproduce today's access", () => {
	it("view keys follow the pages each role could open", () => {
		for (const role of ["manager", "accountant", "cashier"]) {
			expect(can(u(role), "reports.pos")).toBe(ROLE_VIEWS[role].includes("reports"));
			expect(can(u(role), "menu.view")).toBe(ROLE_VIEWS[role].includes("products"));
			expect(can(u(role), "inventory.view")).toBe(ROLE_VIEWS[role].includes("inventory"));
			expect(can(u(role), "pos.order.create")).toBe(ROLE_VIEWS[role].includes("checkout"));
			expect(can(u(role), "settings.system.edit")).toBe(FULL_SETTINGS_ROLES.includes(role));
			expect(can(u(role), "pos.refund")).toBe(APPROVER_ROLES.includes(role));
			expect(can(u(role), "pos.discount")).toBe(true);
		}
		expect(rolePreset("cashier")).toEqual(["pos.order.create", "pos.discount", "pos.payments.third_party"]);
		expect(can(u("manager"), "users.edit")).toBe(true);
		expect(can(u("accountant"), "users.edit")).toBe(false);
	});
	it("owners and admins hold everything and cannot lose it", () => {
		const settings = { userAccess: { owner: { revoke: PERMISSION_KEYS } } };
		expect(effectivePermissions(u("owner"), settings)).toEqual(PERMISSION_KEYS);
		expect(effectivePermissions(u("admin"), settings)).toEqual(PERMISSION_KEYS);
		expect(can(null, "pos.refund")).toBe(false);
	});
});

describe("personal changes", () => {
	const settings = { userAccess: { c1: { grant: ["reports.pos"], revoke: ["pos.discount"] } } };
	it("grant adds and revoke removes on top of the role", () => {
		expect(can(u("cashier", "c1"), "reports.pos", settings)).toBe(true);
		expect(can(u("cashier", "c1"), "pos.discount", settings)).toBe(false);
		expect(can(u("cashier", "c2"), "reports.pos", settings)).toBe(false);
	});
	it("turns a wanted set into grants and revokes against the role", () => {
		const a = accessFromKeys(u("cashier", "c1"), ["pos.order.create", "pos.payments.third_party", "menu.view"], {}, u("owner"));
		expect(a.grant).toEqual(["menu.view"]);
		expect(a.revoke).toEqual(["pos.discount"]);
	});
	it("a person cannot grant what they do not hold themselves, but keeps grants already given", () => {
		const manager = u("manager", "m1");
		const a = accessFromKeys(u("cashier", "c1"), ["pos.order.create", "reports.pos"], {}, manager); // managers lack reports
		expect(a.grant).toEqual([]);
		const kept = accessFromKeys(u("cashier", "c1"), ["pos.order.create", "reports.pos"], settings, manager);
		expect(kept.grant).toEqual(["reports.pos"]);
	});
});

describe("jobs and pay rates", () => {
	const settings = { jobs: [{ id: "j1", title: "Server", code: "SRV", rate: 500 }, { id: "j2", title: "Chef", code: "CHF", rate: 800 }, { id: "", title: "x" }], userAccess: { a: { jobs: [{ jobId: "j2", rate: "" }, { jobId: "j1" }] }, b: { jobs: [{ jobId: "j1", rate: 650 }] } } };
	it("lists real jobs only", () => expect(jobsOf(settings).map((j) => j.title)).toEqual(["Server", "Chef"]));
	it("the rate is the person's own rate on their first job, else the job's default", () => {
		expect(userRate(settings, "a")).toBe(800);
		expect(userRate(settings, "b")).toBe(650);
		expect(userRate(settings, "nobody")).toBeNull();
	});
	it("validates title, code and rate", () => {
		const others = jobsOf(settings);
		expect(jobError({ title: " ", rate: 1 })).toBeTruthy();
		expect(jobError({ title: "server", rate: 1 }, others)).toMatch(/already a job/);
		expect(jobError({ title: "Cook", code: "chf", rate: 1 }, others)).toMatch(/code/);
		expect(jobError({ title: "Cook", rate: "" })).toBeTruthy();
		expect(jobError({ title: "Cook", rate: -1 })).toBeTruthy();
		expect(jobError({ title: "Cook", code: "CK", rate: 0 }, others)).toBe("");
	});
});
