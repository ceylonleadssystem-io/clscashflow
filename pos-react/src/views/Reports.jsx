/**
 * Reports page: date-range KPIs, sales by item and payment type, cash register reconciliation, staff hours,
 * customer intelligence and CSV export.
 */
import { useMemo, useState } from "react";
import { closedShiftsInRange, customerReport, defaultRange, rangeDates, reportData, reportKpis, staffHours, birthdayInfo, customerSegment, customerInsights } from "../domain/analytics";
import { downloadCsv, money } from "../domain/format";
import { Kpi } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useScopedData } from "../hooks/useScopedData";
import { createLogger } from "../utils/logger";

const log = createLogger("ui");

/** Business reports: items, payments, register reconciliation, staff hours, customers. */
export function Reports() {
	const data = useData();
	const { sales, cashShifts, timeEntries } = useScopedData();
	const exportOn = useFeature("reports.export");
	const intelligence = useFeature("reports.customerIntelligence");
	const [range, setRange] = useState(defaultRange);
	const d = useMemo(() => reportData(sales, range), [sales, range]);
	const k = reportKpis(d);
	const max = Math.max(1, ...Object.values(k.payments));
	const shifts = closedShiftsInRange(cashShifts, range);
	const hours = staffHours(timeEntries, data.users, range);
	const cr = useMemo(() => customerReport(data.customers, sales, range), [data.customers, sales, range]);

	const exportReport = () => {
		log.info("report exported", { from: range.from, to: range.to, items: d.items.length });
		return downloadCsv(
			[
				["POS REPORT", range.from + " to " + range.to],
				[],
				["ITEM", "UNITS", "REVENUE", "COST", "GROSS PROFIT"],
				...d.items.map((x) => [x.name, x.qty, x.revenue, x.cost, x.revenue - x.cost]),
				[],
				["MODIFIER GROUP", "MODIFIER OPTION", "UNITS SOLD", "SALES OF THESE ITEMS", "EXTRA CHARGED"],
				...d.modifiers.map((x) => [x.group, x.option, x.qty, x.revenue, x.extra]),
			],
			`pos-report-${range.from}-${range.to}.csv`,
		);
	};

	return (
		<section className="view active" id="view-reports">
			<div className="dashboard-toolbar">
				<div>
					<div className="panel-title">Business Reports</div>
					<div className="muted">Financial and operational reporting for owners and accountants</div>
				</div>
				<div className="range-fields">
					<div className="field">
						<label>From</label>
						<input className="input" type="date" id="report-from" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
					</div>
					<div className="field">
						<label>To</label>
						<input className="input" type="date" id="report-to" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
					</div>
					<button className="btn out" onClick={() => setRange(rangeDates("today"))}>
						Today
					</button>
					<button className="btn out" onClick={() => setRange(rangeDates("month"))}>
						This Month
					</button>
					{exportOn && (
						<button className="btn" onClick={exportReport}>
							Export Report
						</button>
					)}
				</div>
			</div>
			<div className="grid4" id="report-kpis">
				<Kpi label="Transactions" value={d.sales.length} />
				<Kpi label="Revenue" value={money(k.revenue)} />
				<Kpi label="Gross Profit" value={money(k.profit)} tone="positive" />
				<Kpi label="Gross Margin" value={k.margin.toFixed(1) + "%"} />
			</div>
			<div className="dashboard-two">
				<div className="panel">
					<div className="panel-head">
						<div className="panel-title">Sales by Item</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Item</th>
									<th>Units</th>
									<th>Revenue</th>
									<th>Cost</th>
									<th>Gross Profit</th>
								</tr>
							</thead>
							<tbody id="report-items">
								{d.items.map((x) => (
									<tr key={x.name}>
										<td>
											<strong>{x.name}</strong>
										</td>
										<td>{x.qty}</td>
										<td>{money(x.revenue)}</td>
										<td>{money(x.cost)}</td>
										<td className="positive">{money(x.revenue - x.cost)}</td>
									</tr>
								))}
								{!d.items.length && (
									<tr>
										<td colSpan="5">No item sales in this period.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
				<div className="panel" id="report-modifiers-panel">
					<div className="panel-head">
						<div className="panel-title">Sales by Modifier</div>
						<div className="muted">Sizes, add-ons and other options sold in this period</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Group</th>
									<th>Option</th>
									<th>Units</th>
									<th>Sales</th>
									<th>Extra charged</th>
								</tr>
							</thead>
							<tbody id="report-modifiers">
								{d.modifiers.map((x) => (
									<tr key={x.group + "|" + x.option}>
										<td>{x.group}</td>
										<td>
											<strong>{x.option}</strong>
										</td>
										<td>{x.qty}</td>
										<td>{money(x.revenue)}</td>
										<td>{money(x.extra)}</td>
									</tr>
								))}
								{!d.modifiers.length && (
									<tr>
										<td colSpan="5">No modifier sales in this period.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
				<div className="panel">
					<div className="panel-head">
						<div className="panel-title">Sales by Payment Type</div>
					</div>
					<div className="payment-bars" id="report-payments">
						{Object.entries(k.payments)
							.sort((a, b) => b[1] - a[1])
							.map(([name, value]) => (
								<div className="payment-bar-row" key={name}>
									<span>{name}</span>
									<div className="payment-bar">
										<span style={{ width: (value / max) * 100 + "%" }} />
									</div>
									<strong>{money(value)}</strong>
								</div>
							))}
						{!Object.keys(k.payments).length && <div className="empty">No payments in this period.</div>}
					</div>
				</div>
			</div>
			<div className="dashboard-two">
				<div className="panel">
					<div className="panel-head">
						<div className="panel-title">Cash Register Reconciliation</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>User</th>
									<th>Closed</th>
									<th>Expected</th>
									<th>Actual</th>
									<th>Variance</th>
								</tr>
							</thead>
							<tbody id="report-registers">
								{shifts.map((s) => (
									<tr key={s.id}>
										<td>{data.users.find((u) => u.id === s.userId)?.name || "Unknown"}</td>
										<td>{new Date(s.closedAt).toLocaleString()}</td>
										<td>{money(s.expectedCash)}</td>
										<td>{money(s.actualCash)}</td>
										<td className={s.variance >= 0 ? "cash-positive" : "cash-negative"}>{money(s.variance)}</td>
									</tr>
								))}
								{!shifts.length && (
									<tr>
										<td colSpan="5">No closed registers in this period.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
				<div className="panel">
					<div className="panel-head">
						<div className="panel-title">Staff Hours</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Staff</th>
									<th>Hours</th>
									<th>Break</th>
								</tr>
							</thead>
							<tbody id="report-hours">
								{hours.map((x) => (
									<tr key={x.name}>
										<td>{x.name}</td>
										<td>{(x.work / 3600000).toFixed(2)}</td>
										<td>{(x.break / 3600000).toFixed(2)}</td>
									</tr>
								))}
								{!hours.length && (
									<tr>
										<td colSpan="3">No staff hours in this period.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
			{intelligence && (
				<div className="panel" id="report-customers-panel" style={{ marginTop: 16 }}>
					<div className="panel-head">
						<div>
							<div className="panel-title">Customer Intelligence</div>
							<div className="muted">Visits, revenue, average spend and upcoming birthdays</div>
						</div>
					</div>
					<div className="grid4" id="report-customer-kpis" style={{ padding: 16 }}>
						<div className="cashflow-metric">
							<span>Customers Served</span>
							<strong>{cr.unique}</strong>
						</div>
						<div className="cashflow-metric">
							<span>Repeat Customers</span>
							<strong>{cr.repeat}</strong>
						</div>
						<div className="cashflow-metric">
							<span>Average Customer Sale</span>
							<strong>{money(cr.avg)}</strong>
						</div>
						<div className="cashflow-metric">
							<span>Upcoming Birthdays</span>
							<strong>{cr.birthdays}</strong>
						</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Customer</th>
									<th>Mobile</th>
									<th>Visits</th>
									<th>Revenue</th>
									<th>Average Spend</th>
									<th>Last Visit</th>
									<th>Birthday</th>
								</tr>
							</thead>
							<tbody id="report-customers">
								{cr.rows.map((x) => {
									const b = birthdayInfo(x.c);
									return (
										<tr key={x.c.id}>
											<td>
												<strong>{x.c.name}</strong>
												<br />
												<span className="muted">{customerSegment(customerInsights(x.c, data.sales))}</span>
											</td>
											<td>{x.c.phone || "—"}</td>
											<td>{x.visits}</td>
											<td>{money(x.revenue)}</td>
											<td>{money(x.revenue / x.visits)}</td>
											<td>{x.last}</td>
											<td>
												{b.label}
												{b.upcoming ? " · " + b.days + " days" : ""}
											</td>
										</tr>
									);
								})}
								{!cr.rows.length && (
									<tr>
										<td colSpan="7">No customer-linked sales in this period.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</section>
	);
}
