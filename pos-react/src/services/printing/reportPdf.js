/**
 * Direct PDF download of a report (same data model as reportDocument.js: title, kpis, sections of head + rows).
 * jsPDF and its table plugin are loaded on demand, so the POS bundle only grows when someone exports. The PDF uses
 * the built-in Helvetica font, which covers Latin text only: `pdfSupportsText` lets the caller fall back to the
 * print dialog (which handles every script) when the report contains other characters, e.g. Sinhala or Tamil names.
 */
import { downloadBlob } from "../../domain/format";

// punctuation Helvetica lacks, written with a plain equivalent instead
const PLAIN = { "—": "-", "–": "-", "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "•": "-", " ": " " };
const plain = (v) => String(v ?? "").replace(/[—–‘’“”…• ]/g, (c) => PLAIN[c]);

/** True when every character of the report can be drawn with the built-in PDF font. */
export function pdfSupportsText(report) {
	const texts = [report.title, report.business, report.subtitle, ...(report.kpis || []).flatMap((k) => [k.label, k.value]), ...(report.sections || []).flatMap((s) => [s.title, s.note, s.empty, ...s.head, ...s.rows.flat()])];
	return texts.every((t) => !/[^\u0000-ÿ]/.test(plain(t)));
}

/** Builds the report PDF and saves it as `filename`. */
export async function downloadReportPdf(report, filename) {
	const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
	const doc = buildReportPdf(new jsPDF({ unit: "mm", format: "a4" }), autoTable, report);
	downloadBlob(doc.output("blob"), filename);
}

/** Draws the report on a jsPDF document and returns it (split out so it can be tested without downloading). */
export function buildReportPdf(doc, autoTable, { title, business = "", subtitle = "", kpis = [], sections = [], generated = new Date() }) {
	const M = 14;
	const width = doc.internal.pageSize.getWidth();
	const room = (need) => {
		if (y + need > doc.internal.pageSize.getHeight() - M) {
			doc.addPage();
			y = M;
		}
	};
	let y = M + 6;
	doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(31, 26, 20).text(plain(title), M, y);
	y += 6;
	doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(111, 98, 88).text(plain([business, subtitle].filter(Boolean).join(" · ")), M, y);
	y += 7;
	if (kpis.length) {
		const gap = 3;
		const w = (width - 2 * M - gap * (kpis.length - 1)) / kpis.length;
		kpis.forEach((k, i) => {
			const x = M + i * (w + gap);
			doc.setDrawColor(216, 205, 187).roundedRect(x, y, w, 15, 1.5, 1.5);
			doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(111, 98, 88).text(plain(k.label).toUpperCase(), x + 2.5, y + 5);
			doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(31, 26, 20).text(plain(k.value), x + 2.5, y + 11.5);
		});
		y += 21;
	}
	for (const s of sections) {
		room(22);
		doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(31, 26, 20).text(plain(s.title), M, y);
		y += 1.5;
		doc.setDrawColor(23, 21, 18).setLineWidth(0.5).line(M, y, width - M, y);
		y += 5;
		if (s.note) {
			doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(111, 98, 88).text(plain(s.note), M, y);
			y += 5;
		}
		if (!s.rows.length) {
			doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(111, 98, 88).text(plain(s.empty || "Nothing to show for this period."), M, y);
			y += 9;
			continue;
		}
		const numeric = s.head.map((_, i) => s.rows.every((r) => /^-?(LKR\s?)?[\d,]+(\.\d+)?%?$/.test(String(r[i]).trim())));
		autoTable(doc, {
			startY: y,
			margin: { left: M, right: M },
			head: [s.head.map(plain)],
			body: s.rows.map((r) => r.map(plain)),
			theme: "plain",
			styles: { fontSize: 8.5, cellPadding: 1.8, textColor: [31, 26, 20], lineColor: [230, 220, 203], lineWidth: { bottom: 0.2 } },
			headStyles: { fillColor: [247, 242, 234], textColor: [111, 98, 88], fontSize: 7.5, fontStyle: "bold" },
			columnStyles: Object.fromEntries(numeric.map((n, i) => [i, { halign: n ? "right" : "left" }])),
			didParseCell: (d) => {
				if (d.section === "head" && numeric[d.column.index]) d.cell.styles.halign = "right";
			},
		});
		y = doc.lastAutoTable.finalY + 9;
	}
	room(8);
	doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(139, 124, 111).text("Generated " + generated.toLocaleString(), M, y);
	return doc;
}
