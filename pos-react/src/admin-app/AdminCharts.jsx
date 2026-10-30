import { useState } from "react";

/**
 * Small charts for the administration portal: a bar chart of a daily series, and a ranked list with bars. Plain SVG / CSS, no chart library.
 */
export const lkr = (n) => "LKR " + Math.round(Number(n) || 0).toLocaleString();

/** `data` is [{ label, value }]; one bar each, with the highest labelled. */
export function BarChart({ data, height = 140, label = "Sales per day" }) {
	const max = Math.max(1, ...data.map((d) => d.value));
	const w = 100 / Math.max(1, data.length);
	const top = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
	return (
		<figure className="admin-chart" style={{ margin: 0 }}>
			<svg viewBox={`0 0 100 ${height / 4}`} preserveAspectRatio="none" role="img" aria-label={label} style={{ width: "100%", height }}>
				{data.map((d, i) => {
					const h = (d.value / max) * (height / 4 - 2);
					return (
						<rect key={i} x={i * w + w * 0.12} y={height / 4 - h} width={w * 0.76} height={Math.max(h, d.value ? 0.6 : 0.25)} rx="0.4" className={"admin-bar" + (d.value ? "" : " empty")}>
							<title>{`${d.label}: ${lkr(d.value)}`}</title>
						</rect>
					);
				})}
			</svg>
			<figcaption className="muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
				<span>{data[0]?.label}</span>
				{data.length > 0 && data[top].value > 0 && <span>Best day {data[top].label}: {lkr(data[top].value)}</span>}
				<span>{data.at(-1)?.label}</span>
			</figcaption>
		</figure>
	);
}

/** `rows` is [{ name, value, note?, onClick? }] ranked; each gets a bar relative to the biggest. */
export function RankedBars({ rows, empty = "Nothing to show yet." }) {
	if (!rows.length) return <p className="muted">{empty}</p>;
	const max = Math.max(1, ...rows.map((r) => r.value));
	return (
		<ul className="admin-ranked">
			{rows.map((r) => (
				<li key={r.name}>
					<span className="admin-ranked-top">
						{r.onClick ? (
							<button type="button" className="link-btn" onClick={r.onClick}>
								{r.name}
							</button>
						) : (
							<strong>{r.name}</strong>
						)}
						<span>{lkr(r.value)}</span>
					</span>
					<span className="admin-ranked-bar" aria-hidden="true">
						<span style={{ width: (r.value / max) * 100 + "%" }} />
					</span>
					{r.note && <small className="muted">{r.note}</small>}
				</li>
			))}
		</ul>
	);
}

export function Kpi({ label, value, hint }) {
	return (
		<div className="card">
			<div className="label">{label}</div>
			<div className="value admin-small">{value}</div>
			{hint && <small className="muted">{hint}</small>}
		</div>
	);
}

const METRICS = [
	["orders", "Transactions"],
	["sales", "Sales"],
	["sellers", "Users selling"],
];
const one = (n) => (Math.round(n * 10) / 10).toLocaleString();

/**
 * When a business (or every business) is active, hour by hour. `hours` is [{ hour, orders, sales, sellers, onClock? }]; the chart shows one of
 * transactions, sales or users selling. `facts` is the sentence list above it (busiest hour, opening window, peaks).
 */
export function HourlyPanel({ hours, facts, hourLabel }) {
	const [metric, setMetric] = useState("orders");
	const data = hours.map((h) => ({ label: hourLabel(h.hour), value: h[metric] || 0 }));
	const fmtValue = (v) => (metric === "sales" ? lkr(v) : one(v));
	return (
		<div className="admin-hourly">
			<ul className="admin-facts">
				{facts.map((f) => (
					<li key={f}>{f}</li>
				))}
			</ul>
			<div className="sk-tabs" role="group" aria-label="Show">
				{METRICS.map(([k, label]) => (
					<button key={k} type="button" className={metric === k ? "active" : ""} aria-pressed={metric === k} onClick={() => setMetric(k)}>
						{label}
					</button>
				))}
			</div>
			<svg viewBox="0 0 96 36" preserveAspectRatio="none" role="img" aria-label={"Hourly " + METRICS.find((m) => m[0] === metric)[1].toLowerCase()} style={{ width: "100%", height: 150 }}>
				{data.map((d, i) => {
					const max = Math.max(1, ...data.map((x) => x.value));
					const h = (d.value / max) * 32;
					return (
						<rect key={i} x={i * 4 + 0.5} y={34 - h} width={3} height={Math.max(h, d.value ? 0.6 : 0.25)} rx="0.4" className={"admin-bar" + (d.value ? "" : " empty")}>
							<title>{`${d.label}: ${fmtValue(d.value)}`}</title>
						</rect>
					);
				})}
			</svg>
			<div className="muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
				{[0, 6, 12, 18, 23].map((h) => (
					<span key={h}>{hourLabel(h)}</span>
				))}
			</div>
			<div className="table-wrap" style={{ marginTop: 10 }}>
				<table>
					<thead>
						<tr>
							<th>Hour</th>
							<th>Transactions</th>
							<th>Sales</th>
							<th>Users selling (average)</th>
							{hours.some((h) => h.onClock != null) && <th>Clocked in (average)</th>}
						</tr>
					</thead>
					<tbody>
						{hours.filter((h) => h.orders > 0 || h.onClock > 0).map((h) => (
							<tr key={h.hour}>
								<td>{hourLabel(h.hour)}</td>
								<td>{h.orders}</td>
								<td>{lkr(h.sales)}</td>
								<td>{one(h.sellers)}</td>
								{hours.some((x) => x.onClock != null) && <td>{one(h.onClock || 0)}</td>}
							</tr>
						))}
						{!hours.some((h) => h.orders > 0) && (
							<tr>
								<td colSpan="5" className="muted">No transactions in this period.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
