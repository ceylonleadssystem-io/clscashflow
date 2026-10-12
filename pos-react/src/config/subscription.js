/**
 * Subscription constraints (pure). An administrator assigns a plan to a business in the admin portal; the assignment is copied into
 * that business's settings as `settings.subscription` and the POS follows it: how many active users and locations may exist, and
 * which features are forced off. A business with no assignment is not limited (existing accounts keep working until assigned).
 *
 *   subscription = { enforced, planId, name, maxUsers (null = unlimited), maxLocations (null = unlimited), featuresOff: [ids], custom: [{label, value}] }
 */
import { PLANS, PLAN_FEATURE_OFF } from "./plans";

/** Limits of the standard plans (users / locations); null means unlimited. Starter has no multi-location feature, so one location. */
export const STANDARD_LIMITS = {
	starter: { users: 2, locations: 1 },
	business: { users: 10, locations: 3 },
	pro: { users: null, locations: null },
	enterprise: { users: null, locations: null },
};

/** The constraint set of a standard plan, in the shape stored on the account. */
export function standardSubscription(planId) {
	const plan = PLANS.find((p) => p.id === planId);
	const limits = STANDARD_LIMITS[planId];
	if (!plan || !limits) return null;
	return { enforced: true, planId, name: plan.name, maxUsers: limits.users, maxLocations: limits.locations, featuresOff: [...(PLAN_FEATURE_OFF[planId] || [])], custom: [] };
}

const limitOrNull = (v) => (v === null || v === "" || v === undefined ? null : Math.max(1, Math.floor(Number(v)) || 1));

/** Clean constraint set for an account or founders template (what the admin portal saves). */
export function normalizeSubscription(raw) {
	if (!raw || typeof raw !== "object") return null;
	return {
		enforced: raw.enforced !== false,
		planId: String(raw.planId || "").slice(0, 60),
		name: String(raw.name || "").slice(0, 80),
		maxUsers: limitOrNull(raw.maxUsers),
		maxLocations: limitOrNull(raw.maxLocations),
		featuresOff: [...new Set((Array.isArray(raw.featuresOff) ? raw.featuresOff : []).map(String).filter((id) => /^[A-Za-z0-9._-]{1,80}$/.test(id)))].slice(0, 300),
		custom: (Array.isArray(raw.custom) ? raw.custom : []).map((c) => ({ label: String(c?.label || "").trim().slice(0, 80), value: String(c?.value || "").trim().slice(0, 160) })).filter((c) => c.label).slice(0, 30),
	};
}

/** The constraints that apply to a business, or null when none were assigned. */
export const subscriptionOf = (settings) => (settings?.subscription?.enforced ? settings.subscription : null);

/** Feature switches with the plan's excluded features forced off (the plan wins over the business and location switches). */
export function flagsWithPlan(flags, sub) {
	if (!sub?.featuresOff?.length) return flags;
	const out = { ...flags };
	for (const id of sub.featuresOff) out[id] = false;
	return out;
}

const activeCount = (list, exceptId) => (list || []).filter((x) => x.active !== false && x.id !== exceptId).length;

/** Error text when one more active user is not allowed by the plan, else "". */
export function userLimitError(sub, users, exceptId) {
	if (!sub || sub.maxUsers == null) return "";
	return activeCount(users, exceptId) >= sub.maxUsers ? `Your ${sub.name || "plan"} allows up to ${sub.maxUsers} active user${sub.maxUsers === 1 ? "" : "s"}. Deactivate a user or ask Ceylonry to change your plan.` : "";
}

/** Error text when one more active location is not allowed by the plan, else "". */
export function locationLimitError(sub, locations, exceptId) {
	if (!sub || sub.maxLocations == null) return "";
	return activeCount(locations, exceptId) >= sub.maxLocations ? `Your ${sub.name || "plan"} allows up to ${sub.maxLocations} location${sub.maxLocations === 1 ? "" : "s"}. Deactivate a location or ask Ceylonry to change your plan.` : "";
}

/** Current usage against the limits, for the Settings > Plan panel and the admin portal. */
export function usageOf(sub, users, locations) {
	return { users: activeCount(users), maxUsers: sub?.maxUsers ?? null, locations: activeCount(locations), maxLocations: sub?.maxLocations ?? null };
}
