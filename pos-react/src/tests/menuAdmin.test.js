import { beforeEach, describe, expect, it } from "vitest";
import { createHarness, addProduct, line, productForm } from "./harness";
import { allowedCategoryKeys, assignItems, cleanMenu, cleanSalesCategory, draftChanges, hoursSummary, inHours, menuError, menusInEffect, nextDrafts, overlappingMenus, salesCategoryError, salesCategoryNameOf, workingOf } from "../domain/menuAdmin";
import { buildReport } from "../domain/reportBuilders";

// 2026-10-26 was a Monday
const at = (day, hm) => new Date(2026, 9, 26 + ((day + 6) % 7), Number(hm.slice(0, 2)), Number(hm.slice(3)));
const breakfast = cleanMenu({ id: "b", name: "Breakfast", hours: [{ days: [1, 2, 3, 4, 5], start: "07:00", end: "11:00" }], categories: ["Drinks", "Bakery"] });
const dinner = cleanMenu({ id: "d", name: "Dinner", hours: [{ days: [5, 6], start: "18:00", end: "02:00" }], categories: ["Mains"] });

describe("availability hours", () => {
	it("covers the start up to, not including, the end", () => {
		expect(inHours(breakfast.hours, at(1, "06:59"))).toBe(false);
		expect(inHours(breakfast.hours, at(1, "07:00"))).toBe(true);
		expect(inHours(breakfast.hours, at(1, "10:59"))).toBe(true);
		expect(inHours(breakfast.hours, at(1, "11:00"))).toBe(false);
		expect(inHours(breakfast.hours, at(0, "08:00"))).toBe(false); // Sunday
	});
	it("runs past midnight into the next day", () => {
		expect(inHours(dinner.hours, at(5, "23:30"))).toBe(true); // Friday night
		expect(inHours(dinner.hours, at(6, "01:00"))).toBe(true); // still the Friday menu on Saturday 01:00
		expect(inHours(dinner.hours, at(6, "02:00"))).toBe(false);
		expect(inHours(dinner.hours, at(0, "01:00"))).toBe(true); // Saturday night into Sunday
		expect(inHours(dinner.hours, at(1, "01:00"))).toBe(false); // Sunday night is not on the menu
	});
	it("follows every menu running now, else the default menu, else shows everything", () => {
		const lunch = cleanMenu({ id: "l", name: "Lunch", hours: [{ days: [1], start: "10:00", end: "14:00" }], categories: ["Mains"] });
		expect(menusInEffect([breakfast, lunch], "", at(1, "10:30")).map((m) => m.id)).toEqual(["b", "l"]); // overlap: both
		expect([...allowedCategoryKeys(menusInEffect([breakfast, lunch], "", at(1, "10:30")))].sort()).toEqual(["bakery", "drinks", "mains"]);
		expect(menusInEffect([breakfast, lunch], "l", at(1, "16:00")).map((m) => m.id)).toEqual(["l"]); // default
		expect(menusInEffect([breakfast, lunch], "", at(1, "16:00"))).toBeNull();
		expect(allowedCategoryKeys(null)).toBeNull();
		expect(menusInEffect([{ ...breakfast, status: "inactive" }], "b", at(1, "08:00"))).toBeNull();
	});
	it("summarises hours and spots overlapping menus", () => {
		expect(hoursSummary(breakfast.hours)).toBe("Mon–Fri 07:00–11:00");
		expect(hoursSummary([{ days: [0, 1, 2, 3, 4, 5, 6], start: "00:00", end: "23:59" }])).toBe("Every day 00:00–23:59");
		const lunch = cleanMenu({ id: "l", name: "Lunch", hours: [{ days: [1], start: "10:00", end: "14:00" }] });
		expect(overlappingMenus(lunch, [breakfast, dinner]).map((m) => m.name)).toEqual(["Breakfast"]);
		expect(overlappingMenus(breakfast, [dinner])).toEqual([]);
	});
	it("validates a menu", () => {
		expect(menuError(cleanMenu({ id: "x", name: "", hours: breakfast.hours }), [])).toMatch(/name/);
		expect(menuError(cleanMenu({ id: "x", name: "breakfast", hours: breakfast.hours }), [breakfast])).toMatch(/already/);
		expect(menuError(cleanMenu({ id: "x", name: "A", hours: [] }), [])).toMatch(/hours/);
		expect(menuError(cleanMenu({ id: "x", name: "A", hours: [{ days: [], start: "07:00", end: "08:00" }] }), [])).toMatch(/day/);
		expect(menuError(cleanMenu({ id: "x", name: "A", hours: [{ days: [1], start: "07:00", end: "07:00" }] }), [])).toMatch(/same/);
		expect(menuError(cleanMenu({ id: "x", name: "A", hours: [{ days: [1], start: "", end: "07:00" }] }), [])).toMatch(/start/);
		expect(menuError(breakfast, [dinner])).toBe("");
	});
});

