import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../services/platform.service", async (orig) => ({ ...(await orig()), sendOrderEmail: vi.fn(async () => true) }));
import { sendOrderEmail } from "../services/platform.service";
import { addProduct, createHarness, line, noDiscount, openShift } from "./harness";

const cash = (h, p, o = {}) => h.svc.sales.completeSale({ cart: [line(p, 2)], discount: noDiscount, payment: "Cash", cashTendered: "1000", ...o });

describe("checkout workflow", () => {
	let h, tea;
	beforeEach(async () => {
		sendOrderEmail.mockClear();
		h = await createHarness();
		tea = await addProduct(h);
	});

	it("refuses an empty cart", async () => {
		expect(await h.svc.sales.completeSale({ cart: [], discount: noDiscount, payment: "Cash" })).toBeNull();
	});

	it("requires an open register for cash", async () => {
		expect(await cash(h, tea)).toBeNull();
		expect(h.lastAlert()).toMatch(/Open the cash register/);
		expect(h.data().sales).toHaveLength(0);
	});

	it("requires the cash received and rejects too little", async () => {
		await openShift(h);
		expect(await cash(h, tea, { cashTendered: "" })).toBeNull();
		expect(h.lastAlert()).toMatch(/Enter the cash received/);
		expect(await cash(h, tea, { cashTendered: "100" })).toBeNull();
		expect(h.lastAlert()).toMatch(/less than the amount due/);
	});

	it("completes a cash sale, gives change and updates the register", async () => {
		await openShift(h);
		const res = await cash(h, tea);
		expect(res.sale.total).toBe(500);
		expect(res.sale.profit).toBe(300);
		expect(res.sale.changeGiven).toBe(500);
		expect(res.sale.receipt).toMatch(/^ORD-/);
		const shift = h.data().cashShifts[0];
		expect(shift.netCashSales).toBe(500);
		expect(h.data().sales).toHaveLength(1);
		expect(h.data().sales[0].lines[0].name).toBe("Milk Tea");
	});

	it("numbers receipts sequentially", async () => {
		await openShift(h);
		const a = await cash(h, tea);
		const b = await cash(h, tea);
		expect(a.sale.receipt).not.toBe(b.sale.receipt);
		expect(h.data().meta.nextOrderSequence).toBe(3);
	});

	it("accepts card payment without a register", async () => {
		const res = await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Card" });
		expect(res.sale.payment).toBe("Card");
		expect(res.sale.cashDue).toBeUndefined();
	});

	it("applies a percentage discount as its own line", async () => {
		const res = await h.svc.sales.completeSale({ cart: [line(tea, 2)], discount: { type: "percent", value: 10 }, payment: "Card" });
		expect(res.sale.total).toBe(450);
		expect(res.sale.discount.amount).toBe(50);
		expect(res.sale.lines.some((l) => l.isDiscount)).toBe(true);
	});

	it("ignores discounts when the feature is switched off", async () => {
		const off = await createHarness({ features: { "checkout.discounts": false } });
		const p = await addProduct(off);
		const res = await off.svc.sales.completeSale({ cart: [line(p, 2)], discount: { type: "percent", value: 50 }, payment: "Card" });
		expect(res.sale.total).toBe(500);
	});

	it("requires a real location", async () => {
		h.session.locationId = "all";
		expect(await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Card" })).toBeNull();
		expect(h.lastAlert()).toMatch(/real POS location/);
	});

	it("blocks overselling tracked stock and deducts on sale", async () => {
		const tracked = await addProduct(h, { name: "Bun", type: "Product" });
		const row = h.data().inventory.find((i) => i.productId === tracked.id);
		expect(row.qty).toBe(0);
		expect(await h.svc.sales.completeSale({ cart: [line(tracked, 1)], discount: noDiscount, payment: "Card" })).toBeNull();
		await h.svc.inventory.adjustStock(row.id, 3, "Stock received", "");
		expect(await h.svc.sales.completeSale({ cart: [line(tracked, 4)], discount: noDiscount, payment: "Card" })).toBeNull();
		expect(h.lastAlert()).toMatch(/only 3 in stock/);
		const ok = await h.svc.sales.completeSale({ cart: [line(tracked, 2)], discount: noDiscount, payment: "Card" });
		expect(ok.sale.productStockDeducted).toBe(true);
		expect(h.data().inventory.find((i) => i.id === row.id).qty).toBe(1);
		expect(h.data().stockMovements.some((m) => m.reason === "Product sold")).toBe(true);
	});

	it("deducts recipe ingredients and blocks when one is short", async () => {
		const milk = await h.svc.inventory.saveInventoryItem({ name: "Milk", sku: "", type: "Ingredient", unit: "ml", qty: "500", reorder: "100", cost: "1", supplier: "" });
		const rec = await addProduct(h, { name: "Latte", recipe: [{ itemId: milk.id, qty: 200 }] });
		await h.svc.sales.completeSale({ cart: [line(rec, 2)], discount: noDiscount, payment: "Card" });
		expect(h.data().inventory.find((i) => i.id === milk.id).qty).toBe(100);
		expect(await h.svc.sales.completeSale({ cart: [line(rec, 1)], discount: noDiscount, payment: "Card" })).toBeNull();
		expect(h.lastAlert()).toMatch(/Not enough Milk/);
	});

	it("emails the order itself (not a payment-received message)", async () => {
		const res = await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Card", wantsEmail: true, receiptEmail: "buyer@test.lk" });
		expect(sendOrderEmail).toHaveBeenCalledOnce();
		const arg = sendOrderEmail.mock.calls[0][0];
		expect(arg.to).toBe("buyer@test.lk");
		expect(arg.html).toContain("Milk Tea");
		expect(arg.html.toLowerCase()).not.toContain("payment received");
		expect(h.data().sales[0].receiptSentAt).toBeTruthy();
		expect(res.sale.receiptEmail).toBe("buyer@test.lk");
	});

	it("rejects an invalid receipt email and keeps the sale when sending fails", async () => {
		expect(await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Card", wantsEmail: true, receiptEmail: "nope" })).toBeNull();
		sendOrderEmail.mockRejectedValueOnce(new Error("smtp down"));
		const res = await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Card", wantsEmail: true, receiptEmail: "a@b.lk" });
		expect(res.sale).toBeTruthy();
		expect(h.messages.notices.at(-1)).toMatch(/order e-mail failed/);
	});

	it("links the sale to the customer and enforces WhatsApp needs a phone", async () => {
		const c = await h.svc.customers.saveCustomer({ name: "Nimal", phone: "0771234567", email: "", company: "", address: "", tags: "", notes: "" });
		const res = await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Card", customerId: c.id });
		expect(res.sale.customerName).toBe("Nimal");
		expect(res.sale.customerPhone).toBe("0771234567");
		expect(await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, payment: "Card", wantsWhatsApp: true })).toBeNull();
	});

	describe("split bill", () => {
		it("requires every share to be paid and a register for cash shares", async () => {
			const split = [{ method: "Card", amount: 125, paid: true }, { method: "Cash", amount: 125, paid: false }];
			expect((await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, splitPayments: split, cashTendered: "200" })).needsSplit).toBe(true);
			split[1].paid = true;
			expect(await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, splitPayments: split, cashTendered: "200" })).toBeNull();
			expect(h.lastAlert()).toMatch(/Open the cash register/);
		});
		it("stores the payments", async () => {
			await openShift(h);
			const split = [{ method: "Card", amount: 125, paid: true }, { method: "Cash", amount: 125, paid: true }];
			const res = await h.svc.sales.completeSale({ cart: [line(tea)], discount: noDiscount, splitPayments: split, cashTendered: "200" });
			expect(res.sale.payment).toBe("Split");
			expect(res.sale.payments).toHaveLength(2);
			expect(res.sale.cashAmount).toBe(125);
		});
	});

	describe("restaurant mode", () => {
		it("adds service charge and the order channel", async () => {
			const r = await createHarness({ settings: { businessType: "restaurant", serviceChargeEnabled: true, serviceChargeRate: 10, orderChannels: ["Dine-in", "Takeaway"] } });
			const p = await addProduct(r);
			const res = await r.svc.sales.completeSale({ cart: [line(p, 2)], discount: noDiscount, payment: "Card", orderChannel: "Takeaway" });
			expect(res.sale.serviceCharge.amount).toBe(50);
			expect(res.sale.total).toBe(550);
			expect(res.sale.orderChannel).toBe("Takeaway");
		});
	});
});

