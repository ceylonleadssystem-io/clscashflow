/**
 * Sales actions: completeSale (validation, stock deduction, cash-shift totals, e-mail/WhatsApp/KOT follow-ups,
 * all in one database write), refunds and voids, permanent deletion, and open orders (save, resend to kitchen, void).
 */
import { T } from "../../db/tables";
import { nowIso, isEmail, money, today, whatsappPhone } from "../../domain/format";
import { cartTotals, discountAmount, serviceChargeAmount } from "../../domain/cart";
import {
	applyReversal,
	currentCashShift,
	makeDiscountLine,
	makeServiceLine,
	refundableLines,
	selectedRefundLines,
	calculateRefundAmount,
	statusOf,
} from "../../domain/sales";
import { availableProductStock, firstShortIngredient, saleStockNeeds, stockProblem } from "../../domain/inventory";
import { formatOrderNumber, mergeOrders, nextSequence } from "../../domain/orders";
import { sendOrderEmail } from "../platform.service";
import { orderEmailHtml, orderEmailSubject } from "../printing/orderEmail";
import { applyStockChange, kitchenMode, markDeleted, movementRow, newId, serviceChargeSupported, stamp } from "./common";
import { createLogger } from "../../utils/logger";
import { printKotForSale, printReceipt, queueKitchenTicket, shareReceiptWhatsApp } from "./printing";

const log = createLogger("sales");

/** Checkout completion, reversals (refund/void), open orders and sale deletion. */

const activeLocation = (ctx) => {
	const s = ctx.session();
	return s.locationId && s.locationId !== "all" ? ctx.data().locations.find((l) => l.id === s.locationId) : null;
};

const cashPortion = (payment, splitPayments, total) => {
	const split = splitPayments.filter((p) => p.method === "Cash").reduce((a, p) => a + (+p.amount || 0), 0);
	return split || payment === "Cash" ? split || total : 0;
};

/**
 * Completes the current order. All database changes (sale + lines, recipe and
 * product stock, cash-shift totals, open-order status, order sequence) are
 * committed in ONE WatermelonDB write; optional extras (e-mail, WhatsApp,
 * printing, kitchen ticket) follow after the sale is safely stored.
 *
 * @returns {Promise<object|null>} the stored sale, or null when validation failed
 */
