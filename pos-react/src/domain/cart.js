import { PLATFORM_CHANNELS } from "../config/constants";

/** Cart maths and modifier logic (final behaviour of the legacy checkout). */

export const modifierSignature = (selections) =>
	selections
		.map((s) => s.groupId + ":" + s.optionName)
		.sort()
		.join("|");

/**
 * Modifier groups attached to a product, with the per-product
 * required/optional override applied (`product.modifierRules`).
 */
export function productModifiers(product, modifiers) {
	return (product?.modifierIds || [])
		.map((id) => {
			const m = modifiers.find((x) => x.id === id);
			if (!m) return null;
			const override =
				product.modifierRules && Object.prototype.hasOwnProperty.call(product.modifierRules, id)
					? product.modifierRules[id]
					: m.required !== false;
			return { ...m, required: override !== false };
		})
		.filter(Boolean);
}

/** Validates a picker selection; returns the first group with a missing required choice. */
export function missingRequiredGroup(groups, selected) {
	return groups.find((m) => m.required !== false && !selected.some((s) => s.groupId === m.id));
}

export const selectionExtra = (selections) => selections.reduce((sum, s) => sum + (+s.price || 0), 0);

/**
 * Adds (or edits) a configured line. Returns a new cart array.
 * `lineKey` set => editing an existing line's modifiers (merging duplicates).
 */
export function addConfiguredLine(cart, product, selections, lineKey = "") {
	const extra = selectionExtra(selections);
	const signature = modifierSignature(selections);
	const key = lineKey || product.id + "|" + signature;
	if (!lineKey) {
		const existing = cart.find((x) => x.key === key);
		if (existing) return cart.map((x) => (x === existing ? { ...x, qty: x.qty + 1 } : x));
		return [
			...cart,
			{
				...product,
				productId: product.id,
				key,
				basePrice: +product.price,
				price: +product.price + extra,
				modifiers: selections,
				qty: 1,
			},
		];
	}
	const line = cart.find((x) => x.key === lineKey);
	if (!line) return cart;
	const duplicate = cart.find(
		(x) => x !== line && x.productId === product.id && modifierSignature(x.modifiers || []) === signature,
	);
	if (duplicate)
		return cart
			.filter((x) => x !== line)
			.map((x) => (x === duplicate ? { ...x, qty: x.qty + line.qty } : x));
	return cart.map((x) =>
		x === line
			? {
					...x,
					key: product.id + "|" + signature,
					price: +product.price + extra,
					basePrice: +product.price,
					modifiers: selections,
				}
			: x,
	);
}

export function changeQty(cart, key, delta) {
	const line = cart.find((x) => x.key === key);
	if (!line) return cart;
	const qty = line.qty + delta;
	if (qty < 1) return cart.filter((x) => x !== line);
	return cart.map((x) => (x === line ? { ...x, qty } : x));
}

// -------------------------------------------------------------- totals ------
const isChargeable = (line) => !line.isDiscount && !line.isServiceCharge;

export const chargeableSubtotal = (cart) =>
	cart.filter(isChargeable).reduce((sum, l) => sum + (+l.price || 0) * (+l.qty || 0), 0);

export function discountAmount(cart, discount) {
	const subtotal = chargeableSubtotal(cart);
	const value = Math.max(0, +discount?.value || 0);
	return Math.min(
		subtotal,
		discount?.type === "percent" ? (subtotal * Math.min(value, 100)) / 100 : value,
	);
}

export function serviceChargeAmount(cart, discount, settings, supported) {
	if (!supported || !settings.serviceChargeEnabled) return 0;
	const rate = Math.max(0, Math.min(100, +settings.serviceChargeRate || 0));
	return (Math.max(0, chargeableSubtotal(cart) - discountAmount(cart, discount)) * rate) / 100;
}

export function cartTotals(cart, discount, settings, serviceChargeSupported) {
	const subtotal = chargeableSubtotal(cart);
	const discountValue = discountAmount(cart, discount);
	const service = serviceChargeAmount(cart, discount, settings, serviceChargeSupported);
	return {
		count: cart.filter(isChargeable).reduce((a, l) => a + l.qty, 0),
		subtotal,
		discount: discountValue,
		service,
		total: Math.max(0, subtotal - discountValue + service),
	};
}

export const EMPTY_DISCOUNT = { type: "percent", value: 0 };

export const isPlatformChannel = (channel) => PLATFORM_CHANNELS.includes(channel);

/** Equal split that puts the rounding remainder on the last share. */
export function equalSplit(total, count) {
	const base = Math.floor((total / count) * 100) / 100;
	return Array.from({ length: count }, (_, i) => ({
		method: i ? "Card" : "Cash",
		amount: i === count - 1 ? +(total - base * (count - 1)).toFixed(2) : base,
		paid: false,
	}));
}
