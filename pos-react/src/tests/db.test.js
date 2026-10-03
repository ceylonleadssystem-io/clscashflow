/**
 * Tests for the database layer: PosStore ordering and lossless extra data, sale persistence with cloud payload
 * round trips, removals, and the repositories.
 */
import { describe, it, expect } from "vitest";
import { createDatabase } from "../db/database";
import { PosStore } from "../db/PosStore";
import { T } from "../db/tables";
import { snapshotToPayload, payloadToSnapshot } from "../services/sync/payload";

const newStore = (name) => new PosStore(createDatabase(name));

describe("PosStore (WatermelonDB)", () => {
	it("stores products and keeps legacy newest-first ordering", async () => {
		const store = newStore("t1");
		await store.write((tx) => {
			tx.put(T.products, { id: "p1", name: "Milk Tea", price: 250, cost: 110, type: "Product", category: "Drinks", modifierIds: ["m1"], customField: { a: 1 } });
		});
		await store.write((tx) => tx.put(T.products, { id: "p2", name: "Coffee", price: 550, cost: 240 }));
		const products = await store.all(T.products);
		expect(products.map((p) => p.id)).toEqual(["p2", "p1"]);
		expect(products[1].modifierIds).toEqual(["m1"]);
		expect(products[1].customField).toEqual({ a: 1 }); // lossless `extra` column
		expect(products[1].updatedAt).toBeTruthy();
	});

	it("persists a sale with its lines and round-trips the cloud payload", async () => {
		const a = newStore("t2");
		await a.write((tx) => {
			tx.putSale({
				id: "s1", receipt: "ORD-0001", date: "2026-10-01", total: 500, cost: 200, profit: 300, payment: "Cash",
				lines: [{ id: "p1", productId: "p1", name: "Milk Tea", qty: 2, price: 250, cost: 100, modifiers: [{ groupId: "m1", groupName: "Size", optionName: "Large", price: 0 }] }],
			});
			tx.addCategory("Drinks");
			tx.setSetting("business", "Test Cafe");
			tx.setMeta("nextOrderSequence", 2);
			tx.put(T.users, { id: "u1", name: "Owner", role: "owner", pin: "1234", active: true });
		});
		const snap = await a.readSnapshot();
		expect(snap.sales[0].lines[0].name).toBe("Milk Tea");
		expect(snap.sales[0].lines[0].id).toBe("p1");
		expect(snap.categories).toEqual(["Drinks"]);
		expect(snap.settings.business).toBe("Test Cafe");

		const payload = snapshotToPayload(snap);
		expect(payload.nextOrderSequence).toBe(2);
		expect(payload.sales[0].lines).toHaveLength(1);

		const b = newStore("t3");
		await b.replaceAll(payloadToSnapshot(payload));
		const copy = await b.readSnapshot();
		expect(copy.sales[0].lines[0].modifiers[0].optionName).toBe("Large");
		expect(copy.users[0].pin).toBe("1234");
		expect(copy.meta.nextOrderSequence).toBe(2);
	});

	it("removes rows and sale lines", async () => {
		const store = newStore("t4");
		await store.write((tx) => tx.putSale({ id: "s9", total: 1, lines: [{ name: "x", qty: 1, price: 1 }] }));
		await store.write((tx) => tx.removeSale("s9"));
		expect((await store.readSnapshot()).sales).toHaveLength(0);
		expect(await store.all(T.saleLines)).toHaveLength(0);
	});
});

import { createRepositories } from "../db/repositories";

describe("repositories", () => {
	it("query by indexed column and expose domain finders", async () => {
		const store = newStore("repo1");
		const repos = createRepositories(store);
		await repos.products.save({ id: "p1", name: "Burger", code: "BRG-1", category: "Food", price: 100, cost: 50 });
		await repos.customers.save({ id: "c1", name: "Ann", phone: "077 123 4567" });
		await repos.settings.set("business", "Cafe");
		await repos.sales.save({ id: "s1", date: "2026-10-01", customerId: "c1", total: 10, lines: [{ name: "x", qty: 1, price: 10 }] });
		expect((await repos.products.findByCode("BRG-1")).name).toBe("Burger");
		expect((await repos.products.byCategory("Food")).length).toBe(1);
		expect((await repos.customers.findByPhone("0771234567")).id).toBe("c1");
		expect(await repos.settings.get("business")).toBe("Cafe");
		expect((await repos.sales.inRange("2026-10-01", "2026-10-31"))[0].lines).toHaveLength(1);
		expect(await repos.products.count()).toBe(1);
	});
});