export async function completeSale(ctx, input) {
	const d = ctx.data();
	const s = ctx.session();
	const f = ctx.features();
	const settings = d.settings;
	const cart = input.cart;
	if (!cart.length) return null;
	const discount = f["checkout.discounts"] ? input.discount : { type: "percent", value: 0 };
	const supported = f["checkout.serviceCharge"] && serviceChargeSupported(settings);
	const totals = cartTotals(cart, discount, settings, supported);
	const splits = f["checkout.splitBill"] ? input.splitPayments || [] : [];
	const register = currentCashShift(d.cashShifts, s.userId);
	const loc = activeLocation(ctx);
	const cashDue = f["checkout.cashTender"] ? cashPortion(input.payment, splits, totals.total) : 0;
	const given = Number(String(input.cashTendered ?? "").replace(/,/g, ""));

	// ---- guards, in the same order as the final legacy wrapper chain --------
	if (f["checkout.stockGuard"] && f["inventory.productStock"]) {
		const issue = stockProblem(cart, d.products, d.inventory, s.locationId);
		if (issue) {
			const stock = availableProductStock(d.products.find((p) => p.id === issue.productId), d.inventory, s.locationId);
			await ctx.ui.alert(`${issue.name} has only ${stock} in stock. Reduce the quantity before completing the sale.`);
			return null;
		}
	}
	if (!loc) {
		await ctx.ui.alert("Choose a real POS location before completing checkout.");
		return null;
	}
	if (cashDue > 0) {
		if (String(input.cashTendered ?? "") === "") {
			await ctx.ui.alert("Enter the cash received or press Exact Cash.");
			return null;
		}
		if (!Number.isFinite(given) || given < cashDue - 0.005) {
			await ctx.ui.alert("Cash received is less than the amount due. " + money(cashDue - given) + " is still required.");
			return null;
		}
	}
	if (splits.length && splits.some((p) => p.paid !== true)) {
		await ctx.ui.alert("Take each split payment before completing the sale.");
		return { needsSplit: true };
	}
	if (splits.length && splits.some((p) => p.method === "Cash") && !register) {
		await ctx.ui.alert("Open the cash register before accepting the cash portion of this split bill.");
		return null;
	}
	const needs = saleStockNeeds(cart, d.products);
	const short = f["inventory.recipes"] ? firstShortIngredient(needs, d.inventory) : null;
	if (short) {
		await ctx.ui.alert(`Not enough ${short.i.name}. Required: ${short.qty} ${short.i.unit}; available: ${short.i.qty} ${short.i.unit}.`);
		return null;
	}
	const customer = d.customers.find((c) => c.id === input.customerId);
	if (!splits.length && input.payment === "Cash" && !register) {
		await ctx.ui.alert("Open the cash register in Staff & Shifts before accepting cash.");
		return null;
	}
	if (input.wantsWhatsApp && !customer?.phone) {
		await ctx.ui.alert("Select or add a customer with a mobile number for WhatsApp receipts.");
		return null;
	}
	const email = (input.receiptEmail || "").trim();
	if (input.wantsEmail && !isEmail(email)) {
		await ctx.ui.alert("Enter a valid receipt email.");
		return null;
	}
	// pre-open the WhatsApp tab synchronously so pop-up blockers allow it
	const waWindow = input.wantsWhatsApp ? window.open("about:blank", "_blank") : null;

	// ------------------------------------------------------------- build sale
	const serviceRate = Number(settings.serviceChargeRate) || 0;
	const serviceAmount = serviceChargeAmount(cart, discount, settings, supported);
	const discountValue = discountAmount(cart, discount);
	const lines = JSON.parse(JSON.stringify(cart));
	if (serviceAmount) lines.push(makeServiceLine(serviceAmount, serviceRate));
	if (discountValue) lines.push(makeDiscountLine(discountValue));
	const total = lines.reduce((a, l) => a + l.price * l.qty, 0);
	const cost = lines.reduce((a, l) => a + (+l.cost || 0) * l.qty, 0);
	const openOrder = input.openOrderId ? d.openOrders.find((o) => o.id === input.openOrderId) : null;
	const seq = nextSequence(d.meta, d.sales, d.openOrders);
	const receipt = openOrder?.orderNumber || formatOrderNumber(seq);
	let id = String(Date.now());
	while (d.sales.some((x) => x.id === id)) id += "1";
	const kitchen = kitchenMode(settings);
	const sale = stamp(
		{
			id,
			receipt,
			orderNumber: receipt,
			date: today(),
			createdAt: nowIso(),
			customerId: input.customerId || "",
			customerName: customer?.name || "",
			customerPhone: customer?.phone || "",
			payment: splits.length ? "Split" : input.payment,
			lines,
			total,
			cost,
			profit: total - cost,
			receiptEmail: input.wantsEmail ? email : "",
			staffId: s.userId,
			cashShiftId: register?.id || "",
			status: "completed",
			orderReference: input.orderReference || "",
			discount: { ...discount, amount: discountValue, subtotal: totals.subtotal },
			serviceCharge: { enabled: serviceAmount > 0, rate: serviceRate, amount: serviceAmount },
			orderChannel: kitchen && f["checkout.orderChannels"] ? input.orderChannel || "Dine-in" : "Retail",
			platformOrderId: kitchen ? input.platformOrderId || "" : "",
			locationName: loc.name,
			committedAt: nowIso(),
			printRequested: !!input.printAfter,
			...(splits.length
				? {
						payments: splits.map((p) => ({ ...p })),
						cashAmount: splits.filter((p) => p.method === "Cash").reduce((a, p) => a + p.amount, 0),
					}
				: {}),
			...(cashDue > 0 ? { cashDue, cashTendered: given, changeGiven: Math.max(0, given - cashDue) } : {}),
			...(openOrder ? { openOrderId: openOrder.id } : {}),
		},
		s,
	);
	// businessId/locationId are stamped above; make sure location is explicit
	sale.locationId = loc.id;
	sale.businessId = s.businessId;

	await ctx.store.write(async (tx) => {
		const items = new Map(d.inventory.map((i) => [i.id, i]));
		const touched = new Set();
		const movements = [];
		// recipe usage
		if (f["inventory.recipes"]) {
			lines.forEach((line) => {
				const p = d.products.find((x) => x.id === line.productId);
				(line.recipe || p?.recipe || []).forEach((r) => {
					const item = items.get(r.itemId);
					if (!item) return;
					const used = r.qty * line.qty;
					const res = applyStockChange(item, -used, loc.id);
					items.set(item.id, res.item);
					touched.add(item.id);
					movements.push(movementRow(res.item, res.balance, -used, "Sale recipe usage", receipt, s));
					sale.inventoryDeducted = true;
				});
			});
		}
		// sellable product stock
		if (f["inventory.productStock"]) {
			lines
				.filter((l) => !l.isDiscount && !l.isServiceCharge)
				.forEach((line) => {
					const item = [...items.values()].find((i) => String(i.productId || "") === String(line.productId));
					if (!item) return;
					const res = applyStockChange(item, -(Number(line.qty) || 0), loc.id);
					items.set(item.id, res.item);
					touched.add(item.id);
					movements.push(movementRow(res.item, res.balance, -(Number(line.qty) || 0), "Product sold", receipt, s));
					sale.productStockDeducted = true;
				});
		}
		touched.forEach((itemId) => tx.put(T.inventoryItems, items.get(itemId)));
		movements.forEach((m) => tx.put(T.stockMovements, m));
		tx.putSale(sale);
		if (!openOrder) tx.setMeta("nextOrderSequence", seq + 1);
		if (cashDue > 0 && register)
			tx.put(T.cashShifts, {
				...register,
				cashTenderedTotal: (+register.cashTenderedTotal || 0) + given,
				changeGivenTotal: (+register.changeGivenTotal || 0) + Math.max(0, given - cashDue),
				netCashSales: (+register.netCashSales || 0) + cashDue,
			});
		if (openOrder)
			tx.put(T.openOrders, { ...openOrder, status: "paid", closedAt: nowIso(), saleId: id });
		tx.put(T.locationAudit, {
			id: "la" + Date.now() + Math.random(),
			businessId: s.businessId,
			userId: s.userId,
			locationId: loc.id,
			sessionId: s.sessionId,
			deviceId: s.deviceId,
			action: "checkout-completed",
			details: receipt + " · " + money(total),
			at: nowIso(),
		});
	});

	log.info("sale completed", {
		receipt,
		total,
		payment: sale.payment,
		items: lines.filter((l) => !l.isDiscount && !l.isServiceCharge).length,
		location: loc.id,
		fromOpenOrder: !!openOrder,
	});
	let message = `Sale ${receipt} completed for ${money(total)}.`;
	if (cashDue > 0)
		message = `Sale ${receipt} completed. Cash received: ${money(given)} · Change to give: ${money(Math.max(0, given - cashDue))}.`;

	// ---- optional follow-ups (the sale is already committed) ----------------
	if (input.wantsEmail && f["checkout.emailReceipt"]) {
		try {
			await sendOrderEmail({
				to: email,
				subject: orderEmailSubject(sale, settings.business),
				html: orderEmailHtml(sale, { settings, customerName: customer?.name || "Customer" }),
				customerName: customer?.name || "Customer",
				settings,
			});
			await ctx.store.write((tx) => tx.putSale({ ...sale, receiptSentAt: nowIso() }));
			log.info("order email sent", { receipt });
			message += " Order e-mailed to " + email + ".";
		} catch (e) {
			// The sale is already committed; an e-mail failure must not undo or block it.
			log.warn("order email failed", e, { receipt });
			message += " Sale saved, but the order e-mail failed: " + e.message;
		}
	}
	ctx.ui.notice(message);
	if (input.wantsWhatsApp) await shareReceiptWhatsApp(ctx, sale, waWindow);
	if (kitchen && settings.autoPrintKot && !openOrder?.kitchenSentAt && f["checkout.kitchenTickets"])
		setTimeout(() => printKotForSale(ctx, sale), 300);
	return { sale, printRequested: !!input.printAfter };
}

