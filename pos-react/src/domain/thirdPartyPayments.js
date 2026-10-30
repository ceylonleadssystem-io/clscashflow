/**
 * 3rd Party Payments (pure): custom ways to take payment (Uber Eats, PickMe Food, bank transfer, a corporate account...), saved in
 * settings.thirdPartyPayments as [{ id, name, active }] in the order they appear at checkout. A type used on past sales is switched
 * off, never removed, so reports keep showing it.
 */
import { PAYMENT_METHODS, SPLIT_PAYMENT_METHODS } from "../config/constants";

export const MAX_NAME = 40;

/** Validation message for a name ("" when fine). `others` are the other types (the one being edited excluded). */
export function nameError(name, others = []) {
	const n = String(name || "").trim();
	if (!n) return "Enter a name.";
	if (n.length > MAX_NAME) return "Keep the name to 40 characters or fewer.";
	const taken = [...PAYMENT_METHODS, ...SPLIT_PAYMENT_METHODS, ...others.map((o) => o.name)].some((x) => String(x).toLowerCase() === n.toLowerCase());
	return taken ? "This name is already used. Use the full name of the service, for example PickMe Food." : "";
}

export const thirdPartyList = (settings = {}) => (Array.isArray(settings.thirdPartyPayments) ? settings.thirdPartyPayments.filter((t) => t && t.id && String(t.name || "").trim()) : []);
export const activeThirdParty = (settings) => thirdPartyList(settings).filter((t) => t.active !== false);

/** What the payment picker at checkout offers: the standard methods, then the active 3rd party types in their order. */
export const paymentChoices = (settings, allowThirdParty = true) => [...PAYMENT_METHODS, ...(allowThirdParty ? activeThirdParty(settings).map((t) => t.name) : [])];

/** The split-bill picker: the generic "3rd Party" entry is replaced by the named types once any are set up. */
export function splitChoices(settings, allowThirdParty = true) {
	const named = allowThirdParty ? activeThirdParty(settings).map((t) => t.name) : [];
	return named.length ? [...SPLIT_PAYMENT_METHODS.filter((m) => m !== "3rd Party"), ...named] : SPLIT_PAYMENT_METHODS;
}

/** Names of types used on at least one sale (these can only be switched off). */
export const usedNames = (sales = []) => new Set(sales.flatMap((s) => [s.payment, ...(Array.isArray(s.payments) ? s.payments.map((p) => p.method) : [])]).filter(Boolean));

/** Moves item `id` by `by` places (-1 up, 1 down); returns the same array when it cannot move. */
export function move(list, id, by) {
	const i = list.findIndex((x) => x.id === id);
	const j = i + by;
	if (i < 0 || j < 0 || j >= list.length) return list;
	const next = [...list];
	[next[i], next[j]] = [next[j], next[i]];
	return next;
}

/** Reorders `list` to follow `ids` (unknown ids ignored, missing ones kept at the end). */
export function reorder(list, ids) {
	const byId = new Map(list.map((x) => [x.id, x]));
	const first = ids.map((id) => byId.get(id)).filter(Boolean);
	return [...first, ...list.filter((x) => !ids.includes(x.id))];
}
