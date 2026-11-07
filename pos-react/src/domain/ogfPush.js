/**
 * Sales push (Restaurant (OGF) only): the settings the page edits and what is checked before they are saved. The server (netlify/lib/ogf-push.js)
 * cleans the same settings again before it uses them, so these checks are for the person typing, not for safety.
 */
export const PAYMENT_ROWS = [
	["Cash", "Cash"],
	["Card", "Credit Card"],
	["Bank Transfer", "Bank Transfer"],
	["Online Payment", "Online"],
	["Gift Card", "Voucher"],
	["3rd Party", "3rd Party"],
];

export const INTERVALS = [15, 30, 60, 120, 240, 720];

export const blankForm = () => ({
	enabled: false,
	environment: "test",
	testBaseUrl: "",
	liveBaseUrl: "",
	propertyCode: "",
	tokenPath: "/connect/token",
	importPath: "/api/possale/importpossaleswithitems",
	intervalMinutes: 60,
	sendFrom: "",
	salesCurrency: "LKR",
	itemAmountBasis: "before-tax",
	itemAmountsAfterDiscount: false,
	noOfItems: "quantity",
	discountField: "both",
	refundType: "Refund",
	paymentMap: {},
	registers: [],
});

/** The saved settings with every missing value filled in. */
export const formFrom = (saved) => {
	const s = saved && typeof saved === "object" ? saved : {};
	const b = blankForm();
	return {
		...b,
		...Object.fromEntries(Object.keys(b).filter((k) => s[k] !== undefined && s[k] !== null).map((k) => [k, s[k]])),
		paymentMap: { ...(s.paymentMap || {}) },
		registers: Array.isArray(s.registers) ? s.registers.map((r) => ({ id: "", name: "", locationId: "", deviceId: "", posInterfaceCode: "", clientId: "", ...r })) : [],
	};
};

export const newRegister = (n = 1) => ({ id: "reg" + Date.now().toString(36) + n, name: "", locationId: "", deviceId: "", posInterfaceCode: "", clientId: "" });

const https = (v) => /^https:\/\/[^\s/]+\.[^\s/]+/i.test(String(v || "").trim());

/** What is wrong with a register being saved ("" = fine). The secret is only required the first time. */
export function registerProblem(r, hasSecret, secret) {
	if (!r.posInterfaceCode.trim()) return "Enter the POS interface code.";
	if (!r.clientId.trim()) return "Enter the client ID.";
	if (!hasSecret && !String(secret || "").trim()) return "Enter the client secret.";
	return "";
}

/** What is wrong with the settings (a list of sentences; empty = ready to switch on). */
export function formProblems(f) {
	const out = [];
	if (!f.propertyCode.trim()) out.push("Enter the property code OGF gave you.");
	const url = f.environment === "live" ? f.liveBaseUrl : f.testBaseUrl;
	if (!url.trim()) out.push("Enter the " + f.environment + " server address.");
	else if (!https(url)) out.push("The " + f.environment + " server address must start with https://.");
	if (!f.registers.length) out.push("Add a register with its POS interface code and login.");
	return out;
}
