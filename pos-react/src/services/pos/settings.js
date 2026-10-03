/**
 * Settings actions: save all business settings, patch single keys, regenerate the support code, upload or
 * remove the business logo and social QR, set the theme, and apply or dismiss the POS setup preset.
 */
import { T } from "../../db/tables";
import { DEFAULT_BUSINESS_NAME, DEFAULT_RECEIPT_FOOTER, SUPPORT_CODE_TTL_MS } from "../../config/constants";
import { POS_TYPE_PRESETS } from "../../config/presets";
import { nowIso } from "../../domain/format";
import { fitBusinessLogo, cleanReceiptQrImage } from "../printing/imageTools";
import { supportAuditEntry } from "./common";
import { addCommonModifiers } from "./catalog";
import { createLogger } from "../../utils/logger";

const log = createLogger("settings");

/** Business settings, POS setup wizard, support code, themes, feature flags. */

export async function saveSettings(ctx, form) {
	const d = ctx.data();
	if (ctx.features()["checkout.serviceCharge"] || "serviceChargeRate" in form) {
		const rate = Number(form.serviceChargeRate);
		if (form.serviceChargeEnabled && (!Number.isFinite(rate) || rate < 0 || rate > 100))
			return void (await ctx.ui.alert("Enter a service charge percentage from 0 to 100."));
	}
	const foodService = ["restaurant", "cafe"].includes(form.businessType);
	if (foodService && form.orderChannels && !form.orderChannels.length)
		return void (await ctx.ui.alert("Enable at least one checkout order type."));
	const next = {
		...d.settings,
		business: form.business.trim() || DEFAULT_BUSINESS_NAME,
		email: form.email.trim(),
		address: form.address.trim(),
		businessType: form.businessType,
		feedbackLink: form.feedbackLink.trim(),
		feedbackDelay: Number(form.feedbackDelay) || 0,
		posUsers: Math.max(1, Math.floor(Number(form.posUsers) || 1)),
		printerType: form.printerType,
		printerAddress: form.printerAddress.trim(),
		autoPrint: !!form.autoPrint,
		autoPrintKot: !!form.autoPrintKot,
		kotPrinter: form.kotPrinter.trim(),
		receiptFooter: form.receiptFooter.trim() || DEFAULT_RECEIPT_FOOTER,
		supportEnabled: !!form.supportEnabled,
		onboardingComplete: true,
		serviceChargeEnabled: !!form.serviceChargeEnabled,
		serviceChargeRate: form.serviceChargeEnabled ? Number(form.serviceChargeRate) || 0 : 0,
		orderChannels: foodService ? form.orderChannels || [] : [],
		receiptSocials: {
			instagram: (form.socials?.instagram || "").trim(),
			facebook: (form.socials?.facebook || "").trim(),
			tiktok: (form.socials?.tiktok || "").trim(),
			website: (form.socials?.website || "").trim(),
		},
	};
	if (next.supportEnabled && !next.supportCode) {
		next.supportCode = generateCode();
		next.supportCodeExpiresAt = Date.now() + SUPPORT_CODE_TTL_MS;
	}
	await putSettings(ctx, next);
	ctx.ui.notice("All POS settings saved.");
	return next;
}

/** Writes changed keys of `next` into the key/value settings table. */
export async function putSettings(ctx, next) {
	const d = ctx.data();
	await ctx.store.write((tx) => {
		for (const [key, value] of Object.entries(next))
			if (JSON.stringify(d.settings[key]) !== JSON.stringify(value)) tx.setSetting(key, value);
	});
}

export async function patchSettings(ctx, patch) {
	return putSettings(ctx, { ...ctx.data().settings, ...patch });
}

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function regenerateSupportCode(ctx) {
	log.info("support code regenerated");
	await patchSettings(ctx, { supportCode: generateCode(), supportCodeExpiresAt: Date.now() + SUPPORT_CODE_TTL_MS });
	ctx.ui.notice("A new support code was generated. It expires in 24 hours.");
}

export async function uploadBusinessLogo(ctx, file) {
	if (!file) return;
	if (!file.type.startsWith("image/")) return void (await ctx.ui.alert("Choose an image file for the business logo."));
	try {
		const logo = await fitBusinessLogo(file);
		await patchSettings(ctx, { logo });
		ctx.ui.notice("Business logo saved and fitted for the POS and receipts.");
	} catch (e) {
		log.error("business logo upload failed", e);
		await ctx.ui.alert(e.message);
	}
}

export const removeBusinessLogo = (ctx) => patchSettings(ctx, { logo: "" });

export async function uploadSocialQr(ctx, file) {
	if (!file) return;
	if (file.size > 1500000) return void (await ctx.ui.alert("Choose a QR image smaller than 1.5 MB."));
	const reader = new FileReader();
	const dataUrl = await new Promise((resolve) => {
		reader.onload = () => resolve(String(reader.result || ""));
		reader.readAsDataURL(file);
	});
	const cleaned = await cleanReceiptQrImage(dataUrl);
	await patchSettings(ctx, { receiptSocialQr: cleaned, receiptSocialQrCleanedVersion: "qr-white-v2" });
}

export const setTheme = async (ctx, id, label) => {
	await patchSettings(ctx, { uiTheme: id });
	ctx.ui.notice(label + " theme saved.");
};

// ------------------------------------------------------------- POS setup ---
export async function applyPosSetup(ctx, { type, addCategories, enableKot }) {
	const d = ctx.data();
	const preset = POS_TYPE_PRESETS[type] || POS_TYPE_PRESETS.other;
	log.info("POS setup applied", { type, addCategories: !!addCategories, enableKot: !!enableKot });
	await ctx.store.write((tx) => {
		tx.setSetting("businessType", type);
		tx.setSetting("autoPrintKot", !!enableKot);
		tx.setSetting("onboardingComplete", true);
		if (addCategories)
			preset.categories.forEach((c) => {
				if (!d.categories.some((x) => x.toLowerCase() === c.toLowerCase())) tx.addCategory(c);
			});
	});
	if (!d.modifiers.length) await addCommonModifiers(ctx, { silent: true });
	ctx.ui.notice(preset.label + " setup applied with categories and ready-to-edit modifiers. Existing products were preserved.");
}

export async function dismissPosSetup(ctx, dontAsk) {
	if (!dontAsk) return;
	await patchSettings(ctx, { onboardingDismissed: true, onboardingDismissedAt: nowIso() });
	ctx.ui.notice("Setup reminder dismissed. You can reopen it from Settings at any time.");
}

export { supportAuditEntry, T };
