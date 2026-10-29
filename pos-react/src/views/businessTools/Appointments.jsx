/**
 * Business Tools module: appointments (calendar by day with status KPIs). One of the pieces of the Business Tools page (views/Industry.jsx); a business type gets it through the
 * capability named in views/businessTools/index.js. Self-contained: it reads its own data and opens its edit dialog through `setModal`.
 */
import { useMemo, useState } from "react";
import { Kpi } from "../../components/ui";
import { today } from "../../domain/format";
import { customerName } from "../../domain/names";
import { useData } from "../../store/DataProvider";

export function Appointments({ canManage, setModal }) {
	const data = useData();
	const [date, setDate] = useState(today());
	const dis = !canManage;
	const name = (id) => customerName(data.customers, id);
	const appointments = useMemo(() => data.appointments.filter((a) => (a.time || "").slice(0, 10) === date).sort((a, b) => a.time.localeCompare(b.time)), [data.appointments, date]);
	return (
		<>
			<div className="grid4" id="appointment-kpis">
				<Kpi label="Appointments" value={appointments.length} />
				<Kpi label="Confirmed" value={appointments.filter((a) => a.status === "Confirmed").length} />
				<Kpi label="Completed" value={appointments.filter((a) => a.status === "Completed").length} />
				<Kpi label="Active Schedule" value={appointments.filter((a) => !["Cancelled", "No-show"].includes(a.status)).length} />
			</div>
			<div className="panel" style={{ marginTop: 16 }}>
				<div className="panel-head">
					<div>
						<div className="panel-title">Appointment Calendar</div>
						<div className="muted">Schedule services and manage client visits</div>
					</div>
					<div className="tools">
						<input className="input" type="date" id="appointment-date" value={date} onChange={(e) => setDate(e.target.value)} />
						<button className="btn" id="new-appointment" disabled={dis} onClick={() => setModal({ kind: "appointment", id: "", date })}>
							+ Appointment
						</button>
					</div>
				</div>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Time</th>
								<th>Customer</th>
								<th>Service</th>
								<th>Staff</th>
								<th>Status</th>
								<th>Notes</th>
								<th></th>
							</tr>
						</thead>
						<tbody id="appointment-table">
							{appointments.map((a) => (
								<tr key={a.id}>
									<td>{new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
									<td>{name(a.customerId)}</td>
									<td>{data.products.find((p) => p.id === a.serviceId)?.name || "Service removed"}</td>
									<td>{data.users.find((u) => u.id === a.staffId)?.name || "Unassigned"}</td>
									<td>
										<span className="badge">{a.status}</span>
									</td>
									<td>{a.notes || "—"}</td>
									<td>
										<button className="btn out" disabled={dis} onClick={() => setModal({ kind: "appointment", id: a.id })}>
											Edit
										</button>
									</td>
								</tr>
							))}
							{!appointments.length && (
								<tr>
									<td colSpan="7">No appointments on this date.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</>
	);
}
