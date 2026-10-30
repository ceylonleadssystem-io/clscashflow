/**
 * Taxes (pure). Prices are entered without tax; tax is added on top, per line, rounded half-up to the cent.
 * Published lists (see menuAdmin.js): settings.taxes [{ id, name, isGroup, rate, memberTaxIds, status }] and
 * settings.taxRules [{ id: "rules", defaultTaxId, takeawayOn, serviceTaxOn, serviceTaxId, categoryTaxes: { [categoryKey]: { tax, takeaway } } }].
 * With no active tax nothing is added, so a business that never sets taxes up sees no change at all.
 * A tax group applies each of its member taxes to the same amount (they are not compounded) and shows them as separate lines.
 * A line's tax is its category's tax, else the default tax; on a takeaway order the category's takeaway tax wins when "Takeaway tax" is on.
 * The tax is worked out on the amount after the order discount (shared across the lines in proportion to their value).
 */
import { categoryKey } from "./catalog";

export const MAX_RATE = 100;
const list = (v) => (Array.isArray(v) ? v : []);
const text = (v) => String(v ?? "").trim().slice(0, 40);

/** Half-up rounding to 2 decimals (the currency minor unit). */
export const round2 = (x) => Math.round((x + 1e-9) * 100) / 100;

export function cleanTax(t = {}) {
	const isGroup = !!t.isGroup;
	return {
		id: String(t.id),
		name: text(t.name),
		isGroup,
		rate: isGroup ? 0 : Math.round((Number(t.rate) || 0) * 1000) / 1000,
		memberTaxIds: isGroup ? [...new Set(list(t.memberTaxIds).map(String))] : [],
		status: t.status === "inactive" ? "inactive" : "active",
	};
}

export function cleanTaxRules(r = {}) {
	const categoryTaxes = {};
	for (const [k, v] of Object.entries(r.categoryTaxes || {})) {
		const tax = String(v?.tax || "");
		const takeaway = String(v?.takeaway || "");
		if (tax || takeaway) categoryTaxes[k] = { tax, takeaway };
	}
	return {
		id: "rules",
		name: "Tax rules",
		defaultTaxId: String(r.defaultTaxId || ""),
		takeawayOn: !!r.takeawayOn,
		serviceTaxOn: !!r.serviceTaxOn,
		serviceTaxId: String(r.serviceTaxId || ""),
		categoryTaxes,
	};
}

/** The published rules (the empty set when none were published). */
export const rulesOf = (settings = {}) => cleanTaxRules(list(settings.taxRules)[0] || {});

/** Why a tax cannot be saved ("" when it can). `others` are the other taxes. */
export function taxError(t, others = []) {
	if (!t.name) return "Enter a name.";
	if (others.some((o) => o.name.toLowerCase() === t.name.toLowerCase())) return "There is already a tax called " + t.name + ".";
	if (t.isGroup) {
		if (!t.memberTaxIds.length) return "Choose the taxes in this group.";
		const singles = new Set(others.filter((o) => !o.isGroup).map((o) => o.id));
		if (t.memberTaxIds.some((id) => !singles.has(id))) return "A group can only contain single taxes that already exist.";
	} else if (!(t.rate >= 0 && t.rate <= MAX_RATE)) return `Enter a rate from 0 to ${MAX_RATE}.`;
	return "";
}

/** Where a tax is used, as short phrases ([] when nowhere): a group's member, the default, a category or the service charge. */
export function taxUses(id, taxes = [], rules = {}, items = []) {
	const uses = taxes.filter((t) => t.isGroup && t.memberTaxIds.includes(id)).map((t) => "the group " + t.name);
	if (rules.defaultTaxId === id) uses.push("the default tax");
	if (rules.serviceTaxOn && rules.serviceTaxId === id) uses.push("the service charge");
	const cats = Object.values(rules.categoryTaxes || {}).filter((c) => c.tax === id || c.takeaway === id).length;
	if (cats) uses.push(`${cats} categor${cats === 1 ? "y" : "ies"}`);
	const its = items.filter((i) => i.taxId === id || i.takeawayTaxId === id).length;
	if (its) uses.push(`${its} item${its === 1 ? "" : "s"}`);
	return uses;
}

/** The single taxes behind an id: itself, or the active members of a group ([] when inactive or unknown). */
export function partsOf(id, taxes = []) {
	const t = taxes.find((x) => x.id === id && x.status === "active");
	if (!t) return [];
	if (!t.isGroup) return [{ id: t.id, name: t.name, rate: t.rate }];
	return t.memberTaxIds.map((m) => taxes.find((x) => x.id === m && x.status === "active" && !x.isGroup)).filter(Boolean).map((x) => ({ id: x.id, name: x.name, rate: x.rate }));
}

const taxIdFor = (line, rules, takeaway, items = {}) => {
	const o = items[line.productId]; // an item's own tax: "none" means no tax (no tax has that id, so nothing applies)
	if (o) {
		if (takeaway && rules.takeawayOn && o.takeawayTaxId) return o.takeawayTaxId;
		if (o.taxId) return o.taxId;
	}
	const c = rules.categoryTaxes[categoryKey(line.category)];
	return (takeaway && rules.takeawayOn && c?.takeaway) || c?.tax || rules.defaultTaxId;
};

/**
 * The tax on an order: { amount, rows: [{ id, name, rate, base, amount }] } with one row per single tax.
 * `discount` and `service` are the order's discount and service charge amounts; `channel` is the order type; `items` are the item overrides by product id.
 */
export function calculateTaxes({ cart = [], discount = 0, service = 0, channel = "", taxes = [], rules = cleanTaxRules(), items = {} }) {
	const active = taxes.filter((t) => t.status === "active");
	if (!active.length) return { amount: 0, rows: [] };
	const takeaway = channel === "Takeaway";
	const lines = cart.filter((l) => !l.isDiscount && !l.isServiceCharge);
	const gross = lines.reduce((a, l) => a + (+l.price || 0) * (+l.qty || 0), 0);
	const rows = new Map();
	const add = (parts, base) => {
		for (const p of parts) {
			const r = rows.get(p.id) || { id: p.id, name: p.name, rate: p.rate, base: 0, amount: 0 };
			r.base = round2(r.base + base);
			r.amount = round2(r.amount + round2((base * p.rate) / 100));
			rows.set(p.id, r);
		}
	};
	for (const l of lines) {
		const value = (+l.price || 0) * (+l.qty || 0);
		const base = gross ? value - (discount * value) / gross : value;
		if (base > 0) add(partsOf(taxIdFor(l, rules, takeaway, items), active), base);
	}
	if (service > 0 && rules.serviceTaxOn && rules.serviceTaxId) add(partsOf(rules.serviceTaxId, active), service);
	const out = [...rows.values()].filter((r) => r.amount > 0 || r.base > 0);
	return { amount: round2(out.reduce((a, r) => a + r.amount, 0)), rows: out };
}

/** "LKR 1,000 -> tax -> total" for the tax editor. */
export function previewTax(t, taxes = [], amount = 1000) {
	const parts = t.isGroup ? t.memberTaxIds.map((id) => taxes.find((x) => x.id === id && !x.isGroup)).filter(Boolean) : [t];
	const tax = round2(parts.reduce((a, p) => a + round2((amount * p.rate) / 100), 0));
	return { amount, tax, total: round2(amount + tax) };
}
