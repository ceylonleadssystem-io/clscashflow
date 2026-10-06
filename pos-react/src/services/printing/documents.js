/**
 * Printable documents as pure functions: the 80 mm receipt HTML, the kitchen order ticket (no prices),
 * the WhatsApp receipt text and the 48-column ESC/POS receipt text.
 */
import { DEFAULT_BUSINESS_NAME, DEFAULT_RECEIPT_FOOTER } from "../../config/constants";
import { esc, money } from "../../domain/format";
import { receiptDate } from "../../domain/sales";

/**
 * Printable documents (80 mm receipt, kitchen ticket, WhatsApp text).
 * Pure functions of (sale, context) so they can be unit tested and reused by
 * the print drivers (window print, iframe print, ESC/POS).
 */

export function receiptSocialLines(settings) {
	const social = settings.receiptSocials || {};
	const labels = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", website: "Web" };
	return ["instagram", "facebook", "tiktok", "website"]
		.filter((key) => String(social[key] || "").trim())
		.map((key) => labels[key] + ": " + String(social[key]).trim());
}

const RECEIPT_CSS =
	"@page{size:80mm auto;margin:4mm}body{font:12px Arial;width:72mm;margin:0;color:#000}.logo{display:block;width:30mm;height:30mm;max-width:30mm;max-height:30mm;object-fit:contain;margin:0 auto 8px}h1{text-align:center;font-size:18px;margin:0}p{text-align:center;margin:4px 0;white-space:pre-line}table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:5px 0;border-bottom:1px dashed #999}td:nth-child(2){text-align:center}td:last-child{text-align:right}small{display:block;color:#555}.total{font-size:17px;font-weight:bold;text-align:right}.foot{margin-top:15px;border-top:1px dashed #999;padding-top:10px}.powered{font-size:8px;color:#777;letter-spacing:.08em;margin-top:12px}.social-qr{display:block;width:42mm;height:42mm;object-fit:contain;margin:12px auto 5px}.receipt-socials{text-align:center;font-size:11px;line-height:1.5;margin-top:8px}";

/** Final receipt HTML (logo, location, cash tender, socials, footer). */
export function receiptHtml(sale, { settings = {}, location = null, autoPrint = true } = {}) {
	const lines = (sale.lines || [])
		.map(
			(l) =>
				`<tr><td>${esc(l.name)}${l.description ? "<small>" + esc(l.description) + "</small>" : ""}${
					(l.modifiers || []).length
						? "<small>" + l.modifiers.map((m) => esc(m.groupName + ": " + m.optionName)).join("<br>") + "</small>"
						: ""
				}</td><td>${l.qty}</td><td>${money(l.price * l.qty)}</td></tr>`,
		)
		.join("");
	const logo = settings.logo ? `<img class="logo" src="${esc(settings.logo)}" alt="Business logo">` : "";
	const footerText = (location && location.receiptFooter) || settings.receiptFooter || DEFAULT_RECEIPT_FOOTER;
	const cashDetail =
		sale.payment === "Cash" || (sale.payment === "Split" && sale.cashDue > 0)
			? `<p><strong>Cash received:</strong> ${money(sale.cashTendered ?? sale.cashDue ?? sale.total)}<br><strong>Change:</strong> ${money(sale.changeGiven || 0)}</p>`
			: "";
	const social = receiptSocialLines(settings);
	const qr = settings.receiptSocialQr
		? `<img class="social-qr" src="${esc(settings.receiptSocialQr)}" alt="Social QR code">`
		: "";
	const socials = social.length
		? `<div class="receipt-socials"><strong>Follow us</strong><br>${social.map(esc).join("<br>")}</div>`
		: "";
	const locationBlock = location ? `<p><b>${esc(location.name)}</b></p>` : "";
	return `<!doctype html><html><head><title>${esc(sale.receipt)}</title><style>${RECEIPT_CSS}</style></head><body>${logo}<h1>${esc(
		settings.business || DEFAULT_BUSINESS_NAME,
	)}</h1>${locationBlock}<p>${esc(settings.address || "")}</p><p>${esc(settings.email || "")}</p><p>${esc(sale.receipt)} · ${new Date(
		sale.createdAt || Date.now(),
	).toLocaleString()}</p><table>${lines}</table><div class="total">TOTAL ${money(sale.total)}</div>${cashDetail}<p>Paid by ${esc(
		sale.payment,
	)}</p><p class="foot">${esc(footerText)}</p>${qr}${socials}<p class="powered">Powered by Ceylonry POS</p>${
		autoPrint ? "<script>onload=()=>print()</script>" : ""
	}</body></html>`;
}

