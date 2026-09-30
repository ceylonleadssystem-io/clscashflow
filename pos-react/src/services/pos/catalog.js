import { T } from "../../db/tables";
import { nowIso } from "../../domain/format";
import { categoryKey, productCategories } from "../../domain/catalog";
import { ensureProductInventory } from "../../domain/inventory";
import { commonModifierPresets } from "../../config/presets";
import { markDeleted, newId, unmarkDeletedCategory } from "./common";

/** Products, categories, subcategories, modifier groups and catalogue import. */

/** Creates/refreshes the auto "Sellable Product" stock rows inside a transaction. */
export function syncProductInventory(tx, data, products = data.products) {
	const { inventory, changed } = ensureProductInventory(products, data.inventory, data.locations);
	if (!changed) return;
	const before = new Map(data.inventory.map((i) => [i.id, JSON.stringify(i)]));
	inventory.forEach((item) => {
		if (before.get(item.id) !== JSON.stringify(item)) tx.put(T.inventoryItems, item);
	});
}

export async function saveProduct(ctx, form) {
	const d = ctx.data();
	const name = form.name.trim();
	const chosen = form.category === "__new__" ? form.newCategory.trim() : form.category;
	const cost = Number(form.cost);
	const price = Number(form.price);
	if (!name || !chosen || !Number.isFinite(cost) || cost < 0 || !Number.isFinite(price) || price <= 0) {
		await ctx.ui.alert("Enter a valid name, main category, cost price and selling price.");
		return null;
	}
	const existingCategory = productCategories(d.categories, d.products).find((c) => c.toLowerCase() === chosen.toLowerCase());
	const category = existingCategory || chosen;
	const existing = d.products.find((p) => p.id === form.id);
	const product = {
		...(existing || { id: newId("p"), createdAt: nowIso() }),
		name,
		category,
		subcategory: form.subcategory || "",
		cost,
		price,
		type: form.type,
		code: form.code.trim() || "POS-" + String(Date.now()).slice(-5),
		image: form.image || "",
		imageFit: form.imageFit || "cover",
		imagePositionX: Number.isFinite(form.imagePositionX) ? form.imagePositionX : 50,
		imagePositionY: Number.isFinite(form.imagePositionY) ? form.imagePositionY : 50,
		modifierIds: form.modifierIds || [],
		modifierRules: form.modifierRules || {},
		recipe: form.recipe || [],
	};
	await ctx.store.write(async (tx) => {
		if (!d.categories.some((c) => categoryKey(c) === categoryKey(category))) {
			tx.addCategory(category);
			await unmarkDeletedCategory(tx, category);
		}
		tx.put(T.products, product);
		const products = existing ? d.products.map((p) => (p.id === product.id ? product : p)) : [product, ...d.products];
		if (ctx.features()["inventory.productStock"]) syncProductInventory(tx, d, products);
	});
	ctx.ui.notice(`${name} saved with cost ${fmt(cost)} and selling price ${fmt(price)}.`);
	return product;
}

const fmt = (n) => "LKR " + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** @returns the deleted product or null. */
export async function deleteProduct(ctx, id) {
	const d = ctx.data();
	const p = d.products.find((x) => x.id === id);
	if (!p) return null;
	if (!(await ctx.ui.confirm(`Delete ${p.name}? This cannot be undone.`))) return null;
	await ctx.store.write(async (tx) => {
		await markDeleted(tx, "products", id);
		tx.remove(T.products, id);
		const stock = d.inventory.find((i) => String(i.productId || "") === String(id));
		if (stock) {
			await markDeleted(tx, "inventory", stock.id);
			tx.remove(T.inventoryItems, stock.id);
		}
	});
	ctx.ui.notice(`${p.name} was deleted.`);
	return p;
}

// ------------------------------------------------------------- categories ---
export async function addCategory(ctx, rawName) {
	const name = String(rawName || "").trim();
	const d = ctx.data();
	if (!name) return void (await ctx.ui.alert("Enter a category name."));
	if (productCategories(d.categories, d.products).some((c) => c.toLowerCase() === name.toLowerCase()))
		return void (await ctx.ui.alert("That category already exists."));
	await ctx.store.write(async (tx) => {
		tx.addCategory(name);
		await unmarkDeletedCategory(tx, name);
	});
	ctx.ui.notice(name + " category added.");
	return true;
}

