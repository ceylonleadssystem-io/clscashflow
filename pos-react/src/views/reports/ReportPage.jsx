/**
 * One report: title, date range, filters (chips), download / print / info / graph actions, summary cards, an optional bar
 * chart and a sortable data table with a totals row. The report itself comes from domain/reportBuilders.js.
 */
import { useMemo, useState } from "react";
import { buildReport } from "../../domain/reportBuilders";
import { formatCard, formatCell, reportCsv, reportDocument, sortRows } from "../../domain/reportFormat";
import { groupOf, subOf } from "../../domain/reportsCatalog";
import { downloadCsv, localDateValue, today } from "../../domain/format";
import { useReportContext } from "../../hooks/useReportContext";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { printHtmlInFrame } from "../../services/printing/printDocument";
import { reportHtml } from "../../services/printing/reportDocument";
import { downloadReportPdf, pdfSupportsText } from "../../services/printing/reportPdf";
import { createLogger } from "../../utils/logger";

const log = createLogger("ui");

const startOfWeek = (d) => {
	const x = new Date(d);
	x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
	return x;
};
const PRESETS = [
	["today", "Today", (n) => [n, n]],
	["week", "This Week", (n) => [startOfWeek(n), n]],
	["month", "This Month", (n) => [new Date(n.getFullYear(), n.getMonth(), 1), n]],
	["lastMonth", "Last Month", (n) => [new Date(n.getFullYear(), n.getMonth() - 1, 1), new Date(n.getFullYear(), n.getMonth(), 0)]],
	["lastYear", "Last Year", (n) => [new Date(n.getFullYear() - 1, 0, 1), new Date(n.getFullYear() - 1, 11, 31)]],
];
export const presetRange = (key, now = new Date()) => {
	const [, , fn] = PRESETS.find((p) => p[0] === key) || PRESETS[0];
	const [a, b] = fn(now);
	return { from: localDateValue(a), to: localDateValue(b) };
};

const FILTER_TYPES = [
	["employee", "Employee"],
	["orderType", "Order Type"],
	["payment", "Payment Type"],
];

/** Filter value choices from the data itself, so the lists only hold what exists. */
function useFilterOptions() {
	const data = useData();
	return useMemo(
		() => ({
			employee: data.users.map((u) => ({ value: u.id, label: u.name })),
			orderType: [...new Set(data.sales.map((s) => s.orderChannel || "Retail"))].sort().map((v) => ({ value: v, label: v })),
			payment: [...new Set(data.sales.map((s) => s.payment).filter(Boolean))].sort().map((v) => ({ value: v, label: v })),
		}),
		[data.users, data.sales],
	);
}

export function ReportChart({ rows, chart, cols }) {
	const col = cols.find((c) => c.key === chart.value);
	const top = [...rows].sort((a, b) => Math.abs(+b[chart.value] || 0) - Math.abs(+a[chart.value] || 0)).slice(0, 10);
	const max = Math.max(1, ...top.map((r) => Math.abs(+r[chart.value] || 0)));
	return (
		<div className="payment-bars report-chart" role="img" aria-label={"Chart of " + (col?.label || "values")}>
			{top.map((r, i) => (
				<div className="payment-bar-row" key={i}>
					<span>{String(r[chart.label])}</span>
					<div className="payment-bar">
						<span style={{ width: (Math.abs(+r[chart.value] || 0) / max) * 100 + "%" }} />
					</div>
					<strong>{formatCell(col?.type, r[chart.value])}</strong>
				</div>
			))}
		</div>
	);
}

