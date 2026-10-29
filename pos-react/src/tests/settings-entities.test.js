/**
 * Settings pages that keep lists: 3rd party payment types and zones (floors), plus the System Options audit entry.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, addProduct, line, noDiscount, openShift } from "./harness";
import { floorLayoutKey, floorsFor, MAIN_FLOOR } from "../domain/tables";
import { thirdPartyList } from "../domain/thirdPartyPayments";
import { T } from "../db/tables";

describe("3rd party payment types", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("adds, edits and rejects duplicate names", async () => {
		expect(await h.svc.settings.saveThirdPartyPayment({ name: "PickMe Food", active: true })).toBe(true);
		const [t] = thirdPartyList(h.data().settings);
		expect(t).toMatchObject({ name: "PickMe Food", active: true });
		expect(await h.svc.settings.saveThirdPartyPayment({ name: "pickme food" })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/already used/);
		expect(await h.svc.settings.saveThirdPartyPayment({ id: t.id, name: "PickMe Food", active: false })).toBe(true);
		expect(thirdPartyList(h.data().settings)[0].active).toBe(false);
	});
	it("a type used on a sale can be switched off but not deleted", async () => {
		await h.svc.settings.saveThirdPartyPayment({ name: "Uber Eats", active: true });
		const [t] = thirdPartyList(h.data().settings);
		const tea = await addProduct(h, { name: "Tea", price: "250", cost: "100" });
		await openShift(h);
		await h.svc.sales.completeSale({ cart: [line(h.data().products.find((p) => p.name === "Tea") || tea)], discount: noDiscount, payment: "Uber Eats" });
		expect(h.data().sales.some((s) => s.payment === "Uber Eats")).toBe(true);
		await h.svc.settings.deleteThirdPartyPayment(t.id);
		expect(h.lastAlert()).toMatch(/only be switched off/);
		expect(thirdPartyList(h.data().settings)).toHaveLength(1);
	});
	it("an unused type is deleted after confirming", async () => {
		await h.svc.settings.saveThirdPartyPayment({ name: "Corporate account" });
		const [t] = thirdPartyList(h.data().settings);
		h.answers.confirm = false;
		expect(await h.svc.settings.deleteThirdPartyPayment(t.id)).toBe(false);
		h.answers.confirm = true;
		expect(await h.svc.settings.deleteThirdPartyPayment(t.id)).toBe(true);
		expect(thirdPartyList(h.data().settings)).toHaveLength(0);
	});
	it("writes an audit entry", async () => {
		await h.svc.settings.saveThirdPartyPayment({ name: "DoorDash" });
		expect(h.data().locationAudit.some((a) => a.action === "third-party-payment-saved" && /DoorDash/.test(a.details))).toBe(true);
	});
});

describe("zones", () => {
	let h;
	const loc = "main";
	beforeEach(async () => (h = await createHarness()));

	it("adds, renames and refuses duplicate or empty names", async () => {
		expect(await h.svc.settings.saveZone(loc, { name: " Patio " })).toBe(true);
		const patio = floorsFor(h.data().settings, loc).find((f) => f.name === "Patio");
		expect(patio).toBeTruthy();
		expect(await h.svc.settings.saveZone(loc, { name: "patio" })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/already a zone/);
		expect(await h.svc.settings.saveZone(loc, { name: "  " })).toBeUndefined();
		expect(await h.svc.settings.saveZone(loc, { id: patio.id, name: "Garden" })).toBe(true);
		expect(floorsFor(h.data().settings, loc).map((f) => f.name)).toEqual(["Main floor", "Garden"]);
	});
	it("reorders but keeps the main zone first", async () => {
		await h.svc.settings.saveZone(loc, { name: "A" });
		await h.svc.settings.saveZone(loc, { name: "B" });
		const [main, a, b] = floorsFor(h.data().settings, loc);
		await h.svc.settings.reorderZones(loc, [b.id, main.id, a.id]);
		expect(floorsFor(h.data().settings, loc).map((f) => f.name)).toEqual(["Main floor", "B", "A"]);
	});
	it("will not delete the main zone or a zone with an open check", async () => {
		await h.svc.settings.saveZone(loc, { name: "Bar" });
		const bar = floorsFor(h.data().settings, loc).find((f) => f.name === "Bar");
		await h.svc.settings.patchSettings({ [floorLayoutKey(loc, bar.id)]: [{ id: "t1", number: "7", seats: 2, shape: "square", active: true, w: 100, h: 100, x: 0, y: 0 }] });
		await h.svc.settings.deleteZone(loc, MAIN_FLOOR);
		expect(h.lastAlert()).toMatch(/main zone cannot/);
		// an open check on Table 7
		await h.store.write((tx) => tx.put(T.openOrders, { id: "o1", status: "open", orderReference: "Table 7", orderNumber: "ORD-0001", lines: [], openedAt: new Date().toISOString() }));
		await h.svc.settings.deleteZone(loc, bar.id);
		expect(h.lastAlert()).toMatch(/open check/);
		expect(floorsFor(h.data().settings, loc).some((f) => f.id === bar.id)).toBe(true);
		await h.store.write((tx) => tx.put(T.openOrders, { id: "o1", status: "paid", orderReference: "Table 7", orderNumber: "ORD-0001", lines: [], openedAt: new Date().toISOString() }));
		expect(await h.svc.settings.deleteZone(loc, bar.id)).toBe(true);
		expect(floorsFor(h.data().settings, loc).map((f) => f.name)).toEqual(["Main floor"]);
		expect(h.data().settings[floorLayoutKey(loc, bar.id)]).toEqual([]);
	});
});
