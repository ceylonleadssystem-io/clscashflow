/**
 * The Settings form: the business settings the older tabs and the moved pages (Service Charge, Appearance, Customer Feedback,
 * Receipts & Printing) edit together and save with saveSettings.
 */
import { ORDER_CHANNELS } from "../config/constants";

export const formFrom = (s) => ({
	business: s.business || "",
	email: s.email || "",
	address: s.address || "",
	businessType: s.businessType || "other",
	feedbackLink: s.feedbackLink || "",
	feedbackDelay: s.feedbackDelay ?? 2,
	posUsers: Math.max(1, +s.posUsers || 1),
	printerType: s.printerType || "system",
	printerAddress: s.printerAddress || "",
	autoPrint: !!s.autoPrint,
	autoPrintKot: !!s.autoPrintKot,
	kotPrinter: s.kotPrinter || "",
	receiptFooter: s.receiptFooter || "Thank you for your purchase",
	supportEnabled: !!s.supportEnabled,
	serviceChargeEnabled: !!s.serviceChargeEnabled,
	serviceChargeRate: Math.max(0, Math.min(100, +s.serviceChargeRate || 0)),
	orderChannels: Array.isArray(s.orderChannels) && s.orderChannels.length ? s.orderChannels.filter((c) => ORDER_CHANNELS.includes(c)) : ORDER_CHANNELS,
	socials: { instagram: "", facebook: "", tiktok: "", website: "", ...(s.receiptSocials || {}) },
});
