/**
 * Shop catalogue: the hardware a business can buy for the POS. Prices and stock are agreed on request, so each category opens
 * a quote email to Ceylonry rather than showing a price.
 */
export const SHOP_EMAIL = "hello@ceylonrylabs.io";

export const SHOP_CATEGORIES = [
	{ key: "receipt-printers", title: "Receipt printers", icon: "⎙", blurb: "80mm / 58mm thermal receipt printers (USB, Bluetooth or network).", works: "Prints receipts straight from the POS." },
	{ key: "kitchen-printers", title: "Kitchen printers", icon: "♨", blurb: "Thermal printers for kitchen and bar order tickets.", works: "Assign one to each station on the Stations page." },
	{ key: "cash-drawers", title: "Cash drawers", icon: "▭", blurb: "Cash drawers that open with the receipt printer.", works: "Connects to the receipt printer." },
	{ key: "barcode-scanners", title: "Barcode scanners", icon: "▥", blurb: "USB and wireless scanners for fast item lookup and stock counts.", works: "Works like a keyboard; no setup needed." },
	{ key: "label-printers", title: "Label printers", icon: "▤", blurb: "Barcode and price label printers.", works: "Used by the barcode label tool." },
	{ key: "pos-terminals", title: "POS terminals & tablets", icon: "▣", blurb: "Counter terminals, tablets and stands for the register.", works: "Runs the POS in the browser." },
	{ key: "kitchen-displays", title: "Kitchen display screens", icon: "▦", blurb: "Screens for the kitchen (KDS) with stands or wall mounts.", works: "Pair with a station on the Stations page." },
	{ key: "customer-displays", title: "Customer displays", icon: "▢", blurb: "Second screens that show the customer's order.", works: "Works with the live customer screen." },
];

/** mailto link that asks Ceylonry for a quote for one category (or the whole list when no category is given). */
export function quoteLink({ business = "", category = "" } = {}) {
	const subject = `Hardware quote${category ? ": " + category : ""}${business ? " (" + business + ")" : ""}`;
	const body = `Hello Ceylonry,\n\nI would like a quote for ${category || "POS hardware"}.\n\nBusiness: ${business || ""}\nQuantity: \nDelivery address: \n`;
	return `mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