describe("sales categories", () => {
	it("validates names and gives an item to one category only", () => {
		const food = cleanSalesCategory({ id: "f", name: "Food", itemIds: ["1", "2"] });
		const bev = cleanSalesCategory({ id: "b", name: "Beverage", itemIds: ["3"] });
		expect(salesCategoryError(cleanSalesCategory({ id: "x", name: " " }), [])).toMatch(/name/);
		expect(salesCategoryError(cleanSalesCategory({ id: "x", name: "food" }), [food])).toMatch(/already/);
		const moved = assignItems([food, bev], "b", ["2", "3"]);
		expect(moved.find((c) => c.id === "f").itemIds).toEqual(["1"]);
		expect(moved.find((c) => c.id === "b").itemIds).toEqual(["2", "3"]);
		expect(salesCategoryNameOf([food, bev], 3)).toBe("Beverage");
		expect(salesCategoryNameOf([{ ...bev, status: "inactive" }], "3")).toBe("");
	});
});

describe("drafts", () => {
	const published = { salesCategories: [cleanSalesCategory({ id: "f", name: "Food", itemIds: ["1"] })] };
	it("a draft equal to what is published is not a draft", () => {
		expect(nextDrafts(published, "salesCategories", published.salesCategories)).toEqual({});
		expect(Object.keys(nextDrafts(published, "salesCategories", []))).toEqual(["salesCategories"]);
	});
	it("lists added, edited and removed entries with before and after", () => {
		const draft = [cleanSalesCategory({ id: "f", name: "Meals", itemIds: ["1", "2"] }), cleanSalesCategory({ id: "n", name: "New" })];
		const s = { ...published, menuDraft: { salesCategories: draft, availabilityMenus: [] } };
		const changes = draftChanges(s);
		expect(changes.find((c) => c.id === "n").kind).toBe("added");
		const edited = changes.find((c) => c.id === "f");
		expect(edited.fields).toEqual([{ field: "Name", before: "Food", after: "Meals" }, { field: "Items", before: "1 items", after: "2 items" }]);
		expect(draftChanges({ ...published, menuDraft: { salesCategories: [] } })).toMatchObject([{ kind: "removed", name: "Food" }]);
		expect(draftChanges(published)).toEqual([]);
		expect(workingOf(s, "salesCategories")).toBe(draft);
		expect(workingOf(published, "salesCategories")).toBe(published.salesCategories);
	});
	it("notices a reorder", () => {
		const two = [cleanSalesCategory({ id: "a", name: "A" }), cleanSalesCategory({ id: "b", name: "B" })];
		expect(draftChanges({ salesCategories: two, menuDraft: { salesCategories: [two[1], two[0]] } })).toMatchObject([{ kind: "edited", fields: [{ field: "Order" }] }]);
	});
});

