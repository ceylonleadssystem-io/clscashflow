import { describe, expect, it } from "vitest";
import { runSetupChecks, summarize } from "../domain/ceylo";
import { FEATURES, FEATURE_GROUPS, FEATURE_MAP, resolveFeatures } from "../config/features";

const good = () => ({
	settings: { business: "Lotus Café", address: "Colombo 03", email: "hi@lotus.lk", logo: "https://x/logo.png", businessType: "restaurant", kotPrinter: "Kitchen" },
	users: [{ id: "u1", role: "owner", pin: "8826", active: true }, { id: "u2", role: "cashier", pin: "5310", active: true }],
	locations: [{ id: "l1", name: "Main", active: true }],
	products: [{ id: "p1", name: "Tea", price: 300, category: "Drinks" }],
	features: resolveFeatures({ "checkout.kds": true }).enabled,
	cloud: true,
	cloudState: "synced",
	kds: { paired: true, connected: true },
	printers: { receipt: true, label: true },
});
const byId = (rs) => Object.fromEntries(rs.map((r) => [r.id, r]));

describe("Ceylo setup checks", () => {
	it("a complete setup passes every check", () => {
		const sum = summarize(runSetupChecks(good()));
		expect(sum.problems).toEqual([]);
		expect(sum.warnings).toEqual([]);
		expect(sum.mood).toBe("glad");
	});

	it("does not check plan limits or the subscription", () => {
		const input = good();
		input.subscription = { name: "Starter", maxUsers: 1, maxLocations: 1 };
		input.billingProfile = { paid: false, trialEnd: "2000-01-01" };
		const ids = runSetupChecks(input).map((r) => r.id);
		expect(ids.filter((id) => /^plan-|subscription/.test(id))).toEqual([]);
	});

	it("finds the problems from the mockup and links each fix", () => {
		const input = good();
		input.kds = { paired: false };
		input.settings.kotPrinter = "";
		const r = byId(runSetupChecks(input));
		expect(r.kds).toMatchObject({ status: "problem", fix: { view: "settings", tab: "kds" } });
		expect(r["kot-printer"]).toMatchObject({ status: "warn", fix: { tab: "printing" } });
	});

	it("never puts a PIN in the text and flags missing approvers, empty menus and failing sync", () => {
		const input = good();
		input.users = [{ id: "u2", role: "cashier", pin: "1234", active: true }];
		input.products = [];
		input.cloudState = "retry";
		const rs = runSetupChecks(input);
		const r = byId(rs);
		expect(r.approver.status).toBe("problem");
		expect(r["pins-weak"].status).toBe("warn");
		expect(r.menu.status).toBe("problem");
		expect(r.sync.status).toBe("problem");
		expect(JSON.stringify(rs)).not.toContain("1234");
	});

	it("skips checks that do not apply", () => {
		const input = good();
		input.settings.businessType = "retail";
		input.cloud = false;
		const r = byId(runSetupChecks(input));
		expect(r.kds).toBeUndefined();
		expect(r["kot-printer"]).toBeUndefined();
		expect(r.sync).toBeUndefined();
	});
});

describe("Ceylo ignored checks", () => {
	it("ignored problems and warnings leave the counts and are listed on their own", () => {
		const input = good();
		input.kds = { paired: false };
		input.settings.kotPrinter = "";
		const rs = runSetupChecks(input);
		const sum = summarize(rs, ["kds", "kot-printer", "business-name"]);
		expect(sum.problems.map((r) => r.id)).not.toContain("kds");
		expect(sum.warnings.map((r) => r.id)).not.toContain("kot-printer");
		expect(sum.ignored.map((r) => r.id).sort()).toEqual(["kds", "kot-printer"]);
		expect(sum.passed.map((r) => r.id)).toContain("business-name"); // ignoring a passed check changes nothing
		expect(sum.mood).toBe("glad");
		expect(sum.checked).toBe(summarize(rs).checked);
	});
});