describe("open orders", () => {
	it("saves, updates, pays and voids an open order", async () => {
		const h = await createHarness({ settings: { businessType: "restaurant", orderChannels: ["Dine-in"] } });
		const p = await addProduct(h);
		await openShift(h);
		const o = await h.svc.sales.saveOpenOrder({ cart: [line(p, 1)], discount: noDiscount, orderChannel: "Dine-in", platformOrderId: "" });
		expect(h.data().openOrders[0].status).toBe("open");
		await h.svc.sales.saveOpenOrder({ cart: [line(p, 3)], discount: noDiscount, openOrderId: o.id, orderChannel: "Dine-in", platformOrderId: "" });
		expect(h.data().openOrders).toHaveLength(1);
		expect(h.data().openOrders[0].lines[0].qty).toBe(3);
		const paid = await h.svc.sales.completeSale({ cart: [line(p, 3)], discount: noDiscount, payment: "Cash", cashTendered: "1000", openOrderId: o.id });
		expect(paid.sale.receipt).toBe(o.orderNumber);
		expect(h.data().openOrders[0].status).toBe("paid");

		const o2 = await h.svc.sales.saveOpenOrder({ cart: [line(p, 1)], discount: noDiscount, orderChannel: "Dine-in", platformOrderId: "" });
		await h.svc.sales.voidOpenOrder(o2.id);
		expect(h.data().openOrders.find((x) => x.id === o2.id).status).toBe("voided");
	});
	it("refuses an empty open order and kitchen tickets outside food service", async () => {
		const h = await createHarness();
		const p = await addProduct(h);
		await h.svc.sales.saveOpenOrder({ cart: [], discount: noDiscount });
		expect(h.lastAlert()).toMatch(/Add at least one item/);
		await h.svc.sales.saveOpenOrder({ cart: [line(p)], discount: noDiscount, sendKitchen: true });
		expect(h.lastAlert()).toMatch(/Restaurant or Café/);
	});
	it("records a voided current order", async () => {
		const h = await createHarness();
		const p = await addProduct(h);
		expect(await h.svc.sales.voidCurrentOrder([line(p, 2)])).toBe(true);
		expect(h.data().voidOrders[0].total).toBe(500);
	});
});
