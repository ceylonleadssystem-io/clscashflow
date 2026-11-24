import { describe, expect, it } from "vitest";
import { mergePayload } from "../services/sync/merge";

// BUG 0036: a deleted service package came back because the other copy of the business data still held it and no tombstone was kept
describe("deleted Automobile records stay deleted when the copies sync", () => {
	const pkg = { id: "pkg1", name: "Full Detail", price: 10000, updatedAt: "2026-11-01T00:00:00Z" };
	it("drops a package, vehicle and job that carry a tombstone", () => {
		const remote = { detailPackages: [pkg], vehicles: [{ id: "veh1" }], detailJobs: [{ id: "job1" }], deletedIds: {} };
		const local = { detailPackages: [], vehicles: [], detailJobs: [], deletedIds: { detailPackages: ["pkg1"], vehicles: ["veh1"], detailJobs: ["job1"] } };
		for (const preferLocal of [true, false]) {
			const merged = mergePayload(remote, local, preferLocal);
			expect(merged.detailPackages).toEqual([]);
			expect(merged.vehicles).toEqual([]);
			expect(merged.detailJobs).toEqual([]);
			expect(merged.deletedIds.detailPackages).toEqual(["pkg1"]);
		}
	});
	it("keeps a package nobody deleted", () => {
		const merged = mergePayload({ detailPackages: [pkg], deletedIds: {} }, { detailPackages: [], deletedIds: {} }, true);
		expect(merged.detailPackages).toHaveLength(1);
	});
});