describe("Menu Admin services", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("saving is a draft until Publish, and Publish applies everything at once with an audit entry", async () => {
		expect(await h.svc.settings.saveMenuEntity("salesCategories", { name: "Food" })).toBe(true);
		expect(h.data().settings.salesCategories).toBeUndefined(); // not on the POS yet
		expect(workingOf(h.data().settings, "salesCategories")).toHaveLength(1);
		await h.svc.settings.saveMenuEntity("availabilityMenus", { name: "Lunch", hours: [{ days: [1], start: "11:00", end: "15:00" }], categories: ["Food"] });
		expect(await h.svc.settings.publishMenu()).toBe(true);
		const s = h.data().settings;
		expect(s.salesCategories.map((c) => c.name)).toEqual(["Food"]);
		expect(s.availabilityMenus.map((c) => c.name)).toEqual(["Lunch"]);
		expect(s.menuDraft).toEqual({});
		expect(s.menuVersion).toBe(1);
		expect(h.data().locationAudit.some((a) => a.action === "menu-published")).toBe(true);
		expect(await h.svc.settings.publishMenu()).toBeUndefined();
		expect(h.messages.notices.at(-1)).toMatch(/nothing to publish/);
	});
	it("rejects duplicates and bad hours, and keeps the standard five out of the way of existing names", async () => {
		await h.svc.settings.saveMenuEntity("salesCategories", { name: "Food" });
		expect(await h.svc.settings.saveMenuEntity("salesCategories", { name: "food" })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/already/);
		expect(await h.svc.settings.saveMenuEntity("availabilityMenus", { name: "X", hours: [] })).toBeUndefined();
		expect(await h.svc.settings.addStandardSalesCategories()).toBe(4);
		expect(workingOf(h.data().settings, "salesCategories").map((c) => c.name)).toEqual(["Food", "Beverage", "Alcohol", "Retail", "Other"]);
	});
	it("moves an item between sales categories and refuses to remove or deactivate one that holds items", async () => {
		const tea = await addProduct(h, { name: "Tea", price: "250", cost: "100" });
		const id = String(h.data().products.find((p) => p.name === "Tea")?.id || tea?.id);
		await h.svc.settings.saveMenuEntity("salesCategories", { id: "a", name: "Beverage", itemIds: [id] });
		await h.svc.settings.saveMenuEntity("salesCategories", { id: "b", name: "Food", itemIds: [] });
		await h.svc.settings.saveMenuEntity("salesCategories", { id: "b", name: "Food", itemIds: [id] });
		const [a, b] = workingOf(h.data().settings, "salesCategories");
		expect([a.itemIds, b.itemIds]).toEqual([[], [id]]);
		expect(await h.svc.settings.saveMenuEntity("salesCategories", { id: "b", name: "Food", status: "inactive", itemIds: [id] })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/Move them/);
		await h.svc.settings.deleteMenuEntity("salesCategories", "b");
		expect(h.lastAlert()).toMatch(/still holds 1 item/);
		h.answers.confirm = true;
		expect(await h.svc.settings.deleteMenuEntity("salesCategories", "a")).toBe(true);
	});
	it("discard throws every draft away", async () => {
		await h.svc.settings.saveMenuEntity("salesCategories", { name: "Food" });
		h.answers.confirm = true;
		expect(await h.svc.settings.discardMenuDraft()).toBe(true);
		expect(draftChanges(h.data().settings)).toEqual([]);
	});
	it("the Sales Category report uses published sales categories, and display categories until then", () => {
		const sales = [{ id: "s1", receipt: "R1", date: "2026-10-29", createdAt: "2026-10-29T10:00:00Z", status: "completed", payment: "Cash", staffId: "u1", locationId: "l1", total: 500, lines: [{ productId: "p1", name: "Tea", category: "Drinks", price: 250, qty: 2 }] }];
		const ctx = (extra) => ({ range: { from: "2026-10-29", to: "2026-10-29" }, sales, users: [], ...extra });
		const rows = (extra) => buildReport("menu", "sales-category", ctx(extra)).rows.map((r) => r.name);
		expect(rows({})).toEqual(["Drinks"]);
		expect(rows({ salesCategories: [cleanSalesCategory({ id: "b", name: "Beverage", itemIds: ["p1"] })] })).toEqual(["Beverage"]);
		expect(rows({ salesCategories: [cleanSalesCategory({ id: "b", name: "Beverage", itemIds: ["other"] })] })).toEqual(["Unassigned"]);
	});
});

describe("category rename", () => {
	it("keeps availability menus pointing at the renamed category", async () => {
		const h = await createHarness();
		await addProduct(h, { name: "Tea", price: "250", cost: "100", category: "Drinks" });
		await h.svc.settings.saveMenuEntity("availabilityMenus", { name: "All day", hours: [{ days: [1], start: "08:00", end: "09:00" }], categories: ["Drinks"] });
		await h.svc.settings.publishMenu();
		await h.svc.settings.saveMenuEntity("availabilityMenus", { id: h.data().settings.availabilityMenus[0].id, name: "All day", hours: [{ days: [1], start: "08:00", end: "10:00" }], categories: ["Drinks"] });
		h.answers.prompt = "Beverages";
		await h.svc.catalog.renameCategory("Drinks");
		expect(h.data().settings.availabilityMenus[0].categories).toEqual(["Beverages"]);
		expect(h.data().settings.menuDraft.availabilityMenus[0].categories).toEqual(["Beverages"]);
	});
});

