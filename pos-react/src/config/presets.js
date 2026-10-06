/**
 * Business-type presets (restaurant, cafe, retail, hardware, grocery, salon, pharmacy, services, other):
 * default categories, kitchen workflow flags, guidance notes, the common modifier groups and legacy clean-up lists.
 */
/** POS business-type presets (categories, kitchen workflow, guidance). */
export const POS_TYPE_PRESETS = {
	restaurant: {
		label: "Restaurant",
		categories: ["Starters", "Main Courses", "Sides", "Desserts", "Drinks", "Add-ons"],
		kot: true,
		note: "Open orders, table/order references, modifiers and the existing kitchen-ticket workflow are available.",
	},
	cafe: {
		label: "Café / Bakery",
		categories: ["Coffee", "Tea", "Cold Drinks", "Pastries", "Cakes", "Bakery", "Food", "Add-ons"],
		kot: true,
		note: "Open orders, order references, modifiers and the existing kitchen-ticket workflow are available.",
	},
	retail: {
		label: "Retail Store",
		categories: ["Clothing", "Accessories", "Electronics", "Beauty", "Home", "General"],
		kot: false,
		note: "Standard checkout for products, stock, customer history, discounts, refunds and receipts.",
	},
	hardware: {
		label: "Hardware Shop",
		categories: [
			"Hand Tools",
			"Power Tools",
			"Fasteners",
			"Electrical",
			"Plumbing",
			"Paint & Supplies",
			"Building Materials",
			"Safety Equipment",
			"Garden & Outdoor",
			"Adhesives & Sealants",
			"Locks & Security",
			"Other",
		],
		kot: false,
		note: "Hardware checkout with SKU tracking, fractional units, live stock counts, reorder alerts, suppliers, stock adjustments, sale deductions and refund restoration.",
	},
	grocery: {
		label: "Grocery / Supermarket",
		categories: ["Grocery", "Fresh Produce", "Drinks", "Household", "Personal Care", "Frozen", "Other"],
		kot: false,
		note: "Standard product checkout with stock, pricing, margin, discounts, customers and receipts.",
	},
	salon: {
		label: "Salon / Spa",
		categories: ["Hair", "Nails", "Skincare", "Facial", "Massage", "Treatments", "Packages", "Products"],
		kot: false,
		note: "Standard checkout supporting both services and products, customers, discounts and split payments.",
	},
	pharmacy: {
		label: "Pharmacy",
		categories: ["Medicines", "Personal Care", "Wellness", "Baby Care", "Medical Supplies", "Other"],
		kot: false,
		note: "Standard product checkout with codes, inventory, pricing, margin, customers, refunds and receipts.",
	},
	services: {
		label: "Service Business",
		categories: ["Services", "Packages", "Add-ons", "Products"],
		kot: false,
		note: "Standard checkout supporting services and products, customer history, discounts and split payments.",
	},
	other: {
		label: "Other",
		categories: [],
		kot: false,
		note: "A fully flexible setup. Create any categories, products, services and modifiers you need.",
	},
};

/** Order of the options in the Business / POS type selects. */
export const BUSINESS_TYPE_OPTIONS = [
	"restaurant",
	"cafe",
	"retail",
	"hardware",
	"grocery",
	"salon",
	"pharmacy",
	"services",
	"other",
];

export const KITCHEN_TYPES = ["restaurant", "cafe"];
export const SERVICE_CHARGE_TYPES = ["restaurant", "cafe", "salon", "services"];
export const INDUSTRY_TYPES = ["salon", "services", "pharmacy"];

/** Preset categories that are hidden while they contain nothing (legacy rule). */
export const STALE_PRESET_CATEGORIES = [
	"starters", "main courses", "sides", "desserts", "drinks", "add-ons", "coffee", "tea",
	"cold drinks", "hot drinks", "pastries", "cakes", "bakery", "food", "delivery", "grocery",
	"fresh produce", "household", "personal care", "frozen", "clothing", "accessories",
	"electronics", "beauty", "home", "general", "hair", "nails", "skincare", "facial", "massage",
	"treatments", "packages", "products", "medicines", "wellness", "baby care", "medical supplies",
	"services", "burgers & sandwiches", "pizza", "rice & noodles", "alcohol", "dine-in", "takeaway",
	"pickme", "uber eats", "sandwiches",
];

/** Ready-made modifier groups offered by "Add Common Modifiers". */
export function commonModifierPresets(businessType = "other") {
	const food = KITCHEN_TYPES.includes(businessType);
	return food
		? [
				{
					name: "Size",
					mode: "single",
					required: true,
					options: [
						{ name: "Small", price: 0 },
						{ name: "Regular", price: 0 },
						{ name: "Large", price: 150 },
					],
				},
				{
					name: "Add-ons",
					mode: "multiple",
					required: false,
					options: [
						{ name: "Extra cheese", price: 150 },
						{ name: "Extra portion", price: 250 },
						{ name: "No add-on", price: 0 },
					],
				},
				{
					name: "Preparation",
					mode: "single",
					required: false,
					options: [
						{ name: "Standard", price: 0 },
						{ name: "Less", price: 0 },
						{ name: "Extra", price: 0 },
					],
				},
			]
		: [
				{
					name: "Size",
					mode: "single",
					required: true,
					options: [
						{ name: "S", price: 0 },
						{ name: "M", price: 0 },
						{ name: "XL", price: 0 },
						{ name: "2XL", price: 0 },
					],
				},
				{
					name: "Size / Variant",
					mode: "single",
					required: true,
					options: [
						{ name: "Small", price: 0 },
						{ name: "Regular", price: 0 },
						{ name: "Large", price: 0 },
					],
				},
				{
					name: "Add-ons",
					mode: "multiple",
					required: false,
					options: [
						{ name: "Standard", price: 0 },
						{ name: "Premium", price: 0 },
					],
				},
			];
}

/** Modifier groups the legacy app auto-retired when unused. */
export const RETIRED_MODIFIER_NAMES = ["size / variant", "add-ons"];
