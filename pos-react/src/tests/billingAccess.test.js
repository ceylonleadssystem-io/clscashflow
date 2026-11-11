/**
 * Tests for who may use the POS after the free trial: paying accounts, expired trials, paused accounts and demo accounts an
 * administrator marked Test (never asked for payment).
 */
import { describe, expect, it } from "vitest";
import { accessAllowed, billingWarning, posAccessProfile } from "../services/billing";

const DAY = 86400000;
const now = Date.parse("2026-11-11T09:00:00Z");
const profileOf = (raw) => posAccessProfile({ posTrialEnd: new Date(now - 2 * DAY).toISOString(), posSubscriptionStatus: "trial", ...raw }, { uid: "u1", email: "o@x.lk" });

describe("access after the free trial", () => {
	it("blocks an unpaid account once its trial has ended", () => {
		expect(accessAllowed(profileOf({}), now)).toBe(false);
	});

	it("never blocks an account an administrator marked Test, however old its trial is, and shows no payment warning", () => {
		for (const raw of [{ posAccountStatus: "test" }, { posIsTestAccount: true }, { posAccountStatus: "Test" }]) {
			const p = profileOf(raw);
			expect(p.isTestAccount).toBe(true);
			expect(accessAllowed(p, now)).toBe(true);
			expect(billingWarning(p, now)).toBe("");
		}
	});

	it("still blocks a Test account the administrator paused", () => {
		expect(accessAllowed(profileOf({ posAccountStatus: "test", posAccountPaused: true }), now)).toBe(false);
	});

	it("does not exempt Trial or Live accounts", () => {
		expect(profileOf({ posAccountStatus: "trial" }).isTestAccount).toBe(false);
		expect(accessAllowed(profileOf({ posAccountStatus: "live" }), now)).toBe(false);
	});

	it("keeps a paid account in until its payment period ends", () => {
		const paid = profileOf({ posPaid: true, posSubscriptionStatus: "active", posNextPaymentDue: new Date(now + 3 * DAY).toISOString() });
		expect(accessAllowed(paid, now)).toBe(true);
		expect(accessAllowed(paid, now + 10 * DAY)).toBe(false);
	});
});