export async function renameCategory(ctx, oldName) {
	const d = ctx.data();
	const next = ((await ctx.ui.prompt("Rename category", oldName)) || "").trim();
	if (!next || next === oldName) return;
	if (
		productCategories(d.categories, d.products).some(
			(c) => c.toLowerCase() === next.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase(),
		)
	)
		return void (await ctx.ui.alert("That category already exists."));
	await ctx.store.write(async (tx) => {
		d.categories.filter((c) => categoryKey(c) === categoryKey(oldName)).forEach((c) => tx.removeCategory(c));
		tx.addCategory(next);
		d.products
			.filter((p) => String(p.category || "").toLowerCase() === oldName.toLowerCase())
			.forEach((p) => tx.put(T.products, { ...p, category: next }));
		d.subcategories.filter((s) => s.parent === oldName).forEach((s) => tx.put(T.subcategories, { ...s, parent: next }));
		await markDeleted(tx, "categories", categoryKey(oldName));
		await unmarkDeletedCategory(tx, next);
	});
	ctx.ui.notice(oldName + " renamed to " + next + ".");
}

export async function deleteCategory(ctx, name) {
	const d = ctx.data();
	const used = d.products.filter((p) => String(p.category || "").toLowerCase() === name.toLowerCase());
	const message = used.length
		? `Delete ${name}? Its ${used.length} item(s) will be moved to Uncategorized.`
		: `Delete the ${name} category?`;
	if (!(await ctx.ui.confirm(message))) return;
	await ctx.store.write(async (tx) => {
		d.categories.filter((c) => categoryKey(c) === categoryKey(name)).forEach((c) => tx.removeCategory(c));
		for (const s of d.subcategories.filter((x) => x.parent === name)) {
			await markDeleted(tx, "subcategories", s.id);
			tx.remove(T.subcategories, s.id);
		}
		if (used.length) {
			const fallback =
				productCategories(d.categories, d.products).find((c) => c.toLowerCase() === "uncategorized") || "Uncategorized";
			tx.addCategory(fallback);
			used.forEach((p) => tx.put(T.products, { ...p, category: fallback, subcategory: "" }));
		}
		await markDeleted(tx, "categories", categoryKey(name));
	});
	ctx.ui.notice(name + " category deleted.");
}

// ---------------------------------------------------------- subcategories ---
export async function addSubcategory(ctx, parent) {
	const d = ctx.data();
	const name = ((await ctx.ui.prompt("Subcategory name under " + parent)) || "").trim();
	if (!name) return;
	if (d.subcategories.some((s) => s.parent === parent && s.name.toLowerCase() === name.toLowerCase()))
		return void (await ctx.ui.alert("That subcategory already exists."));
	await ctx.store.write((tx) => tx.put(T.subcategories, { id: newId("sub-"), name, parent }));
	ctx.ui.notice(`${name} was added under ${parent}.`);
}

export async function renameSubcategory(ctx, id) {
	const d = ctx.data();
	const item = d.subcategories.find((s) => s.id === id);
	if (!item) return;
	const name = ((await ctx.ui.prompt("Rename subcategory", item.name)) || "").trim();
	if (!name || name === item.name) return;
	await ctx.store.write((tx) => {
		d.products
			.filter((p) => p.category === item.parent && p.subcategory === item.name)
			.forEach((p) => tx.put(T.products, { ...p, subcategory: name }));
		tx.put(T.subcategories, { ...item, name });
	});
}

export async function deleteSubcategory(ctx, id) {
	const d = ctx.data();
	const item = d.subcategories.find((s) => s.id === id);
	if (!item) return;
	const affected = d.products.filter((p) => p.category === item.parent && p.subcategory === item.name);
	if (
		!(await ctx.ui.confirm(
			`Delete ${item.name}? ${affected.length ? affected.length + " product(s) will keep their main category." : ""}`,
		))
	)
		return;
	await ctx.store.write(async (tx) => {
		affected.forEach((p) => tx.put(T.products, { ...p, subcategory: "" }));
		await markDeleted(tx, "subcategories", id);
		tx.remove(T.subcategories, id);
	});
}

// -------------------------------------------------------------- modifiers ---
export async function saveModifier(ctx, form) {
	const name = form.name.trim();
	const options = form.options.map((o) => ({ name: o.name.trim(), price: +o.price || 0 })).filter((o) => o.name);
	if (!name || !options.length) return void (await ctx.ui.alert("Enter a group name and at least one option."));
	const existing = ctx.data().modifiers.find((m) => m.id === form.id);
	const modifier = {
		...(existing || { id: newId("m"), createdAt: nowIso() }),
		name,
		mode: form.mode,
		required: form.required,
		options,
	};
	await ctx.store.write((tx) => tx.put(T.modifierGroups, modifier));
	return modifier;
}

