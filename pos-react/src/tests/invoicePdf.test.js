import { describe, expect, it } from "vitest";
import { buildInvoicePdf, invoiceEmailSale, invoiceMessage, invoiceModel } from "../services/printing/invoicePdf";

const data = {
	settings: { business: "Shine Detailing", address: "1 Main St", email: "hi@shine.test" },
	customers: [{ id: "c1", name: "Ann Perera", phone: "077 123 4567", email: "ann@test.com" }],
	vehicles: [{ id: "v1", registration: "CAB-1234", make: "Toyota", model: "Aqua", year: "2019", colour: "White" }],
	users: [{ id: "u1", name: "Nimal" }, { id: "u2", name: "Sam" }],
};
const job = { id: "j1", customerId: "c1", vehicleId: "v1", packageName: "Full Detail", price: 10000, discount: 1000, technicianIds: ["u1", "u2"], invoiceNumber: "INV-0001", invoicedAt: "2026-11-10T10:00:00Z", payments: [{ method: "Cash", amount: 4000, at: "2026-11-10T11:00:00Z" }] };

describe("detailing invoice PDF", () => {
	it("gathers the invoice figures and technicians", () => {
		const m = invoiceModel(job, data);
		expect(m).toMatchObject({ number: "INV-0001", total: 9000, paid: 4000, balance: 5000 });
		expect(m.technicians).toEqual(["Nimal", "Sam"]);
		expect(invoiceMessage(m)).toContain("INV-0001");
		expect(invoiceEmailSale(m)).toMatchObject({ receipt: "INV-0001", total: 9000, payment: "Cash" });
	});
	it("builds a PDF document", async () => {
		Object.assign(globalThis.window, { atob: globalThis.atob, btoa: globalThis.btoa }); // the test setup's window stub lacks what jsPDF reads at load time
		const doc = await buildInvoicePdf(invoiceModel(job, data));
		expect(doc.getNumberOfPages()).toBe(1);
		expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(1000);
	});
});
