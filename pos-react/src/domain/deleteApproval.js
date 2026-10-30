/**
 * Approval to remove sent items (pure). Once an order has been sent to the kitchen, each line remembers how many were sent and when
 * (`sentQty`, `sentAt`). A category can require a manager to approve taking those items off the order after a grace period
 * (settings.categorySettings: [{ id: categoryKey, name, description, deleteApprovalOn, graceSeconds }], published from Menu Admin, Categories).
 * People who hold the "Remove sent items without a manager" permission never need approval; nothing is required until a category turns it on.
 */
import { categoryKey } from "./catalog";

export const DEFAULT_GRACE = 60;
export const MAX_GRACE = 3600;
const list = (v) => (Array.isArray(v) ? v : []);

export function cleanCategorySetting(c = {}) {
	const g = Math.floor(Number(c.graceSeconds));
	return {
		id: categoryKey(c.id ?? c.name),
		name: String(c.name ?? "").trim().slice(0, 60),
		description: String(c.description ?? "").trim().slice(0, 300),
		deleteApprovalOn: !!c.deleteApprovalOn,
		graceSeconds: Number.isFinite(g) && g >= 0 ? Math.min(g, MAX_GRACE) : DEFAULT_GRACE,
	};
}
export const categorySettingBlank = (c) => !c.description && !c.deleteApprovalOn;
/** The published category settings by category key. */
export const categorySettingsById = (settings = {}) => Object.fromEntries(list(settings.categorySettings).map((c) => [c.id, c]));

/** Marks every line of an order as sent: how many, and when (a line whose quantity did not change keeps its first sent time). */
export function markSent(lines = [], now = new Date().toISOString()) {
	return lines.map((l) => (l.isDiscount || l.isServiceCharge ? l : { ...l, sentQty: l.qty, sentAt: l.sentQty === l.qty && l.sentAt ? l.sentAt : now }));
}

/**
 * Whether taking a line down to `newQty` (0 = remove it) needs a manager: it cuts into sent items, the line's category asks for approval,
 * and the grace period since they were sent has passed. Returns { needed, removed } (removed = how many sent items would go).
 */
export function removalNeedsApproval(line, newQty, settings = {}, now = Date.now()) {
	const sent = +line.sentQty || 0;
	if (!sent || newQty >= sent) return { needed: false, removed: 0 };
	const removed = sent - Math.max(0, newQty);
	const rule = categorySettingsById(settings)[categoryKey(line.category)];
	if (!rule?.deleteApprovalOn) return { needed: false, removed };
	const since = (now - new Date(line.sentAt || 0).getTime()) / 1000;
	return { needed: since > rule.graceSeconds, removed };
}