export async function addCommonModifiers(ctx, { silent = false } = {}) {
	const d = ctx.data();
	let added = 0;
	await ctx.store.write((tx) => {
		commonModifierPresets(d.settings.businessType || "other").forEach((preset, index) => {
			if (d.modifiers.some((m) => m.name.toLowerCase() === preset.name.toLowerCase())) return;
			tx.put(T.modifierGroups, { ...preset, id: "m" + Date.now() + index });
			added++;
		});
	});
	if (!silent)
		ctx.ui.notice(
			added
				? added + " common modifier groups added. Edit prices and assign them to products."
				: "Common modifier groups are already available.",
		);
}

/** Removes the group from every product; returns the deleted group. */
export async function deleteModifier(ctx, id) {
	const d = ctx.data();
	const modifier = d.modifiers.find((m) => m.id === id);
	if (!modifier) return null;
	const linked = d.products.filter((p) => (p.modifierIds || []).includes(id));
	let message = `Delete the “${modifier.name}” modifier group?`;
	if (linked.length) message += ` It will also be removed from ${linked.length} linked product${linked.length === 1 ? "" : "s"}.`;
	if (!(await ctx.ui.confirm(message))) return null;
	await ctx.store.write(async (tx) => {
		linked.forEach((p) => {
			const rules = { ...(p.modifierRules || {}) };
			delete rules[id];
			tx.put(T.products, { ...p, modifierIds: p.modifierIds.filter((m) => m !== id), modifierRules: rules });
		});
		await markDeleted(tx, "modifiers", id);
		tx.remove(T.modifierGroups, id);
	});
	ctx.ui.notice(modifier.name + " was deleted.");
	return modifier;
}

// ----------------------------------------------------------------- import ---
export async function importCatalogue(ctx, rows, mode) {
	const d = ctx.data();
	const selected = rows.filter((r) => r.include);
	if (!selected.length) return void (await ctx.ui.alert("Select at least one row to import."));
	const invalid = selected.find((r) => !r.name.trim() || !r.category.trim() || !(r.price > 0));
	if (invalid) return void (await ctx.ui.alert(`Row ${invalid.rowNumber} needs a name, main category and selling price.`));
	if (mode === "replace" && !(await ctx.ui.confirm(`Replace the complete product catalogue with these ${selected.length} items? This cannot be undone.`)))
		return;
	let imported = 0;
	let updated = 0;
	let skipped = 0;
	await ctx.store.write(async (tx) => {
		let products = mode === "replace" ? [] : [...d.products];
		if (mode === "replace") for (const p of d.products) tx.remove(T.products, p.id);
		const cats = new Set(d.categories);
		const subs = [...d.subcategories];
		selected.forEach((row, index) => {
			const existing = products.find((p) => row.code && String(p.code || "").toLowerCase() === row.code.toLowerCase());
			if (existing && mode === "add") {
				skipped++;
				return;
			}
			const product = {
				...(existing || {
					id: "p-import-" + Date.now() + "-" + index,
					modifierIds: [],
					image: "",
					imageFit: "cover",
					imagePositionX: 50,
					imagePositionY: 50,
				}),
				name: row.name.trim(),
				type: row.type,
				code: row.code.trim(),
				category: row.category.trim(),
				subcategory: row.subcategory.trim(),
				description: row.description,
				cost: +row.cost || 0,
				price: +row.price,
				stock: +row.stock || 0,
				unit: row.unit,
				supplier: row.supplier,
			};
			if (existing) {
				updated++;
				products = products.map((p) => (p.id === product.id ? product : p));
			} else {
				imported++;
				products.push(product);
			}
			tx.put(T.products, product);
			if (!cats.has(product.category)) {
				cats.add(product.category);
				tx.addCategory(product.category);
			}
			if (product.subcategory && !subs.some((s) => s.parent === product.category && s.name === product.subcategory)) {
				const sub = { id: "sub-import-" + Date.now() + "-" + index, parent: product.category, name: product.subcategory };
				subs.push(sub);
				tx.put(T.subcategories, sub);
			}
		});
		if (ctx.features()["inventory.productStock"]) syncProductInventory(tx, d, products);
	});
	ctx.ui.notice(
		`${imported} items added${updated ? " · " + updated + " updated" : ""}${skipped ? " · " + skipped + " skipped" : ""}. Use Edit to add images and adjust details.`,
	);
	return { imported, updated, skipped };
}

/** Fills empty product images from the optional bundled catalogue photos. */
export async function applyBundledCatalogueImages(ctx, images) {
	const d = ctx.data();
	if (!/azure\s*swim/i.test(String(d.settings.business || ""))) return false;
	const changes = d.products.filter((p) => !p.image && images[String(p.code || "").trim().toUpperCase()]);
	if (!changes.length) return false;
	await ctx.store.write((tx) =>
		changes.forEach((p) =>
			tx.put(T.products, { ...p, image: images[String(p.code).trim().toUpperCase()], imageSource: "azure-swim-catalogue" }),
		),
	);
	return true;
}
