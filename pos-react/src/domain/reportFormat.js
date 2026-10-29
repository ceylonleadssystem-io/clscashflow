/**
 * Report cell formatting and export (pure): turns the raw values of a built report into display text, CSV rows and the
 * { title, subtitle, kpis, sections } shape used by the print / PDF documents.
 */
import { money } from "./format";

export function formatCell(type, v) {
	if (v === null || v === undefined || v === "") return "—";
	if (type === "money") return money(v);
	if (type === "num") return Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (type === "pct") return Number(v).toFixed(1) + "%";
	if (type === "hours") return Number(v).toFixed(2);
	if (type === "time") return new Date(v).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
	return String(v);
}

export const formatCard = (c) => formatCell(c.type, c.value);

/** Rows sorted by a column (numbers numerically, text alphabetically). */
export function sortRows(rows, col, dir = "asc") {
	if (!col) return rows;
	const sign = dir === "desc" ? -1 : 1;
	const numeric = ["money", "num", "pct", "hours"].includes(col.type);
	return [...rows].sort((a, b) => sign * (numeric ? (+a[col.key] || 0) - (+b[col.key] || 0) : String(a[col.key] ?? "").localeCompare(String(b[col.key] ?? ""))));
}

const tableRows = (report, rows) => rows.map((r) => report.cols.map((c) => formatCell(c.type, r[c.key])));
const totalsLine = (report) => (report.totals ? [report.cols.map((c, i) => (i === 0 ? "Total" : c.key in report.totals ? formatCell(c.type, report.totals[c.key]) : ""))] : []);

/** CSV rows: title, period, the summary figures, then the table with a total row. */
export function reportCsv(title, subtitle, report, rows) {
	return [
		[title, subtitle],
		[],
		...(report.cards || []).map((c) => [c.label, formatCard(c)]),
		...(report.cards?.length ? [[]] : []),
		report.cols.map((c) => c.label),
		...tableRows(report, rows),
		...totalsLine(report),
	];
}

/** Printable / PDF document of one report. */
export function reportDocument({ title, business, subtitle, report, rows }) {
	return {
		title,
		business,
		subtitle,
		kpis: (report.cards || []).slice(0, 6).map((c) => ({ label: c.label, value: formatCard(c) })),
		sections: [
			{
				title,
				note: report.note || "",
				head: report.cols.map((c) => c.label),
				rows: [...tableRows(report, rows), ...totalsLine(report)],
				empty: "No data for this period.",
			},
		],
	};
}
