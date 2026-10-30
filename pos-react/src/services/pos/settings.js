/**
 * Settings actions: save all business settings, patch single keys, regenerate the support code, upload or
 * remove the business logo and social QR, set the theme, and apply or dismiss the POS setup preset.
 */
import { T } from "../../db/tables";
import { DEFAULT_BUSINESS_NAME, DEFAULT_RECEIPT_FOOTER, SUPPORT_CODE_TTL_MS } from "../../config/constants";
import { POS_TYPE_PRESETS } from "../../config/presets";
import { hasCapability } from "../../config/capabilities";
import { cleanStations, kitchenStations } from "../../domain/kitchenStations";
import { cleanTax, cleanTaxRules, taxError, taxUses } from "../../domain/taxes";
import { PAGES as MENU_PAGES, PAGE_KEYS as MENU_KEYS, SALES_DEFAULTS, assignItems, cleanGlobalModifier, cleanItemSetting, cleanLimit, cleanMenu, cleanPrefixes, globalModifierError, itemSettingBlank, limitBlank, limitError, cleanSalesCategory, draftChanges, menuError, nextDrafts, salesCategoryError, workingOf } from "../../domain/menuAdmin";
import { copyPrinters, deviceNameError, devicesOf, normalizePrinter, printerError, printersOf, receiptPrinterId } from "../../domain/devices";
import { PERMISSION_KEYS, accessFromKeys, accessOf, jobError, jobsOf } from "../../domain/access";
import { MAIN_FLOOR, floorLayout, floorLayoutKey, floorsFor, floorsKey } from "../../domain/tables";
import { nameError, thirdPartyList, usedNames } from "../../domain/thirdPartyPayments";
import { nowIso } from "../../domain/format";
import { fitBusinessLogo, cleanReceiptQrImage } from "../printing/imageTools";
import { isAppwrite } from "../../config/env";
import { isDataImage, storeImage } from "../imageStorage";
import { audit, newId, supportAuditEntry, unmarkDeletedCategory } from "./common";
import { addCommonModifiers, applyCatalogDrafts } from "./catalog";
import { APPLY_KEYS } from "../../domain/menuAdmin";
import { categoryKey, productCategories } from "../../domain/catalog";
import { newItemFields, subcategoryEntries, subcategoryError, effectiveCategory, categoryEditError, cleanCategoryEdit, cleanGroupEdit, draftList, groupEditError, itemChanges, itemEditError, remainingNames, workingCategories, workingGroups } from "../../domain/catalogDraft";
import { categorySettingBlank, cleanCategorySetting } from "../../domain/deleteApproval";
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
	const foodService = hasCapability(form.businessType, "kitchen");
	if (foodService && form.orderChannels && !form.orderChannels.length)
		return void (await ctx.ui.alert("Enable at least one checkout order type."));
	const stations = form.kitchenStations ? cleanStations(form.kitchenStations) : null;
	if (stations?.error) return void (await ctx.ui.alert(stations.error));
	const next = {
		...d.settings,
		...(stations ? { kitchenStations: stations.stations } : {}),
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
		// the first kitchen printer keeps the old single-printer setting up to date for anything that still reads it
		kotPrinter: stations ? stations.stations.find((x) => x.type === "printer")?.name || "" : form.kotPrinter.trim(),
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

/**
 * System Options page: saves the new settings.systemOptions (and the receipt footer, which keeps living in settings.receiptFooter) and
 * writes one audit entry that lists what changed. `changes` is [{ page, key, before, after }].
 */
export async function saveSystemOptions(ctx, { systemOptions, receiptFooter, changes = [], locationId = "all" }) {
	const patch = { systemOptions };
	if (receiptFooter !== undefined) patch.receiptFooter = receiptFooter;
	await patchSettings(ctx, patch);
	const summary = changes.map((c) => `${c.page}.${c.key}: ${JSON.stringify(c.before)} -> ${JSON.stringify(c.after)}`).join("; ").slice(0, 900);
	await ctx.store.write((tx) => audit(tx, ctx.session(), "system-options-saved", summary, locationId === "all" ? "" : locationId));
	log.info("system options saved", { changes: changes.length, locationId });
	ctx.ui.notice("Settings saved.");
	return true;
}

/** Stations page: saves the kitchen printers and displays. Returns true when saved. */
export async function saveKitchenStations(ctx, rows) {
	const { stations, error } = cleanStations(rows);
	if (error) return void (await ctx.ui.alert(error));
	// the first kitchen printer keeps the old single-printer setting up to date for anything that still reads it
	await patchSettings(ctx, { kitchenStations: stations, kotPrinter: stations.find((x) => x.type === "printer")?.name || "" });
	log.info("kitchen stations saved", { stations: stations.length });
	ctx.ui.notice("Stations saved.");
	return true;
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
		const logo = await storeImage(await fitBusinessLogo(file), "logo");
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
	const cleaned = await storeImage(await cleanReceiptQrImage(dataUrl), "qr");
	await patchSettings(ctx, { receiptSocialQr: cleaned, receiptSocialQrCleanedVersion: "qr-white-v2" });
}

/**
 * One-time move of the images already saved inside the business data (product photos, logo, receipt QR) into cloud
 * storage, so every sync stops carrying them. Images that cannot be uploaded stay as they are; run it again later.
 */
export async function moveImagesToCloud(ctx) {
	if (!isAppwrite()) return void (await ctx.ui.alert("Cloud image storage needs a cloud (Appwrite) account. It is not available in local mode."));
	const d = ctx.data();
	const products = d.products.filter((p) => isDataImage(p.image));
	const settingKeys = ["logo", "receiptSocialQr"].filter((k) => isDataImage(d.settings[k]));
	const total = products.length + settingKeys.length;
	if (!total) return void ctx.ui.notice("All images are already in cloud storage.");
	if (!(await ctx.ui.confirm(`Move ${total} image${total === 1 ? "" : "s"} to cloud storage? Keep this page open until it finishes.`))) return;
	const uploaded = new Map(); // identical images are uploaded once
	const upload = async (image, kind) => {
		if (!uploaded.has(image)) uploaded.set(image, await storeImage(image, kind));
		return uploaded.get(image);
	};
	const movedProducts = [];
	const movedSettings = {};
	for (const p of products) {
		const image = await upload(p.image, "product");
		if (!isDataImage(image)) movedProducts.push({ ...p, image });
	}
	for (const key of settingKeys) {
		const image = await upload(d.settings[key], key === "logo" ? "logo" : "qr");
		if (!isDataImage(image)) movedSettings[key] = image;
	}
	await ctx.store.write((tx) => {
		movedProducts.forEach((p) => tx.put(T.products, p));
		for (const [key, value] of Object.entries(movedSettings)) tx.setSetting(key, value);
	});
	const moved = movedProducts.length + Object.keys(movedSettings).length;
	log.info("images moved to cloud storage", { moved, failed: total - moved });
	ctx.ui.notice(moved === total ? `${moved} image${moved === 1 ? "" : "s"} moved to cloud storage.` : `${moved} of ${total} images moved. The rest stay on this device; try again when you are online.`);
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
	await ctx.store.write(async (tx) => {
		tx.setSetting("businessType", type);
		tx.setSetting("autoPrintKot", !!enableKot);
		tx.setSetting("onboardingComplete", true);
		if (addCategories) {
			for (const c of preset.categories) {
				if (!d.categories.some((x) => x.toLowerCase() === c.toLowerCase())) tx.addCategory(c);
				await unmarkDeletedCategory(tx, c); // a category deleted earlier would otherwise be removed again by sync
			}
			// remembered like "Add Category" does, otherwise empty preset-named categories stay hidden in Products & Services
			const mine = d.settings.userCategories || [];
			const fresh = preset.categories.filter((c) => !mine.some((m) => m.toLowerCase() === c.toLowerCase()));
			if (fresh.length) tx.setSetting("userCategories", [...mine, ...fresh]);
		}
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

// ------------------------------------------------------------------ 3rd party payment types ----

const settingsAudit = (ctx, action, details, locationId = "") => ctx.store.write((tx) => audit(tx, ctx.session(), action, details, locationId));

/** Adds or edits a 3rd party payment type ({ id?, name, active }). Returns true when saved. */
export async function saveThirdPartyPayment(ctx, { id, name, active = true }) {
	const list = thirdPartyList(ctx.data().settings);
	const error = nameError(name, list.filter((t) => t.id !== id));
	if (error) return void (await ctx.ui.alert(error));
	const clean = String(name).trim();
	const next = id ? list.map((t) => (t.id === id ? { ...t, name: clean, active } : t)) : [...list, { id: newId("tp"), name: clean, active }];
	await patchSettings(ctx, { thirdPartyPayments: next });
	await settingsAudit(ctx, "third-party-payment-saved", `${id ? "edited" : "added"} ${clean}${active ? "" : " (inactive)"}`);
	ctx.ui.notice("Payment type saved.");
	return true;
}

/** Saves the order of the types (an array of ids). */
export async function reorderThirdPartyPayments(ctx, next) {
	await patchSettings(ctx, { thirdPartyPayments: next });
	return true;
}

/** Removes a type that no sale has used; a used one can only be switched off. */
export async function deleteThirdPartyPayment(ctx, id) {
	const d = ctx.data();
	const t = thirdPartyList(d.settings).find((x) => x.id === id);
	if (!t) return false;
	if (usedNames(d.sales).has(t.name)) return void (await ctx.ui.alert(`${t.name} was used on past sales, so it can only be switched off.`));
	if (!(await ctx.ui.confirm(`Delete ${t.name}?`))) return false;
	await patchSettings(ctx, { thirdPartyPayments: thirdPartyList(d.settings).filter((x) => x.id !== id) });
	await settingsAudit(ctx, "third-party-payment-deleted", t.name);
	return true;
}

// ------------------------------------------------------------------------------ zones ----
// A zone is a floor of the table layout (views/Tables.jsx), so the same saved lists are used.

const trimZone = (v) => String(v || "").trim().slice(0, 40);

/** Adds a zone, or renames one ({ id?, name }) at a location. Returns true when saved. */
export async function saveZone(ctx, locationId, { id, name }) {
	const d = ctx.data();
	const floors = floorsFor(d.settings, locationId);
	const clean = trimZone(name);
	if (!clean) return void (await ctx.ui.alert("Enter a name."));
	if (floors.some((f) => f.id !== id && f.name.toLowerCase() === clean.toLowerCase())) return void (await ctx.ui.alert("There is already a zone called " + clean + "."));
	const next = id ? floors.map((f) => (f.id === id ? { ...f, name: clean } : f)) : [...floors, { id: newId("fl"), name: clean }];
	await patchSettings(ctx, { [floorsKey(locationId)]: next });
	await settingsAudit(ctx, "zone-saved", `${id ? "renamed" : "added"} ${clean}`, locationId);
	ctx.ui.notice("Zone saved.");
	return true;
}

/** Puts the zones in the order of `ids` (the main zone always stays first). */
export async function reorderZones(ctx, locationId, ids) {
	const floors = floorsFor(ctx.data().settings, locationId);
	const byId = new Map(floors.map((f) => [f.id, f]));
	const next = [byId.get(MAIN_FLOOR), ...ids.filter((id) => id !== MAIN_FLOOR).map((id) => byId.get(id))].filter(Boolean);
	await patchSettings(ctx, { [floorsKey(locationId)]: next });
	return true;
}

/** Deletes a zone and its tables. Refused while a table of it has an open check. */
export async function deleteZone(ctx, locationId, id) {
	const d = ctx.data();
	if (id === MAIN_FLOOR) return void (await ctx.ui.alert("The main zone cannot be deleted."));
	const floors = floorsFor(d.settings, locationId);
	const zone = floors.find((f) => f.id === id);
	if (!zone) return false;
	const tables = floorLayout(d.settings, locationId, id);
	const refs = new Set(tables.map((t) => "Table " + t.number));
	const open = d.openOrders.filter((o) => o.status === "open" && refs.has(o.orderReference));
	if (open.length) return void (await ctx.ui.alert(`${zone.name} still has ${open.length} open check${open.length === 1 ? "" : "s"}: ${open.map((o) => o.orderReference).join(", ")}. Pay, move or void them first.`));
	if (!(await ctx.ui.confirm(`Delete ${zone.name}${tables.length ? ` and its ${tables.length} table${tables.length === 1 ? "" : "s"}` : ""}?`))) return false;
	await patchSettings(ctx, { [floorsKey(locationId)]: floors.filter((f) => f.id !== id), [floorLayoutKey(locationId, id)]: [] });
	await settingsAudit(ctx, "zone-deleted", zone.name, locationId);
	return true;
}

// ------------------------------------------------------------------------- jobs and access ----

/** Adds or edits a job ({ id?, title, code, rate, color, active }). Returns true when saved. */
export async function saveJob(ctx, form) {
	const jobs = jobsOf(ctx.data().settings);
	const error = jobError(form, jobs.filter((j) => j.id !== form.id));
	if (error) return void (await ctx.ui.alert(error));
	const clean = { id: form.id || newId("job"), title: form.title.trim(), code: String(form.code || "").trim().toUpperCase(), rate: Number(form.rate), color: form.color || "", active: form.active !== false };
	await patchSettings(ctx, { jobs: form.id ? jobs.map((j) => (j.id === form.id ? clean : j)) : [...jobs, clean] });
	await settingsAudit(ctx, "job-saved", `${form.id ? "edited" : "added"} ${clean.title} at ${clean.rate} an hour`);
	ctx.ui.notice("Job saved.");
	return true;
}

export async function reorderJobs(ctx, next) {
	await patchSettings(ctx, { jobs: next });
	return true;
}

/** Removes a job nobody holds; a job in use can only be switched off. */
export async function deleteJob(ctx, id) {
	const d = ctx.data();
	const job = jobsOf(d.settings).find((j) => j.id === id);
	if (!job) return false;
	const holders = d.users.filter((u) => accessOf(d.settings, u.id).jobs.some((x) => x.jobId === id));
	if (holders.length) return void (await ctx.ui.alert(`${job.title} is held by ${holders.map((u) => u.name).join(", ")}. Remove it from them first, or switch it off.`));
	if (!(await ctx.ui.confirm(`Delete ${job.title}?`))) return false;
	await patchSettings(ctx, { jobs: jobsOf(d.settings).filter((j) => j.id !== id) });
	await settingsAudit(ctx, "job-deleted", job.title);
	return true;
}

/**
 * Saves a person's permissions and jobs: `keys` is the full set they should hold, `jobs` is [{ jobId, rate }] (rate "" = the job's default).
 * The person doing this can only grant permissions they hold. Returns true when saved.
 */
export async function saveUserAccess(ctx, userId, { keys, jobs }) {
	const d = ctx.data();
	const user = d.users.find((u) => u.id === userId);
	if (!user) return false;
	const known = new Set(jobsOf(d.settings).map((j) => j.id));
	const cleanJobs = (jobs || []).filter((j) => known.has(j.jobId));
	if (cleanJobs.some((j) => j.rate !== "" && j.rate !== undefined && !(Number(j.rate) >= 0))) return void (await ctx.ui.alert("Enter pay rates of 0 or more."));
	const wanted = (keys || []).filter((k) => PERMISSION_KEYS.includes(k));
	const next = { ...(d.settings.userAccess || {}), [userId]: { ...accessFromKeys(user, wanted, d.settings, ctx.session().user), jobs: cleanJobs.map((j) => ({ jobId: j.jobId, rate: j.rate === "" || j.rate === undefined ? "" : Number(j.rate) })) } };
	await patchSettings(ctx, { userAccess: next });
	await settingsAudit(ctx, "user-access-saved", `${user.name}: ${next[userId].grant.length} granted, ${next[userId].revoke.length} removed, ${cleanJobs.length} job${cleanJobs.length === 1 ? "" : "s"}`);
	ctx.ui.notice("Access saved.");
	return true;
}

// ------------------------------------------------------------------------------ devices and printers ----

const rawPrinters = (settings) => (Array.isArray(settings.devicePrinters) ? settings.devicePrinters : []);

/** Adds the device the POS is running on to the list the first time it is used. Returns true when it was added. */
export async function registerDevice(ctx) {
	const { settings } = ctx.data();
	const { deviceId, locationId } = ctx.session();
	const all = devicesOf(settings);
	if (!deviceId || all.some((x) => x.id === deviceId)) return false;
	const device = { id: deviceId, name: "Register " + (all.length + 1), kind: "register", locationId: locationId && locationId !== "all" ? locationId : "" };
	await patchSettings(ctx, { posDevices: [...(Array.isArray(settings.posDevices) ? settings.posDevices : []), device] });
	log.info("device registered", { device: device.name });
	return true;
}

/** Renames a device or changes its kind ({ id, name, kind }). Returns true when saved. */
export async function saveDevice(ctx, form) {
	const { settings } = ctx.data();
	const error = deviceNameError(settings, form);
	if (error) return void (await ctx.ui.alert(error));
	const name = String(form.name).trim().slice(0, 40);
	await patchSettings(ctx, { posDevices: (settings.posDevices || []).map((x) => (x.id === form.id ? { ...x, name, kind: form.kind === "orderpad" ? "orderpad" : "register" } : x)) });
	await settingsAudit(ctx, "device-saved", name);
	ctx.ui.notice("Device saved.");
	return true;
}

/** Removes a device and its printers. The device in use cannot be removed. */
export async function deleteDevice(ctx, id) {
	const { settings } = ctx.data();
	const dev = devicesOf(settings).find((x) => x.id === id);
	if (!dev) return false;
	if (id === ctx.session().deviceId) return void (await ctx.ui.alert("This is the device you are using. Remove it from another device."));
	if (!(await ctx.ui.confirm(`Remove ${dev.name} and its printers?`))) return false;
	await patchSettings(ctx, { posDevices: settings.posDevices.filter((x) => x.id !== id), devicePrinters: rawPrinters(settings).filter((p) => p.deviceId !== id) });
	await settingsAudit(ctx, "device-deleted", dev.name);
	return true;
}

/** Saves one printer of a device ({ id?, deviceId, role, ... }). Returns true when saved. */
export async function saveDevicePrinter(ctx, form) {
	const d = ctx.data();
	const stations = kitchenStations(d.settings, ctx.features()["checkout.kds"]);
	const clean = normalizePrinter({ ...form, name: stations.find((x) => x.id === form.stationId)?.name || "", id: form.id || (form.role === "receipt" ? receiptPrinterId(form.deviceId) : newId("prn")) });
	const siblings = printersOf(d.settings, clean.deviceId).filter((x) => x.id !== clean.id);
	const error = printerError({ ...clean, receiptCopies: form.role === "kitchen" ? 1 : form.receiptCopies ?? 1 }, siblings, stations);
	if (error) return void (await ctx.ui.alert(error));
	const others = rawPrinters(d.settings).filter((x) => x.id !== clean.id);
	await patchSettings(ctx, { devicePrinters: [...others, clean] });
	const device = devicesOf(d.settings).find((x) => x.id === clean.deviceId);
	await settingsAudit(ctx, "device-printer-saved", `${clean.name} on ${device?.name || "a device"}`);
	ctx.ui.notice("Printer saved.");
	return true;
}

/** Removes a kitchen printer (and any backup or duplicate link to it), or puts a Receipt printer back to its default. */
export async function deleteDevicePrinter(ctx, id) {
	const { settings } = ctx.data();
	const p = rawPrinters(settings).find((x) => x.id === id);
	if (!p) return false;
	const label = p.role === "receipt" ? "Reset the receipt printer of this device to its default?" : `Delete ${p.name}?`;
	if (!(await ctx.ui.confirm(label))) return false;
	const left = rawPrinters(settings)
		.filter((x) => x.id !== id)
		.map((x) => ({ ...x, backupPrinterId: x.backupPrinterId === id ? "" : x.backupPrinterId, duplicateToPrinterId: x.duplicateToPrinterId === id ? "" : x.duplicateToPrinterId }));
	await patchSettings(ctx, { devicePrinters: left });
	await settingsAudit(ctx, "device-printer-deleted", p.name);
	return true;
}

/** Copies the printers of one device to another (replacing the target's). USB connections are not copied: connect them on the device. */
export async function copyDevicePrinters(ctx, fromId, toId) {
	const { settings } = ctx.data();
	const devices = devicesOf(settings);
	const from = devices.find((x) => x.id === fromId);
	const to = devices.find((x) => x.id === toId);
	if (!from || !to || fromId === toId) return false;
	if (rawPrinters(settings).some((p) => p.deviceId === toId) && !(await ctx.ui.confirm(`Replace the printers of ${to.name} with those of ${from.name}?`))) return false;
	const copied = copyPrinters(printersOf(settings, fromId), toId, () => newId("prn"));
	await patchSettings(ctx, { devicePrinters: [...rawPrinters(settings).filter((p) => p.deviceId !== toId), ...copied] });
	await settingsAudit(ctx, "device-printers-copied", `${from.name} to ${to.name}`);
	ctx.ui.notice("Printers copied. Connect any USB printers on " + to.name + ".");
	return true;
}

// -------------------------------------------------------------------------------- menu admin ----
// Saving stores a draft (settings.menuDraft); Publish copies every draft over the published lists in one write.

const writeDraft = (ctx, key, next) => patchSettings(ctx, { menuDraft: nextDrafts(ctx.data().settings, key, next) });
const DRAFT_NOTE = "Saved as a draft. Publish the menu to put it on the POS.";

/** Adds or edits a sales category or availability menu as a draft. Returns true when saved. */
export async function saveMenuEntity(ctx, key, form) {
	const { settings, products } = ctx.data();
	const all = workingOf(settings, key);
	const id = form.id || newId(key === "salesCategories" ? "sc" : "mn");
	const others = all.filter((e) => e.id !== id);
	let clean;
	let error;
	if (key === "salesCategories") {
		clean = cleanSalesCategory({ ...form, id });
		error = salesCategoryError(clean, others);
		const known = new Set(products.map((p) => String(p.id)));
		clean.itemIds = clean.itemIds.filter((i) => known.has(i));
		if (!error && clean.status === "inactive" && clean.itemIds.length) error = `${clean.itemIds.length} item${clean.itemIds.length === 1 ? " is" : "s are"} still in ${clean.name}. Move them to another sales category first.`;
	} else if (key === "availabilityMenus") {
		clean = cleanMenu({ ...form, id });
		error = menuError(clean, others);
	} else if (key === "taxes") {
		clean = cleanTax({ ...form, id });
		error = taxError(clean, others);
	} else if (key === "globalModifiers") {
		clean = cleanGlobalModifier({ ...form, id });
		error = globalModifierError(clean, others);
	} else if (key === "modifierPrefixes") {
		clean = cleanPrefixes(form);
		if (!clean.prefixes.length) return void (await ctx.ui.alert("Add at least one prefix, such as Add or No."));
		await writeDraft(ctx, key, [clean]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "modifierLimits") {
		const group = ctx.data().modifiers.find((m) => m.id === form.id);
		clean = cleanLimit({ ...form, name: group?.name });
		const problem = limitError(clean, group);
		if (problem) return void (await ctx.ui.alert(problem));
		const rest = all.filter((e) => e.id !== clean.id);
		await writeDraft(ctx, key, limitBlank(clean) ? rest : [...rest, clean]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "categorySettings") {
		const names = productCategories(ctx.data().categories, products);
		const real = names.find((n) => categoryKey(n) === categoryKey(form.name ?? form.id));
		if (!real) return void (await ctx.ui.alert("That category no longer exists."));
		clean = cleanCategorySetting({ ...form, name: real, id: real });
		const rest = all.filter((e) => e.id !== clean.id);
		await writeDraft(ctx, key, categorySettingBlank(clean) ? rest : [...rest, clean]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "categoryEdits") {
		// add ("original" empty), rename or remove a category; applied to the live catalogue on Publish
		const d = ctx.data();
		const live = productCategories(d.categories, d.products);
		const edits = draftList(settings, "categoryEdits");
		const e = cleanCategoryEdit(form, form.original ? categoryKey(form.original) : form.id || newId("nc"));
		// the other categories: this one does not clash with itself
		const others = workingCategories(live, edits.filter((x) => x.id !== e.id)).filter((r) => !(e.original && categoryKey(r.original) === categoryKey(e.original)));
		const problem = categoryEditError(e, others);
		if (problem) return void (await ctx.ui.alert(problem));
		const unchanged = !e.removed && e.original && e.name === e.original;
		const rest = edits.filter((x) => x.id !== e.id);
		await writeDraft(ctx, key, unchanged ? rest : [...rest, e]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "itemEdits") {
		const product = products.find((p) => String(p.id) === String(form.id));
		const d = ctx.data();
		const rows = workingCategories(productCategories(d.categories, products), draftList(settings, "categoryEdits"));
		const drafted = draftList(settings, "itemEdits").find((x) => x.isNew && x.id === String(form.id));
		if (!product && (form.isNew || drafted)) {
			// a new item: created when the menu is published
			const problem = itemEditError(form, remainingNames(rows));
			if (problem) return void (await ctx.ui.alert(problem));
			const groups = new Set(workingGroups(d.modifiers, draftList(settings, "groupEdits")).filter((g) => g.state !== "removed").map((g) => g.id));
			const stations = new Set(kitchenStations(settings, ctx.features()["checkout.kds"]).map((s) => s.id));
			const changes = newItemFields({ ...form, modifierIds: (form.modifierIds || []).filter((i) => groups.has(i)), stationIds: (form.stationIds || []).filter((i) => stations.has(i)) });
			const id = drafted?.id || form.id || newId("p");
			await writeDraft(ctx, key, [...draftList(settings, "itemEdits").filter((x) => x.id !== id), { id, isNew: true, name: changes.name, original: "", changes }]);
			ctx.ui.notice(DRAFT_NOTE);
			return true;
		}
		if (!product) return void (await ctx.ui.alert("That item no longer exists."));
		const problem = itemEditError(form, remainingNames(rows));
		if (problem) return void (await ctx.ui.alert(problem));
		const changes = itemChanges({ ...product, category: effectiveCategory(rows, product.category) }, form); // against the category it will have once published
		const rest = draftList(settings, "itemEdits").filter((x) => x.id !== String(product.id));
		await writeDraft(ctx, key, Object.keys(changes).length ? [...rest, { id: String(product.id), name: changes.name || product.name, original: product.name, changes, was: Object.fromEntries(Object.keys(changes).map((f) => [f, product[f]])) }] : rest);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "subcategoryEdits") {
		// the whole list of one category's subcategories: form { group, parent, wanted: [{ id?, name }] }
		const problem = subcategoryError(form.wanted || []);
		if (problem) return void (await ctx.ui.alert(problem));
		const entries = subcategoryEntries(ctx.data().subcategories, form.group, form.parent, form.wanted || [], () => newId("sc"));
		await writeDraft(ctx, key, [...draftList(settings, key).filter((x) => x.group !== form.group), ...entries]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "groupEdits") {
		const d = ctx.data();
		const edits = draftList(settings, "groupEdits");
		const live = d.modifiers.find((m) => m.id === form.id);
		const e = cleanGroupEdit({ ...form, id: live ? live.id : form.id || newId("m"), isNew: !live });
		const others = workingGroups(d.modifiers, edits).filter((g) => g.state !== "removed" && g.id !== e.id);
		const problem = groupEditError(e, others);
		if (problem) return void (await ctx.ui.alert(problem));
		const rest = edits.filter((x) => x.id !== e.id);
		const same = live && !e.removed && live.name === e.name && live.mode === e.mode && (live.required !== false) === e.required && JSON.stringify(live.options.map((o) => [o.name, +o.price || 0])) === JSON.stringify(e.options.map((o) => [o.name, o.price]));
		await writeDraft(ctx, key, same || (e.removed && e.isNew) ? rest : [...rest, e]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "itemSettings") {
		// overrides of an existing item; clearing every field removes the entry
		const product = products.find((p) => String(p.id) === String(form.id));
		if (!product) return void (await ctx.ui.alert("That item no longer exists."));
		clean = cleanItemSetting({ ...form, id: String(product.id), name: product.name });
		const known = new Set(workingOf(settings, "taxes").map((t) => t.id));
		if ([clean.taxId, clean.takeawayTaxId].some((t) => t && t !== "none" && !known.has(t))) return void (await ctx.ui.alert("The chosen tax no longer exists. Choose it again."));
		const rest = all.filter((e) => e.id !== clean.id);
		await writeDraft(ctx, key, itemSettingBlank(clean) ? rest : [...rest, clean]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else if (key === "taxRules") {
		clean = cleanTaxRules(form);
		const known = new Set(workingOf(settings, "taxes").map((t) => t.id));
		const refs = [clean.defaultTaxId, clean.serviceTaxId, ...Object.values(clean.categoryTaxes).flatMap((c) => [c.tax, c.takeaway])].filter(Boolean);
		if (refs.some((r) => !known.has(r))) error = "One of the chosen taxes no longer exists. Choose it again.";
		if (!error && clean.serviceTaxOn && !clean.serviceTaxId) error = "Choose the tax on the service charge, or switch it off.";
		if (error) return void (await ctx.ui.alert(error));
		await writeDraft(ctx, key, [clean]);
		ctx.ui.notice(DRAFT_NOTE);
		return true;
	} else return false;
	if (error) return void (await ctx.ui.alert(error));
	let next = all.some((e) => e.id === id) ? all.map((e) => (e.id === id ? clean : e)) : [...all, clean];
	if (key === "salesCategories") next = assignItems(next, id, clean.itemIds);
	await writeDraft(ctx, key, next);
	ctx.ui.notice(DRAFT_NOTE);
	return true;
}

/** Removes one (as a draft). A sales category that still holds items cannot be removed. */
export async function deleteMenuEntity(ctx, key, id) {
	const all = workingOf(ctx.data().settings, key);
	const e = all.find((x) => x.id === id);
	if (!e) return false;
	if (key === "taxes") {
		const uses = taxUses(id, all, workingOf(ctx.data().settings, "taxRules")[0] || {}, workingOf(ctx.data().settings, "itemSettings"));
		if (uses.length) return void (await ctx.ui.alert(`${e.name} is used by ${uses.join(", ")}. Change those first, or set it to inactive.`));
	}
	if (key === "salesCategories" && e.itemIds.length) return void (await ctx.ui.alert(`${e.name} still holds ${e.itemIds.length} item${e.itemIds.length === 1 ? "" : "s"}. Move them to another sales category first, or set it to inactive once it is empty.`));
	if (!(await ctx.ui.confirm(`Remove ${e.name}? It stays on the POS until you publish.`))) return false;
	await writeDraft(ctx, key, all.filter((x) => x.id !== id));
	return true;
}

/** Saves the order of a list (ids) as a draft. */
export async function reorderMenuEntities(ctx, key, ids) {
	const all = workingOf(ctx.data().settings, key);
	const byId = new Map(all.map((e) => [e.id, e]));
	await writeDraft(ctx, key, ids.map((i) => byId.get(i)).filter(Boolean));
	return true;
}

/** Adds the standard sales categories (Food, Beverage, Alcohol, Retail, Other) that are missing, as a draft. */
export async function addStandardSalesCategories(ctx) {
	const all = workingOf(ctx.data().settings, "salesCategories");
	const have = new Set(all.map((c) => c.name.toLowerCase()));
	const add = SALES_DEFAULTS.filter((n) => !have.has(n.toLowerCase())).map((name) => cleanSalesCategory({ id: newId("sc"), name }));
	if (add.length) await writeDraft(ctx, "salesCategories", [...all, ...add]);
	return add.length;
}

/**
 * Puts every draft on the POS at once: the published lists are replaced and the catalogue drafts (categories, items, modifier groups)
 * are applied to the live catalogue, all in one write. Returns true when something was published.
 */
export async function publishMenu(ctx) {
	const d = ctx.data();
	const { settings } = d;
	const changes = draftChanges(settings);
	if (!changes.length) return void ctx.ui.notice("There is nothing to publish.");
	const drafts = settings.menuDraft || {};
	const copied = {};
	for (const key of MENU_KEYS) if (drafts[key]) copied[key] = drafts[key];
	const version = (Number(settings.menuVersion) || 0) + 1;
	await ctx.store.write(async (tx) => {
		const carried = APPLY_KEYS.some((k) => Array.isArray(drafts[k]) && drafts[k].length) ? await applyCatalogDrafts(tx, d, drafts, { ...settings, ...copied }, { syncStock: !!ctx.features()["inventory.productStock"] }) : {};
		const patch = { ...copied, ...carried, menuDraft: {}, menuVersion: version };
		for (const [k, v] of Object.entries(patch)) if (JSON.stringify(settings[k]) !== JSON.stringify(v)) tx.setSetting(k, v);
	});
	const summary = changes.map((c) => `${MENU_PAGES[c.page].label} ${c.name || ""} ${c.kind}`).join("; ").slice(0, 900);
	await settingsAudit(ctx, "menu-published", summary);
	log.info("menu published", { changes: changes.length, version });
	ctx.ui.notice("Menu published.");
	return true;
}

/** Takes one unpublished catalogue edit back out of the draft (by its id). */
export async function revertMenuEdit(ctx, key, id) {
	await writeDraft(ctx, key, draftList(ctx.data().settings, key).filter((x) => x.id !== id));
	return true;
}

/** Throws away every unpublished change. */
export async function discardMenuDraft(ctx) {
	const changes = draftChanges(ctx.data().settings);
	if (!changes.length) return false;
	if (!(await ctx.ui.confirm(`Discard ${changes.length} unpublished change${changes.length === 1 ? "" : "s"}?`))) return false;
	await patchSettings(ctx, { menuDraft: {} });
	return true;
}
