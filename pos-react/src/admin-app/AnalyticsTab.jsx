/**
 * Administration portal, one business: sales, orders and average order over a chosen number of days, per day, best-selling items,
 * how customers paid, order types, and each location. Built from the business's own sales.
 */
import { useMemo, useState } from "react";
import { hourLabel, hourlyActivity, summarize } from "../domain/adminAnalytics";
import { BarChart, HourlyPanel, Kpi, RankedBars, lkr } from "./AdminCharts";

const RANGES = [[7, "7 days"], [30, "30 days"], [90, "90 days"]];

export function AnalyticsTab({ workspace, locations }) {
	const [days, setDays] = useState(30);
	const [locationId, setLocationId] = useState("");
	const sales = workspace?.sales || [];
	const s = useMemo(() => summarize(sales, { days, locationId }), [sales, days, locationId]);
	const hr = useMemo(() => hourlyActivity(sales, { days, locationId, timeEntries: workspace?.timeEntries || [] }), [sales, days, locationId, workspace]);
	return (
		<section className="panel admin-analytics">
			<div className="panel-head">
				<div>
					<div className="panel-title">Analytics</div>
					<div className="muted">{s.lastSaleAt ? "Last sale " + new Date(s.lastSaleAt).toLocaleString() : "No sales recorded yet."}</div>
				</div>
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					{locations.length > 1 && (
						<select className="input" aria-label="Location" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
							<option value="">All locations</option>
							{locations.map((l) => (
								<option key={l.id} value={l.id}>
									{l.name}
								</option>
							))}
						</select>
					)}
					<select className="input" aria-label="Period" value={days} onChange={(e) => setDays(+e.target.value)}>
						{RANGES.map(([d, label]) => (
							<option key={d} value={d}>
								Last {label}
							</option>
						))}
					</select>
				</div>
			</div>
			<div className="modal-body">
				<div className="admin-summary" style={{ marginBottom: 12 }}>
					<Kpi label="Sales" value={lkr(s.sales)} />
					<Kpi label="Orders" value={s.orders.toLocaleString()} />
					<Kpi label="Average order" value={lkr(s.average)} />
					<Kpi label="Best seller" value={s.topItems[0]?.name || "—"} hint={s.topItems[0] ? s.topItems[0].qty + " sold" : ""} />
				</div>
				<h4 style={{ margin: "0 0 6px" }}>Sales per day</h4>
				<BarChart data={s.series.map((d) => ({ label: d.date.slice(5), value: d.sales }))} />
				<div className="admin-grid" style={{ marginTop: 16 }}>
					<div>
						<h4 style={{ margin: "0 0 6px" }}>Best-selling items</h4>
						<RankedBars rows={s.topItems.map((t) => ({ name: t.name, value: t.sales, note: t.qty + " sold" }))} />
					</div>
					<div>
						<h4 style={{ margin: "0 0 6px" }}>How customers paid</h4>
						<RankedBars rows={s.payments.map((p) => ({ name: p.name, value: p.sales, note: p.orders + (p.orders === 1 ? " order" : " orders") }))} />
						<h4 style={{ margin: "16px 0 6px" }}>Order types</h4>
						<RankedBars rows={s.channels.map((p) => ({ name: p.name, value: p.sales, note: p.orders + (p.orders === 1 ? " order" : " orders") }))} />
					</div>
				</div>
				<h4 style={{ margin: "18px 0 6px" }}>Hourly activity</h4>
				<HourlyPanel
					hours={hr.hours}
					hourLabel={hourLabel}
					facts={
						hr.summary.busiestHour == null
							? ["No transactions in this period."]
							: [
									`The POS is in use from ${hourLabel(hr.summary.firstHour)} to ${hourLabel(hr.summary.lastHour)} (business time, Sri Lanka), on ${hr.summary.activeDays} day${hr.summary.activeDays === 1 ? "" : "s"}.`,
									`Busiest hour: ${hourLabel(hr.summary.busiestHour)}, ${hr.hours[hr.summary.busiestHour].orders} transactions and ${lkr(hr.hours[hr.summary.busiestHour].sales)}.`,
									`${hr.summary.orders} transactions and ${lkr(hr.summary.sales)} in total. Most users selling in one hour: ${hr.summary.peakSellers}${hr.summary.peakOnClock ? `; most clocked in: ${hr.summary.peakOnClock}` : ""}.`,
								]
					}
				/>
				{!locationId && s.locations.length > 1 && (
					<>
						<h4 style={{ margin: "16px 0 6px" }}>Locations</h4>
						<RankedBars rows={s.locations.map((p) => ({ name: p.name, value: p.sales, note: p.orders + (p.orders === 1 ? " order" : " orders") }))} />
					</>
				)}
			</div>
		</section>
	);
}
