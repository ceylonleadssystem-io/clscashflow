/** Shared labels and badge colours for account status and subscription type. */
export const STATUSES = [
	{ value: "trial", label: "Trial", style: { background: "#fff4d6", color: "#9a6b00" } },
	{ value: "test", label: "Test", style: { background: "#e6eefb", color: "#2d5a9b" } },
	{ value: "live", label: "Live", style: { background: "#e7f6ee", color: "#168653" } },
];
export const SUBSCRIPTIONS = [
	{ value: "monthly", label: "Monthly" },
	{ value: "annual", label: "Annual" },
];
export const statusOf = (a) => STATUSES.find((s) => s.value === a?.status) || STATUSES[0];
export const subscriptionOf = (a) => SUBSCRIPTIONS.find((s) => s.value === a?.subscriptionType) || SUBSCRIPTIONS[0];

/** The products an account uses: POS, plus Guest Manager (GM) and Kitchen Display (KDS) when they are switched on for it. */
export const appsOf = (a) => (Array.isArray(a?.apps) && a.apps.length ? a.apps : ["POS"]);

/** When the business was last used: the later of its last sign-in and its last sync ("" when unknown). */
export const lastUsedOf = (a) => [a?.authLastSignInAt, a?.updatedAt].filter(Boolean).sort().at(-1) || "";
export const fmtDay = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
