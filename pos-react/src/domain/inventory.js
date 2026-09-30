import { nowIso } from "./format";

/** Inventory maths: recipes, product stock and per-location quantities. */

export function stockStatus(item) {
	return item.qty <= 0 ? "Out of stock" : item.qty <= item.reorder ? "Low stock" : "In stock";
}

export const isService = (product) => String(product?.type || "Product").toLowerCase() === "service";

/** Quantity of the item at the active location (falls back to item.qty). */
export function locationStock(item, locationId) {
	const q = item.locationQuantities || {};
	return locationId && q[locationId] != null ? Number(q[locationId]) || 0 : Number(item.qty) || 0;
}

/** Ingredient needs of a cart: { itemId: qty }. */
export function saleStockNeeds(cart, products) {
	const needs = {};
	cart.forEach((line) => {
		const p = products.find((x) => x.id === line.productId);
		(line.recipe || p?.recipe || []).forEach((r) => {
			needs[r.itemId] = (needs[r.itemId] || 0) + r.qty * line.qty;
		});
	});
	return needs;
}

export function firstShortIngredient(needs, inventory) {
	return Object.entries(needs)
		.map(([id, qty]) => ({ i: inventory.find((x) => x.id === id), qty }))
		.find((x) => x.i && x.i.qty < x.qty);
}

export function stockMovement(item, change, reason, note = "", userId = "") {
	return {
		id: "sm" + Date.now() + Math.random(),
		itemId: item.id,
		itemName: item.name,
		at: nowIso(),
		change: +change,
		balance: +item.qty,
		reason,
		note,
		userId,
	};
}

/** Product-backed stock row (sellable product) -> item for a product id. */
export const productStockItem = (inventory, productId) =>
	inventory.find((i) => String(i.productId || "") === String(productId));

/** Stock available for a product at a location (Infinity for services). */
export function availableProductStock(product, inventory, locationId) {
	if (!product || isService(product)) return Infinity;
	const item = productStockItem(inventory, product.id);
	return item ? locationStock(item, locationId) : Number(product.stock) || 0;
}

export const cartQtyForProduct = (cart, productId, exceptKey) =>
	cart
		.filter((l) => String(l.productId) === String(productId) && l.key !== exceptKey)
		.reduce((t, l) => t + (Number(l.qty) || 0), 0);

/** Returns the first cart line exceeding available stock, if any. */
export function stockProblem(cart, products, inventory, locationId) {
	return cart.find((line) => {
		if (line.isDiscount || line.isServiceCharge) return false;
		const product = products.find((p) => p.id === line.productId);
		const available = availableProductStock(product, inventory, locationId);
		const requested = cartQtyForProduct(cart, line.productId, line.key) + (Number(line.qty) || 0);
		return Number.isFinite(available) && requested > available;
	});
}

/** Auto-created stock rows for every non-service product. Returns changed rows. */
export function ensureProductInventory(products, inventory, locations) {
	const next = inventory.map((i) => ({ ...i }));
	const active = locations.filter((l) => l.active !== false);
	let changed = false;
	products
		.filter((p) => !isService(p))
		.forEach((product) => {
			let item = next.find((e) => String(e.productId || "") === String(product.id));
			if (!item) {
				item = {
					id: "inv-product-" + product.id,
					productId: product.id,
					name: product.name,
					sku: product.code || "",
					type: "Sellable Product",
					unit: "each",
					qty: Number(product.stock) || 0,
					reorder: 0,
					cost: Number(product.cost) || 0,
					supplier: "",
					autoProductStock: true,
					locationQuantities: {},
					createdAt: nowIso(),
				};
				next.push(item);
				changed = true;
			}
			const set = (key, value) => {
				if (item[key] !== value) {
					item[key] = value;
					changed = true;
				}
			};
			set("name", product.name);
			if (product.code) set("sku", product.code);
			set("cost", Number(product.cost) || 0);
			set("type", "Sellable Product");
			set("unit", "each");
			set("autoProductStock", true);
			if (!item.locationQuantities || typeof item.locationQuantities !== "object") {
				item.locationQuantities = {};
				changed = true;
			}
			active.forEach((loc) => {
				if (item.locationQuantities[loc.id] == null) {
					item.locationQuantities[loc.id] = Number(product.stock) || 0;
					changed = true;
				}
			});
		});
	return { inventory: next, changed };
}
