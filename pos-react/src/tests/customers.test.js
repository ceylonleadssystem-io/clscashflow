/**
 * Tests for customers and loyalty: validation, duplicate phone detection, discount rules, visits and spend,
 * and feedback requests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { customerInsights, customerSegment, customerStats, validCustomerSales } from "../domain/analytics";
import { addProduct, createHarness, line, noDiscount } from "./harness";

const form = (o = {}) => ({ name: "Nimal", phone: "0771234567", email: "", company: "", address: "", tags: "", notes: "", ...o });

describe("customers & loyalty", () => {
	let h, tea;
	beforeEach(async () => {
		h = await createHarness();
		tea = await addProduct(h);
	});

	it("validates name, phone and email", async () => {
		await h.svc.customers.saveCustomer(form({ name: " " }));
		expect(h.lastAlert()).toMatch(/customer name/);
		await h.svc.customers.saveCustomer(form({ phone: "12" }));
		expect(h.lastAlert()).toMatch(/valid phone/);
		await h.svc.customers.saveCustomer(form({ email: "bad" }));
		expect(h.lastAlert()).toMatch(/valid email/);
		expect(h.data().customers).toHaveLength(0);
	});
	it("blocks duplicate phone numbers (formatted differently) but not self-edit", async () => {
		const c = await h.svc.customers.saveCustomer(form());
		await h.svc.customers.saveCustomer(form({ name: "Other", phone: "077 123 4567" }));
		expect(h.lastAlert()).toMatch(/already exists/);
		await h.svc.customers.saveCustomer(form({ id: c.id, name: "Nimal P" }));
		expect(h.data().customers).toHaveLength(1);
		expect(h.data().customers[0].name).toBe("Nimal P");
	});
	it("validates a customer discount", async () => {
		await h.svc.customers.saveCustomer(form({ discountEligible: true, discountType: "percent", discountValue: 150 }));
		expect(h.lastAlert()).toMatch(/valid discount/);
		const c = await h.svc.customers.saveCustomer(form({ discountEligible: true, discountType: "percent", discountValue: 10 }));
		expect(c.discountValue).toBe(10);
	});

	it("calculates visits and total spent from completed sales", async () => {
		const c = await h.svc.customers.saveCustomer(form());
		await h.svc.sales.completeSale({ cart: [line(tea, 2)], discount: noDiscount, payment: "Card", customerId: c.id });
		await h.svc.sales.completeSale({ cart: [line(tea, 1)], discount: noDiscount, payment: "Card", customerId: c.id });
		const stats = customerStats(c.id, h.data().sales, h.data().customers);
		expect(stats.visits).toBe(2);
		expect(stats.spent).toBe(750);
		expect(customerInsights(c, h.data().sales).favorite).toBe("Milk Tea");
	});
	it("excludes refunded/voided sales from total spent", async () => {
		const c = await h.svc.customers.saveCustomer(form());
		const a = (await h.svc.sales.completeSale({ cart: [line(tea, 2)], discount: noDiscount, payment: "Card", customerId: c.id })).sale;
		await h.svc.sales.completeSale({ cart: [line(tea, 1)], discount: noDiscount, payment: "Card", customerId: c.id });
		await h.svc.sales.reverseSale({ saleId: a.id, type: "refund", reason: "x" });
		expect(customerStats(c.id, h.data().sales, h.data().customers)).toMatchObject({ visits: 1, spent: 250 });
	});
	it("matches walk-in sales to a customer by saved phone number", async () => {
		const c = await h.svc.customers.saveCustomer(form());
		const sale = { id: "x", status: "completed", total: 100, date: "2026-10-01", customerId: "", customerPhone: "+94 77 123 4567", lines: [] };
		expect(validCustomerSales([sale], { ...c, phone: "0771234567" })).toHaveLength(0); // different prefix: not guessed
		expect(validCustomerSales([{ ...sale, customerPhone: "077-123-4567" }], c)).toHaveLength(1);
	});
	it("segments customers", () => {
		expect(typeof customerSegment(customerInsights({ id: "n", phone: "" }, []))).toBe("string");
	});
	it("feedback request needs an e-mail address", async () => {
		const c = await h.svc.customers.saveCustomer(form());
		await h.svc.customers.requestFeedback(c.id);
		expect(h.lastAlert()).toMatch(/Add an email/);
	});
});
