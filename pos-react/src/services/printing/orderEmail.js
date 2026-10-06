/**
 * Builds the order e-mail sent to the customer after checkout (subject and styled HTML with items,
 * modifiers, totals and payment method).
 */
import { DEFAULT_RECEIPT_FOOTER } from "../../config/constants";
import { esc, money } from "../../domain/format";

/**
 * E-mail sent to the customer after checkout: the ORDER itself (items,
 * modifiers, discount, service charge, totals and how it was paid) - not a
 * "payment received" notice.
 */
export function orderEmailSubject(sale, business) {
	return `Your order ${sale.receipt} from ${business || "our store"}`;
}

/**
 * Variables for the EmailJS order template (public/email-templates/pos-order-email.html). Everything is a ready-to-show
 * string (money already formatted); the items are the `orders` list for the template's {{#orders}} loop. Optional blocks
 * have a matching has_* flag that is "" when the block should be hidden, so the template can wrap it in {{#has_x}}.
 */
export function orderEmailVariables(sale, { settings = {}, customerName = "Customer" } = {}) {
	const lines = sale.lines || [];
	const real = lines.filter((l) => !l.isDiscount && !l.isServiceCharge);
	const discount = Number(sale.discount?.amount) || 0;
	const service = Number(sale.serviceCharge?.amount) || 0;
	const subtotal = sale.discount?.subtotal ?? real.reduce((a, l) => a + (+l.price || 0) * (+l.qty || 0), 0);
	const logo = /^https?:\/\//i.test(settings.logo || "") ? settings.logo : ""; // data-URL logos do not survive e-mail
	return {
		order_number: sale.orderNumber || sale.receipt,
		receipt_number: sale.receipt,
		order_date: new Date(sale.createdAt || Date.now()).toLocaleString(),
		order_reference: sale.orderReference || "",
		order_channel: sale.orderChannel || "Retail",
		customer_name: customerName,
		business_name: settings.business || "",
		business_address: settings.address || "",
		business_email: settings.email || "",
		business_logo: logo,
		orders: lines.map((l) => ({
			name: l.name || "Item",
			description: l.description || "",
			modifiers: (l.modifiers || []).map((m) => `${m.groupName}: ${m.optionName}`).join(", "),
			quantity: l.isDiscount || l.isServiceCharge ? "" : String(l.qty),
			unit_price: l.isDiscount || l.isServiceCharge ? "" : money(l.price),
			line_total: money(l.price * l.qty),
		})),
		items_count: String(real.reduce((a, l) => a + (+l.qty || 0), 0)),
		subtotal: money(subtotal),
		discount: money(discount),
		service_charge: money(service),
		total: money(sale.total),
		payment_method: sale.payment === "Split" ? (sale.payments || []).map((p) => `${p.method} ${money(p.amount)}`).join(" · ") : sale.payment || "",
		footer_message: settings.receiptFooter || DEFAULT_RECEIPT_FOOTER,
		year: String(new Date().getFullYear()),
		has_discount: discount > 0 ? "yes" : "",
		has_service_charge: service > 0 ? "yes" : "",
		has_reference: sale.orderReference ? "yes" : "",
		has_address: settings.address ? "yes" : "",
		has_logo: logo ? "yes" : "",
	};
}

export function orderEmailHtml(sale, { settings = {}, customerName = "Customer" } = {}) {
	const lines = sale.lines || [];
	const rows = lines
		.map((l) => {
			const mods = (l.modifiers || []).map((m) => esc(m.groupName + ": " + m.optionName)).join("<br>");
			return `<tr><td style="padding:10px 8px;border-bottom:1px solid #eee7dc;vertical-align:top"><strong>${esc(l.name)}</strong>${
				mods ? `<div style="font-size:12px;color:#7a6f63;margin-top:3px">${mods}</div>` : ""
			}</td><td align="center" style="padding:10px 8px;border-bottom:1px solid #eee7dc">${l.isDiscount ? "" : l.qty}</td><td align="right" style="padding:10px 8px;border-bottom:1px solid #eee7dc;white-space:nowrap">${money(l.price * l.qty)}</td></tr>`;
		})
		.join("");
	const accent = "#ff4d0a";
	const paid = sale.payment === "Split" ? (sale.payments || []).map((p) => `${esc(p.method)} ${money(p.amount)}`).join(" · ") : esc(sale.payment);
	const when = new Date(sale.createdAt || Date.now()).toLocaleString();
	const business = esc(settings.business || "Our store");
	return `<div style="margin:0;background:#f6f2ea;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#2d2117"><div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5d9c8;border-radius:10px;overflow:hidden"><div style="background:#171512;color:#fff;padding:26px 28px;border-bottom:5px solid ${accent}">${
		settings.logo ? `<img src="${esc(settings.logo)}" alt="" style="max-height:54px;max-width:160px;display:block;margin-bottom:12px">` : ""
	}<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${accent}">Your order</div><h1 style="margin:8px 0 2px;font-size:26px;line-height:1.2">Order ${esc(sale.receipt)}</h1><div style="color:#eadfce;font-size:14px">${business}${
		settings.address ? " · " + esc(settings.address) : ""
	}</div></div><div style="padding:26px 28px"><p style="margin:0 0 6px;font-size:16px">Hi ${esc(customerName)},</p><p style="margin:0 0 18px;color:#6f6258;line-height:1.6">Thank you for your order. Here is a copy of everything you ordered on ${esc(when)}.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse"><thead><tr style="background:#faf5ec;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#7a6f63"><th align="left" style="padding:10px 8px">Item</th><th align="center" style="padding:10px 8px">Qty</th><th align="right" style="padding:10px 8px">Amount</th></tr></thead><tbody>${rows}</tbody></table><div style="text-align:right;margin:18px 0 6px"><div style="display:inline-block;min-width:240px;background:#171512;color:#fff;padding:14px 18px;border-radius:8px;font-size:18px;font-weight:700">Total ${money(sale.total)}</div></div><p style="margin:14px 0 0;font-size:13px;color:#6f6258">${
		sale.orderReference ? `Reference: <strong>${esc(sale.orderReference)}</strong><br>` : ""
	}Order type: ${esc(sale.orderChannel || "Retail")}<br>Payment method: ${paid}</p><p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#6f6258;border-left:4px solid ${accent};padding-left:14px">${esc(
		settings.receiptFooter || DEFAULT_RECEIPT_FOOTER,
	)}</p></div><div style="padding:14px 28px;background:#f7f2ea;text-align:center;font-size:12px;color:#8b7c6f">${business}${
		settings.email ? " · " + esc(settings.email) : ""
	}<br>Powered by Ceylonry POS</div></div></div>`;
}
