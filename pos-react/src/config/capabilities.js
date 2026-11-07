/**
 * Capabilities: what each POS business type (see POS_TYPE_PRESETS) can do. Screens and services ask `hasCapability(type, "kitchen")`
 * instead of listing business types, so a new vertical is described here once: its business type, then the capabilities it uses.
 *   kitchen        open orders, tables, kitchen tickets, stations and food modifier presets
 *   serviceCharge  optional service charge on the bill
 *   industryTools  the Business Tools page
 *   appointments / memberships / prescriptions / medicineBatches / commissions   the Business Tools modules (views/businessTools/)
 *   barcodeLabels  shops that always need the label printer
 *   salesPush      the OGF sales push (Settings > System Options > Sales push): receipts are sent to the mall's cloud every hour
 *   detailing      the Detailing page (bookings, jobs, vehicles, packages, invoices) of the Automobile type
 * Which of these a business really gets is still narrowed by its feature switches (config/features.js).
 */
export const CAPABILITIES = {
	restaurant: ["kitchen", "serviceCharge"],
	cafe: ["kitchen", "serviceCharge"],
	ogf: ["kitchen", "serviceCharge", "salesPush"], // a restaurant in One Galle Face: everything a restaurant has, plus the sales push
	retail: ["barcodeLabels"],
	hardware: ["barcodeLabels"],
	grocery: ["barcodeLabels"],
	salon: ["serviceCharge", "industryTools", "appointments", "memberships", "commissions"],
	services: ["serviceCharge", "industryTools", "appointments", "memberships", "commissions"],
	automobile: ["detailing"],
	pharmacy: ["barcodeLabels", "industryTools", "prescriptions", "medicineBatches", "commissions"],
	other: [],
};

/** True when the business type has the capability. */
export const hasCapability = (businessType, capability) => !!CAPABILITIES[businessType]?.includes(capability);

/** Every business type that has the capability, in catalogue order. */
export const typesWith = (capability) => Object.keys(CAPABILITIES).filter((t) => CAPABILITIES[t].includes(capability));