describe("modifiers: limits, global modifiers and prefixes", () => {
	it("checks a group's limits only for choose-any groups", async () => {
		const { limitProblem, limitError, cleanLimit, limitBlank } = await import("../domain/menuAdmin");
		const group = { id: "g", name: "Toppings", mode: "multiple", required: true, options: [{ name: "a" }, { name: "b" }, { name: "c" }] };
		const lim = cleanLimit({ id: "g", min: 1, max: 2 });
		expect(limitProblem(group, 0, lim)).toMatch(/at least 1/);
		expect(limitProblem(group, 2, lim)).toBe("");
		expect(limitProblem(group, 3, lim)).toMatch(/no more than 2/);
		expect(limitProblem({ ...group, required: false }, 0, lim)).toBe(""); // optional group left empty is fine
		expect(limitProblem({ ...group, mode: "single" }, 3, lim)).toBe("");
		expect(limitProblem(group, 5, undefined)).toBe("");
		expect(limitError(cleanLimit({ id: "g", min: 3, max: 2 }), group)).toMatch(/less than the minimum/);
		expect(limitError(cleanLimit({ id: "g", min: 4 }), group)).toMatch(/only 3 options/);
		expect(limitError(lim, { ...group, mode: "single" })).toMatch(/several options/);
		expect(limitBlank(cleanLimit({ id: "g" }))).toBe(true);
	});
	it("reads a modifier the same way on every ticket, global or not", async () => {
		const { modifierLabel } = await import("../domain/menuAdmin");
		expect(modifierLabel({ groupName: "Size", optionName: "Large" })).toBe("Size: Large");
		expect(modifierLabel({ groupName: "", optionName: "No onion" })).toBe("No onion");
	});
	it("saves as drafts, publishes, and a global modifier priced into the line", async () => {
		const { prefixesOf, globalModifiersOf, limitsById, GLOBAL_GROUP_ID } = await import("../domain/menuAdmin");
		const { addConfiguredLine } = await import("../domain/cart");
		const h = await createHarness();
		expect(prefixesOf(h.data().settings)).toEqual(["Add", "Extra", "Side", "No"]);
		expect(await h.svc.settings.saveMenuEntity("globalModifiers", { name: "" })).toBeUndefined();
		await h.svc.settings.saveMenuEntity("globalModifiers", { name: "Sauce", price: 50 });
		await h.svc.settings.saveMenuEntity("globalModifiers", { name: "Onion" });
		expect(await h.svc.settings.saveMenuEntity("globalModifiers", { name: "onion" })).toBeUndefined();
		expect(await h.svc.settings.saveMenuEntity("modifierPrefixes", { prefixes: [] })).toBeUndefined();
		await h.svc.settings.saveMenuEntity("modifierPrefixes", { prefixes: ["No", "Extra", "no", " Hold "] });
		expect(globalModifiersOf(h.data().settings)).toEqual([]); // drafts are not on the POS yet
		await h.svc.settings.publishMenu();
		const s = h.data().settings;
		expect(globalModifiersOf(s).map((m) => [m.name, m.price])).toEqual([["Sauce", 50], ["Onion", 0]]);
		expect(prefixesOf(s)).toEqual(["No", "Extra", "Hold"]);
		const product = { id: "p1", name: "Burger", price: 800 };
		const cart = addConfiguredLine([], product, [{ groupId: GLOBAL_GROUP_ID, groupName: "", optionName: "Extra Sauce", prefix: "Extra", name: "Sauce", price: 50 }]);
		expect(cart[0]).toMatchObject({ price: 850, basePrice: 800 });
		expect(limitsById(s)).toEqual({});
	});
	it("a limit on a real group is validated against it and cleared when blank", async () => {
		const { limitsById } = await import("../domain/menuAdmin");
		const h = await createHarness();
		await h.svc.catalog.saveModifier({ name: "Toppings", mode: "multiple", required: true, options: [{ name: "a", price: 0 }, { name: "b", price: 0 }, { name: "c", price: 0 }] });
		const g = h.data().modifiers.find((m) => m.name === "Toppings");
		expect(await h.svc.settings.saveMenuEntity("modifierLimits", { id: "ghost", min: 1 })).toBeUndefined();
		expect(await h.svc.settings.saveMenuEntity("modifierLimits", { id: g.id, min: 2, max: 1 })).toBeUndefined();
		expect(await h.svc.settings.saveMenuEntity("modifierLimits", { id: g.id, min: 1, max: 2 })).toBe(true);
		await h.svc.settings.publishMenu();
		expect(limitsById(h.data().settings)[g.id]).toMatchObject({ min: 1, max: 2, name: "Toppings" });
		await h.svc.settings.saveMenuEntity("modifierLimits", { id: g.id, min: 0, max: 0 });
		await h.svc.settings.publishMenu();
		expect(h.data().settings.modifierLimits).toEqual([]);
	});
});