/** Prints a just-completed sale after the UI state has been reset. */
export async function printCompletedSale(ctx, sale) {
	return printReceipt(ctx, sale);
}

// =========================================================== reversals ======
export async function reverseSale(ctx, { saleId, type, reason, refundType = "full", choices = {} }) {
	const d = ctx.data();
	const s = ctx.session();
	const f = ctx.features();
	const sale = d.sales.find((x) => x.id === saleId);
	const text = (reason || "").trim();
	if (!text) return void (await ctx.ui.alert("Enter a reason."));
	if (!sale || !["completed", "partially_refunded"].includes(statusOf(sale)))
		return void (await ctx.ui.alert("This sale has already been fully reversed."));
	const register = currentCashShift(d.cashShifts, s.userId);
	const isSplitCash = sale.payment === "Split" && (sale.payments || []).some((p) => p.method === "Cash");
	const bypassHistoricalCash = sale.payment === "Cash" && !register && ["owner", "admin"].includes(s.user?.role);
	if (sale.payment === "Cash" && !register && !bypassHistoricalCash)
		return void (await ctx.ui.alert("Open a cash register before reversing a cash sale."));
	if (isSplitCash && !register)
		return void (await ctx.ui.alert("Open a cash register before refunding the cash portion of this split payment."));
	let refundLines = [];
	if (type === "refund") {
		refundLines = selectedRefundLines(sale, refundType, choices);
		if (!refundLines.length) return void (await ctx.ui.alert("Select at least one item to refund."));
		if (calculateRefundAmount(sale, refundType, refundLines) <= 0)
			return void (await ctx.ui.alert("There is no remaining amount to refund."));
	}
	const { sale: updated, restoredLines } = applyReversal(sale, {
		type,
		reason: text,
		userId: s.userId,
		cashShiftId: bypassHistoricalCash ? "" : register?.id,
		refundType,
		refundLines,
	});
	const autoPurge = type === "void" && ["owner", "admin"].includes(s.user?.role) && f["sales.permanentDelete"];
	await ctx.store.write(async (tx) => {
		// restore stock for recipes and sellable products by the reversed quantities
		const items = new Map(d.inventory.map((i) => [i.id, i]));
		const touched = new Set();
		const movements = [];
		restoredLines.forEach((ref) => {
			const line = sale.lines[ref.lineIndex];
			if (!line) return;
			const product = d.products.find((x) => x.id === line.productId);
			const reasonText = type === "void" ? "Sale reversed" : "Partial refund";
			if (sale.inventoryDeducted)
				(line.recipe || product?.recipe || []).forEach((r) => {
					const item = items.get(r.itemId);
					if (!item) return;
					const returned = r.qty * ref.qty;
					const res = applyStockChange(item, returned, sale.locationId || s.locationId);
					items.set(item.id, res.item);
					touched.add(item.id);
					movements.push(movementRow(res.item, res.balance, returned, reasonText, sale.receipt + " · " + text, s));
				});
			if (sale.productStockDeducted) {
				const item = [...items.values()].find((i) => String(i.productId || "") === String(line.productId));
				if (item) {
					const res = applyStockChange(item, ref.qty, sale.locationId || s.locationId);
					items.set(item.id, res.item);
					touched.add(item.id);
					movements.push(movementRow(res.item, res.balance, ref.qty, reasonText === "Sale reversed" ? "Sale reversed" : "Partial refund", sale.receipt, s));
				}
			}
		});
		touched.forEach((itemId) => tx.put(T.inventoryItems, items.get(itemId)));
		movements.forEach((m) => tx.put(T.stockMovements, m));
		if (autoPurge) {
			// legacy behaviour: an owner/admin void permanently removes the sale everywhere
			await markDeleted(tx, "sales", sale.id);
			if (sale.receipt) await markDeleted(tx, "saleReceipts", sale.receipt);
			tx.removeSale(sale.id);
			tx.put(T.supportAudit, {
				id: "sa" + Date.now(),
				at: nowIso(),
				action: "sale-permanently-deleted",
				details: sale.receipt + " · voided",
				userId: s.userId,
				locationId: sale.locationId || s.locationId || "",
				sessionId: s.sessionId || "",
			});
		} else tx.putSale(updated);
	});
	log.info(type === "refund" ? "sale refunded" : "sale voided", {
		receipt: sale.receipt,
		type,
		refundType: type === "refund" ? refundType : undefined,
		total: sale.total,
		payment: sale.payment,
		items: restoredLines.length,
		role: s.user?.role,
		permanentlyDeleted: autoPurge,
	});
	ctx.ui.notice((type === "refund" ? "Refund" : "Void") + " recorded for " + sale.receipt + ".");
	return true;
}

