/**
 * Timesheets (admin portal): employee clock-in / clock-out / break hours for a date range, with a total per employee and CSV export.
 */
import { useMemo, useState } from "react";
import { timesheetRows } from "../domain/timesheets";
import { downloadCsv, today } from "../domain/format";
import { rangeDates } from "../domain/analytics";
import { Panel } from "../components/ui";
import { useScopedData } from "../hooks/useScopedData";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

const time = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
const h = (n) => n.toFixed(2);

export function Timesheets() {
	const data = useData();
	const { timeEntries } = useScopedData();
	const { locationId } = usePos();
	const [range, setRange] = useState(() => rangeDates("7days"));
	const [userId, setUserId] = useState("");
	const sheet = useMemo(() => timesheetRows(timeEntries, data.users, range, { locationId, userId }), [timeEntries, data.users, range, locationId, userId]);
	const csv = () =>
		downloadCsv(
			[["Employee", "Date", "Clock in", "Clock out", "Break hours", "Worked hours"], ...sheet.rows.map((r) => [r.employee, r.date, time(r.clockIn), r.open ? "Still clocked in" : time(r.clockOut), h(r.breakHours), h(r.hours)])],
			`timesheets-${range.from}-${range.to}.csv`,
		);
	return (
		<section className="view active" id="view-timesheets">
			<div className="dashboard-toolbar">
				<div>
					<div className="panel-title">Timesheets</div>
					<div className="muted">Employee clock-in, clock-out and break hours</div>
				</div>
				<div className="range-fields">
					<div className="field">
						<label htmlFor="ts-from">From</label>
						<input className="input" type="date" id="ts-from" max={today()} value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value || r.from }))} />
					</div>
					<div className="field">
						<label htmlFor="ts-to">To</label>
						<input className="input" type="date" id="ts-to" max={today()} value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value || r.to }))} />
					</div>
					<div className="field">
						<label htmlFor="ts-user">Employee</label>
						<select className="input" id="ts-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
							<option value="">All employees</option>
							{data.users.map((u) => (
								<option key={u.id} value={u.id}>
									{u.name}
								</option>
							))}
						</select>
					</div>
					<button type="button" className="btn out" id="ts-csv" onClick={csv} disabled={!sheet.rows.length}>
						Download CSV
					</button>
				</div>
			</div>
			<Panel title="Hours by employee" subtitle={sheet.rows.length + " shifts · " + h(sheet.hours) + " hours"}>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Employee</th>
								<th className="n">Shifts</th>
								<th className="n">Break hours</th>
								<th className="n">Worked hours</th>
							</tr>
						</thead>
						<tbody id="ts-totals">
							{sheet.totals.map((t) => (
								<tr key={t.userId}>
									<td>
										<strong>{t.employee}</strong>
									</td>
									<td className="n">{t.shifts}</td>
									<td className="n">{h(t.breakHours)}</td>
									<td className="n">{h(t.hours)}</td>
								</tr>
							))}
							{!sheet.totals.length && (
								<tr>
									<td colSpan="4">No clock-ins in this period.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Panel>
			<Panel title="Shifts">
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Employee</th>
								<th>Date</th>
								<th>Clock in</th>
								<th>Clock out</th>
								<th className="n">Break hours</th>
								<th className="n">Worked hours</th>
							</tr>
						</thead>
						<tbody id="ts-rows">
							{sheet.rows.map((r) => (
								<tr key={r.id || r.clockIn + r.userId}>
									<td>{r.employee}</td>
									<td>{r.date}</td>
									<td>{time(r.clockIn)}</td>
									<td>{r.open ? <span className="role-pill">Clocked in</span> : time(r.clockOut)}</td>
									<td className="n">{h(r.breakHours)}</td>
									<td className="n">{h(r.hours)}</td>
								</tr>
							))}
							{!sheet.rows.length && (
								<tr>
									<td colSpan="6">No shifts in this period.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Panel>
		</section>
	);
}
