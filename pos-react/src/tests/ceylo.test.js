import { describe, expect, it } from "vitest";
import { runSetupChecks, summarize } from "../domain/ceylo";
import { FEATURES, FEATURE_GROUPS, FEATURE_MAP, resolveFeatures } from "../config/features";

const good = () => ({
	settings: { business: "Lotus Café", address: "Colombo 03", email: "hi@lotus.lk", logo: "https://x/logo.png", businessType: "restaurant", kotPrinter: "Kitchen" },
	users: [{ id: "u1", role: "owner", pin: "8826", active: true }, { id: "u2", role: "cashier", pin: "5310", active: true }],
	locations: [{ id: "l1", name: "Main", active: true }],
	products: [{ id: "p1", name: "Tea", price: 300, category: "Drinks" }],
	features: resolveFeatures({ "checkout.kds": true }).enabled,
	subscription: { name: "Business", maxUsers: 10, maxLocations: 3 },
	billingProfile: null,
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

	it("finds the problems from the mockup and links each fix", () => {
		const input = good();
		input.kds = { paired: false };
		input.settings.kotPrinter = "";
		input.users = [...input.users, ...Array.from({ length: 7 }, (_, i) => ({ id: "x" + i, role: "cashier", pin: "70" + (10 + i), active: true }))];
		const r = byId(runSetupChecks(input));
		expect(r.kds).toMatchObject({ status: "problem", fix: { view: "settings", tab: "kds" } });
		expect(r["kot-printer"]).toMatchObject({ status: "warn", fix: { tab: "printing" } });
		expect(r["plan-users"]).toMatchObject({ status: "warn", title: "9 of 10 users on your Business plan" });
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
		input.subscription = null;
		input.cloud = false;
		const r = byId(runSetupChecks(input));
		expect(r.kds).toBeUndefined();
		expect(r["kot-printer"]).toBeUndefined();
		expect(r["plan-users"]).toBeUndefined();
		expect(r.sync).toBeUndefined();
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
		input.billingProfile = { paid: false, trialEnd: "2000-01-01" };
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
