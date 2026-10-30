/**
 * Access (pure): permission keys behind the roles, and jobs with hourly rates.
 * A person's permissions are their role's preset plus personal changes (settings.userAccess[userId] = { grant: [keys], revoke: [keys] }).
 * The role presets reproduce what each role could already do, so nothing changes until an owner edits a person's permissions.
 * Only keys the POS enforces are listed; a key is added here in the same change that makes the POS check it.
 * Jobs live in settings.jobs = [{ id, title, code, rate, color, active }]; settings.userAccess[userId].jobs = [{ jobId, rate }].
 */
import { APPROVER_ROLES } from "./salesLog";
import { FULL_SETTINGS_ROLES, ROLES, ROLE_VIEWS } from "../config/roles";

export const PERMISSIONS = [
	{ group: "Back office", key: "reports.pos", label: "View reports", tip: "Opens the Reports page and the reports in the admin portal." },
	{ group: "Back office", key: "settings.system.edit", label: "Change settings", tip: "System Options, location info, users and jobs." },
	{ group: "Menu", key: "menu.view", label: "Menu: items, modifiers and stations", tip: "Opens Products & Services, Modifiers and Stations." },
	{ group: "Menu", key: "inventory.view", label: "Inventory and stock", tip: "Opens Inventory & Stock." },
	{ group: "Users", key: "users.view", label: "See users and timesheets", tip: "Lists users and shows timesheets." },
	{ group: "Users", key: "users.edit", label: "Add, edit and remove users", tip: "Includes PINs, roles, jobs and pay rates." },
	{ group: "POS", key: "pos.order.create", label: "Take orders (Checkout)", tip: "Opens Checkout so the person can sell." },
	{ group: "POS", key: "pos.discount", label: "Give discounts", tip: "Shows the discount controls at checkout." },
	{ group: "POS", key: "pos.refund", label: "Refund without a manager", tip: "Without this, a refund needs a manager's PIN." },
	{ group: "POS", key: "pos.void.item", label: "Remove sent items without a manager", tip: "Without this, taking an item off an order after it was sent to the kitchen needs a manager's PIN, where the category asks for it." },
	{ group: "POS", key: "pos.void.order", label: "Void without a manager", tip: "Without this, a void needs a manager's PIN." },
	{ group: "POS", key: "pos.payments.third_party", label: "Take 3rd party payments", tip: "Uber Eats, PickMe Food and the other types set up in Settings." },
];
export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

const viewKey = { "reports.pos": "reports", "menu.view": "products", "inventory.view": "inventory", "pos.order.create": "checkout" };
const roleHas = (role, key) => {
	if (role === "owner" || role === "admin") return true;
	if (viewKey[key]) return (ROLE_VIEWS[role] || []).includes(viewKey[key]);
	if (key === "settings.system.edit") return FULL_SETTINGS_ROLES.includes(role);
	if (key === "users.view" || key === "users.edit") return role === "manager";
	if (key === "pos.refund" || key === "pos.void.order" || key === "pos.void.item") return APPROVER_ROLES.includes(role);
	return key === "pos.discount" || key === "pos.payments.third_party"; // every role could already do these
};

/** What a role gets with no personal changes: the keys it holds. */
export const rolePreset = (role) => PERMISSION_KEYS.filter((k) => roleHas(role, k));
/** Roles that can be chosen as a starting point ("Copy from"). */
export const PRESET_ROLES = ROLES;

export const accessOf = (settings = {}, userId) => ({ grant: [], revoke: [], jobs: [], ...(settings.userAccess?.[userId] || {}) });

/** Does this person hold the permission? Owners and admins always hold every one. */
export function can(user, key, settings = {}) {
	if (!user) return false;
	if (user.role === "owner" || user.role === "admin") return true;
	const a = accessOf(settings, user.id);
	if (a.revoke.includes(key)) return false;
	return roleHas(user.role, key) || a.grant.includes(key);
}

/** Every key the person holds. */
export const effectivePermissions = (user, settings) => PERMISSION_KEYS.filter((k) => can(user, k, settings));

/**
 * Turns a wanted set of keys for a person into the personal changes against their role (grant what the role lacks, revoke what it has).
 * `actor` may only grant keys they hold themselves; keys they cannot grant are ignored (an existing grant is kept as it was).
 */
export function accessFromKeys(user, wanted, settings, actor) {
	const base = rolePreset(user.role);
	const before = accessOf(settings, user.id);
	const set = new Set(wanted);
	const grant = PERMISSION_KEYS.filter((k) => set.has(k) && !base.includes(k) && (can(actor, k, settings) || before.grant.includes(k)));
	const revoke = PERMISSION_KEYS.filter((k) => !set.has(k) && base.includes(k));
	return { ...before, grant, revoke };
}

// ------------------------------------------------------------------------------------------ jobs ----

export const jobsOf = (settings = {}) => (Array.isArray(settings.jobs) ? settings.jobs.filter((j) => j && j.id && String(j.title || "").trim()) : []);

/** Validation message for a job ("" when fine). `others` are the other jobs. */
export function jobError({ title, code, rate }, others = []) {
	if (!String(title || "").trim()) return "Enter a job title.";
	if (String(title).trim().length > 40) return "Keep the title to 40 characters or fewer.";
	if (others.some((j) => j.title.trim().toLowerCase() === String(title).trim().toLowerCase())) return "There is already a job with this title.";
	if (String(code || "").trim() && others.some((j) => String(j.code || "").trim().toLowerCase() === String(code).trim().toLowerCase())) return "This code is already used by another job.";
	const r = Number(rate);
	if (rate === "" || !Number.isFinite(r) || r < 0) return "Enter an hourly rate of 0 or more.";
	return "";
}

/** The hourly rate a person is paid: the pay rate on their first job. Time entries do not record a job yet, so one rate per person. */
export function userRate(settings, userId) {
	const first = accessOf(settings, userId).jobs[0];
	if (!first) return null;
	const job = jobsOf(settings).find((j) => j.id === first.jobId);
	const rate = first.rate !== undefined && first.rate !== "" ? Number(first.rate) : Number(job?.rate);
	return Number.isFinite(rate) ? rate : null;
}
