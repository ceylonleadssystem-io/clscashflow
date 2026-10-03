/**
 * Tests for refunds, voids and permanent deletion: reasons, partial and full refunds, cash register rules,
 * stock restoration and role restrictions.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { addProduct, createHarness, line, noDiscount, openShift } from "./harness";

async function sellCard(h, p, qty = 2) {
	return (await h.svc.sales.completeSale({ cart: [line(p, qty)], discount: noDiscount, payment: "Card" })).sale;
}

describe("refunds, voids and deletion", () => {
	let h, tea;
	beforeEach(async () => {
		h = await createHarness({ role: "cashier" });
		tea = await addProduct(h);
	});

	it("needs a reason", async () => {
		const sale = await sellCard(h, tea);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "  " });
		expect(h.lastAlert()).toMatch(/Enter a reason/);
		expect(h.data().sales[0].status).toBe("completed");
	});

	it("fully refunds a card sale", async () => {
		const sale = await sellCard(h, tea);
		expect(await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "Wrong order" })).toBe(true);
		const s = h.data().sales[0];
		expect(s.status).toBe("refunded");
		expect(s.refunds).toHaveLength(1);
	});

	it("partially refunds by line quantity, then the rest", async () => {
		const sale = await sellCard(h, tea, 3);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "One cold", refundType: "partial", choices: { 0: 1 } });
		let s = h.data().sales[0];
		expect(s.status).toBe("partially_refunded");
		expect(s.refunds[0].amount).toBe(250);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "Rest", refundType: "full" });
		s = h.data().sales[0];
		expect(s.status).toBe("refunded");
	});

	it("rejects a partial refund with nothing selected", async () => {
		const sale = await sellCard(h, tea);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "x", refundType: "partial", choices: {} });
		expect(h.lastAlert()).toMatch(/Select at least one item/);
	});

	it("refuses to reverse an already reversed sale", async () => {
		const sale = await sellCard(h, tea);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "x" });
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "again" });
		expect(h.lastAlert()).toMatch(/already been fully reversed/);
	});

	it("needs an open register to reverse a cash sale", async () => {
		await openShift(h);
		const sale = (await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Cash", cashTendered: "500" })).sale;
		const shift = h.data().cashShifts[0];
		await h.svc.staff.closeRegister(1250);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "refund", reason: "x" });
		expect(h.lastAlert()).toMatch(/Open a cash register/);
		expect(shift.id).toBeTruthy();
	});

	it("restores product stock when a sale is voided or refunded", async () => {
		const tracked = await addProduct(h, { name: "Bun", type: "Product" });
		const row = h.data().inventory.find((i) => i.productId === tracked.id);
		await h.svc.inventory.adjustStock(row.id, 5, "Stock received", "");
		const sale = await sellCard(h, tracked, 2);
		expect(h.data().inventory.find((i) => i.id === row.id).qty).toBe(3);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "void", reason: "mistake" });
		expect(h.data().inventory.find((i) => i.id === row.id).qty).toBe(5);
		expect(h.data().stockMovements.some((m) => m.reason === "Sale reversed")).toBe(true);
	});

	it("keeps a cashier's void in the history (status voided)", async () => {
		const sale = await sellCard(h, tea);
		await h.svc.sales.reverseSale({ saleId: sale.id, type: "void", reason: "mistake" });
		expect(h.data().sales[0].status).toBe("voided");
	});

	it("purges the sale when an owner voids it", async () => {
		const o = await createHarness({ role: "owner" });
		const p = await addProduct(o);
		const sale = await sellCard(o, p);
		await o.svc.sales.reverseSale({ saleId: sale.id, type: "void", reason: "mistake" });
		expect(o.data().sales).toHaveLength(0);
		expect(o.data().meta.deletedIds.sales).toContain(sale.id);
	});

	it("only owner/admin may permanently delete, and only reversed sales", async () => {
		const sale = await sellCard(h, tea);
		await h.svc.sales.deleteSalePermanently(sale.id, true);
		expect(h.messages.notices.at(-1)).toMatch(/Only the owner or an admin/);

		const o = await createHarness({ role: "admin", features: { "sales.permanentDelete": false } });
		const p = await addProduct(o);
		const s = await sellCard(o, p);
		await o.svc.sales.deleteSalePermanently(s.id, true);
		expect(o.lastAlert()).toMatch(/Refund or void this sale/);
		await o.svc.sales.reverseSale({ saleId: s.id, type: "refund", reason: "x" });
		await o.svc.sales.deleteSalePermanently(s.id, true);
		expect(o.data().sales).toHaveLength(0);
		expect(o.data().meta.deletedIds.sales).toContain(s.id);
	});
});
