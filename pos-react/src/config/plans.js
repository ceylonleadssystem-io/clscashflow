/** Ceylonry POS plans shown to users (pricing sheet). Prices in LKR. */
export const PLANS = [
	{
		id: "starter",
		name: "POS Starter",
		icon: "🏪",
		tagline: "Perfect for small businesses getting started.",
		price: 5500,
		term: "/ month",
		features: [
			"Up to 2 users",
			"Sales & inventory management",
			"Customer management",
			"Reports & analytics",
			"Receipt printing",
			"Cloud access (web & mobile)",
		],
		excluded: ["Barcode & label printing (not included)"],
		cta: "Get Started",
	},
	{
		id: "business",
		name: "POS Business",
		icon: "📊",
		tagline: "Ideal for growing businesses with more locations and customer engagement.",
		price: 7500,
		term: "/ month",
		popular: true,
		features: [
			"Up to 10 users",
			"All Starter features",
			"Barcode & label printing",
			"CRM with loyalty features (points, rewards, promotions)",
			"Customer insights",
			"Multi-location support (up to 3 locations)",
			"Advanced reports",
		],
		cta: "Get Started",
	},
	{
		id: "pro",
		name: "POS Pro",
		icon: "👑",
		tagline: "For larger businesses that need more flexibility and advanced features.",
		price: 15500,
		term: "/ month",
		features: [
			"Unlimited users",
			"All Business features",
			"Advanced CRM with feedback & customer insights",
			"Unlimited locations",
			"Advanced inventory management",
			"Detailed analytics & reporting",
			"Role-based access control",
			"Priority support",
		],
		cta: "Get Started",
	},
	{
		id: "enterprise",
		name: "POS Enterprise",
		icon: "🏢",
		tagline: "A fully customised solution tailored to your business requirements.",
		price: 150000,
		term: "one-time",
		features: [
			"Customised deployment",
			"Tailor-made features as per your business needs",
			"Unlimited users & locations",
			"Advanced integrations (e.g. accounting, e-commerce, etc.)",
			"Dedicated onboarding & training",
			"Annual maintenance & support arrangement",
			"Priority technical support",
		],
		cta: "Talk to Our Team",
	},
];

export const ADDITIONAL_FEATURES = { freeCount: 2, pricePerFeature: 5500 };

export const PLAN_HIGHLIGHTS = [
	{ icon: "☁", title: "Cloud Based", text: "Access anywhere, anytime" },
	{ icon: "🛡", title: "Secure & Reliable", text: "Your data is always protected" },
	{ icon: "🎧", title: "Local Support", text: "We're here when you need us" },
	{ icon: "⚡", title: "Easy to Use", text: "Get started in no time" },
];

export const PLAN_CONDITIONS =
	"Prices are subject to change. Applicable taxes (if any) are additional. Additional features, integrations, and customisations may incur extra charges. Terms and conditions apply.";

/**
 * Feature sets per plan (quick presets in the Admin Dashboard). Only features
 * that a plan *excludes* are listed; everything else stays on.
 */
export const PLAN_FEATURE_OFF = {
	starter: [
		"catalogue.barcodeLabels",
		"hardware.labelPrinter",
		"view.crm",
		"crm.whatsapp",
		"crm.feedback",
		"crm.smartCustomer",
		"business.locations",
		"business.branchStock",
		"reports.customerIntelligence",
	],
	business: ["business.branchStock"],
	pro: [],
	enterprise: [],
};
