import { describe, expect, it } from "vitest";
import { PORTAL_SECTIONS, isPortalPath, sectionOfView, visiblePortalSections } from "../config/portal";
import { SHOP_CATEGORIES, quoteLink } from "../config/shop";
import { timesheetRows } from "../domain/timesheets";
import { ROLE_VIEWS } from "../config/roles";
import { can as canDo } from "../domain/access";

const canViewFor = (role) => (v) => (ROLE_VIEWS[role] || []).includes(v);
const keys = (role) => visiblePortalSections({ canView: canViewFor(role), can: (k) => canDo({ id: role, role }, k, {}) }).map((s) => s.key);

describe("admin portal", () => {
	it("is the /admin path only, not the Ceylonry staff portal", () => {
		expect(isPortalPath("/admin")).toBe(true);
		expect(isPortalPath("/admin/")).toBe(true);
		expect(isPortalPath("/posv2/admin")).toBe(false);
		expect(isPortalPath("/posv2/")).toBe(false);
		expect(isPortalPath("/administrator")).toBe(false);
	});
	it("shows the sections to an owner (Timesheets is under User Admin for anyone who sees users, and a box of its own for the rest) and follows the role for others", () => {
		expect(keys("owner")).toEqual(["location", "reports", "menu", "users", "devices", "shop"]);
		expect(keys("manager")).toEqual(["location", "menu", "users", "devices", "shop"]);
		expect(keys("accountant")).toEqual(["reports", "timesheets", "shop"]);
		expect(keys("cashier")).toEqual(["shop"]);
		expect(PORTAL_SECTIONS.map((s) => s.title)).toEqual(["Location Info", "Reports", "Menu Admin", "User Admin", "Device Manager", "Timesheets", "Shop"]);
	});
	it("Menu Admin owns Products and Modifiers", () => {
		expect(sectionOfView("modifiers").key).toBe("menu");
		expect(sectionOfView("items").key).toBe("menu");
		expect(PORTAL_SECTIONS.find((s) => s.key === "menu").subs.map((s) => s.view)).toEqual(["items", "categories", "modifiers", "availability", "taxes", "salesCategories"]);
	});
});

describe("portal pages", () => {
	it("every page in System Options, Menu Admin, User Admin and Device Manager is a Settings page (the same component the POS uses)", async () => {
		const { PAGE_COMPONENTS } = await import("../views/settings/SettingsHome");
		for (const key of ["menu", "users", "devices"]) {
			const s = PORTAL_SECTIONS.find((x) => x.key === key);
			for (const sub of s.subs) expect(sub.view in PAGE_COMPONENTS || sub.view === "overview", key + "/" + sub.view).toBe(true);
		}
	});
});

describe("shop", () => {
	it("builds a quote email for a category and the business", () => {
		const link = quoteLink({ business: "Cafe A", category: "Receipt printers" });
		expect(link.startsWith("mailto:hello@ceylonrylabs.io?")).toBe(true);
		expect(decodeURIComponent(link)).toContain("Hardware quote: Receipt printers (Cafe A)");
		expect(SHOP_CATEGORIES.length).toBeGreaterThan(5);
	});
});

describe("timesheets", () => {
	const users = [{ id: "u1", name: "Kehara", role: "cashier" }, { id: "u2", name: "Nuwan", role: "manager" }];
	const entries = [
		{ id: "a", userId: "u1", clockIn: "2026-10-29T08:00:00Z", clockOut: "2026-10-29T12:00:00Z", breaks: [{ start: "2026-10-29T10:00:00Z", end: "2026-10-29T11:00:00Z" }] },
		{ id: "b", userId: "u1", clockIn: "2026-10-30T08:00:00Z", clockOut: "2026-10-30T10:00:00Z" },
		{ id: "c", userId: "u2", clockIn: "2026-10-30T09:00:00Z", locationId: "l2" },
		{ id: "d", userId: "u2", clockIn: "2026-09-01T09:00:00Z", clockOut: "2026-09-01T17:00:00Z" },
	];
	const range = { from: "2026-10-29", to: "2026-10-30" };
	it("subtracts breaks, totals per employee and keeps a running shift counting to now", () => {
		const s = timesheetRows(entries, users, range, { now: new Date("2026-10-30T11:00:00Z") });
		expect(s.rows).toHaveLength(3); // the September entry is out of range
		expect(s.totals.find((t) => t.employee === "Kehara")).toMatchObject({ shifts: 2, hours: 5, breakHours: 1 });
		const running = s.rows.find((r) => r.id === "c");
		expect(running).toMatchObject({ open: true, hours: 2 });
	});
	it("filters by employee and location", () => {
		expect(timesheetRows(entries, users, range, { userId: "u2", now: new Date("2026-10-30T11:00:00Z") }).rows).toHaveLength(1);
		expect(timesheetRows(entries, users, range, { locationId: "l1", now: new Date("2026-10-30T11:00:00Z") }).rows.map((r) => r.id).sort()).toEqual(["a", "b"].concat(["c"]).filter((x) => x !== "c"));
	});
});
