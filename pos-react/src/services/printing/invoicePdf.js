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
	// the detailers' contact details come from the job's location (Settings > Locations), then the first location that has a phone
	const places = (data.locations || []).filter((l) => l.active !== false);
	const place = places.find((l) => l.id === job.locationId && l.phone) || places.find((l) => l.phone) || places.find((l) => l.id === job.locationId) || {};
	return {
		number: job.invoiceNumber,
		date: job.invoicedAt || job.completedAt || job.scheduledAt,
		business: { name: s.business || "", logo: s.logo || "", address: place.address || s.address || "", phone: place.phone || s.phone || "" }, // no e-mail address on the invoice (client request)
		customer: { name: customer.name || "Customer", phone: customer.phone || "", email: customer.email || "" },
		vehicle: v ? `${v.registration} ${[v.year, v.make, v.model, v.colour].filter(Boolean).join(" ")}`.trim() : "",
		technicians: jobTechs(job).map((id) => data.users.find((u) => u.id === id)).filter(Boolean).map((u) => ({ name: u.name, phone: u.phone || "" })),
		package: job.packageName,
		price: Number(job.price) || 0,
		discount: Number(job.discount) || 0,
		total: jobTotal(job),
		paid: jobPaid(job),
		balance: Math.max(0, jobTotal(job) - jobPaid(job)),
		payments: (job.payments || []).map((p) => ({ method: p.method, amount: Number(p.amount) || 0, at: p.at })),
		footer: "Thank you for choosing us!",
	};
}

/** The business logo as a PNG data URL with its size, or null when it cannot be read (no logo, offline, blocked image). */
async function loadLogo(src) {
	if (!src || typeof document === "undefined") return null;
	try {
		let url = src;
		if (!/^data:/.test(src)) url = await remoteAsDataUrl(src);
		const img = await new Promise((ok, fail) => {
			const i = new Image();
			i.onload = () => ok(i);
			i.onerror = fail;
			i.src = url;
		});
		const c = document.createElement("canvas"); // redrawn as PNG so WebP logos work too
		c.width = img.naturalWidth;
		c.height = img.naturalHeight;
		c.getContext("2d").drawImage(img, 0, 0);
		return { data: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
	} catch (e) {
		console.warn("Invoice logo could not be loaded; the invoice is made without it.", e);
		return null;
	}
}

/**
 * Downloads a cloud-stored picture as a data URL. The sidebar has usually shown the same file already, and the browser then answers a
 * CORS request from its cached copy of that plain image load, which has no CORS headers and fails. So the first try skips the cache; if that
 * still fails, the picture is asked for again under a new address.
 */
async function remoteAsDataUrl(src) {
	const read = (blob) =>
		new Promise((ok, fail) => {
			const fr = new FileReader();
			fr.onload = () => ok(fr.result);
			fr.onerror = fail;
			fr.readAsDataURL(blob);
		});
	let last;
	for (const [url, init] of [[src, { mode: "cors", cache: "reload" }], [src + (src.includes("?") ? "&" : "?") + "invoice=" + Date.now(), { mode: "cors", cache: "no-store" }]]) {
		try {
			const res = await fetch(url, init);
			if (res.ok) return await read(await res.blob());
			last = new Error("Logo download failed (" + res.status + ")");
		} catch (e) {
			last = e;
		}
	}
	throw last;
}

/** Draws the invoice and returns the jsPDF document. */
export async function buildInvoicePdf(m) {
	const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
	const doc = new jsPDF({ unit: "mm", format: "a4" });
	const M = 16;
	const width = doc.internal.pageSize.getWidth();
	let y = M;
	// header: the business logo at the top left, INVOICE and its number at the right
	const logo = await loadLogo(m.business.logo);
	if (logo) {
		const scale = Math.min(55 / logo.w, 22 / logo.h);
		doc.addImage(logo.data, "PNG", M, y, logo.w * scale, logo.h * scale);
		y += logo.h * scale + 4;
	} else y += 4;
	doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(31, 26, 20).text("INVOICE", width - M, M + 6, { align: "right" });
	doc.setFontSize(11).text(plain(m.number), width - M, M + 13, { align: "right" });
	doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(111, 98, 88).text(plain(new Date(m.date).toLocaleDateString()), width - M, M + 18, { align: "right" });
	[m.business.name, m.business.address].filter(Boolean).forEach((t, i) => {
		doc.setFont("helvetica", i ? "normal" : "bold").setFontSize(10).setTextColor(31, 26, 20).text(plain(t), M, y + i * 4.5);
	});
	y += 18;
	doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(111, 98, 88).text("BILL TO", M, y);
	y += 5;
	doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(31, 26, 20);
	[m.customer.name, m.customer.phone, m.customer.email, m.vehicle && "Vehicle: " + m.vehicle, m.technicians.length && "Technicians: " + m.technicians.map((t) => t.name).join(", ")].filter(Boolean).forEach((t, i) => doc.text(plain(t), M, y + i * 5));
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
	// footer: thank-you message, then how to reach the detailers
	const bottom = doc.internal.pageSize.getHeight() - M;
	// the technicians who did the work, each with a phone number, then the business phone and address
	const contact = [...m.technicians.map((t) => (t.phone ? `${t.name}: ${t.phone}` : t.name)), m.business.phone && "Call us: " + m.business.phone, m.business.address].filter(Boolean);
	doc.setDrawColor(216, 205, 187).setLineWidth(0.3).line(M, bottom - 6 - contact.length * 4.5, width - M, bottom - 6 - contact.length * 4.5);
	doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(31, 26, 20).text(plain(m.footer), width / 2, bottom - contact.length * 4.5, { align: "center" });
	doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(111, 98, 88);
	contact.forEach((t, i) => doc.text(plain(t), width / 2, bottom - (contact.length - 1 - i) * 4.5 + 0, { align: "center" }));
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
