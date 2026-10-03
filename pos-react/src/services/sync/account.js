/**
 * Workspace bootstrap and normalisation for cloud sync: fresh account data, owner and main location,
 * cleaning a payload (tombstones, defaults), catalogue backup and recovery, and a push-safe payload.
 */
import { PAYLOAD_ARRAYS } from "./payload";
import { env } from "../../config/env";
import { DEFAULT_OWNER_PIN, STORAGE } from "../../config/constants";
import { RETIRED_MODIFIER_NAMES } from "../../config/presets";
import { itemTime } from "./merge";
import { createLogger } from "../../utils/logger";

const log = createLogger("sync");

/** Workspace bootstrap / normalisation (ported from the legacy cloud layer). */

const now = () => new Date().toISOString();

export function mainLocation(extra = {}) {
	return {
		id: "loc-main",
		name: "Main Location",
		code: "MAIN",
		address: "",
		phone: "",
		email: "",
		openingHours: "",
		active: true,
		receiptHeader: "",
		receiptFooter: "",
		createdAt: now(),
		...extra,
	};
}

export function ownerUser(name = "Owner") {
	return {
		id: "u-owner",
		name,
		role: "owner",
		pin: DEFAULT_OWNER_PIN,
		active: true,
		commissionRate: 0,
		locationAccess: "all",
		locationIds: [],
		createdAt: now(),
	};
}

const emptyDeleted = () => ({
	products: [],
	modifiers: [],
	inventory: [],
	sales: [],
	saleReceipts: [],
	users: [],
	categories: [],
	subcategories: [],
});

export function freshAccountDb(profile = {}, user = {}) {
	const payload = { accountUid: user.uid };
	for (const key of PAYLOAD_ARRAYS) payload[key] = [];
	payload.categories = [];
	payload.sales = [];
	payload.users = [ownerUser(profile.name || "Owner")];
	payload.locations = [mainLocation({ email: user.email || "" })];
	payload.deletedIds = emptyDeleted();
	payload.settings = {
		business: profile.posBusinessName || profile.bizName || "My Business",
		email: user.email || "",
		address: "",
		feedbackLink: "",
		feedbackDelay: 2,
		businessType: "other",
		onboardingComplete: false,
		ejsKey: env.ejsKey,
		ejsService: env.ejsService,
		ejsReceiptTemplate: env.ejsReceiptTemplate,
	};
	return payload;
}

export function normalizeAccountDb(payload, profile, user) {
	// A payload stamped with another account's uid must never leak into this workspace: start fresh instead.
	if (payload?.accountUid && payload.accountUid !== user.uid) {
		log.warn("payload belongs to a different account; discarded");
		payload = null;
	}
	const clean = payload && typeof payload === "object" ? payload : freshAccountDb(profile, user);
	clean.accountUid = user.uid;
	for (const key of [...PAYLOAD_ARRAYS, "sales"]) clean[key] = Array.isArray(clean[key]) ? clean[key] : [];
	clean.categories = Array.isArray(clean.categories) ? clean.categories : [];
	clean.deletedIds = clean.deletedIds && typeof clean.deletedIds === "object" ? clean.deletedIds : {};
	for (const key of ["products", "modifiers", "inventory", "sales", "subcategories"]) {
		clean.deletedIds[key] = Array.isArray(clean.deletedIds[key]) ? clean.deletedIds[key] : [];
		const removed = new Set(clean.deletedIds[key].map(String));
		clean[key] = clean[key].filter((item) => !removed.has(String(item?.id)));
	}
	clean.deletedIds.categories = Array.isArray(clean.deletedIds.categories) ? clean.deletedIds.categories : [];
	const removedCategories = new Set(clean.deletedIds.categories.map((n) => String(n).trim().toLowerCase()));
	clean.categories = clean.categories.filter((n) => !removedCategories.has(String(n).trim().toLowerCase()));
	clean.settings = clean.settings || {};
	if (!clean.locations.length)
		clean.locations.push(
			mainLocation({ address: clean.settings.address || "", email: clean.settings.email || user.email || "" }),
		);
	if (!clean.users.length) clean.users.push(ownerUser(profile?.name || "Owner"));
	clean.users.forEach((u) => {
		if (u.locationAccess !== "all" && !Array.isArray(u.locationIds)) {
			u.locationAccess = u.role === "owner" ? "all" : "selected";
			u.locationIds = u.role === "owner" ? [] : [clean.locations[0].id];
		}
	});
	clean.products.forEach((p) => {
		p.modifierIds = Array.isArray(p.modifierIds) ? p.modifierIds : [];
		p.recipe = Array.isArray(p.recipe) ? p.recipe : [];
	});
	clean.inventory.forEach((item) => {
		item.locationQuantities =
			item.locationQuantities && typeof item.locationQuantities === "object"
				? item.locationQuantities
				: { [clean.locations[0].id]: Number(item.qty) || 0 };
	});
	const linked = new Set(clean.products.flatMap((p) => p.modifierIds));
	clean.deletedIds.modifiers = Array.isArray(clean.deletedIds.modifiers) ? clean.deletedIds.modifiers : [];
	clean.modifiers = clean.modifiers.filter((m) => {
		if (RETIRED_MODIFIER_NAMES.includes(String(m.name || "").trim().toLowerCase()) && !linked.has(m.id)) {
			const id = String(m.id);
			if (!clean.deletedIds.modifiers.includes(id)) clean.deletedIds.modifiers.push(id);
			return false;
		}
		return true;
	});
	return clean;
}