describe("Ceylo printer checks", () => {
	it("checks the USB receipt printer, the Epson address and a set-up label printer", () => {
		const input = good();
		Object.assign(input.settings, { printerType: "usb-direct", usbPrinter: {}, barcodePrinter: { vendorId: 1 } });
		input.printers = { receipt: false, label: false };
		let r = byId(runSetupChecks(input));
		expect(r["receipt-printer"]).toMatchObject({ status: "problem", fix: { tab: "printing" } });
		expect(r["label-printer"].status).toBe("warn");
		input.settings.usbPrinter = { vendorId: 2 };
		expect(byId(runSetupChecks(input))["receipt-printer"]).toMatchObject({ status: "warn", title: "USB receipt printer is not connected" });
		Object.assign(input.settings, { printerType: "epson-network", printerAddress: "" });
		expect(byId(runSetupChecks(input))["receipt-printer"].title).toBe("Epson network printer has no address");
	});

	it("never suggests a label printer that was never set up", () => {
		expect(byId(runSetupChecks(good()))["label-printer"]).toBeUndefined();
	});
});

describe("Ceylo respects the admin feature switches", () => {
	it("a feature switched off in the admin portal produces no suggestion", () => {
		const input = good();
		Object.assign(input.settings, { printerType: "usb-direct", usbPrinter: {}, kotPrinter: "", barcodePrinter: { vendorId: 1 }, serviceChargeEnabled: true, serviceChargeRate: 0, logo: "" });
		input.users = [{ id: "u2", role: "cashier", pin: "1234", active: true }];
		input.products = [];
		input.kds = { paired: false };
		input.cloudState = "retry";
		input.printers = { receipt: false, label: false };
		const off = ["checkout.printReceipt", "checkout.kitchenTickets", "checkout.kds", "hardware.labelPrinter", "checkout.serviceCharge", "settings.businessLogo", "view.products", "sales.refunds", "sales.voids", "staff.users", "settings.billing", "settings.cloudBanner"];
		input.features = resolveFeatures(Object.fromEntries(off.map((id) => [id, false]))).enabled;
		const ids = runSetupChecks(input).filter((x) => x.status !== "ok").map((x) => x.id);
		expect(ids).toEqual([]);
	});

	it("the USB checks disappear when the USB printer feature is off", () => {
		const input = good();
		Object.assign(input.settings, { printerType: "usb-direct", usbPrinter: {} });
		input.features = resolveFeatures({ "checkout.kds": true, "hardware.usbPrinter": false }).enabled;
		expect(byId(runSetupChecks(input))["receipt-printer"].status).toBe("ok");
	});
});