export async function deleteSalePermanently(ctx, id, skipConfirm = false) {
	const s = ctx.session();
	const d = ctx.data();
	if (!["owner", "admin"].includes(s.user?.role))
		return void ctx.ui.notice("Only the owner or an admin can permanently delete sales.");
	const sale = d.sales.find((x) => String(x.id) === String(id));
	if (!sale) return void ctx.ui.notice("This sale has already been deleted.");
	const status = statusOf(sale);
	if (!["refunded", "voided"].includes(status)) return void (await ctx.ui.alert("Refund or void this sale before permanently deleting it."));
	if (!skipConfirm && !(await ctx.ui.confirm(`Permanently delete ${sale.receipt}? It will be removed from every synced device and cannot be restored.`))) return;
	await ctx.store.write(async (tx) => {
		await markDeleted(tx, "sales", sale.id);
		if (sale.receipt) await markDeleted(tx, "saleReceipts", sale.receipt);
		tx.removeSale(sale.id);
		tx.put(T.supportAudit, {
			id: "sa" + Date.now(),
			at: nowIso(),
			action: "sale-permanently-deleted",
			details: sale.receipt + " · " + status,
			userId: s.userId,
			locationId: sale.locationId || s.locationId || "",
			sessionId: s.sessionId || "",
		});
	});
	log.warn("sale permanently deleted", { receipt: sale.receipt, status, role: s.user?.role });
	ctx.ui.notice(sale.receipt + " was permanently deleted from every synced device.");
}