describe("approval to remove sent items", () => {
	it("applies only to sent items, past the grace period, in categories that ask", async () => {
		const { markSent, removalNeedsApproval, cleanCategorySetting } = await import("../domain/deleteApproval");
		const t0 = "2026-10-30T10:00:00.000Z";
		const sentLine = markSent([{ productId: "p", name: "Roti", category: "Food", qty: 2 }, { isDiscount: true, qty: 1 }], t0);
		expect(sentLine[0]).toMatchObject({ sentQty: 2, sentAt: t0 });
		expect(sentLine[1].sentQty).toBeUndefined();
		expect(markSent([{ ...sentLine[0] }], "2026-10-30T11:00:00.000Z")[0].sentAt).toBe(t0); // unchanged quantity keeps the first time
		expect(markSent([{ ...sentLine[0], qty: 3 }], "2026-10-30T11:00:00.000Z")[0]).toMatchObject({ sentQty: 3, sentAt: "2026-10-30T11:00:00.000Z" });
		const settings = { categorySettings: [cleanCategorySetting({ name: "Food", deleteApprovalOn: true, graceSeconds: 60 })] };
		const at = (s) => new Date(t0).getTime() + s * 1000;
		const line = sentLine[0];
		expect(removalNeedsApproval(line, 1, settings, at(30))).toEqual({ needed: false, removed: 1 }); // inside the grace period
		expect(removalNeedsApproval(line, 1, settings, at(61))).toEqual({ needed: true, removed: 1 });
		expect(removalNeedsApproval(line, 0, settings, at(61))).toEqual({ needed: true, removed: 2 });
		expect(removalNeedsApproval(line, 2, settings, at(600))).toEqual({ needed: false, removed: 0 }); // nothing sent is removed
		expect(removalNeedsApproval(line, 1, {}, at(600)).needed).toBe(false); // the category does not ask
		expect(removalNeedsApproval({ ...line, sentQty: 0 }, 0, settings, at(600)).needed).toBe(false); // never sent
		expect(removalNeedsApproval({ ...line, category: "Drinks" }, 0, settings, at(600)).needed).toBe(false);
	});
	it("a send marks the lines, and the approval needs a PIN of someone who holds the permission", async () => {
		const h = await createHarness({ settings: { businessType: "restaurant" } });
		await addProduct(h, { name: "Roti", price: "60", cost: "10", category: "Food" });
		const p = h.data().products[0];
		const order = await h.svc.sales.saveOpenOrder({ cart: [{ ...line(p, 2), category: "Food" }], discount: { type: "percent", value: 0 }, sendKitchen: true, orderChannel: "Dine-in" });
		expect(order.lines[0]).toMatchObject({ sentQty: 2 });
		expect(order.lines[0].sentAt).toBeTruthy();
		const owner = h.data().users.find((u) => u.role === "owner");
		expect(await h.svc.sales.approveItemRemoval({ pin: "0000", line: order.lines[0], removed: 1 })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/PIN of a manager/);
		expect(owner.pin).toBeTruthy();
		expect((await h.svc.sales.approveItemRemoval({ pin: owner.pin, line: order.lines[0], removed: 1 }))?.id).toBe(owner.id);
		expect(h.data().locationAudit.some((a) => a.action === "sent-item-removed" && /Roti x1/.test(a.details))).toBe(true);
	});
	it("the permission follows the role: managers hold it, cashiers do not", async () => {
		const { can } = await import("../domain/access");
		expect(can({ id: "m", role: "manager" }, "pos.void.item")).toBe(true);
		expect(can({ id: "c", role: "cashier" }, "pos.void.item")).toBe(false);
		expect(can({ id: "c", role: "cashier" }, "pos.void.item", { userAccess: { c: { grant: ["pos.void.item"] } } })).toBe(true);
	});
});

