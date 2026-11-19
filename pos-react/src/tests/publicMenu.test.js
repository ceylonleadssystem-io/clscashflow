import { describe, expect, it } from "vitest";
import { buildMenuSnapshot, enabledKeys, linkKey, linkOf } from "../domain/publicMenu";
import { FEATURES, FEATURE_MAP, defaultFeatureFlags } from "../config/features";
import { FEATURE_PRESETS, presetFlags } from "../config/featurePresets";
import { settingsGroups } from "../views/settings/SettingsHome";
import menuShare from "../../../netlify/lib/menu-share.js";

const { locationKey, sanitizeMenu } = menuShare;
const locations = [{ id: "main", name: "Main", active: true }, { id: "galle", name: "Galle", active: true }];
const settings = { business: "Cafe Neva", categorySettings: [{ id: "desserts", name: "Desserts", locationIds: ["galle"] }] };
const product = (name, category, price, extra = {}) => ({ id: name, name, category, price, cost: 5, stock: 3, description: "", image: "", ...extra });
const data = {
	products: [product("Tea", "Drinks", 300, { description: "Ceylon tea", image: "https://img.test/tea.png" }), product("Cake", "Desserts", 650, { image: "data:image/png;base64,AAAA" }), product("Soup", "Drinks", 500, { locationIds: ["main"] })],
	categories: ["Drinks", "Desserts"],
	subcategories: [],
	settings,
	locations,
};

describe("QR menu snapshot", () => {
	it("shows only what a customer needs: name, description, price, photo, category", () => {
		const menu = buildMenuSnapshot(data, "all");
		expect(menu.business).toBe("Cafe Neva");
		const drinks = menu.categories.find((c) => c.name === "Drinks");
		expect(drinks.items.map((i) => i.name)).toEqual(["Soup", "Tea"]);
		expect(Object.keys(drinks.items[1]).sort()).toEqual(["description", "image", "name", "price", "sub"]);
		expect(drinks.items[1]).toMatchObject({ price: 300, description: "Ceylon tea", image: "https://img.test/tea.png" });
	});

	it("leaves out a photo that only exists on one device", () => {
		const cake = buildMenuSnapshot(data, "all").categories.find((c) => c.name === "Desserts").items[0];
		expect(cake.image).toBe("");
	});

	it("follows the branch rules: items and categories limited to other locations are left out", () => {
		const main = buildMenuSnapshot(data, "main");
		expect(main.location).toBe("Main");
		expect(main.categories.map((c) => c.name)).toEqual(["Drinks"]);
		const galle = buildMenuSnapshot(data, "galle");
		expect(galle.categories.map((c) => c.name).sort()).toEqual(["Desserts", "Drinks"]);
		expect(galle.categories.find((c) => c.name === "Drinks").items.map((i) => i.name)).toEqual(["Tea"]);
	});

	it("reads the saved links", () => {
		const s = { publicMenu: { links: { all: { token: "t", url: "u", enabled: true }, galle: { token: "g", url: "v", enabled: false } } } };
		expect(linkOf(s, "all").token).toBe("t");
		expect(linkOf(s, "")).toBe(linkOf(s, "all"));
		expect(linkOf(s, "main")).toBe(null);
		expect(enabledKeys(s)).toEqual(["all"]);
		expect(linkKey("galle")).toBe("galle");
	});
});

describe("QR menu server clean-up", () => {
	it("cuts the snapshot down and drops anything that is not a plain https photo", () => {
		const out = sanitizeMenu({
			business: " Cafe ",
			categories: [{ name: "Drinks", items: [{ name: "Tea", price: "300", image: "javascript:alert(1)", cost: 5, stock: 9 }, { name: "", price: 1 }] }, { name: "Empty", items: [] }],
		});
		expect(out.categories).toHaveLength(1);
		expect(out.categories[0].items).toEqual([{ name: "Tea", description: "", price: 300, sub: "", image: "" }]);
		expect(sanitizeMenu(null).categories).toEqual([]);
	});

	it("keeps location keys safe to use in a document id", () => {
		expect(locationKey("galle")).toBe("galle");
		expect(locationKey("all")).toBe("all");
		expect(locationKey("../x y")).toBe("xy");
		expect(locationKey("")).toBe("all");
	});
});

describe("QR menu admin switch", () => {
	const tabs = [{ id: "business", label: "Business Profile" }];
	const keys = (qrMenu) => settingsGroups({ can: () => true, serviceChargeOn: false, kitchen: false, legacyTabs: tabs, qrMenu })[0].items.map((i) => i.key);

	it("is off until an admin turns it on, and applying a business category never turns it on", () => {
		expect(FEATURE_MAP["menu.qr"].default).toBe(false);
		expect(defaultFeatureFlags()["menu.qr"]).toBe(false);
		for (const p of FEATURE_PRESETS) expect(presetFlags(p, FEATURES)["menu.qr"]).toBe(false);
	});

	it("shows the QR Menu settings page only where the switch is on", () => {
		expect(keys(false)).not.toContain("qrMenu");
		expect(keys(true)).toContain("qrMenu");
	});
});
