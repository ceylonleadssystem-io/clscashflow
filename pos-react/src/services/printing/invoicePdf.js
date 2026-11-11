/**
 * Detailing invoices as a PDF (jsPDF, loaded only when someone makes one), plus the helpers to share it: download, WhatsApp
 * (the PDF itself where the browser can share files, otherwise it is downloaded and the chat opens with a message) and an
 * order-style e-mail model for the existing EmailJS sender. The PDF uses the built-in Helvetica font (Latin text only).
 */
import { downloadBlob, money, whatsappPhone } from "../../domain/format";
import { jobPaid, jobTechs, jobTotal } from "../pos/detailing";

const PLAIN = { "—": "-", "–": "-", "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "•": "-" };
const plain = (v) => String(v ?? "").replace(/[—–‘’“”…•]/g, (c) => PLAIN[c]).replace(/[^\u0000-ÿ]/g, "?");

/** Everything the invoice shows, gathered from the job and the business data. */
export function invoiceModel(job, data) {
	const customer = data.customers.find((c) => c.id === job.customerId) || {};
	const v = data.vehicles.find((x) => x.id === job.vehicleId);
	const s = data.settings || {};
	return {
		number: job.invoiceNumber,
		date: job.invoicedAt || job.completedAt || job.scheduledAt,
		business: { name: s.business || "", address: s.address || "", email: s.email || "", phone: s.phone || "" },
		customer: { name: customer.name || "Customer", phone: customer.phone || "", email: customer.email || "" },
		vehicle: v ? `${v.registration} ${[v.year, v.make, v.model, v.colour].filter(Boolean).join(" ")}`.trim() : "",
		technicians: jobTechs(job).map((id) => data.users.find((u) => u.id === id)?.name).filter(Boolean),
		package: job.packageName,
		price: Number(job.price) || 0,
		discount: Number(job.discount) || 0,
		total: jobTotal(job),
		paid: jobPaid(job),
		balance: Math.max(0, jobTotal(job) - jobPaid(job)),
		payments: (job.payments || []).map((p) => ({ method: p.method, amount: Number(p.amount) || 0, at: p.at })),
		footer: s.receiptFooter || "Thank you for choosing us.",
	};
}

/** Draws the invoice and returns the jsPDF document. */
export async function buildInvoicePdf(m) {
	const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
	const doc = new jsPDF({ unit: "mm", format: "a4" });
	const M = 16;
	const width = doc.internal.pageSize.getWidth();
	let y = M + 4;
	doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(31, 26, 20).text("INVOICE", M, y);
	doc.setFontSize(11).text(plain(m.number), width - M, y, { align: "right" });
	y += 7;
	doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(111, 98, 88);
	doc.text(plain(new Date(m.date).toLocaleDateString()), width - M, y, { align: "right" });
	[m.business.name, m.business.address, m.business.email, m.business.phone].filter(Boolean).forEach((t, i) => {
		doc.setFont("helvetica", i ? "normal" : "bold").setTextColor(31, 26, 20).text(plain(t), M, y + i * 4.5);
	});
	y += 22;
	doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(111, 98, 88).text("BILL TO", M, y);
	y += 5;
	doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(31, 26, 20);
	[m.customer.name, m.customer.phone, m.customer.email, m.vehicle && "Vehicle: " + m.vehicle, m.technicians.length && "Technicians: " + m.technicians.join(", ")].filter(Boolean).forEach((t, i) => doc.text(plain(t), M, y + i * 5));
	y += 30;
	const rows = [[m.package, "1", money(m.price), money(m.price)]];
	if (m.discount) rows.push(["Discount", "", "", "-" + money(m.discount)]);
	autoTable(doc, { startY: y, margin: { left: M, right: M }, head: [["Service", "Qty", "Price", "Amount"]], body: rows.map((r) => r.map(plain)), theme: "striped", headStyles: { fillColor: [23, 21, 18] }, columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } } });
	y = doc.lastAutoTable.finalY + 8;
	const line = (label, value, bold) => {
		doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 12 : 10).setTextColor(31, 26, 20);
		doc.text(label, width - M - 55, y);
		doc.text(plain(value), width - M, y, { align: "right" });
		y += bold ? 7 : 5.5;
	};
	line("Total", money(m.total), true);
	line("Paid", money(m.paid));
	line("Balance due", money(m.balance), m.balance > 0);
	if (m.payments.length) {
		y += 4;
		autoTable(doc, { startY: y, margin: { left: M, right: M }, head: [["Payment", "Method", "Amount"]], body: m.payments.map((p) => [plain(new Date(p.at).toLocaleDateString()), plain(p.method), money(p.amount)]), theme: "grid", headStyles: { fillColor: [111, 98, 88] }, columnStyles: { 2: { halign: "right" } } });
		y = doc.lastAutoTable.finalY;
	}
	doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(111, 98, 88).text(plain(m.footer), M, doc.internal.pageSize.getHeight() - M);
	return doc;
}

const fileName = (m) => `${m.number}-invoice.pdf`;

/** Saves the invoice PDF to the device. */
export async function downloadInvoicePdf(m) {
	downloadBlob((await buildInvoicePdf(m)).output("blob"), fileName(m));
}

/** The text sent with the invoice on WhatsApp or e-mail. */
export const invoiceMessage = (m) => `Hello ${m.customer.name}, here is your invoice ${m.number} from ${m.business.name || "us"}. Total ${money(m.total)}, paid ${money(m.paid)}${m.balance > 0 ? `, balance ${money(m.balance)}` : ""}. ${m.footer}`;

/**
 * Shares the invoice PDF on WhatsApp. Browsers that can share files (most phones) send the PDF itself; otherwise the PDF is
 * downloaded and the customer's WhatsApp chat opens with the message, ready for the PDF to be attached.
 * Returns "shared", "chat" or "no-phone".
 */
export async function shareInvoiceWhatsApp(m) {
	const phone = whatsappPhone(m.customer.phone);
	if (!phone) return "no-phone";
	const blob = (await buildInvoicePdf(m)).output("blob");
	const file = new File([blob], fileName(m), { type: "application/pdf" });
	if (navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file], text: invoiceMessage(m) });
			return "shared";
		} catch (e) {
			if (e?.name === "AbortError") return "shared"; // the person closed the share sheet
		}
	}
	downloadBlob(blob, fileName(m));
	window.open(`https://wa.me/${phone}?text=${encodeURIComponent(invoiceMessage(m))}`, "_blank", "noopener");
	return "chat";
}

/** The invoice as a sale-shaped object so the existing order e-mail template and sender can be reused. */
export function invoiceEmailSale(m) {
	const lines = [{ name: m.package, qty: 1, price: m.price, cost: 0 }];
	return {
		receipt: m.number,
		orderNumber: m.number,
		createdAt: m.date,
		orderChannel: "Invoice",
		lines,
		discount: { amount: m.discount, subtotal: m.price },
		total: m.total,
		payment: [...new Set(m.payments.map((p) => p.method))].join(" · ") || "Not paid yet",
	};
}
export const invoiceEmailSubject = (m) => `Your invoice ${m.number} from ${m.business.name || "us"}`;
