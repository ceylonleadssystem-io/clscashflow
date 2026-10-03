/** Storage keys, limits and other literals shared across the POS. */
export const STORAGE = {
	/** Default (pre-login) database name / legacy localStorage key. */
	KEY: "ceylonry-pos-v1",
	userSession: "ceylonry-pos-user",
	businessAuth: "ceylonry-business-auth",
	businessUid: "ceylonry-pos-business-uid",
	loginUid: "ceylonry-pos-login-uid",
	location: "ceylonry-pos-location",
	sessionId: "ceylonry-pos-session",
	deviceId: "ceylonry-pos-device",
	checkoutMode: "ceylonry-pos-checkout-mode",
	printSale: "ceylonry-pos-print-sale",
	uiTheme: "ceylonry-pos-ui-theme",
	supportSession: "ceylonry-support-session",
	onboardingMobile: "ceylonry-pos-onboarding-mobile",
};

export const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Online Payment"];
export const SPLIT_PAYMENT_METHODS = [
	"Cash",
	"Card",
	"Bank Transfer",
	"Online Payment",
	"Gift Card",
	"3rd Party",
];
export const PAYMENT_ICONS = {
	Cash: "▣",
	Card: "▤",
	"Bank Transfer": "▥",
	"Online Payment": "⌁",
};

export const ORDER_CHANNELS = ["Dine-in", "Takeaway", "PickMe", "Uber Eats"];
export const PLATFORM_CHANNELS = ["PickMe", "Uber Eats"];

export const STOCK_TYPES = [
	"Ingredient",
	"Sellable Product",
	"Packaging",
	"Supply",
	"Hardware Item",
	"Building Material",
	"Tool",
	"Fastener",
];
export const STOCK_UNITS = [
	"each",
	"kg",
	"g",
	"litre",
	"ml",
	"pack",
	"box",
	"bottle",
	"piece",
	"metre",
	"foot",
	"sheet",
	"roll",
	"pair",
	"set",
	"bag",
	"bundle",
];
export const ADJUST_REASONS = [
	"Stock received",
	"Stock count correction",
	"Wastage",
	"Damaged",
	"Internal use",
	"Return to supplier",
];

export const CUSTOMER_TYPES = ["regular", "vip", "wholesale", "corporate"];

export const UI_THEMES = [
	{
		id: "ceylonry",
		label: "Ceylonry Orange",
		color: "#ff4d0a",
		note: "Bright orange accent",
	},
	{
		id: "graphite",
		label: "Graphite",
		color: "#252b31",
		note: "Neutral grey accent",
	},
	{
		id: "sand",
		label: "Ceylonry Gold",
		color: "#c68d21",
		note: "Warm gold accent",
	},
];

export const VIP_SPEND = 10000;
export const SUPPORT_CODE_TTL_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_RECEIPT_FOOTER = "Thank you for your purchase";
export const DEFAULT_BUSINESS_NAME = "My Business";
export const DEFAULT_OWNER_PIN = "1234";
