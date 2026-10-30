/**
 * Administration portal, one business: sales, orders and average order over a chosen number of days, per day, best-selling items,
 * how customers paid, order types, and each location. Built from the business's own sales.
 */
import { useMemo, useState } from "react";
import { hourLabel, hourlyActivity, summarize } from "../domain/adminAnalytics";
import { TYPE_LABELS, benchmark, change, kitchenSpeed, lossWatch, summarizeHeat } from "../domain/adminInsights";
import { BarChart, HourlyPanel, Kpi, RankedBars, lkr } from "./AdminCharts";
import { HeatmapView, trendClass } from "./InsightPanels";

const RANGES = [[7, "7 days"], [30, "30 days"], [90, "90 days"]];

export function AnalyticsTab({ account, accounts = [], workspace, locations }) {
	const [days, setDays] = useState(30);
	const [locationId, setLocationId] = useState("");
	const sales = workspace?.sales || [];
	// the figures that need the 30-day summary the account list carries (compared with similar businesses, losses, kitchen, heat map)
	const ins = account?.analytics?.insights;
	const trend = ins ? change(account.analytics.sales30, ins.prev30.sales) : null;
	const bench = useMemo(() => (ins ? benchmark(account, accounts) : null), [account, accounts, ins]);
	const loss = useMemo(() => (ins ? lossWatch([account])[0] : null), [account, ins]);
	const kitchen = useMemo(() => (ins ? kitchenSpeed([account]).rows[0] : null), [account, ins]);
	const heat = useMemo(() => (ins ? summarizeHeat(Array.from({ length: 7 }, (_, d) => ins.heat.slice(d * 24, d * 24 + 24))) : null), [ins]);
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
				{ins && (
					<ul className="admin-facts">
						<li className={trendClass(trend)}>
							{trend == null ? "No sales in the 30 days before, so nothing to compare with." : `Sales are ${trend >= 0 ? "up" : "down"} ${Math.abs(trend)}% on the previous 30 days (${lkr(ins.prev30.sales)} then, ${lkr(account.analytics.sales30)} now).`}
						</li>
						{bench ? (
							<li>
								Average order {lkr(bench.average)}: {bench.averageDiff === 0 ? "the same as" : Math.abs(bench.averageDiff) + "% " + (bench.averageDiff > 0 ? "above" : "below")} {bench.peers} similar {TYPE_LABELS[bench.type] || bench.type} business{bench.peers === 1 ? "" : "es"} ({lkr(bench.peerAverage)}). Items per order {bench.itemsPerOrder.toFixed(1)} against {bench.peerItemsPerOrder.toFixed(1)}.
							</li>
						) : (
							<li className="muted">There is no other {TYPE_LABELS[account.businessType] || "business of this type"} with sales to compare the average order with.</li>
						)}
					</ul>
				)}
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
				{heat && (
					<>
						<h4 style={{ margin: "18px 0 6px" }}>Orders by weekday and hour (30 days)</h4>
						<HeatmapView heat={heat} />
					</>
				)}
				{loss && (
					<>
						<h4 style={{ margin: "18px 0 6px" }}>Refunds, voids, discounts and cash (30 days)</h4>
						<ul className="admin-facts">
							<li className={loss.flags.includes("Refunds") ? "health-bad" : ""}>Refunds {lkr(loss.refunds.amount)} ({loss.refundRate}% of sales)</li>
							<li className={loss.flags.includes("Voids") ? "health-bad" : ""}>Voids {loss.voids.count} ({loss.voidRate}% of orders)</li>
							<li className={loss.flags.includes("Discounts") ? "health-bad" : ""}>Discounts {lkr(loss.discounts.amount)} ({loss.discountRate}% of item sales)</li>
							<li className={loss.flags.includes("Cash variance") ? "health-bad" : ""}>{loss.cash.shifts ? `Cash counted over ${loss.cash.shifts} closed registers: ${lkr(loss.cash.net)} net, ${lkr(loss.cash.abs)} in either direction` : "No registers closed in this period."}</li>
						</ul>
					</>
				)}
				{kitchen && (
					<>
						<h4 style={{ margin: "18px 0 6px" }}>Kitchen speed (30 days)</h4>
						<p>{kitchen.avgMinutes} minutes on average and {kitchen.medianMinutes} typical, over {kitchen.tickets} tickets sent to the Kitchen Display.</p>
					</>
				)}
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