// ------------------------------------------------------- catalogue recovery
export const catalogueBackupKey = (uid) => STORAGE.KEY + "-catalogue-backup-" + uid;

export function cacheCatalogue(payload, user) {
	if (!user || !Array.isArray(payload?.products) || !payload.products.length) return;
	try {
		localStorage.setItem(
			catalogueBackupKey(user.uid),
			JSON.stringify({
				accountUid: user.uid,
				products: payload.products,
				categories: payload.categories || [],
				subcategories: payload.subcategories || [],
				savedAt: now(),
			}),
		);
	} catch (error) {
		console.warn("Catalogue backup could not be updated", error);
		log.warn("catalogue backup write failed", error);
	}
}

export function readCatalogueBackup(uid) {
	try {
		return JSON.parse(localStorage.getItem(catalogueBackupKey(uid)) || "null");
	} catch {
		return null;
	}
}

function catalogueIdentityMatches(payload, profile, user) {
	if (!payload || typeof payload !== "object") return false;
	if (payload.accountUid) return payload.accountUid === user.uid;
	const expected = String(profile.posBusinessName || profile.bizName || "").trim().toLowerCase();
	const actual = String(payload.settings?.business || "").trim().toLowerCase();
	return !!expected && actual === expected;
}

export function productsFromHistory(payload) {
	const map = new Map();
	[].concat(payload?.sales || [], payload?.openOrders || [], payload?.voidOrders || []).forEach((record) => {
		(record.lines || []).forEach((line) => {
			if (!line || line.isDiscount || line.isServiceCharge || !line.name) return;
			const id = String(
				line.productId || line.id || line.code || "recovered-" + line.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
			);
			const old = map.get(id);
			const candidate = {
				id,
				name: line.name,
				type: line.type || "Product",
				code: line.code || "POS-RECOVERED",
				category: line.category || "Recovered",
				subcategory: line.subcategory || "",
				cost: +line.cost || 0,
				price: +line.basePrice || +line.price || 0,
				image: line.image || "",
				imageFit: line.imageFit || "cover",
				imagePositionX: line.imagePositionX == null ? 50 : line.imagePositionX,
				imagePositionY: line.imagePositionY == null ? 50 : line.imagePositionY,
				modifierIds: Array.isArray(line.modifierIds) ? line.modifierIds : [],
				recipe: Array.isArray(line.recipe) ? line.recipe : [],
				updatedAt: record.updatedAt || record.createdAt || now(),
			};
			if (!old || itemTime(candidate) >= itemTime(old)) map.set(id, candidate);
		});
	});
	return Array.from(map.values());
}

/** Restore an empty catalogue from device backups / history. Returns true if it changed `current`. */
export function recoverMissingCatalogue(current, candidates, profile, user) {
	if (Array.isArray(current.products) && current.products.length) {
		cacheCatalogue(current, user);
		return false;
	}
	current.deletedIds = current.deletedIds && typeof current.deletedIds === "object" ? current.deletedIds : {};
	for (const k of ["products", "categories", "subcategories"])
		current.deletedIds[k] = Array.isArray(current.deletedIds[k]) ? current.deletedIds[k] : [];
	const intentionallyDeleted = new Set(current.deletedIds.products.map(String));
	const removedCategories = new Set(current.deletedIds.categories.map(String));
	const removedSubcategories = new Set(current.deletedIds.subcategories.map(String));
	const currentBusiness = String(current.settings?.business || "").trim().toLowerCase();
	let source = (candidates || []).find((c) => {
		const sameBusiness =
			currentBusiness && String(c?.settings?.business || "").trim().toLowerCase() === currentBusiness;
		return (
			(catalogueIdentityMatches(c, profile, user) || sameBusiness) &&
			Array.isArray(c.products) &&
			c.products.length
		);
	});
	let products = source && source.products;
	if (!products || !products.length) {
		products = productsFromHistory(current);
		source = current;
	}
	products = (products || []).filter(
		(p) =>
			!intentionallyDeleted.has(String(p?.id)) &&
			!removedCategories.has(String(p?.category || "")) &&
			!removedSubcategories.has(String(p?.subcategory || "")),
	);
	if (!products.length) return false;
	log.info("catalogue restored", { products: products.length, from: source === current ? "history" : "backup" });
	current.products = JSON.parse(JSON.stringify(products));
	current.categories = Array.from(
		new Set([].concat(current.categories || [], source.categories || [], products.map((p) => p.category || "Recovered")).filter(Boolean)),
	).filter((c) => !removedCategories.has(String(c)));
	current.subcategories = (Array.isArray(source.subcategories) ? JSON.parse(JSON.stringify(source.subcategories)) : current.subcategories || []).filter(
		(s) => !removedSubcategories.has(String(s?.id || s?.name || s)) && !removedCategories.has(String(s?.category || "")),
	);
	cacheCatalogue(current, user);
	return true;
}

/** Payload that is safe to push: drops local-only secrets + bundled images. */
export function safePayload(payload) {
	const copy = JSON.parse(JSON.stringify(payload));
	const bundled = (typeof window !== "undefined" && window.CLS_AZURE_SWIM_IMAGES) || {};
	if (copy.settings) delete copy.settings.ownerAuth;
	(copy.products || []).forEach((p) => {
		const code = String(p.code || "").trim().toUpperCase();
		if (p.imageSource === "azure-swim-catalogue" && bundled[code] === p.image) p.image = "";
	});
	return copy;
}
