/**
 * Timesheets (admin portal): employee clock-in / clock-out / break hours for a date range, with a total per employee and CSV export.
 */
import { useMemo, useState } from "react";
import { timesheetRows } from "../domain/timesheets";
import { downloadCsv, today } from "../domain/format";
import { rangeDates } from "../domain/analytics";
import { Panel } from "../components/ui";
import { DetailDrawer } from "../components/settings/kit/entities";
import { SettingRow } from "../components/settings/kit/rows";
import { entryError, entryLocked, fromLocalInput, lockDate, toLocalInput } from "../domain/timesheetEdit";
import { useScopedData } from "../hooks/useScopedData";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

const time = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
const h = (n) => n.toFixed(2);

export function Timesheets() {
	const data = useData();
	const { timeEntries } = useScopedData();
	const { locationId, svc, can, currentUser } = usePos();
	const canEdit = can("time.edit_entries");
	const [edit, setEdit] = useState(null); // { id?, userId, clockIn, clockOut, breaks, reason } with times as datetime-local values
	const original = edit?.id ? data.timeEntries.find((e) => e.id === edit.id) : null;
	const user = data.users.find((u) => u.id === (original ? original.userId : edit?.userId));
	const problem = edit
		? entryError(
				{ clockIn: fromLocalInput(edit.clockIn), clockOut: fromLocalInput(edit.clockOut), breaks: edit.breaks.map((b) => ({ start: fromLocalInput(b.start), end: fromLocalInput(b.end) })) },
				{ user, existing: original, others: data.timeEntries.filter((e) => e.userId === user?.id) },
			)
		: "";
	const openEdit = (r) => {
		const e = data.timeEntries.find((x) => x.id === r.id);
		setEdit({ id: e.id, userId: e.userId, clockIn: toLocalInput(e.clockIn), clockOut: toLocalInput(e.clockOut), breaks: (e.breaks || []).map((b) => ({ start: toLocalInput(b.start), end: toLocalInput(b.end) })), reason: "" });
	};
	const addShift = () => setEdit({ id: "", userId: userId || data.users.find((u) => u.active !== false)?.id || "", clockIn: "", clockOut: "", breaks: [], reason: "" });
	const saveEdit = async () => {
		const ok = await svc.staff.saveTimeEntry({ id: edit.id, userId: edit.userId, clockIn: fromLocalInput(edit.clockIn), clockOut: fromLocalInput(edit.clockOut), breaks: edit.breaks.map((b) => ({ start: fromLocalInput(b.start), end: fromLocalInput(b.end) })), reason: edit.reason.trim() });
		if (ok) setEdit(null);
	};
	const setBreak = (i, next) => setEdit((x) => ({ ...x, breaks: x.breaks.map((b, j) => (j === i ? { ...b, ...next } : b)) }));
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
					{canEdit && (
						<button type="button" className="btn gold" id="ts-add" onClick={addShift}>
							Add shift
						</button>
					)}
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
			<Panel title="Shifts" subtitle={canEdit ? "Shifts can be corrected for one month, back to " + lockDate().toLocaleDateString() + ". Older shifts are locked." : "Shifts older than one month are locked."}>
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
								<th></th>
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
									<td>
										{entryLocked({ clockIn: r.clockIn }) ? (
											<span className="role-pill" title="Older than one month: this shift can no longer be changed">Locked</span>
										) : (
											canEdit && (
												<span className="table-actions">
													<button type="button" className="btn out" onClick={() => openEdit(r)}>
														Edit
													</button>
													<button type="button" className="btn danger" onClick={() => svc.staff.deleteTimeEntry(r.id)}>
														Delete
													</button>
												</span>
											)
										)}
									</td>
								</tr>
							))}
							{!sheet.rows.length && (
								<tr>
									<td colSpan="7">No shifts in this period.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Panel>
			<DetailDrawer
				open={!!edit}
				wide
				title={edit?.id ? "Edit shift" : "Add shift"}
				subtitle={user ? user.name : ""}
				onClose={() => setEdit(null)}
				footer={
					<>
						<button type="button" className="btn out" onClick={() => setEdit(null)}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="ts-save" disabled={!!problem} onClick={saveEdit}>
							Save shift
						</button>
					</>
				}
			>
				{edit && (
					<>
						<p className="muted">
							Changes are recorded in the audit log. A shift can be set or changed back to {lockDate().toLocaleDateString()}{user?.createdAt ? ", and not before " + user.name + " was added (" + user.createdAt.slice(0, 10) + ")" : ""}.
						</p>
						{!edit.id && (
							<SettingRow label="Employee" htmlFor="ts-emp">
								<select id="ts-emp" className="input" value={edit.userId} onChange={(e) => setEdit((x) => ({ ...x, userId: e.target.value }))}>
									{data.users.filter((u) => u.active !== false).map((u) => (
										<option key={u.id} value={u.id}>
											{u.name}
										</option>
									))}
								</select>
							</SettingRow>
						)}
						<SettingRow label="Clock in" htmlFor="ts-in">
							<input id="ts-in" className="input" type="datetime-local" value={edit.clockIn} onChange={(e) => setEdit((x) => ({ ...x, clockIn: e.target.value }))} />
						</SettingRow>
						<SettingRow label="Clock out" help="Leave empty while the person is still clocked in." htmlFor="ts-out">
							<input id="ts-out" className="input" type="datetime-local" value={edit.clockOut} onChange={(e) => setEdit((x) => ({ ...x, clockOut: e.target.value }))} />
						</SettingRow>
						<SettingRow label="Breaks" wide>
							<div className="sk-options">
								{edit.breaks.map((b, i) => (
									<div key={i} className="sk-option-row" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto" }}>
										<input className="input" type="datetime-local" aria-label={"Break " + (i + 1) + " start"} value={b.start} onChange={(e) => setBreak(i, { start: e.target.value })} />
										<input className="input" type="datetime-local" aria-label={"Break " + (i + 1) + " end"} value={b.end} onChange={(e) => setBreak(i, { end: e.target.value })} />
										<button type="button" className="btn out" onClick={() => setEdit((x) => ({ ...x, breaks: x.breaks.filter((_, j) => j !== i) }))}>
											Remove
										</button>
									</div>
								))}
								<button type="button" className="btn out" onClick={() => setEdit((x) => ({ ...x, breaks: [...x.breaks, { start: "", end: "" }] }))}>
									Add break
								</button>
							</div>
						</SettingRow>
						<SettingRow label="Reason" help="Optional. Shown in the audit log." htmlFor="ts-reason">
							<input id="ts-reason" className="input" maxLength={120} value={edit.reason} onChange={(e) => setEdit((x) => ({ ...x, reason: e.target.value }))} />
						</SettingRow>
						{problem && edit.clockIn && (
							<p className="sk-error" role="alert">
								{problem}
							</p>
						)}
					</>
				)}
			</DetailDrawer>
		</section>
	);
}
