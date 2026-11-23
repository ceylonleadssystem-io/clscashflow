import { describe, expect, it } from "vitest";
import { allOnlineOrders, isOnlineOrder, newOnlineCount, openOnlineOrders } from "../domain/onlineOrders";
import { settingsGroups } from "../views/settings/SettingsHome";
import { NAV_ITEMS, ROLE_VIEWS, VIEW_TITLES } from "../config/roles";

const order = (id, o = {}) => ({ id, status: "open", orderChannel: "Shopify", updatedAt: "2026-11-19T10:00:00Z", ...o });

describe("online orders", () => {
	it("are the open orders that came from an online store, newest first", () => {
		const list = [order("a"), order("b", { orderChannel: "Dine-in" }), order("c", { updatedAt: "2026-11-19T11:00:00Z" }), order("d", { status: "paid" })];
		expect(list.map(isOnlineOrder)).toEqual([true, false, true, true]);
		expect(openOnlineOrders(list).map((o) => o.id)).toEqual(["c", "a"]);
		expect(openOnlineOrders(undefined)).toEqual([]);
	});

	it("count as new until staff accept or decline them", () => {
		expect(newOnlineCount([order("a"), order("b", { online: { state: "accepted" } }), order("c", { status: "voided", online: { state: "declined" } })])).toBe(1);
	});

	it("are all listed, whatever step they are at, newest first", () => {
		const list = [order("a"), order("b", { status: "paid", online: { state: "fulfilled" }, updatedAt: "2026-11-19T12:00:00Z" }), order("c", { orderChannel: "Dine-in" })];
		expect(allOnlineOrders(list).map((o) => o.id)).toEqual(["b", "a"]);
	});

	it("have a page that owners, managers and cashiers can open, a title and a sidebar entry", () => {
		for (const role of ["owner", "manager", "cashier"]) expect(ROLE_VIEWS[role]).toContain("online");
		expect(ROLE_VIEWS.accountant).not.toContain("online");
		expect(VIEW_TITLES.online[0]).toBe("Online Orders");
		expect(NAV_ITEMS.some((n) => n.view === "online")).toBe(true);
	});
});

describe("Ceylo AI settings page", () => {
	const tabs = [];
	const keys = (ceyloAi) => settingsGroups({ can: () => true, serviceChargeOn: false, kitchen: false, legacyTabs: tabs, ceyloAi })[0].items.map((i) => i.key);
	it("is listed under System Options only where the Ceylo AI feature is on", () => {
		expect(keys(true)).toContain("ceyloAi");
		expect(keys(false)).not.toContain("ceyloAi");
		expect(keys(undefined)).not.toContain("ceyloAi");
	});
});