// ============================================================ open orders ===
export async function voidCurrentOrder(ctx, cart) {
	if (!cart.length) return void ctx.ui.notice("The current order is already empty.");
	const s = ctx.session();
	await ctx.store.write((tx) =>
		tx.put(
			T.voidOrders,
			stamp(
				{
					id: newId("vo"),
					at: nowIso(),
					staffId: s.userId,
					lines: JSON.parse(JSON.stringify(cart)),
					total: cart.reduce((a, l) => a + l.price * l.qty, 0),
				},
				s,
			),
		),
	);
	log.info("current order voided", { items: cart.length });
	ctx.ui.notice("Current order voided.");
	return true;
}

/** Saves (or updates) an open order; optionally sends it to the kitchen. */
export async function saveOpenOrder(ctx, input) {
	const d = ctx.data();
	const s = ctx.session();
	if (!input.cart.length) return void (await ctx.ui.alert("Add at least one item to the order."));
	if (input.sendKitchen && !kitchenMode(d.settings))
		return void (await ctx.ui.alert("Kitchen tickets are available only in Restaurant or Café / Bakery mode."));
	const now = nowIso();
	const existing = d.openOrders.find((o) => o.id === input.openOrderId);
	const seq = nextSequence(d.meta, d.sales, d.openOrders);
	const order = {
		...(existing || { id: "ord" + Date.now(), orderNumber: formatOrderNumber(seq), openedAt: now }),
		updatedAt: now,
		staffId: s.userId,
		customerId: input.customerId || "",
		orderReference: input.reference || (existing || {}).orderNumber || formatOrderNumber(seq),
		lines: JSON.parse(JSON.stringify(input.cart)),
		discount: { ...input.discount, amount: discountAmount(input.cart, input.discount) },
		status: "open",
		orderChannel: input.orderChannel,
		platformOrderId: input.platformOrderId,
	};
	if (input.sendKitchen) {
		order.kitchenSentAt = now;
		order.kitchenSendCount = (order.kitchenSendCount || 0) + 1;
	}
	const stamped = stamp(order, s);
	await ctx.store.write((tx) => {
		tx.put(T.openOrders, stamped);
		if (!existing) tx.setMeta("nextOrderSequence", seq + 1);
	});
	log.info(existing ? "open order updated" : "open order saved", { order: stamped.orderNumber, items: input.cart.length, sentToKitchen: !!input.sendKitchen });
	if (input.sendKitchen) await queueKitchenTicket(ctx, { ...stamped, receipt: stamped.orderNumber });
	ctx.ui.notice(input.sendKitchen ? "Order sent to the kitchen." : "Open order saved.");
	return stamped;
}

