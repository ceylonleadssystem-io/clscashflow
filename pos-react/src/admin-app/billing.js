/**
 * Invoice maths for the admin portal: which enabled features fall outside a plan tier, and
 * buildInvoiceLines() which produces the invoice lines and total (tier price, chargeable extras or a fixed-amount exception).
 */
import { ADDITIONAL_FEATURES, PLANS, PLAN_FEATURE_OFF } from "../config/plans";
import { FEATURE_MAP, resolveFeatures } from "../config/features";

/**
 * Subscription invoice for one account.
 *  - base price of the tier (Enterprise is a one-time price)
 *  - features switched on that are NOT part of the tier are "additional features":
 *    the first N are free, the rest are charged per feature
 *  - exception: some clients have a fixed agreed amount that replaces the computed total
 */
export function tierFeatureOff(tier) {
	return PLAN_FEATURE_OFF[tier] || [];
}

/** Enabled features that the tier does not include. */
export function additionalFeatures(tier, businessFlags) {
	const { raw } = resolveFeatures(businessFlags);
	return tierFeatureOff(tier).filter((id) => raw[id] && FEATURE_MAP[id] && !FEATURE_MAP[id].core);
}

export function buildInvoiceLines({ tier, flags, exceptionAmount, exceptionNote, period }) {
	const plan = PLANS.find((p) => p.id === tier) || PLANS[0];
	const label = plan.term === "one-time" ? "one-time" : period || "monthly";
	const extras = additionalFeatures(tier, flags);
	const free = ADDITIONAL_FEATURES.freeCount;
	const chargeable = Math.max(0, extras.length - free);
	const computed = [
		{ desc: `${plan.name} — ${label}`, qty: 1, price: plan.price },
		...(chargeable
			? [{ desc: `Additional features beyond ${free} free (${extras.map((id) => FEATURE_MAP[id].label).join(", ")})`, qty: chargeable, price: ADDITIONAL_FEATURES.pricePerFeature }]
			: []),
	];
	const computedTotal = computed.reduce((t, l) => t + l.qty * l.price, 0);
	const fixed = Number(exceptionAmount);
	if (Number.isFinite(fixed) && fixed > 0)
		return {
			exception: true,
			computedTotal,
			extras,
			lines: [{ desc: `${plan.name} — agreed fixed amount${exceptionNote ? " (" + exceptionNote + ")" : ""}`, qty: 1, price: fixed }],
			total: fixed,
		};
	return { exception: false, computedTotal, extras, lines: computed, total: computedTotal };
}
