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
