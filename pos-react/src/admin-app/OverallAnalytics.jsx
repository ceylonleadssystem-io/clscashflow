/**
 * Administration portal, main page: how every business is doing together over the last 30 days, and which businesses sell the most.
 */
import { useMemo } from "react";
import { hourLabel, overall, overallHourly } from "../domain/adminAnalytics";
import { change } from "../domain/adminInsights";
import { BarChart, HourlyPanel, Kpi, RankedBars, lkr } from "./AdminCharts";
import { trendClass } from "./InsightPanels";

/** " · ▲ 12%" against the business's previous 30 days (nothing when there were no earlier sales). */
const trendText = (accounts, id) => {
	const a = accounts.find((x) => x.id === id);
	const n = a?.analytics?.insights ? change(a.analytics.sales30, a.analytics.insights.prev30.sales) : null;
	return n == null ? "" : " · " + (n > 0 ? "▲ " : n < 0 ? "▼ " : "") + Math.abs(n) + "%";
};

export function OverallAnalytics({ accounts, onOpen }) {
	const o = useMemo(() => overall(accounts), [accounts]);
	const hr = useMemo(() => overallHourly(accounts), [accounts]);
	// the 30 days before, for the "vs previous period" figures
	const before = useMemo(() => accounts.filter((a) => a.analytics?.insights && a.status !== "test").reduce((t, a) => ({ sales: t.sales + a.analytics.insights.prev30.sales, orders: t.orders + a.analytics.insights.prev30.orders }), { sales: 0, orders: 0 }), [accounts]);
	const salesChange = change(o.sales30, before.sales);
	const ordersChange = change(o.orders30, before.orders);
	const arrow = (n) => (n == null ? "No earlier sales to compare" : (n > 0 ? "▲ " : n < 0 ? "▼ " : "") + Math.abs(n) + "% vs the previous 30 days");
	if (!o.businesses) return null;
	return (
		<section className="panel admin-analytics" aria-label="Overall analytics">
			<div className="panel-head">
				<div>
					<div className="panel-title">Analytics</div>
					<div className="muted">Every business, last 30 days. Open a business to see its own analytics.</div>
				</div>
			</div>
			<div className="modal-body">
				<div className="admin-summary" style={{ marginBottom: 12 }}>
					<Kpi label="Sales" value={lkr(o.sales30)} hint={arrow(salesChange)} tone={trendClass(salesChange)} />
					<Kpi label="Orders" value={o.orders30.toLocaleString()} hint={arrow(ordersChange) + " · average " + lkr(o.average)} tone={trendClass(ordersChange)} />
					<Kpi label="Businesses selling this week" value={`${o.active7} of ${o.businesses}`} />
					<Kpi label="No sales in 30 days" value={String(o.inactive)} />
				</div>
				<div className="admin-grid">
					<div>
						<h4 style={{ margin: "0 0 6px" }}>Sales per day</h4>
						<BarChart data={o.daily.map((d) => ({ label: d.date.slice(5), value: d.sales }))} />
					</div>
					<div>
						<h4 style={{ margin: "0 0 6px" }}>Top businesses</h4>
						<RankedBars rows={o.top.filter((t) => t.sales > 0).map((t) => ({ name: t.name, value: t.sales, note: t.orders + (t.orders === 1 ? " order" : " orders") + trendText(accounts, t.id), onClick: () => onOpen(t.id) }))} empty="No sales recorded in the last 30 days." />
					</div>
				</div>
				{hr.busiestHour != null && (
					<>
						<h4 style={{ margin: "18px 0 6px" }}>Hourly activity</h4>
						<HourlyPanel
							hours={hr.hours}
							hourLabel={hourLabel}
							facts={[
								`The POS is in use from ${hourLabel(hr.firstHour)} to ${hourLabel(hr.lastHour)} (business time, Sri Lanka).`,
								`Busiest hour: ${hourLabel(hr.busiestHour)}, with ${hr.hours[hr.busiestHour].orders} transactions in 30 days.`,
								`Most users selling in one hour on an average day, all businesses together: ${Math.round(hr.peakSellers * 10) / 10}.`,
							]}
						/>
					</>
				)}
			</div>
		</section>
	);
}
