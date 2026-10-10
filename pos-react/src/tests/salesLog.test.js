/**
 * Tests for the Sales History tabs: approver lookup, deleted-sale audit text, and the Voids & deletes / Refunds rows.
 */
import { describe, expect, it } from "vitest";
import { deletedDetails, findApprover, parseDeletedDetails, refundRows, voidRows, DELETED_ACTION } from "../domain/salesLog";

const users = [
	{ id: "o", name: "Owner", role: "owner", pin: "1234", active: true },
	{ id: "m", name: "Mia", role: "manager", pin: "2222", active: true },
	{ id: "c", name: "Cam", role: "cashier", pin: "3333", active: true },
	{ id: "x", name: "Old", role: "manager", pin: "4444", active: false },
];

describe("findApprover", () => {
	it("accepts only an active owner, manager or admin PIN", () => {
		expect(findApprover(users, "1234").id).toBe("o");
		expect(findApprover(users, " 2222 ").id).toBe("m");
		expect(findApprover(users, "3333")).toBeNull(); // cashier
		expect(findApprover(users, "4444")).toBeNull(); // inactive
		expect(findApprover(users, "")).toBeNull();
	});
});

describe("deleted sale audit text", () => {
	it("round-trips receipt, payment, total and a reason that contains the separator", () => {
		const text = deletedDetails({ receipt: "R-1", status: "voided", payment: "Cash", total: 1200.5, reason: "Wrong · order\nagain" });
		expect(parseDeletedDetails(text)).toEqual({ receipt: "R-1", status: "voided", payment: "Cash", total: 1200.5, reason: "Wrong · order again" });
	});
	it("reads entries written before the extra details were kept", () => {
		expect(parseDeletedDetails("R-0 · voided")).toEqual({ receipt: "R-0", status: "voided", payment: "", total: null, reason: "" });
	});
});

describe("voidRows and refundRows", () => {
	const sales = [
		{ id: "s1", receipt: "R-1", payment: "Cash", status: "voided", voidAt: "2026-10-05T10:00:00Z", voidReason: "Mistake", voidAmount: 500, voidBy: "m" },
		{ id: "s2", receipt: "R-2", payment: "Card", status: "partially_refunded", total: 300, refunds: [{ id: "r1", at: "2026-10-06T09:00:00Z", amount: 200, reason: "Cold", by: "c", authorizedBy: "m" }, { id: "r0", at: "2026-10-04T09:00:00Z", amount: 50, reason: "Old", by: "o" }] },
		{ id: "s3", receipt: "R-3", payment: "Card", status: "completed", total: 100 },
	];
	it("lists refunds newest first with the approver, falling back to who processed older ones", () => {
		const rows = refundRows(sales, users);
		expect(rows.map((r) => [r.receipt, r.authorizedBy, r.total])).toEqual([["R-2", "Mia", 200], ["R-2", "Owner", 50]]);
	});
	it("combines voided sales, cleared carts, voided checks and deleted sales for the active location", () => {
		const rows = voidRows({
			sales,
			voidOrders: [{ id: "v1", at: "2026-10-07T08:00:00Z", staffId: "c", total: 90, locationId: "a" }, { id: "v2", at: "2026-10-07T09:00:00Z", staffId: "c", total: 10, locationId: "b" }],
			openOrders: [{ id: "o1", status: "voided", voidedAt: "2026-10-03T08:00:00Z", voidReason: "Left", voidedBy: "m", orderNumber: "ORD-7", lines: [{ price: 40, qty: 2 }] }, { id: "o2", status: "open" }],
			audit: [{ id: "a1", action: DELETED_ACTION, at: "2026-10-08T08:00:00Z", userId: "o", details: deletedDetails({ receipt: "R-9", status: "refunded", payment: "Card", total: 75, reason: "Duplicate" }) }, { id: "a2", action: "other", at: "2026-10-08T08:00:00Z", details: "x" }],
			users,
			locationId: "a",
		});
		expect(rows.map((r) => [r.kind, r.receipt, r.total, r.reason])).toEqual([
			["Deleted", "R-9", 75, "Duplicate"],
			["Cart cleared", "—", 90, "Cart cleared before payment"],
			["Voided", "R-1", 500, "Mistake"],
			["Voided check", "ORD-7", 80, "Left"],
		]);
		expect(rows.find((r) => r.kind === "Voided").by).toBe("Mia");
	});
});
