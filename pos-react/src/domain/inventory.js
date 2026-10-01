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
	if (item) return locationStock(item, locationId);
	// stock row deleted on purpose: the item is sellable without restrictions
	if (product.trackStock === false) return Infinity;
	return Number(product.stock) || 0;
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
		.filter((p) => !isService(p) && p.trackStock !== false)
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

/**
 * How an adjustment reason changes stock. The operator always types a positive
 * number; the reason decides whether it is added, removed or is a counted total.
 */
export const ADJUST_RULES = {
	"Stock received": { sign: 1, label: "Quantity received (added to stock)" },
	"Stock count correction": { sign: 0, label: "Counted quantity (replaces current stock)" },
	Wastage: { sign: -1, label: "Quantity wasted (removed from stock)" },
	Damaged: { sign: -1, label: "Quantity damaged (removed from stock)" },
	"Internal use": { sign: -1, label: "Quantity used (removed from stock)" },
	"Return to supplier": { sign: -1, label: "Quantity returned (removed from stock)" },
};

/** Signed stock change for `amount` (>= 0) typed under `reason` at `current` stock. */
export function adjustmentChange(reason, amount, current) {
	const rule = ADJUST_RULES[reason] || ADJUST_RULES["Stock received"];
	const a = Math.abs(Number(amount) || 0);
	return rule.sign === 0 ? a - current : rule.sign * a;
}