describe("Ceylo housekeeping checks", () => {
	const NOW = Date.parse("2026-10-20T10:00:00Z");
	const H = 3600000;
	const messy = () => {
		const input = good();
		input.now = NOW;
		input.locationId = "l1";
		input.features = resolveFeatures({ "checkout.kds": true, "business.locations": true }).enabled;
		Object.assign(input.settings, { email: "hi@lotus", feedbackLink: "google review", receiptSocials: { website: "lotus cafe" }, supportEnabled: true, supportCodeExpiresAt: NOW + 5 * H });
		input.cashShifts = [{ status: "open", openedAt: new Date(NOW - 30 * H).toISOString() }, { status: "open", openedAt: new Date(NOW - 2 * H).toISOString() }];
		input.timeEntries = [{ clockIn: new Date(NOW - 20 * H).toISOString() }, { clockIn: new Date(NOW - 20 * H).toISOString(), clockOut: new Date(NOW - 12 * H).toISOString() }];
		input.openOrders = [{ status: "open", openedAt: new Date(NOW - 13 * H).toISOString() }, { status: "paid", openedAt: new Date(NOW - 40 * H).toISOString() }];
		input.inventory = [{ name: "Milk", qty: 2, reorder: 5 }, { name: "Tea", qty: 50, reorder: 10 }];
		input.products = [{ name: "Tea", price: 300, category: "Drinks", barcode: "111" }, { name: "tea ", price: 320, category: "Drinks", barcode: "111" }];
		input.modifiers = [{ name: "Size", options: [] }, { name: "Milk", options: [{ name: "Oat" }] }];
		input.customers = [{ phone: "077 123 4567" }, { phone: "+94771234567" }, { phone: "0711111111" }];
		input.locations = [{ id: "l1", name: "Main", active: true }, { id: "l2", name: "Kandy", active: true }];
		input.users = [{ id: "u1", role: "owner", pin: "8826", active: true, locationAccess: "selected", locationIds: ["l1"] }];
		return input;
	};

	it("finds things left open, low stock, duplicates, broken links, a missing floor plan and open support access", () => {
		const r = byId(runSetupChecks(messy()));
		expect(r["register-open"]).toMatchObject({ status: "warn", title: "1 cash register left open for more than a day", fix: { view: "staff" } });
		expect(r["clocked-in"].title).toBe("1 staff member still clocked in after 16 hours");
		expect(r["open-orders"]).toMatchObject({ title: "1 open order older than 12 hours", fix: { view: "orders" } });
		expect(r["low-stock"].title).toBe("1 stock item at or below the reorder level");
		expect(r["duplicate-codes"].status).toBe("warn");
		expect(r["duplicate-names"].status).toBe("warn");
		expect(r["modifiers-empty"].title).toBe("1 modifier group without options");
		expect(r["customer-phones"].title).toBe("1 phone number shared by more than one customer");
		expect(r["business-email"].status).toBe("warn");
		expect(r["feedback-link"].fix).toEqual({ view: "settings", tab: "operations" });
		expect(r["receipt-website"].status).toBe("warn");
		expect(r["table-layout"].fix).toEqual({ view: "tables" });
		expect(r["support-access"].status).toBe("warn");
		expect(r["location-staff"].title).toBe("1 location with no staff who can sign in");
	});

	it("says nothing about them when their features are switched off", () => {
		const input = messy();
		const off = ["staff.cashRegister", "staff.attendance", "checkout.openOrders", "view.inventory", "view.products", "view.modifiers", "view.customers", "crm.feedback", "settings.receiptSocials", "view.tables", "settings.supportAccess", "business.locations"];
		input.features = resolveFeatures({ "checkout.kds": true, ...Object.fromEntries(off.map((id) => [id, false])) }).enabled;
		const ids = runSetupChecks(input).map((x) => x.id);
		for (const id of ["register-open", "clocked-in", "open-orders", "low-stock", "duplicate-codes", "duplicate-names", "modifiers-empty", "customer-phones", "feedback-link", "receipt-website", "table-layout", "support-access", "location-staff"]) expect(ids).not.toContain(id);
	});

	it("a floor plan saved for the location, or the old shared one, counts", () => {
		const input = messy();
		input.settings.tableLayout_l1 = [{ id: "t1" }];
		expect(byId(runSetupChecks(input))["table-layout"]).toBeUndefined();
	});
});

describe("feature groups in the admin portal", () => {
	it("every feature belongs to a listed group and each screen switch sits with its own features", () => {
		const groups = new Set(FEATURE_GROUPS.map((g) => g.id));
		FEATURES.forEach((f) => expect(groups.has(f.group)).toBe(true));
		expect(FEATURE_MAP["view.sales"].group).toBe(FEATURE_MAP["sales.refunds"].group);
		expect(FEATURE_MAP["view.customers"].group).toBe(FEATURE_MAP["crm.feedback"].group);
		expect(FEATURE_MAP["view.tables"].group).toBe(FEATURE_MAP["checkout.kds"].group);
		expect(FEATURE_MAP["settings.ceylo"]).toMatchObject({ group: "settings", default: true });
	});
});
