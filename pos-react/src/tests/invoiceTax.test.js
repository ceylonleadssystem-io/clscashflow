import { describe, expect, it } from "vitest";
import { buildInvoiceLines } from "../admin-app/billing";

const base = { tier: "business", period: "2026-10" };
describe("invoice extras and tax", () => {
	it("unchanged with no extras and no tax", () => {
		const r = buildInvoiceLines(base);
		expect(r.lines).toHaveLength(1);
		expect(r.total).toBe(7500);
		expect(r.tax.amount).toBe(0);
		expect(r.extras).toBeNull();
	});
	it("adds one extras line when enabled with amount > 0", () => {
		const r = buildInvoiceLines({ ...base, extras: { enabled: true, description: "Setup", amount: 2500 } });
		expect(r.lines[1]).toEqual({ desc: "Setup", qty: 1, price: 2500 });
		expect(r.total).toBe(10000);
		expect(buildInvoiceLines({ ...base, extras: { enabled: false, description: "x", amount: 5 } }).lines).toHaveLength(1);
		expect(buildInvoiceLines({ ...base, extras: { enabled: true, description: "x", amount: 0 } }).lines).toHaveLength(1);
	});
	it("tax is a % of the subtotal including extras", () => {
		const r = buildInvoiceLines({ ...base, extras: { enabled: true, description: "Setup", amount: 2500 }, tax: { enabled: true, rate: 10 } });
		expect(r.tax).toEqual({ enabled: true, rate: 10, amount: 1000 });
		expect(r.lines.at(-1).desc).toBe("Tax (10%)");
		expect(r.total).toBe(11000);
		expect(buildInvoiceLines({ ...base, tax: { enabled: false, rate: 10 } }).total).toBe(7500);
	});
	it("fixed amount is final: no tax or extras", () => {
		const r = buildInvoiceLines({ ...base, exceptionAmount: 6000, tax: { enabled: true, rate: 18 }, extras: { enabled: true, description: "x", amount: 100 } });
		expect(r.total).toBe(6000);
		expect(r.lines).toHaveLength(1);
		expect(r.tax.enabled).toBe(false);
	});
	it("rounds money to 2 decimals", () => {
		const r = buildInvoiceLines({ ...base, extras: { enabled: true, description: "x", amount: 0.1 }, tax: { enabled: true, rate: 8.33 } });
		expect(r.tax.amount).toBe(624.76);
		expect(r.total).toBe(8124.86);
	});
});
