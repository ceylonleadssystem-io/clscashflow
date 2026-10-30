/**
 * Administration portal, main page: how every business is doing together over the last 30 days, and which businesses sell the most.
 */
import { useMemo } from "react";
import { overall } from "../domain/adminAnalytics";
import { BarChart, Kpi, RankedBars, lkr } from "./AdminCharts";

export function OverallAnalytics({ accounts, onOpen }) {
	const o = useMemo(() => overall(accounts), [accounts]);
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
					<Kpi label="Sales" value={lkr(o.sales30)} />
					<Kpi label="Orders" value={o.orders30.toLocaleString()} hint={"Average " + lkr(o.average)} />
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
						<RankedBars rows={o.top.filter((t) => t.sales > 0).map((t) => ({ name: t.name, value: t.sales, note: t.orders + (t.orders === 1 ? " order" : " orders"), onClick: () => onOpen(t.id) }))} empty="No sales recorded in the last 30 days." />
					</div>
				</div>
			</div>
		</section>
	);
}
