/**
 * Administration portal, Analytics tab: the deeper views. Who may be leaving, how far new businesses got, when everyone trades, how people pay
 * by business type, what looks wrong (refunds, voids, discounts, cash) and how fast kitchens are. The numbers come from domain/adminInsights.js.
 */
import { useMemo, useState } from "react";
import { WEEKDAYS, activationFunnel, byBusinessType, churnRisk, heatmap, kitchenSpeed, lossWatch, overallMix } from "../domain/adminInsights";
import { hourLabel } from "../domain/adminAnalytics";
import { RankedBars, lkr } from "./AdminCharts";

const Panel = ({ title, subtitle, children, id }) => (
	<section className="panel admin-analytics" aria-label={title} id={id}>
		<div className="panel-head">
			<div>
				<div className="panel-title">{title}</div>
				{subtitle && <div className="muted">{subtitle}</div>}
			</div>
		</div>
		<div className="modal-body">{children}</div>
	</section>
);
const pct = (n) => (n == null ? "—" : (n > 0 ? "▲ " : n < 0 ? "▼ " : "") + Math.abs(n) + "%");
export const trendClass = (n) => (n == null || n === 0 ? "" : n > 0 ? "health-ok" : "health-bad");

/** 1. Who may be leaving. */
export function ChurnPanel({ accounts, onOpen }) {
	const rows = useMemo(() => churnRisk(accounts), [accounts]);
	return (
		<Panel title="Needs attention" subtitle="Businesses whose sales have stopped or fallen. A call or a visit now is cheaper than winning them back later." id="admin-churn">
			{!rows.length ? (
				<p className="muted">No business looks at risk. Every selling business has sold recently and is holding its sales.</p>
			) : (
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Business</th>
								<th>Status</th>
								<th>Why</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{rows.map((r) => (
								<tr key={r.id}>
									<td>
										<strong>{r.name}</strong>
									</td>
									<td>
										<span className="badge" style={r.severity === "high" ? { background: "#fde9e7", color: "#a5362b" } : r.severity === "medium" ? { background: "#fff1d6", color: "#9a6700" } : undefined}>
											{r.severity === "high" ? "High" : r.severity === "medium" ? "Medium" : "Watch"}
										</span>{" "}
										<small className="muted">{r.status}</small>
									</td>
									<td>{r.reasons.join(" · ")}</td>
									<td>
										<button className="btn out" onClick={() => onOpen(r.id)}>
											Open
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</Panel>
	);
}

/** 2. How far businesses got. */
export function FunnelPanel({ accounts, onOpen }) {
	const steps = useMemo(() => activationFunnel(accounts), [accounts]);
	const [open, setOpen] = useState("");
	if (!steps[0].count) return null;
	return (
		<Panel title="Activation funnel" subtitle="How far each business got after signing up. Click a step to see who stopped before it." id="admin-funnel">
			<ol className="admin-funnel">
				{steps.map((s, i) => (
					<li key={s.key}>
						<button type="button" className="admin-funnel-row" aria-expanded={open === s.key} onClick={() => setOpen(open === s.key ? "" : s.key)} disabled={i === 0}>
							<span className="admin-funnel-label">{s.label}</span>
							<span className="admin-funnel-bar" aria-hidden="true">
								<span style={{ width: s.ofAll + "%" }} />
							</span>
							<strong>{s.count}</strong>
							<span className="muted">{i === 0 ? "" : s.ofPrevious + "% of the step before"}</span>
						</button>
						{open === s.key && (
							<p className="muted" style={{ margin: "4px 0 8px 12px" }}>
								{s.stuck.length ? "Stopped before this step: " + s.stuck.join(", ") : "Everyone before this step got here."}
							</p>
						)}
					</li>
				))}
			</ol>
		</Panel>
	);
}

/** 4. When everyone trades. `cells` is [7][24] order counts. */
export function HeatmapView({ heat }) {
	const quiet = heat.quietest;
	const shade = (n) => (heat.max ? Math.max(0.05, n / heat.max) : 0.05);
	return (
		<>
			{heat.busiest ? (
				<ul className="admin-facts">
					<li>
						Busiest: {WEEKDAYS[heat.busiest.day]} at {hourLabel(heat.busiest.hour)} ({heat.busiest.orders} orders in 30 days).
					</li>
					{quiet && (
						<li>
							Quietest three hours (6 am to midnight): {hourLabel(quiet.from)} to {hourLabel(quiet.to)}. The least disruptive time for an update or planned maintenance.
						</li>
					)}
				</ul>
			) : (
				<p className="muted">No orders in the last 30 days.</p>
			)}
			<div className="admin-heat" role="img" aria-label="Orders by weekday and hour">
				<div className="admin-heat-hours" aria-hidden="true">
					<span />
					{Array.from({ length: 24 }, (_, h) => (
						<span key={h}>{h % 3 === 0 ? hourLabel(h).replace(" ", "") : ""}</span>
					))}
				</div>
				{heat.cells.map((row, d) => (
					<div className="admin-heat-row" key={d}>
						<span className="admin-heat-day">{WEEKDAYS[d]}</span>
						{row.map((n, h) => (
							<span key={h} className="admin-heat-cell" style={{ opacity: n ? shade(n) : 0.06 }} title={`${WEEKDAYS[d]} ${hourLabel(h)}: ${n} orders`} />
						))}
					</div>
				))}
			</div>
		</>
	);
}
export function HeatmapPanel({ accounts }) {
	const heat = useMemo(() => heatmap(accounts), [accounts]);
	return (
		<Panel title="Busiest days and hours" subtitle="Orders by weekday and hour across every business, last 30 days (business time)." id="admin-heat">
			<HeatmapView heat={heat} />
		</Panel>
	);
}

/** Payment and order-type mix overall, and average order and items per order by business type. */
export function TypesPanel({ accounts }) {
	const mix = useMemo(() => overallMix(accounts), [accounts]);
	const types = useMemo(() => byBusinessType(accounts), [accounts]);
	if (!types.length) return null;
	const share = (g, k) => (g.sales ? Math.round(((g.pay[k] || 0) / Object.values(g.pay).reduce((a, b) => a + b, 0)) * 100) + "%" : "—");
	return (
		<Panel title="How people pay and order" subtitle="Share of sales over the last 30 days, and a benchmark by business type." id="admin-mix">
			<div className="admin-grid">
				<div>
					<h4 style={{ margin: "0 0 6px" }}>Payments</h4>
					<RankedBars rows={mix.payments.map((p) => ({ name: p.name, value: p.sales, note: p.share + "% of sales" }))} />
				</div>
				<div>
					<h4 style={{ margin: "0 0 6px" }}>Order types</h4>
					<RankedBars rows={mix.channels.map((p) => ({ name: p.name, value: p.sales, note: p.share + "% of sales" }))} />
				</div>
			</div>
			<h4 style={{ margin: "16px 0 6px" }}>By business type</h4>
			<div className="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Type</th>
							<th>Businesses</th>
							<th>Average order</th>
							<th>Items per order</th>
							<th>Card</th>
							<th>Cash</th>
							<th>3rd party</th>
						</tr>
					</thead>
					<tbody>
						{types.map((g) => (
							<tr key={g.type}>
								<td>{g.label}</td>
								<td>{g.businesses}</td>
								<td>{lkr(g.average)}</td>
								<td>{g.itemsPerOrder.toFixed(1)}</td>
								<td>{share(g, "Card")}</td>
								<td>{share(g, "Cash")}</td>
								<td>{share(g, "3rd party")}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Panel>
	);
}

/** Refunds, voids, discounts and cash variance per business. */
export function LossPanel({ accounts, onOpen }) {
	const rows = useMemo(() => lossWatch(accounts), [accounts]);
	if (!rows.length) return null;
	return (
		<Panel title="Refunds, voids, discounts and cash" subtitle="Last 30 days. Red means high against the business's own sales: refunds over 5%, voids over 3% of orders, discounts over 15%, cash variance over 1%. A spike often points to training, or to theft." id="admin-loss">
			<div className="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Business</th>
							<th>Refunds</th>
							<th>Voids</th>
							<th>Discounts</th>
							<th>Cash variance</th>
							<th>Flags</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.id}>
								<td>
									<button type="button" className="link-btn" onClick={() => onOpen(r.id)}>
										{r.name}
									</button>
								</td>
								<td className={r.flags.includes("Refunds") ? "health-bad" : ""}>{lkr(r.refunds.amount)} · {r.refundRate}%</td>
								<td className={r.flags.includes("Voids") ? "health-bad" : ""}>{r.voids.count} · {r.voidRate}%</td>
								<td className={r.flags.includes("Discounts") ? "health-bad" : ""}>{lkr(r.discounts.amount)} · {r.discountRate}%</td>
								<td className={r.flags.includes("Cash variance") ? "health-bad" : ""}>{r.cash.shifts ? lkr(r.cash.net) + " (" + r.varianceRate + "% off)" : "—"}</td>
								<td>{r.flags.length ? r.flags.join(", ") : "None"}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Panel>
	);
}

/** Kitchen speed for the businesses that use the Kitchen Display. */
export function KitchenPanel({ accounts, onOpen }) {
	const k = useMemo(() => kitchenSpeed(accounts), [accounts]);
	if (!k.rows.length) return null;
	return (
		<Panel title="Kitchen speed" subtitle={`From a ticket being sent to the kitchen screen to it being marked ready or done, last 30 days. All businesses: ${k.avgMinutes} minutes on average over ${k.tickets} tickets.`} id="admin-kitchen">
			<div className="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Business</th>
							<th>Tickets</th>
							<th>Average</th>
							<th>Typical (median)</th>
						</tr>
					</thead>
					<tbody>
						{k.rows.map((r) => (
							<tr key={r.id}>
								<td>
									<button type="button" className="link-btn" onClick={() => onOpen(r.id)}>
										{r.name}
									</button>
								</td>
								<td>{r.tickets}</td>
								<td className={r.avgMinutes > 15 ? "health-bad" : r.avgMinutes > 10 ? "health-fair" : ""}>{r.avgMinutes} min</td>
								<td>{r.medianMinutes} min</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="muted">The kitchen marks a ticket done after it is ready, so these times run a little longer than the cooking itself.</p>
		</Panel>
	);
}