export function ReportPage({ group, sub }) {
	const data = useData();
	const exportOn = useFeature("reports.export");
	const g = groupOf(group);
	const s = subOf(group, sub);
	const title = g.title + (s ? " › " + s.title : "");
	const [range, setRange] = useState(() => presetRange("today"));
	const [filters, setFilters] = useState([]);
	const [pick, setPick] = useState({ type: "employee", value: "" });
	const [sort, setSort] = useState(null);
	const [graph, setGraph] = useState(true);
	const [info, setInfo] = useState(false);
	const [extra, setExtra] = useState("");
	const options = useFilterOptions();
	const ctx = useReportContext(range, filters, extra);
	const report = useMemo(() => buildReport(group, sub, ctx), [group, sub, ctx]);
	const sortCol = report.cols.find((c) => c.key === sort?.key);
	const rows = useMemo(() => sortRows(report.rows, sortCol, sort?.dir), [report.rows, sortCol, sort]);
	const subtitle = range.from === range.to ? range.from : range.from + " to " + range.to;
	const doc = () => reportDocument({ title, business: data.settings.business || "", subtitle, report, rows });

	const addFilter = () => {
		if (!pick.value || filters.some((f) => f.type === pick.type && f.value === pick.value)) return;
		setFilters((list) => [...list, { ...pick, label: options[pick.type].find((o) => o.value === pick.value)?.label || pick.value }]);
		setPick((p) => ({ ...p, value: "" }));
	};
	const sortBy = (key) => setSort((cur) => (cur?.key === key ? (cur.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));
	const file = `${group}-${sub || "report"}-${range.from}-${range.to}`;

	const csv = () => {
		log.info("report csv", { group, sub });
		downloadCsv(reportCsv(title, subtitle, report, rows), file + ".csv");
	};
	const pdf = async (print) => {
		const d = doc();
		log.info("report document", { group, sub, print });
		if (!print && pdfSupportsText(d)) {
			try {
				return await downloadReportPdf(d, file + ".pdf");
			} catch (e) {
				log.error("pdf download failed, using the print dialog", e);
			}
		}
		printHtmlInFrame(reportHtml(d), title);
	};

	return (
		<section className="view active report-page" id="view-reports" data-report={group + (sub ? "/" + sub : "")}>
			<div className="dashboard-toolbar">
				<div>
					<div className="panel-title">{title}</div>
					<div className="muted">{g.blurb}</div>
				</div>
				<div className="range-fields">
					<div className="field">
						<label htmlFor="report-from">From</label>
						<input className="input" type="date" id="report-from" max={today()} value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value || r.from }))} />
					</div>
					<div className="field">
						<label htmlFor="report-to">To</label>
						<input className="input" type="date" id="report-to" max={today()} value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value || r.to }))} />
					</div>
					<div className="field">
						<label htmlFor="report-preset">Period</label>
						<select className="input" id="report-preset" value="" onChange={(e) => e.target.value && setRange(presetRange(e.target.value))}>
							<option value="">Choose…</option>
							{PRESETS.map(([key, label]) => (
								<option key={key} value={key}>
									{label}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<div className="report-actions" role="toolbar" aria-label="Report actions">
				{report.extra && (
					<div className="field">
						<label htmlFor="report-extra">{report.extra.label}</label>
						<select className="input" id="report-extra" value={report.extra.value} onChange={(e) => setExtra(e.target.value)}>
							{report.extra.options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</div>
				)}
				<div className="report-filter">
					<div className="field">
						<label htmlFor="report-filter-type">Filter</label>
						<select className="input" id="report-filter-type" value={pick.type} onChange={(e) => setPick({ type: e.target.value, value: "" })}>
							{FILTER_TYPES.map(([key, label]) => (
								<option key={key} value={key}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div className="field">
						<label htmlFor="report-filter-value" className="sr-only">
							Filter value
						</label>
						<select className="input" id="report-filter-value" value={pick.value} onChange={(e) => setPick((p) => ({ ...p, value: e.target.value }))}>
							<option value="">Choose…</option>
							{options[pick.type].map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</div>
					<button type="button" className="btn out" id="report-filter-add" disabled={!pick.value} onClick={addFilter}>
						Add filter
					</button>
				</div>
				<div className="report-buttons">
					{exportOn && (
						<>
							<button type="button" className="btn out" id="report-csv" onClick={csv} title="Download this report as a spreadsheet (CSV)">
								Download CSV
							</button>
							<button type="button" className="btn out" id="report-pdf" onClick={() => pdf(false)} title="Download this report as a PDF">
								PDF
							</button>
							<button type="button" className="btn out" id="report-print" onClick={() => pdf(true)}>
								Print
							</button>
						</>
					)}
					<button type="button" className={"btn out" + (info ? " active" : "")} id="report-info" aria-pressed={info} onClick={() => setInfo((v) => !v)} title="What this report shows">
						Info
					</button>
					{report.chart && (
						<button type="button" className={"btn out" + (graph ? " active" : "")} id="report-graph" aria-pressed={graph} onClick={() => setGraph((v) => !v)} title="Show or hide the chart">
							Graph
						</button>
					)}
				</div>
			</div>

			{filters.length > 0 && (
				<div className="report-chips" id="report-chips">
					{filters.map((f) => (
						<span className="report-chip" key={f.type + f.value}>
							{FILTER_TYPES.find((t) => t[0] === f.type)[1]}: {f.label}
							<button type="button" aria-label={"Remove filter " + f.label} onClick={() => setFilters((list) => list.filter((x) => x !== f))}>
								×
							</button>
						</span>
					))}
					<button type="button" className="btn out" id="report-filter-reset" onClick={() => setFilters([])}>
						Reset
					</button>
				</div>
			)}

			{info && (
				<div className="panel report-info" id="report-info-panel">
					<div className="panel-title">About this report</div>
					<p className="muted">{g.blurb}</p>
					{report.note && <p>{report.note}</p>}
					{report.cards?.length > 0 && (
						<ul>
							{report.cards.filter((c) => c.tip).map((c) => (
								<li key={c.label}>
									<strong>{c.label}</strong>: {c.tip}
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{report.cards?.length > 0 && (
				<div className="grid4 report-cards" id="report-cards">
					{report.cards.map((c) => (
						<div className="card" key={c.label} title={c.tip || undefined}>
							<div className="label">{c.label}</div>
							<div className={"value" + (c.tone === "neg" && c.value < 0 ? " negative" : "")}>{formatCard(c)}</div>
						</div>
					))}
				</div>
			)}

			{report.note && <div className="report-note" id="report-note">{report.note}</div>}

			{report.chart && graph && rows.length > 0 && (
				<div className="panel">
					<ReportChart rows={rows} chart={report.chart} cols={report.cols} />
				</div>
			)}

			<div className="panel">
				<div className="table-wrap">
					<table className="report-table" id="report-table">
						<thead>
							<tr>
								{report.cols.map((c) => (
									<th key={c.key} className={["money", "num", "pct", "hours"].includes(c.type) ? "n" : ""} aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
										<button type="button" className="th-sort" onClick={() => sortBy(c.key)}>
											{c.label}
											<span aria-hidden="true">{sort?.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : " ↕"}</span>
										</button>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((r, i) => (
								<tr key={i}>
									{report.cols.map((c) => (
										<td key={c.key} className={(["money", "num", "pct", "hours"].includes(c.type) ? "n" : "") + (c.type === "money" && r[c.key] < 0 ? " negative" : "")}>
											{formatCell(c.type, r[c.key])}
										</td>
									))}
								</tr>
							))}
							{!rows.length && (
								<tr>
									<td colSpan={report.cols.length}>No data for this period.</td>
								</tr>
							)}
						</tbody>
						{rows.length > 0 && report.totals && (
							<tfoot>
								<tr>
									{report.cols.map((c, i) => (
										<td key={c.key} className={["money", "num", "pct", "hours"].includes(c.type) ? "n" : ""}>
											<strong>{i === 0 ? "Total" : c.key in report.totals ? formatCell(c.type, report.totals[c.key]) : ""}</strong>
										</td>
									))}
								</tr>
							</tfoot>
						)}
					</table>
				</div>
			</div>
		</section>
	);
}
