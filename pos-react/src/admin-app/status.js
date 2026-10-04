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
