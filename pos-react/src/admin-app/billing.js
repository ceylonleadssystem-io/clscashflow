/** Invoice maths for the admin portal (see buildInvoiceLines). */
import { PLANS, PLAN_FEATURE_OFF } from "../config/plans";

export function tierFeatureOff(tier) {
	return PLAN_FEATURE_OFF[tier] || [];
}

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Pure invoice calculation: tier price + optional manual extras line + optional tax.
 * A fixed-amount exception is final (no extras, no tax added).
 * extras: { enabled, description, amount }   tax: { enabled, rate }
 */
export function buildInvoiceLines({ tier, exceptionAmount, exceptionNote, period, extras, tax }) {
	const plan = PLANS.find((p) => p.id === tier) || PLANS[0];
	const label = plan.term === "one-time" ? "one-time" : period || "monthly";
	const fixed = Number(exceptionAmount);
	if (Number.isFinite(fixed) && fixed > 0)
		return {
			exception: true,
			computedTotal: plan.price,
			extras: null,
			tax: { enabled: false, rate: 0, amount: 0 },
			lines: [{ desc: `${plan.name} — agreed fixed amount${exceptionNote ? " (" + exceptionNote + ")" : ""}`, qty: 1, price: r2(fixed) }],
			subtotal: r2(fixed),
			total: r2(fixed),
		};
	const lines = [{ desc: `${plan.name} — ${label}`, qty: 1, price: plan.price }];
	const exAmt = r2(extras?.amount);
	const ex = extras?.enabled && exAmt > 0 ? { description: String(extras.description || "Additional features").trim().slice(0, 200) || "Additional features", amount: exAmt } : null;
	if (ex) lines.push({ desc: ex.description, qty: 1, price: ex.amount });
	const subtotal = r2(lines.reduce((t, l) => t + l.qty * l.price, 0));
	const rate = Math.min(100, Math.max(0, r2(tax?.rate)));
	const t = { enabled: !!tax?.enabled && rate > 0, rate, amount: 0 };
	if (t.enabled) {
		t.amount = r2((subtotal * rate) / 100);
		lines.push({ desc: `Tax (${rate}%)`, qty: 1, price: t.amount });
	}
	return { exception: false, computedTotal: subtotal, extras: ex, tax: t, lines, subtotal, total: r2(subtotal + t.amount) };
}