export async function resendOpenOrder(ctx, id) {
	const d = ctx.data();
	if (!kitchenMode(d.settings)) return void ctx.ui.notice("Kitchen tickets are available for Restaurant and Café / Bakery presets.");
	const order = d.openOrders.find((o) => o.id === id && o.status === "open");
	if (!order) return;
	const next = { ...order, kitchenSentAt: nowIso(), kitchenSendCount: (order.kitchenSendCount || 0) + 1 };
	await ctx.store.write((tx) => tx.put(T.openOrders, next));
	await queueKitchenTicket(ctx, next);
	ctx.ui.notice("Kitchen ticket sent for " + order.orderNumber + ".");
}

export async function voidOpenOrder(ctx, id) {
	const d = ctx.data();
	const s = ctx.session();
	const order = d.openOrders.find((o) => o.id === id && o.status === "open");
	if (!order) return;
	const reason = await ctx.ui.prompt("Reason for voiding this open order:");
	if (!reason) return;
	await ctx.store.write((tx) =>
		tx.put(T.openOrders, { ...order, status: "voided", voidedAt: nowIso(), voidedBy: s.userId, voidReason: reason }),
	);
	log.info("open order voided", { order: order.orderNumber });
	ctx.ui.notice(order.orderNumber + " voided.");
}

/** Moves an open check to another reference (e.g. "Table 7"). */
export async function transferOpenOrder(ctx, id, reference) {
	const d = ctx.data();
	const order = d.openOrders.find((o) => o.id === id && o.status === "open");
	if (!order) return;
	await ctx.store.write((tx) => tx.put(T.openOrders, stamp({ ...order, orderReference: reference, updatedAt: nowIso() }, ctx.session())));
	log.info("open order moved", { order: order.orderNumber, to: reference });
	ctx.ui.notice(order.orderNumber + " moved to " + reference + ".");
}

/** Merges open order `fromId` into `intoId` (lines add up, the source is closed as merged). */
export async function mergeOpenOrders(ctx, fromId, intoId) {
	const d = ctx.data();
	const from = d.openOrders.find((o) => o.id === fromId && o.status === "open");
	const into = d.openOrders.find((o) => o.id === intoId && o.status === "open");
	if (!from || !into || from.id === into.id) return;
	const merged = mergeOrders(into, from);
	const s = ctx.session();
	await ctx.store.write((tx) => {
		tx.put(T.openOrders, stamp(merged.target, s));
		tx.put(T.openOrders, stamp(merged.source, s));
	});
	log.info("open orders merged", { from: from.orderNumber, into: into.orderNumber });
	ctx.ui.notice(from.orderNumber + " merged into " + into.orderNumber + ".");
}

export { refundableLines, whatsappPhone };
