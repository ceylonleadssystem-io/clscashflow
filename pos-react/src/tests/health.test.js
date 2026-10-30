import { describe, expect, it } from "vitest";
import { formatBytes, healthIssues, rateLatency } from "../domain/health";
import { KDS_DEFAULTS, cleanKds, kdsError, kdsSettingsOf } from "../domain/kdsSettings";

describe("health", () => {
	it("rates latency and formats sizes", () => {
		expect([100, 800, 3000, null].map(rateLatency)).toEqual(["good", "fair", "slow", "unknown"]);
		expect([512, 2048, 5 * 1024 * 1024, 3 * 1024 ** 3, -1].map(formatBytes)).toEqual(["512 B", "2.0 KB", "5.0 MB", "3.0 GB", "—"]);
	});
	it("lists only what needs attention", () => {
		expect(healthIssues({ online: true, latencyMs: 120, cloud: true, sync: { state: "synced" }, storage: { usage: 1, quota: 100 }, battery: { level: 0.9, charging: false }, printers: [{ name: "Receipt printer", expected: true, connected: true }], kds: { paired: true, connected: true, pending: 0 }, failedTickets: 0 })).toEqual([]);
		expect(healthIssues({ online: false })).toHaveLength(1);
		const bad = healthIssues({ online: true, latencyMs: 5000, cloud: true, sync: { state: "retry" }, storage: { usage: 90, quota: 100 }, battery: { level: 0.1, charging: false }, printers: [{ name: "USB label printer", expected: true, connected: false }, { name: "Scanner", expected: false, connected: false }], kds: { paired: true, connected: false, pending: 2 }, failedTickets: 1 });
		expect(bad).toHaveLength(8);
		expect(bad.join(" ")).toMatch(/slow.*sync failed.*80%.*battery.*USB label printer.*not connected.*waiting to reach.*could not print/is);
		expect(healthIssues({ online: true, cloud: false, sync: { state: "retry" } })).toEqual([]); // a local-only account has no cloud to fail
	});
});

describe("Kitchen Display settings", () => {
	it("clean, default and validate", () => {
		expect(kdsSettingsOf({})).toEqual(KDS_DEFAULTS);
		expect(cleanKds({ warnMinutes: "5", lateMinutes: 12.9, sound: false, recallCount: "" })).toEqual({ warnMinutes: 5, lateMinutes: 12, sound: false, recallCount: 10 });
		expect(kdsError(KDS_DEFAULTS)).toBe("");
		expect(kdsError({ ...KDS_DEFAULTS, warnMinutes: 0 })).toMatch(/1 to 120/);
		expect(kdsError({ ...KDS_DEFAULTS, lateMinutes: 8 })).toMatch(/more than the warning/);
		expect(kdsError({ ...KDS_DEFAULTS, lateMinutes: 300 })).toMatch(/240/);
		expect(kdsError({ ...KDS_DEFAULTS, recallCount: 99 })).toMatch(/1 to 50/);
	});
});