/** Kitchen order ticket (no prices, quantities + modifiers only). */
export function kotHtml(order, { settings = {}, customerName = "Walk-in Customer", autoPrint = true } = {}) {
	const lines = (order.lines || [])
		.filter((l) => !l.isDiscount && !l.isServiceCharge)
		.map(
			(l) =>
				`<div class="item"><b>${l.qty} × ${esc(l.name)}</b>${(l.modifiers || [])
					.map((m) => `<span>• ${esc(m.groupName)}: ${esc(m.optionName)}</span>`)
					.join("")}</div>`,
		)
		.join("");
	const reference = order.orderReference ? `<div class="reference">${esc(order.orderReference)}</div>` : "";
	return `<!doctype html><html><head><title>KOT ${esc(order.receipt || order.orderNumber)}</title><style>@page{size:80mm auto;margin:4mm}body{font:14px Arial;width:72mm;margin:0;color:#000}h1{text-align:center;margin:0;font-size:25px}.reference{text-align:center;font-size:26px;font-weight:bold;border:3px solid #000;padding:7px;margin:8px 0}.meta{text-align:center;border-bottom:2px dashed #000;padding:7px 0;line-height:1.55}.item{font-size:18px;padding:10px 0;border-bottom:1px dashed #000}.item span{display:block;font-size:14px;margin:4px 0 0 12px}.foot{text-align:center;margin-top:12px;font-weight:bold}</style></head><body><h1>KITCHEN ORDER</h1>${reference}<div class="meta"><b>${esc(
		order.receipt || order.orderNumber,
	)}</b><br><strong>Customer:</strong> ${esc(customerName)}<br>${new Date(order.createdAt || order.openedAt || Date.now()).toLocaleString()}</div>${
		lines || '<div class="item">No preparation items</div>'
	}<div class="foot">Route: ${esc(settings.kotPrinter || "Kitchen")}</div>${autoPrint ? "<script>onload=()=>print()</script>" : ""}</body></html>`;
}

/** WhatsApp receipt text. */
export function receiptMessage(sale, { settings = {}, customer = null } = {}) {
	const lines = (sale.lines || [])
		.map(
			(l) =>
				`${l.qty} x ${l.name}${(l.modifiers || []).length ? " (" + l.modifiers.map((m) => m.optionName).join(", ") + ")" : ""} — ${money(l.price * l.qty)}`,
		)
		.join("\n");
	const address = settings.address ? "\n" + settings.address : "";
	return `${settings.business || DEFAULT_BUSINESS_NAME}${address}\nReceipt: ${sale.receipt}\nCustomer: ${customer?.name || "Walk-in Customer"}\n\n${lines}\n\nTotal: ${money(sale.total)}\nPayment: ${sale.payment}\n${settings.receiptFooter || DEFAULT_RECEIPT_FOOTER}`;
}

// ---- 48 column ESC/POS text ------------------------------------------------
const padRight = (v, w) => {
	v = String(v == null ? "" : v);
	return v.length > w ? v.slice(0, w) : v + " ".repeat(w - v.length);
};
const padLeft = (v, w) => {
	v = String(v == null ? "" : v);
	return v.length > w ? v.slice(0, w) : " ".repeat(w - v.length) + v;
};

export function receiptText(sale, { settings = {}, location = null } = {}) {
	const width = 48;
	const rule = "-".repeat(width);
	const lines = [];
	lines.push(settings.business || DEFAULT_BUSINESS_NAME);
	if (location) lines.push(location.name);
	if (location && location.address) lines.push(location.address);
	else if (settings.address) lines.push(settings.address);
	lines.push(rule);
	lines.push((sale.receipt || "RECEIPT") + "  " + receiptDate(sale));
	lines.push(rule);
	(sale.lines || []).forEach((line) => {
		lines.push(padRight(line.qty + " x " + line.name, 32) + padLeft(money(line.price * line.qty).replace("LKR ", ""), 16));
		if (line.description) lines.push("  " + line.description);
		(line.modifiers || []).forEach((m) => lines.push("  " + m.groupName + ": " + m.optionName));
	});
	lines.push(rule);
	lines.push(padRight("TOTAL", 28) + padLeft(money(sale.total), 20));
	lines.push("Paid by " + (sale.payment || "Cash"));
	lines.push(rule);
	lines.push((location && location.receiptFooter) || settings.receiptFooter || DEFAULT_RECEIPT_FOOTER);
	lines.push(...receiptSocialLines(settings));
	lines.push("Powered by Ceylonry POS");
	return lines.join("\n") + "\n\n\n";
}
