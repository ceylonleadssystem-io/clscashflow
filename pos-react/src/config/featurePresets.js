/**
 * Business-category presets for the admin Features tab. One preset per category; `off` lists the feature ids
 * switched OFF, everything else is ON (same convention as PLAN_FEATURE_OFF in plans.js). `posType` is the default
 * POS businessType (key of POS_TYPE_PRESETS). The chosen category id is stored as settings.businessCategory.
 */
const KITCHEN = ["view.orders", "view.tables", "checkout.openOrders", "checkout.kitchenTickets", "checkout.orderReference", "checkout.orderChannels", "inventory.recipes", "view.modifiers", "modifiers.commonPresets"];
const SHOP = ["catalogue.barcodeLabels", "hardware.labelPrinter", "hardware.barcodeScanner", "checkout.stockGuard", "inventory.productStock", "inventory.stockTools"];
const TOOLS = ["industry.tools"];
const GM = ["view.guestManager"]; // Guest Manager (/GM): on for Food & Beverage and Hospitality only

export const FEATURE_PRESETS = [
	{
		id: "food", icon: "🍔", label: "Food & Beverage", posType: "restaurant",
		types: ["Restaurants", "Cafés / coffee shops", "Fast-food outlets", "Bakeries", "Pizzerias", "Food courts", "Bars & pubs", "Juice / smoothie shops", "Ice-cream shops", "Food trucks", "Cloud kitchens", "Takeaway shops"],
		off: [...TOOLS, "checkout.kds", "catalogue.barcodeLabels", "hardware.labelPrinter", "sales.permanentDelete"],
	},
	{
		id: "retail", icon: "🛍️", label: "Retail", posType: "retail",
		types: ["Supermarkets", "Grocery stores", "Convenience stores", "Clothing / fashion stores", "Shoe stores", "Electronics stores", "Mobile phone shops", "Computer shops", "Cosmetics & beauty stores", "Jewelry stores", "Gift shops", "Bookstores / stationery", "Hardware stores", "Furniture stores", "Pet stores", "Sports equipment stores"],
		off: [...GM, ...KITCHEN, ...TOOLS, "checkout.serviceCharge"],
	},
	{
		id: "beauty", icon: "💇", label: "Personal & Beauty Services", posType: "salon",
		types: ["Salons", "Barbershops", "Spas", "Nail salons", "Beauty clinics", "Massage centers", "Tattoo studios"],
		off: [...GM, ...KITCHEN, ...SHOP.filter((x) => x !== "inventory.productStock"), "inventory.recipes"],
	},
	{
		id: "hospitality", icon: "🏨", label: "Hospitality", posType: "restaurant",
		types: ["Hotels", "Resorts", "Guesthouses", "Hostels", "Motels", "Restaurants inside hotels", "Hotel bars", "Room-service operations"],
		off: [...TOOLS, "checkout.kds", "catalogue.barcodeLabels", "hardware.labelPrinter", "hardware.barcodeScanner"],
	},
	{
		id: "health", icon: "🏥", label: "Health & Wellness", posType: "pharmacy",
		types: ["Pharmacies", "Medical supply stores", "Optical shops", "Dental clinics", "Fitness centers", "Gyms", "Supplement stores"],
		off: [...GM, ...KITCHEN, "checkout.serviceCharge"],
	},
	{
		id: "automotive", icon: "🚗", label: "Automotive", posType: "hardware",
		types: ["Auto parts stores", "Tire shops", "Car dealerships", "Vehicle service centers", "Car washes", "Detailing centers", "Motorcycle dealerships", "Motorcycle service shops"],
		off: [...GM, ...KITCHEN, ...TOOLS, "checkout.serviceCharge"],
	},
	{
		id: "entertainment", icon: "🎮", label: "Entertainment & Recreation", posType: "services",
		types: ["Cinemas", "Bowling alleys", "Gaming centers", "Amusement parks", "Arcades", "Escape rooms", "Karaoke lounges", "Tourist attractions"],
		off: [...GM, ...SHOP, ...TOOLS, "inventory.recipes", "view.modifiers", "modifiers.commonPresets", "checkout.orderChannels", "business.branchStock"],
	},
	{
		id: "education", icon: "🏫", label: "Education", posType: "services",
		types: ["Private institutes", "Tuition centers", "Bookstores attached to schools", "University cafeterias", "School canteens", "Training centers"],
		off: [...GM, ...KITCHEN, ...TOOLS, ...SHOP, "checkout.serviceCharge", "business.branchStock"],
	},
	{
		id: "other", icon: "🛒", label: "Other Businesses", posType: "other",
		types: ["Florists", "Bakeries", "Butcher shops", "Fish/meat markets", "Liquor stores", "Vape/tobacco shops", "Farmers' markets", "Wholesale stores", "Printing shops", "Photography studios"],
		off: [...GM, ...KITCHEN, ...TOOLS, "checkout.serviceCharge"],
	},
];

export const FEATURE_PRESET_MAP = Object.fromEntries(FEATURE_PRESETS.map((p) => [p.id, p]));

/** Full flag map for a preset: every feature on except `off` (industry.tools included, so it must be listed to stay off). */
export function presetFlags(preset, features) {
	const off = new Set(preset.off);
	return Object.fromEntries(features.map((x) => [x.id, x.core ? true : !off.has(x.id)]));
}
