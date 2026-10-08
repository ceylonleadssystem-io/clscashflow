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
	"@page{size:80mm auto;margin:4mm}*{box-sizing:border-box}body{width:72mm;margin:0;color:#000}.rc{font:9.4px/1.45 'Courier New',Courier,monospace;padding:0 1ch}.ln{white-space:pre;min-height:1.45em}.ln.center{text-align:center}.logo{display:block;width:34mm;height:34mm;max-width:34mm;max-height:34mm;object-fit:contain;margin:0 auto 6px}.social-qr{display:block;width:42mm;height:42mm;object-fit:contain;margin:8px auto 4px}";

/** Final receipt HTML: the same lines as the thermal receipt (see receiptLayout), in a monospace 80 mm page. */
export function receiptHtml(sale, { settings = {}, location = null, autoPrint = true } = {}) {
	const { main, powered } = receiptLayout(sale, { settings, location });
	const line = (seg) => `<div class="ln ${seg.align}">${esc(seg.text)}</div>`;
	const logo = settings.logo ? `<img class="logo" src="${esc(settings.logo)}" alt="Business logo">` : "";
	const qr = settings.receiptSocialQr ? `<img class="social-qr" src="${esc(settings.receiptSocialQr)}" alt="Social QR code">` : "";
	return `<!doctype html><html><head><title>${esc(sale.receipt)}</title><style>${RECEIPT_CSS}</style></head><body>${logo}<div class="rc">${main
		.map(line)
		.join("")}${qr}${powered.map(line).join("")}</div>${autoPrint ? "<script>onload=()=>print()</script>" : ""}</body></html>`;
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

/** 46 columns of text: with the one-column gap each side added when printing, that fills the 48-column paper. */
const RECEIPT_WIDTH = 46;

/** Word-wraps `text` into lines of at most `width` characters (long words are cut). */
function wrapLine(text, width) {
	const out = [];
	for (const raw of String(text ?? "").split("\n")) {
		let cur = "";
		for (const word of raw.split(/\s+/).filter(Boolean)) {
			const w = word.length > width ? word.slice(0, width) : word;
			if (!cur) cur = w;
			else if ((cur + " " + w).length <= width) cur += " " + w;
			else {
				out.push(cur);
				cur = w;
			}
		}
		out.push(cur);
	}
	return out;
}

/** Like wrapLine, but a paragraph that needs several lines is split into lines of similar length (no lone last word). */
function wrapBalanced(text, width) {
	return String(text ?? "")
		.split("\n")
		.flatMap((para) => {
			const len = para.trim().length;
			const lines = Math.max(1, Math.ceil(len / width));
			return lines === 1 ? wrapLine(para, width) : wrapLine(para, Math.min(width, Math.ceil(len / lines) + 4));
		});
}

/**
 * The receipt as aligned 48-column lines, shared by the thermal (ESC/POS) printout and the HTML receipt so both look the
 * same: business, location, rule, receipt number and date, items, total, payment, footer and socials (centred). The
 * QR code goes between `main` and `powered`; "Powered by Ceylonry POS" is always the last line.
 * Returns { main, powered }, each a list of { align: "left" | "center", text }.
 */
export function receiptLayout(sale, { settings = {}, location = null } = {}) {
	const width = RECEIPT_WIDTH;
	const rule = "-".repeat(width);
	const left = (text) => ({ align: "left", text });
	const center = (text) => ({ align: "center", text });
	const main = [];
	main.push(left(settings.business || DEFAULT_BUSINESS_NAME));
	if (location) main.push(left(location.name));
	if (location && location.address) main.push(left(location.address));
	else if (settings.address) main.push(left(settings.address));
	main.push(left(rule));
	main.push(left((sale.receipt || "RECEIPT") + "  " + receiptDate(sale)));
	main.push(left(rule));
	(sale.lines || []).forEach((line) => {
		const [first, ...rest] = wrapLine(line.qty + " x " + line.name, 29);
		main.push(left(padRight(first, 30) + padLeft(money(line.price * line.qty).replace("LKR ", ""), 16)));
		rest.forEach((r) => main.push(left("  " + r)));
		if (line.description) wrapLine(line.description, width - 2).forEach((r) => main.push(left("  " + r)));
		(line.modifiers || []).forEach((m) => main.push(left("  " + m.groupName + ": " + m.optionName)));
	});
	main.push(left(rule));
	main.push(left(padRight("TOTAL", 26) + padLeft(money(sale.total), 20)));
	main.push(left("Paid by " + (sale.payment || "Cash")));
	if (sale.cashTendered != null) {
		main.push(left(padRight("Cash received", 26) + padLeft(money(sale.cashTendered), 20)));
		main.push(left(padRight("Change", 26) + padLeft(money(sale.changeGiven || 0), 20)));
	}
	main.push(left(rule));
	wrapBalanced((location && location.receiptFooter) || settings.receiptFooter || DEFAULT_RECEIPT_FOOTER, width).forEach((l) => main.push(center(l)));
	receiptSocialLines(settings).forEach((l) => wrapLine(l, width).forEach((x) => main.push(center(x))));
	return { main, powered: [center("Powered by Ceylonry POS")] };
}

/** Plain-text version of receiptLayout (no QR, no alignment). */
export function receiptText(sale, ctx = {}) {
	const { main, powered } = receiptLayout(sale, ctx);
	return [...main, ...powered].map((l) => l.text).join("\n") + "\n\n\n";
}
