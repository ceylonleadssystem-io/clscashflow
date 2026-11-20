import { describe, expect, it } from "vitest";
import admin from "../../../netlify/functions/pos-admin-data.js";
import { accessWarning } from "../admin-app/status";

const { _accountStatus: accountStatus, _billingPatchForStatus: billingPatch, _extendedTrialEnd: extendedTrialEnd } = admin;
const NOW = "2026-11-20T10:00:00.000Z";
const nowMs = Date.parse(NOW);

describe("account status always matches the billing", () => {
	it("an unpaid account is Trial even when it was marked Live before (the label no longer wins over the billing)", () => {
		expect(accountStatus({ posAccountStatus: "live", posPaid: false, posSubscriptionStatus: "trial" })).toBe("trial");
		expect(accountStatus({})).toBe("trial");
	});
	it("a paid account is Live, however it was paid", () => {
		expect(accountStatus({ posPaid: true })).toBe("live");
		expect(accountStatus({ posSubscriptionStatus: "active" })).toBe("live");
		expect(accountStatus({ posSubscriptionStatus: "manual-paid" })).toBe("live");
	});
	it("Test stays Test: by the label or by the older test flag", () => {
		expect(accountStatus({ posAccountStatus: "test", posPaid: true })).toBe("test");
		expect(accountStatus({ posIsTestAccount: true })).toBe("test");
	});
});

describe("choosing an account status changes the billing too", () => {
	it("Live marks the account paid for one billing period, monthly or annual", () => {
		const m = billingPatch({ posBillingCycle: "monthly" }, "live", NOW);
		expect(m).toMatchObject({ posPaid: true, posSubscriptionStatus: "manual-paid", posPaymentReminderStatus: "paid" });
		expect(m.posNextPaymentDue.slice(0, 10)).toBe("2026-12-20");
		expect(billingPatch({ posBillingCycle: "annual" }, "live", NOW).posNextPaymentDue.slice(0, 10)).toBe("2027-11-20");
		expect(accountStatus({ ...m })).toBe("live");
	});
	it("Live keeps a payment date that is still ahead", () => {
		expect(billingPatch({ posNextPaymentDue: "2027-01-05T00:00:00.000Z" }, "live", NOW).posNextPaymentDue).toBe("2027-01-05T00:00:00.000Z");
	});
	it("Trial marks the account unpaid", () => {
		const t = billingPatch({ posPaid: true, posSubscriptionStatus: "active" }, "trial", NOW);
		expect(t).toEqual({ posPaid: false, posSubscriptionStatus: "trial" });
		expect(accountStatus({ ...t })).toBe("trial");
	});
	it("Test leaves the billing alone, and a disabled account stays disabled", () => {
		expect(billingPatch({ posPaid: false }, "test", NOW)).toEqual({});
		expect(billingPatch({ posAccountPaused: true, posSubscriptionStatus: "paused" }, "live", NOW)).not.toHaveProperty("posSubscriptionStatus");
		expect(billingPatch({ posAccountPaused: true }, "trial", NOW)).toEqual({ posPaid: false });
	});
});

describe("extending a trial", () => {
	it("counts from today when the trial already ended, or from the end date when it is still ahead", () => {
		expect(extendedTrialEnd("2026-11-19T00:00:00.000Z", 14, nowMs).slice(0, 10)).toBe("2026-12-04");
		expect(extendedTrialEnd("2026-11-25T10:00:00.000Z", 14, nowMs).slice(0, 10)).toBe("2026-12-09");
		expect(extendedTrialEnd("", 7, nowMs).slice(0, 10)).toBe("2026-11-27");
	});
});

describe("the warning on the Access tab", () => {
	const trial = (trialEnd) => ({ status: "trial", payment: { trialEnd } });
	const live = (nextPaymentDue) => ({ status: "live", payment: { nextPaymentDue } });
	it("warns when the trial has ended, but not while it is running", () => {
		expect(accessWarning(trial("2026-11-19T00:00:00.000Z"), false, nowMs)).toMatch(/trial ended on 19 Nov 2026/);
		expect(accessWarning(trial("2026-11-25T00:00:00.000Z"), false, nowMs)).toBe("");
	});
	it("warns when a paid account is more than a day overdue, with the same one day grace as the POS", () => {
		expect(accessWarning(live("2026-11-10T00:00:00.000Z"), false, nowMs)).toMatch(/payment was due on 10 Nov 2026/);
		expect(accessWarning(live("2026-11-20T00:00:00.000Z"), false, nowMs)).toBe("");
	});
	it("says so for a disabled account, and never warns a Test account", () => {
		expect(accessWarning(live("2027-01-01T00:00:00.000Z"), true, nowMs)).toMatch(/disabled/);
		expect(accessWarning({ status: "test", payment: { trialEnd: "2020-01-01T00:00:00.000Z" } }, false, nowMs)).toBe("");
	});
});
