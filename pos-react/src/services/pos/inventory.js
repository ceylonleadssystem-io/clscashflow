/**
 * Inventory actions: save stock items (with opening stock and movements), adjust stock by reason, delete items,
 * set branch and bulk branch counts, import a count sheet, and build the low-stock WhatsApp alert link.
 */
import { T } from "../../db/tables";
import { nowIso } from "../../domain/format";
import { adjustmentChange, locationStock, stockMovement } from "../../domain/inventory";
import { parseStockCountRows } from "../../domain/catalog";
import { applyStockChange, audit, markDeleted, movementRow, newId } from "./common";
import { loadXlsx } from "../xlsx";
import { createLogger } from "../../utils/logger";

const log = createLogger("inventory");

/** Stock items, adjustments, recipes, branch counts and count-sheet upload. */

const activeLocationId = (ctx) => {
	const loc = ctx.session().locationId;
	return loc && loc !== "all" ? loc : ctx.data().locations[0]?.id || "";
};

export async function saveInventoryItem(ctx, form) {
	const d = ctx.data();
	const s = ctx.session();
	const name = form.name.trim();
	const qty = Number(form.qty);
	const reorder = Number(form.reorder);
	const cost = Number(form.cost);
	if (!name || !(qty >= 0) || !(reorder >= 0) || !(cost >= 0)) return void (await ctx.ui.alert("Enter a valid item name and stock values."));
	const existing = d.inventory.find((i) => i.id === form.id);
	const loc = activeLocationId(ctx);
	const before = existing ? locationStock(existing, loc) : 0;
	let item = {
		...(existing || { id: newId("i"), createdAt: nowIso(), locationQuantities: {} }),
		name,
		sku: form.sku.trim() || "STK-" + String(Date.now()).slice(-5),
		type: form.type,
		unit: form.unit,
		reorder,
		cost,
		supplier: form.supplier.trim(),
		...(form.productId ? { productId: form.productId, autoProductStock: true } : {}),
	};
	let movement = null;
	if (qty !== before || !existing) {
		const result = applyStockChange({ ...item, qty: before }, qty - before, loc);
		item = result.item;
		if (qty !== before) movement = movementRow(item, qty, qty - before, existing ? "Stock count correction" : "Opening stock", "", s);
	} else item.qty = qty;
	if (!existing) {
		// new stock item: seed every other active location with 0
		d.locations.filter((l) => l.active !== false).forEach((l) => {
			if (item.locationQuantities[l.id] == null) item.locationQuantities = { ...item.locationQuantities, [l.id]: 0 };
		});
	}
	await ctx.store.write((tx) => {
		tx.put(T.inventoryItems, item);
		if (movement) tx.put(T.stockMovements, movement);
		const product = form.productId && d.products.find((p) => p.id === form.productId);
		if (product) tx.put(T.products, { ...product, trackStock: true });
	});
	log.info(existing ? "stock item updated" : "stock item created", { itemId: item.id, location: loc, adjusted: !!movement });
	return item;
}

export async function adjustStock(ctx, itemId, amount, reason, note) {
	const d = ctx.data();
	const s = ctx.session();
	const item = d.inventory.find((i) => i.id === itemId);
	const value = Number(amount);
	if (!item || !Number.isFinite(value) || value < 0 || (value === 0 && reason !== "Stock count correction"))
		return void (await ctx.ui.alert("Enter a quantity greater than zero."));
	const loc = activeLocationId(ctx);
	const current = locationStock(item, loc);
	const change = adjustmentChange(reason, value, current);
	if (!change) return void (await ctx.ui.alert("The counted quantity matches the current stock. Nothing to update."));
	if (current + change < 0) return void (await ctx.ui.alert(`This would make stock negative. Only ${current} ${item.unit} on hand.`));
	const { item: next, balance } = applyStockChange(item, change, loc);
	await ctx.store.write((tx) => {
		tx.put(T.inventoryItems, next);
		tx.put(T.stockMovements, movementRow(next, balance, change, reason, note, s));
	});
	log.info("stock adjusted", { itemId: item.id, reason, change, balance, location: loc });
	ctx.ui.notice(`${item.name}: ${change > 0 ? "+" : ""}${change} ${item.unit} · now ${balance} ${item.unit} (${reason}).`);
	return true;
}

export async function deleteInventoryItem(ctx, id) {
	const d = ctx.data();
	const item = d.inventory.find((i) => i.id === id);
	if (!item) return;
	const usedBy = d.products.filter((p) => (p.recipe || []).some((r) => r.itemId === id));
	const warning = usedBy.length ? ` This will also remove it from ${usedBy.length} product recipe${usedBy.length === 1 ? "" : "s"}.` : "";
	if (!(await ctx.ui.confirm(`Delete “${item.name}”?${warning} Stock movement history will be retained.`))) return;
	await ctx.store.write(async (tx) => {
		d.stockMovements.filter((m) => m.itemId === id && !m.itemName).forEach((m) => tx.put(T.stockMovements, { ...m, itemName: item.name }));
		usedBy.forEach((p) => tx.put(T.products, { ...p, recipe: (p.recipe || []).filter((r) => r.itemId !== id) }));
		// deleting a sellable product's stock row turns stock tracking off: always available
		const product = item.productId && d.products.find((p) => String(p.id) === String(item.productId));
		if (product) tx.put(T.products, { ...product, trackStock: false });
		await markDeleted(tx, "inventory", id);
		tx.remove(T.inventoryItems, id);
	});
	log.info("stock item deleted", { itemId: id, recipesUpdated: usedBy.length });
	ctx.ui.notice(item.name + (item.productId ? " is no longer stock-tracked and can always be sold." : " deleted from inventory."));
}