describe("catalogue drafts", () => {
	let h;
	beforeEach(async () => {
		h = await createHarness();
		await addProduct(h, { name: "Tea", price: "250", cost: "100", category: "Drinks" });
		await addProduct(h, { name: "Roti", price: "60", cost: "10", category: "Food" });
	});
	const live = (name) => h.data().products.find((p) => p.name === name);

	it("changes nothing live until Publish, then applies adds, renames and removals together", async () => {
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Drinks", name: "Beverages" });
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "", name: "Desserts" });
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Food", removed: true, moveTo: "Desserts" });
		expect(live("Tea").category).toBe("Drinks");
		expect(live("Roti").category).toBe("Food");
		expect(draftChanges(h.data().settings).map((c) => c.kind).sort()).toEqual(["added", "edited", "removed"]);
		await h.svc.settings.publishMenu();
		expect(live("Tea").category).toBe("Beverages");
		expect(live("Roti").category).toBe("Desserts");
		const names = h.data().categories;
		expect(names).toEqual(expect.arrayContaining(["Beverages", "Desserts"]));
		expect(names.some((c) => c === "Drinks" || c === "Food")).toBe(false);
		expect(h.data().settings.menuDraft).toEqual({});
	});
	it("a rename carries menus, tax by category and category settings with it, including those published in the same go", async () => {
		await h.svc.settings.saveMenuEntity("availabilityMenus", { name: "All day", hours: [{ days: [1], start: "08:00", end: "09:00" }], categories: ["Drinks"] });
		await h.svc.settings.saveMenuEntity("taxes", { name: "VAT", rate: 18 });
		await h.svc.settings.saveMenuEntity("taxRules", { categoryTaxes: { drinks: { tax: h.data().settings.menuDraft.taxes[0].id } } });
		await h.svc.settings.saveMenuEntity("categorySettings", { name: "Drinks", description: "Hot and cold", deleteApprovalOn: true });
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Drinks", name: "Beverages" });
		await h.svc.settings.publishMenu();
		const s = h.data().settings;
		expect(s.availabilityMenus[0].categories).toEqual(["Beverages"]);
		expect(Object.keys(s.taxRules[0].categoryTaxes)).toEqual(["beverages"]);
		expect(s.categorySettings).toMatchObject([{ id: "beverages", name: "Beverages", description: "Hot and cold", deleteApprovalOn: true }]);
	});
	it("rejects duplicate names and missing moves, and an unchanged rename leaves no draft", async () => {
		expect(await h.svc.settings.saveMenuEntity("categoryEdits", { original: "", name: "food" })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/already/);
		expect(await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Food", removed: true, moveTo: "Nowhere" })).toBeUndefined();
		expect(await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Drinks", name: "Drinks" })).toBe(true);
		expect(h.data().settings.menuDraft?.categoryEdits).toBeUndefined();
		expect(await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Drinks", name: "Food" })).toBeUndefined(); // a rename onto another category
		expect(h.lastAlert()).toMatch(/already/);
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Drinks", name: "DRINKS" }); // a case-only rename is a rename
		expect(h.data().settings.menuDraft.categoryEdits[0].name).toBe("DRINKS");
	});
	it("edits an item's details as a draft and applies only the changed fields", async () => {
		const tea = live("Tea");
		expect(await h.svc.settings.saveMenuEntity("itemEdits", { id: tea.id, name: "Masala Tea", price: 0, cost: 100, category: "Drinks", code: tea.code, description: "" })).toBeUndefined();
		expect(h.lastAlert()).toMatch(/price/);
		await h.svc.settings.saveMenuEntity("itemEdits", { id: tea.id, name: "Masala Tea", price: 275, cost: 100, category: "Drinks", code: tea.code, description: tea.description || "" });
		expect(h.data().settings.menuDraft.itemEdits[0].changes).toEqual({ name: "Masala Tea", price: 275 });
		expect(live("Tea").price).toBe(250);
		await h.svc.settings.publishMenu();
		expect(h.data().products.find((p) => p.id === tea.id)).toMatchObject({ name: "Masala Tea", price: 275, cost: 100, category: "Drinks" });
		// putting every field back leaves no draft
		const t2 = h.data().products.find((p) => p.id === tea.id);
		await h.svc.settings.saveMenuEntity("itemEdits", { id: t2.id, name: t2.name, price: t2.price, cost: t2.cost, category: t2.category, code: t2.code, description: t2.description || "" });
		expect(h.data().settings.menuDraft?.itemEdits).toBeUndefined();
	});
	it("an item edit made after a category rename is judged against the new name", async () => {
		const tea = live("Tea");
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Drinks", name: "Beverages" });
		expect(await h.svc.settings.saveMenuEntity("itemEdits", { id: tea.id, name: "Tea", price: 300, cost: 100, category: "Drinks", code: tea.code, description: "" })).toBeUndefined(); // the old name is gone in the draft
		expect(await h.svc.settings.saveMenuEntity("itemEdits", { id: tea.id, name: "Tea", price: 300, cost: 100, category: "Beverages", code: tea.code, description: "" })).toBe(true);
		expect(h.data().settings.menuDraft.itemEdits[0].changes).toEqual({ price: 300 });
		await h.svc.settings.publishMenu();
		expect(live("Tea")).toMatchObject({ price: 300, category: "Beverages" });
	});
	it("an item can move to a category that is added in the same publish", async () => {
		const roti = live("Roti");
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "", name: "Bakery" });
		await h.svc.settings.saveMenuEntity("itemEdits", { id: roti.id, name: roti.name, price: roti.price, cost: roti.cost, category: "Bakery", code: roti.code, description: "" });
		await h.svc.settings.publishMenu();
		expect(live("Roti").category).toBe("Bakery");
	});
	it("adds, edits and removes modifier groups, removing a deleted group from its items", async () => {
		await h.svc.settings.saveMenuEntity("groupEdits", { name: "Toppings", mode: "multiple", required: false, options: [{ name: "Cheese", price: 50 }, { name: "Egg", price: 40 }] });
		expect(h.data().modifiers).toHaveLength(0);
		expect(await h.svc.settings.saveMenuEntity("groupEdits", { name: "Bad", options: [] })).toBeUndefined();
		await h.svc.settings.publishMenu();
		const g = h.data().modifiers.find((m) => m.name === "Toppings");
		expect(g).toMatchObject({ mode: "multiple", required: false });
		expect(g.options.map((o) => [o.name, o.price])).toEqual([["Cheese", 50], ["Egg", 40]]);
		await h.svc.catalog.saveProduct({ ...productForm({ name: "Burger", price: "800", category: "Food" }), modifierIds: [g.id], modifierRules: { [g.id]: false } });
		await h.svc.settings.saveMenuEntity("groupEdits", { id: g.id, name: "Toppings+", mode: "multiple", required: false, options: [{ name: "Cheese", price: 60 }] });
		await h.svc.settings.publishMenu();
		expect(h.data().modifiers.find((m) => m.id === g.id)).toMatchObject({ name: "Toppings+", options: [{ name: "Cheese", price: 60 }] });
		await h.svc.settings.saveMenuEntity("groupEdits", { id: g.id, removed: true });
		await h.svc.settings.publishMenu();
		expect(h.data().modifiers).toHaveLength(0);
		expect(h.data().products.find((p) => p.name === "Burger").modifierIds).toEqual([]);
	});
	it("reverting a draft entry takes it out of the review list", async () => {
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "", name: "Desserts" });
		const id = h.data().settings.menuDraft.categoryEdits[0].id;
		await h.svc.settings.revertMenuEdit("categoryEdits", id);
		expect(draftChanges(h.data().settings)).toEqual([]);
	});
});

