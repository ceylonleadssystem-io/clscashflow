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
