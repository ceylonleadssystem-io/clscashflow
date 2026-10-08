/**
 * Tests for the catalogue workflow: product validation, categories and subcategories, modifier groups and
 * catalogue import modes.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { addProduct, createHarness, productForm } from "./harness";

describe("catalogue workflow", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));

	it("validates product fields", async () => {
		expect(await h.svc.catalog.saveProduct(productForm({ name: "" }))).toBeNull();
		expect(await h.svc.catalog.saveProduct(productForm({ price: "0" }))).toBeNull();
		expect(await h.svc.catalog.saveProduct(productForm({ cost: "-1" }))).toBeNull();
		expect(h.data().products).toHaveLength(0);
	});
	it("creates a product, its category, and edits it", async () => {
		const p = await addProduct(h);
		expect(h.data().categories).toContain("Drinks");
		await h.svc.catalog.saveProduct(productForm({ id: p.id, price: "300" }));
		expect(h.data().products).toHaveLength(1);
		expect(h.data().products[0].price).toBe(300);
	});
	it("saves an optional description and keeps it when a caller does not send one", async () => {
		const p = await h.svc.catalog.saveProduct(productForm({ description: "  Lightweight cotton top  " }));
		expect(p.description).toBe("Lightweight cotton top");
		await h.svc.catalog.saveProduct(productForm({ id: p.id, price: "300" })); // no description key
		expect(h.data().products[0].description).toBe("Lightweight cotton top");
		await h.svc.catalog.saveProduct(productForm({ id: p.id, description: "" }));
		expect(h.data().products[0].description).toBe("");
	});
	it("retail common modifiers include a Size group S, M, XL, 2XL", async () => {
		const { commonModifierPresets } = await import("../config/presets");
		const size = commonModifierPresets("retail").find((m) => m.name === "Size");
		expect(size.options.map((o) => o.name)).toEqual(["S", "M", "XL", "2XL"]);
		expect(commonModifierPresets("restaurant").some((m) => m.options.some((o) => o.name === "2XL"))).toBe(false);
	});
	it("prints the item description under the line on receipts", async () => {
		const { receiptText } = await import("../services/printing/documents");
		const text = receiptText({ receipt: "ORD-1", lines: [{ name: "Island Top", description: "Lightweight cotton top", qty: 1, price: 8500 }], total: 8500, payment: "Cash" });
		expect(text).toMatch(/Island Top[\s\S]*\n {2}Lightweight cotton top\n/);
	});
	it("an added category with a preset name is remembered so it shows while empty", async () => {
		expect(await h.svc.catalog.addCategory("Clothing")).toBe(true);
		expect(h.data().settings.userCategories).toEqual(["Clothing"]);
		await h.svc.catalog.addCategory("clothing"); // duplicate: alert, not stored twice
		expect(h.data().settings.userCategories).toEqual(["Clothing"]);
	});
	it("creates a new category from the product form", async () => {
		await addProduct(h, { category: "__new__", newCategory: "Cakes" });
		expect(h.data().categories).toContain("Cakes");
	});
	it("gives a sellable product an auto stock row, services none", async () => {
		const p = await addProduct(h, { type: "Product" });
		expect(h.data().inventory.some((i) => i.productId === p.id)).toBe(true);
		await addProduct(h, { name: "Haircut", type: "Service" });
		expect(h.data().inventory).toHaveLength(1);
	});
	it("deletes a product together with its stock row", async () => {
		const p = await addProduct(h, { type: "Product" });
		await h.svc.catalog.deleteProduct(p.id);
		expect(h.data().products).toHaveLength(0);
		expect(h.data().inventory).toHaveLength(0);
		expect(h.data().meta.deletedIds.products).toContain(p.id);
	});
	it("keeps the product when delete is declined", async () => {
		const p = await addProduct(h);
		h.answers.confirm = false;
		expect(await h.svc.catalog.deleteProduct(p.id)).toBeNull();
		expect(h.data().products).toHaveLength(1);
	});

	describe("categories", () => {
		it("adds, rejects duplicates and blank names", async () => {
			await h.svc.catalog.addCategory("Snacks");
			await h.svc.catalog.addCategory("snacks");
			expect(h.lastAlert()).toMatch(/already exists/);
			await h.svc.catalog.addCategory("  ");
			expect(h.lastAlert()).toMatch(/Enter a category name/);
		});
		it("renames and cascades to products", async () => {
			await addProduct(h);
			h.answers.prompt = "Beverages";
			await h.svc.catalog.renameCategory("Drinks");
			expect(h.data().products[0].category).toBe("Beverages");
			expect(h.data().categories).not.toContain("Drinks");
		});
		it("moves products to Uncategorized when a category is deleted", async () => {
			await addProduct(h);
			await h.svc.catalog.deleteCategory("Drinks");
			expect(h.data().products[0].category).toBe("Uncategorized");
		});
		it("manages subcategories", async () => {
			h.answers.prompt = "Hot";
			await h.svc.catalog.addSubcategory("Drinks");
			expect(h.data().subcategories[0]).toMatchObject({ name: "Hot", parent: "Drinks" });
			await addProduct(h, { subcategory: "Hot" });
			h.answers.prompt = "Warm";
			await h.svc.catalog.renameSubcategory(h.data().subcategories[0].id);
			expect(h.data().products[0].subcategory).toBe("Warm");
			await h.svc.catalog.deleteSubcategory(h.data().subcategories[0].id);
			expect(h.data().subcategories).toHaveLength(0);
			expect(h.data().products[0].subcategory).toBe("");
		});
	});

	describe("modifiers", () => {
		const form = { name: "Size", mode: "single", required: true, options: [{ name: "Large", price: "50" }, { name: "", price: "0" }] };
		it("needs a name and one option", async () => {
			await h.svc.catalog.saveModifier({ ...form, name: "" });
			expect(h.lastAlert()).toMatch(/group name/);
		});
		it("saves and drops blank options", async () => {
			const m = await h.svc.catalog.saveModifier(form);
			expect(m.options).toEqual([{ name: "Large", price: 50 }]);
		});
		it("unlinks the group from products on delete", async () => {
			const m = await h.svc.catalog.saveModifier(form);
			await addProduct(h, { modifierIds: [m.id], modifierRules: { [m.id]: {} } });
			await h.svc.catalog.deleteModifier(m.id);
			expect(h.data().products[0].modifierIds).toEqual([]);
			expect(h.data().modifiers).toHaveLength(0);
		});
		it("adds common modifier presets once", async () => {
			await h.svc.catalog.addCommonModifiers();
			const n = h.data().modifiers.length;
			expect(n).toBeGreaterThan(0);
			await h.svc.catalog.addCommonModifiers();
			expect(h.data().modifiers).toHaveLength(n);
		});
	});

	describe("import", () => {
		const row = (o = {}) => ({ include: true, rowNumber: 2, name: "Roll", code: "R1", subcategory: "", category: "Bakery", price: 120, cost: 60, type: "Product", ...o });
		it("rejects invalid rows and an empty selection", async () => {
			await h.svc.catalog.importCatalogue([], "merge");
			expect(h.lastAlert()).toMatch(/Select at least one row/);
			await h.svc.catalog.importCatalogue([row({ price: 0 })], "merge");
			expect(h.lastAlert()).toMatch(/Row 2 needs/);
		});
		it("imports in merge mode and does not duplicate on re-import", async () => {
			await h.svc.catalog.importCatalogue([row()], "merge");
			await h.svc.catalog.importCatalogue([row({ price: 150 })], "merge");
			expect(h.data().products).toHaveLength(1);
			expect(h.data().products[0].price).toBe(150);
		});
		it("replace mode swaps the catalogue", async () => {
			await addProduct(h);
			await h.svc.catalog.importCatalogue([row()], "replace");
			expect(h.data().products.map((p) => p.name)).toEqual(["Roll"]);
		});
	});
});

describe("EmailJS order template", () => {
	const load = async () => {
		const fs = await import("node:fs");
		return fs.readFileSync(new URL("../../public/email-templates/pos-order-email.html", import.meta.url), "utf8");
	};
	const sale = {
		receipt: "ORD-0001", createdAt: "2026-10-05T10:00:00Z", payment: "Card", total: 4500, orderReference: "Table 4", orderChannel: "Dine-in",
		discount: { amount: 100, subtotal: 4600 }, serviceCharge: { amount: 0 },
		lines: [{ name: "Polo Shirt", description: "Cotton", qty: 1, price: 4600, modifiers: [{ groupName: "Size", optionName: "M" }] }],
	};
	it("every variable the template uses is sent by the POS", async () => {
		const body = await load();
		const { orderEmailVariables } = await import("../services/printing/orderEmail");
		const vars = orderEmailVariables(sale, { settings: { business: "Shop", address: "Colombo", email: "a@b.lk" }, customerName: "Sam" });
		const lineKeys = Object.keys(vars.orders[0]);
		const used = [...body.matchAll(/\{\{[#^/]?\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]);
		const known = new Set([...Object.keys(vars), ...lineKeys, "subject", "to_email", "from_name", "reply_to"]);
		expect(used.filter((v) => !known.has(v))).toEqual([]);
		expect(vars).toMatchObject({ order_number: "ORD-0001", total: "LKR 4,500.00", subtotal: "LKR 4,600.00", discount: "LKR 100.00", has_discount: "yes", has_service_charge: "", has_reference: "yes", has_email: "yes" });
		expect(vars.orders[0]).toMatchObject({ name: "Polo Shirt", modifiers: "Size: M", description: "Cotton", quantity: "1", has_description: "yes", has_modifiers: "yes" });
	});
	it("is a clean paste: no comments, every section closed and nested, no section wraps a variable of its own name", async () => {
		const body = await load();
		expect(body).not.toContain("<!--"); // nothing but the template body, so pasting the whole file is safe
		const stack = [];
		for (const m of body.matchAll(/\{\{([#/])([a-z_]+)\}\}/g)) {
			if (m[1] === "#") stack.push(m[2]);
			else expect(stack.pop(), "closing {{/" + m[2] + "}}").toBe(m[2]);
		}
		expect(stack, "sections left open").toEqual([]);
		expect(body.match(/\{\{/g).length).toBe(body.match(/\}\}/g).length); // no half tag
		for (const m of body.matchAll(/\{\{#([a-z_]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g)) expect(m[2]).not.toContain("{{" + m[1] + "}}");
	});
	it("gives each optional line a flag that is empty when the block should be hidden", async () => {
		const { orderEmailVariables } = await import("../services/printing/orderEmail");
		const plain = orderEmailVariables({ ...sale, lines: [{ name: "Tea", qty: 1, price: 100, modifiers: [] }] }, { settings: {}, customerName: "Sam" });
		expect(plain.orders[0]).toMatchObject({ has_description: "", has_modifiers: "" });
		expect(plain.has_email).toBe("");
	});
	it("renders with no tag left over, and optional blocks follow their flags", async () => {
		const body = await load();
		const { orderEmailVariables } = await import("../services/printing/orderEmail");
		// minimal Mustache-style renderer (sections, inverted sections, variables): the syntax EmailJS uses
		const render = (t, ctx) =>
			t
				.replace(/\{\{([#^])([a-z_]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g, (m, kind, k, inner) => {
					const v = ctx[k];
					if (kind === "^") return v && (!Array.isArray(v) || v.length) ? "" : render(inner, ctx);
					if (Array.isArray(v)) return v.map((x) => render(inner, { ...ctx, ...x })).join("");
					return v ? render(inner, ctx) : "";
				})
				.replace(/\{\{([a-z_]+)\}\}/g, (m, k) => String(ctx[k] ?? ""));
		const full = render(body, orderEmailVariables(sale, { settings: { business: "Shop", address: "Colombo", email: "a@b.lk" }, customerName: "Sam" }));
		expect(full).not.toContain("{{");
		expect(full).toContain("Polo Shirt");
		expect(full).toContain("Size: M");
		expect(full).toContain("Cotton");
		expect(full).toContain("a@b.lk");
		const bare = render(body, orderEmailVariables({ ...sale, discount: { amount: 0, subtotal: 4600 }, orderReference: "", lines: [{ name: "Tea", qty: 1, price: 100, modifiers: [] }] }, { settings: { business: "Shop" }, customerName: "Sam" }));
		expect(bare).not.toContain("{{");
		expect(bare).not.toContain("Discount");
		expect(bare).not.toContain("Reference:");
		expect(bare).not.toContain("Size: M");
		expect(bare).not.toContain("&middot; a@b.lk");
	});
});