describe("new items and subcategories on drafts", () => {
	let h;
	beforeEach(async () => {
		h = await createHarness();
		await addProduct(h, { name: "Tea", price: "250", cost: "100", category: "Drinks" });
		await h.svc.settings.patchSettings({ kitchenStations: [{ id: "k", name: "Kitchen", type: "printer", printer: { kind: "none" } }] });
	});
	const live = (name) => h.data().products.find((p) => p.name === name);

	it("creates an item on Publish, with its category, stations and modifier groups, and nothing before", async () => {
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "", name: "Bakery" });
		await h.svc.settings.saveMenuEntity("groupEdits", { name: "Toppings", mode: "multiple", required: false, options: [{ name: "Cheese", price: 50 }] });
		const groupId = h.data().settings.menuDraft.groupEdits[0].id;
		expect(await h.svc.settings.saveMenuEntity("itemEdits", { isNew: true, name: "Cheese Bun", price: 0, cost: 10, category: "Bakery" })).toBeUndefined();
		expect(await h.svc.settings.saveMenuEntity("itemEdits", { isNew: true, name: "Cheese Bun", price: 120, cost: 40, category: "Bakery", code: "", description: "Fresh", stationIds: ["k", "ghost"], modifierIds: [groupId, "ghost"] })).toBe(true);
		expect(live("Cheese Bun")).toBeUndefined();
		const c = draftChanges(h.data().settings).find((x) => x.page === "itemEdits");
		expect(c).toMatchObject({ kind: "added", name: "Cheese Bun" });
		await h.svc.settings.publishMenu();
		const bun = live("Cheese Bun");
		expect(bun).toMatchObject({ price: 120, cost: 40, category: "Bakery", description: "Fresh", stationIds: ["k"], modifierIds: [groupId], trackStock: false });
		expect(bun.code).toMatch(/^POS-/);
		expect(h.data().modifiers.find((m) => m.id === groupId)).toBeTruthy();
		expect(h.data().products).toHaveLength(2);
	});
	it("editing a drafted new item replaces it rather than adding a second", async () => {
		await h.svc.settings.saveMenuEntity("itemEdits", { isNew: true, name: "Bun", price: 100, cost: 40, category: "Drinks" });
		const id = h.data().settings.menuDraft.itemEdits[0].id;
		await h.svc.settings.saveMenuEntity("itemEdits", { id, name: "Bun", price: 110, cost: 40, category: "Drinks" });
		expect(h.data().settings.menuDraft.itemEdits).toHaveLength(1);
		expect(h.data().settings.menuDraft.itemEdits[0].changes.price).toBe(110);
	});
	it("changes an existing item's stations and modifier groups as drafts", async () => {
		const tea = live("Tea");
		await h.svc.settings.saveMenuEntity("itemEdits", { id: tea.id, name: "Tea", price: 250, cost: 100, category: "Drinks", code: tea.code, description: "", stationIds: ["k"] });
		expect(h.data().settings.menuDraft.itemEdits[0].changes).toEqual({ stationIds: ["k"] });
		await h.svc.settings.publishMenu();
		expect(live("Tea").stationIds).toEqual(["k"]);
	});
	it("adds, renames and removes subcategories, moving the items that used them", async () => {
		await h.svc.catalog.saveProduct({ ...productForm({ name: "Iced Tea", category: "Drinks", subcategory: "Cold" }) });
		await h.svc.catalog.addSubcategory?.("Drinks");
		const before = h.data().subcategories.length;
		const group = "drinks";
		expect(await h.svc.settings.saveMenuEntity("subcategoryEdits", { group, parent: "Drinks", wanted: [{ name: "Hot" }, { name: "hot" }] })).toBeUndefined();
		expect(await h.svc.settings.saveMenuEntity("subcategoryEdits", { group, parent: "Drinks", wanted: [{ name: "Hot" }, { name: "Cold" }] })).toBe(true);
		expect(h.data().subcategories.length).toBe(before);
		await h.svc.settings.publishMenu();
		const names = h.data().subcategories.filter((s) => s.parent === "Drinks").map((s) => s.name).sort();
		expect(names).toEqual(expect.arrayContaining(["Cold", "Hot"]));
		const cold = h.data().subcategories.find((s) => s.name === "Cold");
		await h.svc.settings.saveMenuEntity("subcategoryEdits", { group, parent: "Drinks", wanted: h.data().subcategories.filter((s) => s.parent === "Drinks").map((s) => ({ id: s.id, name: s.id === cold.id ? "Iced" : s.name })) });
		await h.svc.settings.publishMenu();
		expect(live("Iced Tea").subcategory).toBe("Iced");
		await h.svc.settings.saveMenuEntity("subcategoryEdits", { group, parent: "Drinks", wanted: h.data().subcategories.filter((s) => s.parent === "Drinks" && s.name !== "Iced").map((s) => ({ id: s.id, name: s.name })) });
		await h.svc.settings.publishMenu();
		expect(h.data().subcategories.some((s) => s.name === "Iced")).toBe(false);
		expect(live("Iced Tea").subcategory).toBe("");
	});
	it("a category rename keeps its subcategories attached in the same publish", async () => {
		await h.svc.settings.saveMenuEntity("subcategoryEdits", { group: "drinks", parent: "Drinks", wanted: [{ name: "Hot" }] });
		await h.svc.settings.publishMenu();
		await h.svc.settings.saveMenuEntity("categoryEdits", { original: "Drinks", name: "Beverages" });
		await h.svc.settings.saveMenuEntity("subcategoryEdits", { group: "drinks", parent: "Beverages", wanted: [{ id: h.data().subcategories[0].id, name: "Hot drinks" }, { name: "Cold" }] });
		await h.svc.settings.publishMenu();
		expect(h.data().subcategories.map((s) => [s.parent, s.name]).sort()).toEqual([["Beverages", "Cold"], ["Beverages", "Hot drinks"]]);
	});
});
