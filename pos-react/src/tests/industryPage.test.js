import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { today as todayLocal } from "../domain/format";

let businessType = "salon";
const data = () => ({
	settings: { businessType },
	customers: [{ id: "c1", name: "Nimal" }],
	appointments: [{ id: "a1", customerId: "c1", serviceId: "p1", staffId: "u1", status: "Confirmed", time: todayLocal() + "T10:00:00", notes: "" }],
	memberships: [{ id: "m1", customerId: "c1", name: "Gold", discount: 10, status: "Active" }],
	products: [{ id: "p1", name: "Haircut" }],
	users: [{ id: "u1", name: "Kehara", role: "owner", commissionRate: 5 }],
	prescriptions: [{ id: "r1", customerId: "c1", date: "2026-10-01", reference: "RX-1", status: "Pending" }],
	medicineBatches: [{ id: "b1", itemId: "i1", batchNumber: "B-7", quantity: 20, expiry: "2028-01-01" }],
	inventory: [{ id: "i1", name: "Paracetamol" }],
	sales: [],
	commissionPayments: [],
});
vi.mock("../store/DataProvider", () => ({ useData: () => data() }));
vi.mock("../store/PosProvider", () => ({ usePos: () => ({ currentUser: { role: "owner" }, svc: { industry: {} } }) }));
vi.mock("../modals/IndustryModals", () => ({ IndustryModals: () => null }));

const render = async (type) => {
	businessType = type;
	const { Industry } = await import("../views/Industry");
	return renderToStaticMarkup(createElement(Industry));
};

describe("Business Tools page", () => {
	beforeEach(() => vi.resetModules());
	it("Salon / Services: appointments, memberships and commissions", async () => {
		for (const type of ["salon", "services"]) {
			const html = await render(type);
			expect(html, type).toContain("Appointment Calendar");
			expect(html).toContain("Customer Memberships");
			expect(html).toContain("Staff Commissions");
			expect(html).toContain("Haircut");
			expect(html).not.toContain("Prescription Records");
			expect(html).toContain("Service tools are enabled");
		}
	});
	it("Pharmacy: prescriptions, batches and commissions", async () => {
		const html = await render("pharmacy");
		expect(html).toContain("Prescription Records");
		expect(html).toContain("Medicine Batches &amp; Expiry");
		expect(html).toContain("RX-1");
		expect(html).toContain("Paracetamol");
		expect(html).toContain("Staff Commissions");
		expect(html).not.toContain("Appointment Calendar");
		expect(html).toContain("Pharmacy records and expiry tools are enabled");
	});
	it("other business types get no modules", async () => {
		const html = await render("restaurant");
		expect(html).not.toContain("Staff Commissions");
		expect(html).toContain("Choose Salon / Spa, Services or Pharmacy");
	});
});
