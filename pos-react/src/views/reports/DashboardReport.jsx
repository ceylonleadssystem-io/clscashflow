/**
 * Reports › Dashboard: today's key numbers in collapsible widgets. Each widget uses the same builders as the full reports
 * (so the figures always match) and has a "View full report" link that opens that report.
 */
import { useState } from "react";
import { buildReport, metricCards } from "../../domain/reportBuilders";
import { formatCard, formatCell } from "../../domain/reportFormat";
import { today } from "../../domain/format";
import { useReportContext } from "../../hooks/useReportContext";
import { useReportGroups } from "../../hooks/useReportGroups";
import { usePos } from "../../store/PosProvider";

const WIDGETS = [
	{ title: "Sales Category Sales", group: "menu", sub: "sales-category", keys: ["name", "qty", "net"] },
	{ title: "Order Type Sales", group: "sales", sub: "order-type", keys: ["name", "qty", "net"] },
	{ title: "Payments", group: "sales", sub: "payment-type", keys: ["name", "qty", "total"] },
	{ title: "Register Sales", group: "sales", sub: "register", keys: ["name", "qty", "net"] },
	{ title: "Employee Sales", group: "sales", sub: "employee", keys: ["name", "qty", "net"] },
	{ title: "Sales vs Labor", group: "sales-vs-labor", sub: "", keys: ["date", "net", "hours"] },
	{ title: "Cash Log", group: "transactions", sub: "cash-log", keys: ["type", "employee", "amount"] },
	{ title: "Tips & Cash", group: "payroll", sub: "tips-cash", keys: ["name", "cash", "service"] },
	{ title: "Gift Card Sales", group: "gift-cards", sub: "transactions", keys: ["type", "amount"] },
	{ title: "Best-selling products", group: "menu", sub: "product-mix", keys: ["name", "qty", "net"] },
];

function Widget({ w, ctx, visible, open }) {
	const report = buildReport(w.group, w.sub, ctx);
	const cols = w.keys.map((k) => report.cols.find((c) => c.key === k)).filter(Boolean);
	return (
		<details className="panel dash-widget" open>
			<summary>
				<span className="panel-title">{w.title}</span>
			</summary>
			{report.rows.length ? (
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								{cols.map((c) => (
									<th key={c.key} className={["money", "num", "pct", "hours"].includes(c.type) ? "n" : ""}>{c.label}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{report.rows.slice(0, 5).map((r, i) => (
								<tr key={i}>
									{cols.map((c) => (
										<td key={c.key} className={["money", "num", "pct", "hours"].includes(c.type) ? "n" : ""}>{formatCell(c.type, r[c.key])}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="empty">{report.note || "No data today."}</div>
			)}
			{visible && (
				<button type="button" className="btn out dash-widget-link" onClick={() => open(w.group, w.sub)}>
					View full report
				</button>
			)}
		</details>
	);
}

export function DashboardReport() {
	const { setReportNav } = usePos();
	const groups = useReportGroups();
	const [day, setDay] = useState(today);
	const ctx = useReportContext({ from: day, to: day }, [], "");
	const cards = metricCards(ctx.sales.filter((s) => (s.status || "completed") !== "voided" && s.date === day)).filter((c) => ["Item Sales", "Discounts & Comps", "Refunds", "Net Sales", "Tax", "Tips", "Total Sales", "Total Order Count"].includes(c.label));
	const can = (group) => groups.some((g) => g.key === group);
	const open = (group, sub) => setReportNav({ group, sub });
	return (
		<section className="view active report-page" id="view-reports" data-report="dashboard">
			<div className="dashboard-toolbar">
				<div>
					<div className="panel-title">Dashboard</div>
					<div className="muted">The day's key numbers, matching the close-cash totals</div>
				</div>
				<div className="range-fields">
					<div className="field">
						<label htmlFor="report-day">Day</label>
						<input className="input" type="date" id="report-day" max={today()} value={day} onChange={(e) => setDay(e.target.value || today())} />
					</div>
				</div>
			</div>
			<details className="panel dash-widget" open>
				<summary>
					<span className="panel-title">Sales Summary</span>
				</summary>
				<div className="grid4 report-cards">
					{cards.map((c) => (
						<div className="card" key={c.label} title={c.tip || undefined}>
							<div className="label">{c.label}</div>
							<div className={"value" + (c.tone === "neg" && c.value < 0 ? " negative" : "")}>{formatCard(c)}</div>
						</div>
					))}
				</div>
				<button type="button" className="btn out dash-widget-link" onClick={() => open("sales", "overview")}>
					View full report
				</button>
			</details>
			<div className="dashboard-two">
				{WIDGETS.filter((w) => can(w.group) || w.group === "gift-cards" || w.group === "sales-vs-labor").map((w) => (
					<Widget key={w.title} w={w} ctx={ctx} visible={can(w.group)} open={open} />
				))}
			</div>
		</section>
	);
}
