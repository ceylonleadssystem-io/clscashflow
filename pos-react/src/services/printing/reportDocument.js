/**
 * Printable business report (pure): one A4 document with a title, the KPI figures and one table per report section.
 * Sent through the browser print dialog, where "Save as PDF" produces the PDF file (the document <title> becomes the
 * suggested file name). Sections are plain data so any report can reuse it: { title, note?, head: [...], rows: [[...]] }.
 */
import { esc } from "../../domain/format";

const CSS = `@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#1f1a14;font:12px/1.45 Arial,Helvetica,sans-serif}
h1{margin:0;font-size:22px}h2{margin:22px 0 6px;font-size:14px;border-bottom:2px solid #171512;padding-bottom:4px;break-after:avoid}
.sub{color:#6f6258;margin:2px 0 14px}.kpis{display:flex;gap:10px;margin:8px 0 4px}.kpi{flex:1;border:1px solid #d8cdbb;border-radius:6px;padding:8px 10px}
.kpi span{display:block;color:#6f6258;font-size:10px;text-transform:uppercase;letter-spacing:.5px}.kpi strong{font-size:16px}
table{width:100%;border-collapse:collapse;margin-top:4px}th,td{padding:5px 6px;border-bottom:1px solid #e6dccb;text-align:left;vertical-align:top}
th{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6f6258;background:#f7f2ea}tr{break-inside:avoid}
td.n,th.n{text-align:right;white-space:nowrap}.note{color:#6f6258;font-style:italic;padding:6px 0}.foot{margin-top:18px;color:#8b7c6f;font-size:10px}`;

// right-align cells that look like numbers or money ("12", "LKR 1,500.00", "-3.5", "42.0%")
const isNum = (v) => typeof v === "number" || /^-?(LKR\s?)?[\d,]+(\.\d+)?%?$/.test(String(v).trim());

/** Complete HTML document of the report. */
export function reportHtml({ title, business = "", subtitle = "", kpis = [], sections = [], generated = new Date() }) {
	const kpiHtml = kpis.length ? `<div class="kpis">${kpis.map((k) => `<div class="kpi"><span>${esc(k.label)}</span><strong>${esc(k.value)}</strong></div>`).join("")}</div>` : "";
	const sectionHtml = sections
		.map((s) => {
			const body = s.rows.length
				? `<table><thead><tr>${s.head.map((h, i) => `<th${s.rows.every((r) => isNum(r[i])) ? ' class="n"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${s.rows
						.map((r) => `<tr>${r.map((c, i) => `<td${s.rows.every((x) => isNum(x[i])) ? ' class="n"' : ""}>${esc(c)}</td>`).join("")}</tr>`)
						.join("")}</tbody></table>`
				: `<div class="note">${esc(s.empty || "Nothing to show for this period.")}</div>`;
			return `<h2>${esc(s.title)}</h2>${s.note ? `<div class="sub">${esc(s.note)}</div>` : ""}${body}`;
		})
		.join("");
	return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body><h1>${esc(title)}</h1><div class="sub">${esc(
		[business, subtitle].filter(Boolean).join(" · "),
	)}</div>${kpiHtml}${sectionHtml}<div class="foot">Generated ${esc(generated.toLocaleString())}</div></body></html>`;
}