/** Owner/admin: set the count of one item for every location. */
export async function saveBranchStockCounts(ctx, itemId, counts) {
	const d = ctx.data();
	const s = ctx.session();
	const item = d.inventory.find((i) => i.id === itemId);
	if (!item) return 0;
	let changed = 0;
	await ctx.store.write((tx) => {
		let next = { ...item };
		for (const [locId, raw] of Object.entries(counts)) {
			const value = Number(raw);
			if (!Number.isFinite(value) || value < 0) continue;
			const before = Number((next.locationQuantities || {})[locId]) || 0;
			if (value === before) continue;
			next = {
				...next,
				locationQuantities: { ...(next.locationQuantities || {}), [locId]: value },
				locationQuantityUpdatedAt: { ...(next.locationQuantityUpdatedAt || {}), [locId]: nowIso() },
			};
			if (s.locationId === locId) next.qty = value;
			tx.put(T.stockMovements, {
				...movementRow(next, value, value - before, "Branch stock count", "Owner central inventory update", s),
				locationId: locId,
				businessId: s.businessId,
			});
			changed++;
		}
		tx.put(T.inventoryItems, next);
	});
	log.info("branch stock counts saved", { itemId, changed });
	ctx.ui.notice(changed ? `${changed} branch stock count${changed === 1 ? "" : "s"} updated.` : "No branch stock counts changed.");
	return changed;
}

export async function saveBulkBranchStockCounts(ctx, locationId, counts, locationName) {
	const d = ctx.data();
	const s = ctx.session();
	if (!locationId) return void (await ctx.ui.alert("Choose a location."));
	let changed = 0;
	await ctx.store.write((tx) => {
		for (const [itemId, raw] of Object.entries(counts)) {
			const item = d.inventory.find((i) => i.id === itemId);
			const value = Number(raw);
			if (!item || !Number.isFinite(value) || value < 0) continue;
			const before = Number((item.locationQuantities || {})[locationId]) || 0;
			if (value === before) continue;
			const next = {
				...item,
				locationQuantities: { ...(item.locationQuantities || {}), [locationId]: value },
				locationQuantityUpdatedAt: { ...(item.locationQuantityUpdatedAt || {}), [locationId]: nowIso() },
			};
			if (s.locationId === locationId) next.qty = value;
			tx.put(T.inventoryItems, next);
			tx.put(T.stockMovements, {
				...movementRow(next, value, value - before, "Bulk branch stock count", "Owner bulk inventory update", s),
				locationId,
				businessId: s.businessId,
			});
			changed++;
		}
	});
	log.info("bulk branch stock counts saved", { locationId, changed });
	ctx.ui.notice(changed ? `${changed} stock count${changed === 1 ? "" : "s"} updated for ${locationName}.` : "No stock counts changed.");
}

/** Applies a CSV/XLSX count sheet (SKU/name + count). */
export async function importStockCountFile(ctx, file) {
	const d = ctx.data();
	const s = ctx.session();
	if (!file) return void (await ctx.ui.alert("Choose a CSV or Excel count sheet first."));
	try {
		const XLSX = await loadXlsx();
		const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
		const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
		const counts = parseStockCountRows(rows);
		let changed = 0;
		const loc = activeLocationId(ctx);
		await ctx.store.write((tx) => {
			counts.forEach(({ needle, value }) => {
				const item = d.inventory.find((i) => String(i.sku || "").toLowerCase() === needle || String(i.name || "").toLowerCase() === needle);
				const product = d.products.find((p) => String(p.code || "").toLowerCase() === needle || String(p.name || "").toLowerCase() === needle);
				if (item) {
					const before = Number(item.qty) || 0;
					const { item: next } = applyStockChange({ ...item, qty: before }, value - before, loc);
					tx.put(T.inventoryItems, next);
					tx.put(T.stockMovements, { ...stockMovement({ ...next, qty: value }, value - before, "Uploaded stock count", "", s.userId), userId: s.userId });
					changed++;
				} else if (product) {
					tx.put(T.products, { ...product, stock: value });
					changed++;
				}
			});
		});
		log.info("stock count sheet imported", { rows: counts.length, applied: changed, unmatched: counts.length - changed });
		if (!changed) return void ctx.ui.notice("No matching SKU or item names were found in the count sheet.");
		ctx.ui.notice(`${changed} stock count${changed === 1 ? " was" : "s were"} updated.`);
		return changed;
	} catch (e) {
		log.error("stock count import failed", e);
		await ctx.ui.alert(e.message);
	}
}

export function lowStockWhatsAppUrl(data) {
	const items = data.inventory.filter((i) => Number(i.qty) <= Number(i.reorder));
	if (!items.length) return null;
	const lines = items
		.map((i) => `• ${i.name}: ${Number(i.qty).toLocaleString()} ${i.unit || "each"} (reorder at ${Number(i.reorder).toLocaleString()})`)
		.join("\n");
	const text = `${data.settings.business || "My Business"} stock alert\n\n${lines}\n\nPlease arrange replenishment.`;
	return "https://wa.me/?text=" + encodeURIComponent(text);
}

export { audit };
