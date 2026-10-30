/**
 * Users, jobs and permission changes: services, who may grant what, and the labor cost they switch on in Reports.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createHarness } from "./harness";
import { accessOf, can, jobsOf, userRate } from "../domain/access";
import { buildReport } from "../domain/reportBuilders";
import { defaultsFor } from "../domain/systemOptions";

const form = (o = {}) => ({ name: "Sam", pin: "4321", role: "cashier", active: true, locationAccess: "all", ...o });

describe("jobs", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));
	it("adds, edits, rejects duplicates and reorders", async () => {
		expect(await h.svc.settings.saveJob({ title: "Server", code: "srv", rate: 500 })).toBe(true);
		const [server] = jobsOf(h.data().settings);
		expect(server).toMatchObject({ title: "Server", code: "SRV", rate: 500, active: true });
		expect(await h.svc.settings.saveJob({ title: "server", rate: 1 })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/already a job/);
		await h.svc.settings.saveJob({ id: server.id, title: "Server", code: "SRV", rate: 550, active: true });
		expect(jobsOf(h.data().settings)[0].rate).toBe(550);
		await h.svc.settings.saveJob({ title: "Chef", rate: 800 });
		const [a, b] = jobsOf(h.data().settings);
		await h.svc.settings.reorderJobs([b, a]);
		expect(jobsOf(h.data().settings).map((j) => j.title)).toEqual(["Chef", "Server"]);
	});
	it("a job someone holds cannot be deleted", async () => {
		await h.svc.settings.saveJob({ title: "Server", rate: 500 });
		const [job] = jobsOf(h.data().settings);
		const user = await h.svc.staff.saveUser(form());
		await h.svc.settings.saveUserAccess(user.id, { keys: ["pos.order.create", "pos.discount", "pos.payments.third_party"], jobs: [{ jobId: job.id, rate: "" }] });
		await h.svc.settings.deleteJob(job.id);
		expect(h.lastAlert()).toMatch(/held by Sam/);
		expect(jobsOf(h.data().settings)).toHaveLength(1);
		expect(userRate(h.data().settings, user.id)).toBe(500);
	});
});

describe("personal access", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));
	it("saves permission changes against the role and jobs with a rate of their own", async () => {
		await h.svc.settings.saveJob({ title: "Server", rate: 500 });
		const [job] = jobsOf(h.data().settings);
		const user = await h.svc.staff.saveUser(form());
		await h.svc.settings.saveUserAccess(user.id, { keys: ["pos.order.create", "pos.payments.third_party", "reports.pos"], jobs: [{ jobId: job.id, rate: 650 }, { jobId: "gone", rate: 1 }] });
		const a = accessOf(h.data().settings, user.id);
		expect(a.grant).toEqual(["reports.pos"]);
		expect(a.revoke).toEqual(["pos.discount"]);
		expect(a.jobs).toEqual([{ jobId: job.id, rate: 650 }]);
		expect(can({ ...user }, "reports.pos", h.data().settings)).toBe(true);
		expect(userRate(h.data().settings, user.id)).toBe(650);
		expect(h.data().locationAudit.some((x) => x.action === "user-access-saved")).toBe(true);
	});
	it("refuses a negative pay rate", async () => {
		await h.svc.settings.saveJob({ title: "Server", rate: 500 });
		const [job] = jobsOf(h.data().settings);
		const user = await h.svc.staff.saveUser(form());
		expect(await h.svc.settings.saveUserAccess(user.id, { keys: [], jobs: [{ jobId: job.id, rate: -3 }] })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/0 or more/);
	});
	it("deleting a user removes their access record", async () => {
		const user = await h.svc.staff.saveUser(form());
		await h.svc.settings.saveUserAccess(user.id, { keys: ["pos.order.create"], jobs: [] });
		expect(h.data().settings.userAccess[user.id]).toBeTruthy();
		await h.svc.staff.deleteUser(user.id);
		expect(h.data().settings.userAccess?.[user.id]).toBeUndefined();
	});
});

describe("who may do what", () => {
	it("a manager cannot hand out the owner role or permissions they lack", async () => {
		const h = await createHarness({ role: "manager" });
		expect(await h.svc.staff.saveUser(form({ role: "owner" }))).toBeUndefined();
		expect(h.lastAlert()).toMatch(/Only an owner or admin/);
		const user = await h.svc.staff.saveUser(form());
		await h.svc.settings.saveUserAccess(user.id, { keys: ["pos.order.create", "pos.discount", "pos.payments.third_party", "reports.pos"], jobs: [] });
		expect(accessOf(h.data().settings, user.id).grant).toEqual([]); // managers cannot open Reports, so cannot give it
	});
	it("a cashier without the refund permission needs a manager's PIN, one who was granted it does not", async () => {
		const h = await createHarness({ role: "cashier" });
		expect(can(h.ctx.session().user, "pos.refund", h.data().settings)).toBe(false);
		await h.svc.settings.patchSettings({ userAccess: { [h.ctx.session().user.id]: { grant: ["pos.refund"], revoke: [], jobs: [] } } });
		expect(can(h.ctx.session().user, "pos.refund", h.data().settings)).toBe(true);
	});
});

describe("labor cost in reports", () => {
	const settings = {};
	const users = [{ id: "u1", name: "Kehara", role: "cashier" }];
	const day = (d, from, to) => ({ userId: "u1", clockIn: `${d}T${from}:00:00`, clockOut: `${d}T${to}:00:00`, breaks: [] });
	const ctx = (o) => ({ range: { from: "2026-10-26", to: "2026-11-01" }, users, sales: [], payroll: { ...defaultsFor("payroll"), dailyOn: true }, rates: { u1: 100 }, ...o });
	it("Labor Costs prices regular and overtime hours", () => {
		const r = buildReport("payroll", "labor-costs", ctx({ timeEntries: [day("2026-10-26", "06", "20")] })); // 14 h: 8 regular, 4 at 1.5x, 2 at 2x
		expect(r.rows[0]).toMatchObject({ regular: 8, ot: 4, ot2: 2, paid: 14, rate: 100 });
		expect(r.rows[0].pay).toBe(800 + 600 + 400);
		expect(r.totals.pay).toBe(1800);
	});
	it("says how many people have no rate and leaves them out of the cost", () => {
		const r = buildReport("payroll", "labor-costs", ctx({ timeEntries: [day("2026-10-26", "08", "16")], rates: {} }));
		expect(r.rows[0].pay).toBeNull();
		expect(r.note).toMatch(/1 person has no hourly rate/);
	});
	it("Sales vs Labor shows labor cost and labor % per day", () => {
		const sale = { id: "s", date: "2026-10-26", status: "completed", lines: [{ name: "Tea", price: 4000, qty: 1 }], total: 4000 };
		const r = buildReport("sales-vs-labor", "", ctx({ sales: [sale], timeEntries: [day("2026-10-26", "08", "16")], payroll: defaultsFor("payroll") }));
		expect(r.rows[0]).toMatchObject({ date: "2026-10-26", net: 4000, hours: 8, cost: 800 });
		expect(r.rows[0].pct).toBeCloseTo(20);
		expect(r.cards.map((c) => c.label)).toEqual(["Net sales", "Labor cost", "Labor %"]);
	});
	it("labor % is empty on a day with no sales", () => {
		const r = buildReport("sales-vs-labor", "", ctx({ timeEntries: [day("2026-10-27", "08", "16")], payroll: defaultsFor("payroll") }));
		expect(r.rows[0].pct).toBeNull();
	});
});

describe("jobs start as the roles", () => {
	it("adds a job per role once, keeps the ones a business already has, and does not bring back deleted ones", async () => {
		const { createHarness } = await import("./harness");
		const { ROLE_JOBS, jobsOf } = await import("../domain/access");
		const h = await createHarness({ settings: { jobs: [{ id: "j1", title: "Server", code: "SRV", rate: 500, color: "", active: true }, { id: "j2", title: "cashier", code: "C", rate: 450, color: "", active: true }] } });
		expect(await h.svc.settings.seedRoleJobs()).toBe(true);
		expect(jobsOf(h.data().settings).map((j) => j.title)).toEqual(["Server", "cashier", "Owner", "Admin", "Accountant", "Manager"]); // an existing "cashier" is not duplicated
		expect(ROLE_JOBS.every((j) => j.rate === 0 && j.active)).toBe(true);
		expect(await h.svc.settings.seedRoleJobs()).toBe(false);
		h.answers.confirm = true;
		await h.svc.settings.deleteJob("job-role-owner");
		await h.svc.settings.seedRoleJobs();
		expect(jobsOf(h.data().settings).some((j) => j.title === "Owner")).toBe(false);
		const h2 = await createHarness();
		await h2.svc.settings.seedRoleJobs();
		expect(jobsOf(h2.data().settings)).toHaveLength(5);
	});
});
