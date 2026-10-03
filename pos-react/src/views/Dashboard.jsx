/**
 * Dashboard page: date-range sales KPIs, best-selling items, payment mix, cashflow overview, recent sales and
 * the per-branch location status panel.
 */
import { useMemo, useState } from "react";
import { dashboardData, defaultRange, rangeDates } from "../domain/analytics";
import { money, today } from "../domain/format";
import { Kpi, Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { useScopedData } from "../hooks/useScopedData";
import { customerName } from "../domain/names";
import { REPORTING_ROLES, OWNER_ROLES } from "../config/roles";
import { useDeferredLocationOpen } from "../hooks/useLocationSwitcher";

export function Dashboard() {
	const data = useData();
	const { sales } = useScopedData();
	const { go, role } = usePos();
	const cashflow = useFeature("dashboard.cashflow");
	const locations = useFeature("business.locations");
	const openLocations = useDeferredLocationOpen();
	const [range, setRange] = useState(defaultRange);
	const [active, setActive] = useState("month");
	const d = useMemo(() => dashboardData(sales, range), [sales, range]);
	const maxPayment = Math.max(1, ...Object.values(d.payments));

	const setType = (type) => {
		setActive(type);
		setRange(rangeDates(type));
	};
	const setField = (key) => (e) => {
		setActive("");
		setRange((r) => ({ ...r, [key]: e.target.value }));
	};

	return (
		<section className="view active" id="view-dashboard">
			<div className="dashboard-toolbar">
				<div>
					<div className="label">Sales reporting range</div>
					<div className="range-buttons" style={{ marginTop: 8 }}>
						{[
							["today", "Today"],
							["7days", "Last 7 Days"],
							["month", "This Month"],
						].map(([key, label]) => (
							<button key={key} className={"btn out" + (active === key ? " gold" : "")} data-range={key} onClick={() => setType(key)}>
								{label}
							</button>
						))}
					</div>
				</div>
				<div className="range-fields">
					<div className="field">
						<label>From</label>
						<input className="input" type="date" id="dash-from" value={range.from} onChange={setField("from")} />
					</div>
					<div className="field">
						<label>To</label>
						<input className="input" type="date" id="dash-to" value={range.to} onChange={setField("to")} />
					</div>
				</div>
			</div>
			<div className="grid4" id="kpis">
				<Kpi label="Sales" value={d.sales.length} note="Completed transactions" />
				<Kpi label="Revenue" value={money(d.revenue)} />
				<Kpi label="Gross Profit" value={money(d.profit)} tone="positive" note="Revenue less item cost" />
				<Kpi label="Average Sale" value={money(d.average)} />
			</div>
			{locations && OWNER_ROLES.includes(role) && <BranchStatus data={data} onSwitch={openLocations} />}
			<div className="dashboard-two">
				<Panel title="Best-Selling Items" subtitle="Ranked by quantity sold in the selected range">
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>#</th>
									<th>Item</th>
									<th>Units</th>
									<th>Revenue</th>
								</tr>
							</thead>
							<tbody id="best-items">
								{d.items.slice(0, 10).map((x, i) => (
									<tr key={x.name}>
										<td>
											<span className="rank">{i + 1}</span>
										</td>
										<td>
											<strong>{x.name}</strong>
										</td>
										<td>{x.qty}</td>
										<td>{money(x.revenue)}</td>
									</tr>
								))}
								{!d.items.length && (
									<tr>
										<td colSpan="4">No item sales in this range.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</Panel>
				<Panel title="Payments" subtitle="Revenue by payment method">
					<div className="payment-bars" id="payment-breakdown">
						{Object.entries(d.payments)
							.sort((a, b) => b[1] - a[1])
							.map(([name, value]) => (
								<div className="payment-bar-row" key={name}>
									<span>{name}</span>
									<div className="payment-bar">
										<span style={{ width: (value / maxPayment) * 100 + "%" }} />
									</div>
									<strong>{money(value)}</strong>
								</div>
							))}
						{!Object.keys(d.payments).length && <div className="empty">No payments in this range.</div>}
					</div>
				</Panel>
			</div>
			{cashflow && REPORTING_ROLES.includes(role) && (
				<div className="panel" style={{ marginTop: 16 }} id="cashflow-panel">
					<div className="panel-head">
						<div>
							<div className="panel-title">Cashflow Overview</div>
							<div className="muted">Owner and accountant view for the selected period</div>
						</div>
						<button className="btn out" onClick={() => go("sales")}>
							View Sales
						</button>
					</div>
					<div className="cashflow-grid" id="cashflow-summary">
						<Metric label="Total cash in" value={money(d.revenue)} tone="cash-positive" />
						<Metric label="Cost of goods" value={money(d.cost)} tone="cash-negative" />
						<Metric label="Gross cashflow" value={money(d.profit)} />
						<Metric label="Gross margin" value={d.margin.toFixed(1) + "%"} />
						<Metric label="Cash payments" value={money(d.cash)} />
						<Metric label="Card / digital" value={money(d.nonCash)} />
						<Metric label="Customers served" value={d.customersServed} />
						<Metric label="Units sold" value={d.units} />
					</div>
				</div>
			)}
			<div className="panel" style={{ marginTop: 16 }}>
				<div className="panel-head">
					<div className="panel-title">Sales in Selected Range</div>
					<button className="btn out" onClick={() => go("sales")}>
						View all
					</button>
				</div>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Receipt</th>
								<th>Customer</th>
								<th>Payment</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody id="recent-sales">
							{d.sales.slice(0, 8).map((s) => (
								<tr key={s.id}>
									<td>{s.receipt}</td>
									<td>{customerName(data.customers, s.customerId)}</td>
									<td>{s.payment}</td>
									<td>{money(s.total)}</td>
								</tr>
							))}
							{!d.sales.length && (
								<tr>
									<td colSpan="4">No sales in this range.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}

const Metric = ({ label, value, tone }) => (
	<div className="cashflow-metric">
		<span>{label}</span>
		<strong className={tone}>{value}</strong>
	</div>
);

function BranchStatus({ data, onSwitch }) {
	const key = today();
	return (
		<div className="panel branch-status-panel" id="branch-status-panel">
			<div className="panel-head">
				<div>
					<div className="panel-title">Location Status</div>
					<div className="muted">Live sales and stock position for every branch</div>
				</div>
				<button className="btn out" type="button" onClick={onSwitch}>
					Switch Location
				</button>
			</div>
			<div className="branch-stat-grid" id="branch-stat-grid">
				{data.locations.map((loc) => {
					const sales = data.sales.filter((s) => s.locationId === loc.id && s.date === key && !["refunded", "voided"].includes(s.status || "completed"));
					const revenue = sales.reduce((t, s) => t + (Number(s.total) || 0), 0);
					const stock = data.inventory.reduce((t, i) => t + (Number(i.locationQuantities?.[loc.id]) || 0), 0);
					const low = data.inventory.filter((i) => (Number(i.locationQuantities?.[loc.id]) || 0) <= Number(i.reorder || 0)).length;
					return (
						<article className="branch-stat" key={loc.id}>
							<div className="branch-stat-head">
								<strong>{loc.name}</strong>
								<span>{loc.active === false ? "Inactive" : "Online"}</span>
							</div>
							<div className="location-meta">
								{loc.code || ""}
								{loc.address ? " · " + loc.address : ""}
							</div>
							<div className="branch-stat-values">
								<div>
									<small>Sales today</small>
									<strong>{sales.length}</strong>
								</div>
								<div>
									<small>Revenue</small>
									<strong>{money(revenue)}</strong>
								</div>
								<div>
									<small>Stock units</small>
									<strong>{stock.toLocaleString()}</strong>
								</div>
								<div>
									<small>Low stock</small>
									<strong>{low}</strong>
								</div>
							</div>
						</article>
					);
				})}
				{!data.locations.length && <div className="empty">No locations configured.</div>}
			</div>
		</div>
	);
}
