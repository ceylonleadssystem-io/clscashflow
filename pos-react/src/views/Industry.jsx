/**
 * Business Tools page (Salon / Services / Pharmacy): appointments, memberships, prescriptions, medicine
 * batches with expiry status, and staff commissions.
 */
import { useMemo, useState } from "react";
import { money, today } from "../domain/format";
import { Kpi } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { IndustryModals } from "../modals/IndustryModals";

const serviceMode = (t) => ["salon", "services"].includes(t);
const batchStatus = (b) => {
	const days = Math.ceil((new Date(b.expiry + "T23:59:59") - new Date()) / 86400000);
	return days < 0 ? "Expired" : days <= 30 ? "Expires in " + Math.max(0, days) + " days" : days <= 90 ? "Expiring soon" : "Current";
};

/** Business Tools (Salon / Services / Pharmacy): appointments, memberships, prescriptions, batches, commissions. */
export function Industry() {
	const data = useData();
	const { currentUser, svc } = usePos();
	const type = data.settings.businessType;
	const service = serviceMode(type);
	const pharmacy = type === "pharmacy";
	const canManage = ["owner", "manager"].includes(currentUser?.role);
	const [date, setDate] = useState(today());
	const [range, setRange] = useState({ from: today().slice(0, 7) + "-01", to: today() });
	const [modal, setModal] = useState(null); // {kind, id}
	const name = (id) => data.customers.find((c) => c.id === id)?.name || "Walk-in Customer";
	const appointments = useMemo(() => data.appointments.filter((a) => (a.time || "").slice(0, 10) === date).sort((a, b) => a.time.localeCompare(b.time)), [data.appointments, date]);
	const activeMembership = (cid) => data.memberships.find((m) => m.customerId === cid && m.status === "Active" && (!m.start || m.start <= today()) && (!m.end || m.end >= today()));
	const expired = data.medicineBatches.filter((b) => batchStatus(b) === "Expired").length;
	const soon = data.medicineBatches.filter((b) => batchStatus(b).indexOf("Expir") === 0 && batchStatus(b) !== "Expired").length;
	const commissionRows = data.users.map((u) => {
		const sales = data.sales.filter((s) => s.staffId === u.id && s.date >= range.from && s.date <= range.to && !["voided", "refunded"].includes(s.status));
		const revenue = sales.reduce((a, s) => a + Number(s.total || 0), 0);
		const commission = (revenue * Number(u.commissionRate || 0)) / 100;
		const paid = data.commissionPayments.filter((p) => p.userId === u.id && p.from === range.from && p.to === range.to).reduce((a, p) => a + Number(p.amount || 0), 0);
		return { u, sales, revenue, commission, paid, balance: Math.max(0, commission - paid) };
	});
	const dis = !canManage;
	return (
		<section className="view active" id="view-industry">
			<div id="industry-context-note" className="print-note" style={{ marginBottom: 14 }}>
				{service
					? "Service tools are enabled. Existing checkout, customers and receipts remain unchanged."
					: pharmacy
						? "Pharmacy records and expiry tools are enabled. Existing inventory and checkout remain unchanged."
						: "Choose Salon / Spa, Services or Pharmacy in Settings to use industry tools."}
			</div>
			{service && (
				<div id="service-tools">
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
					<div className="panel" style={{ marginTop: 16 }}>
						<div className="panel-head">
							<div>
								<div className="panel-title">Customer Memberships</div>
								<div className="muted">Plans, discounts and validity periods</div>
							</div>
							<button className="btn" id="new-membership" disabled={dis} onClick={() => setModal({ kind: "membership", id: "" })}>
								+ Membership
							</button>
						</div>
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Customer</th>
										<th>Membership</th>
										<th>Discount</th>
										<th>Period</th>
										<th>Status</th>
										<th></th>
									</tr>
								</thead>
								<tbody id="membership-table">
									{data.memberships.map((m) => {
										const active = activeMembership(m.customerId);
										return (
											<tr key={m.id}>
												<td>{name(m.customerId)}</td>
												<td>
													<strong>{m.name}</strong>
												</td>
												<td>{Number(m.discount || 0)}%</td>
												<td>
													{m.start || "—"} → {m.end || "No expiry"}
												</td>
												<td>
													<span className="badge">{active && active.id === m.id ? "Active" : m.status}</span>
												</td>
												<td>
													<button className="btn out" disabled={dis} onClick={() => setModal({ kind: "membership", id: m.id })}>
														Edit
													</button>
												</td>
											</tr>
										);
									})}
									{!data.memberships.length && (
										<tr>
											<td colSpan="6">No memberships created.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
			{pharmacy && (
				<div id="pharmacy-tools">
					<div className="grid4" id="pharmacy-kpis">
						<Kpi label="Prescriptions" value={data.prescriptions.length} />
						<Kpi label="Pending" value={data.prescriptions.filter((p) => p.status === "Pending").length} />
						<Kpi label="Expiring ≤ 90 Days" value={soon} />
						<Kpi label="Expired Batches" value={expired} />
					</div>
					<div className="panel" style={{ marginTop: 16 }}>
						<div className="panel-head">
							<div>
								<div className="panel-title">Prescription Records</div>
								<div className="muted">Customer prescription references and fulfilment status</div>
							</div>
							<button className="btn" id="new-prescription" disabled={dis} onClick={() => setModal({ kind: "prescription", id: "" })}>
								+ Prescription
							</button>
						</div>
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Date</th>
										<th>Customer</th>
										<th>Reference</th>
										<th>Prescriber</th>
										<th>Medicine / Notes</th>
										<th>Status</th>
										<th></th>
									</tr>
								</thead>
								<tbody id="prescription-table">
									{data.prescriptions
										.slice()
										.sort((a, b) => b.date.localeCompare(a.date))
										.map((p) => (
											<tr key={p.id}>
												<td>{p.date}</td>
												<td>{name(p.customerId)}</td>
												<td>
													<strong>{p.reference}</strong>
												</td>
												<td>{p.prescriber || "—"}</td>
												<td>{p.notes || "—"}</td>
												<td>
													<span className="badge">{p.status}</span>
												</td>
												<td>
													<button className="btn out" disabled={dis} onClick={() => setModal({ kind: "prescription", id: p.id })}>
														Edit
													</button>
												</td>
											</tr>
										))}
									{!data.prescriptions.length && (
										<tr>
											<td colSpan="7">No prescription records.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
					<div className="panel" style={{ marginTop: 16 }}>
						<div className="panel-head">
							<div>
								<div className="panel-title">Medicine Batches & Expiry</div>
								<div className="muted">Track batch quantities and upcoming expiry dates</div>
							</div>
							<button className="btn" id="new-batch" disabled={dis} onClick={() => setModal({ kind: "batch", id: "" })}>
								+ Batch
							</button>
						</div>
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Medicine</th>
										<th>Batch</th>
										<th>Quantity</th>
										<th>Received</th>
										<th>Expiry</th>
										<th>Status</th>
										<th></th>
									</tr>
								</thead>
								<tbody id="medicine-batch-table">
									{data.medicineBatches
										.slice()
										.sort((a, b) => a.expiry.localeCompare(b.expiry))
										.map((b) => (
											<tr key={b.id}>
												<td>{data.inventory.find((i) => i.id === b.itemId)?.name || "Item removed"}</td>
												<td>
													<strong>{b.batchNumber}</strong>
												</td>
												<td>{Number(b.quantity).toLocaleString()}</td>
												<td>{b.received || "—"}</td>
												<td>{b.expiry}</td>
												<td>
													<span className="badge">{batchStatus(b)}</span>
												</td>
												<td>
													<button className="btn out" disabled={dis} onClick={() => setModal({ kind: "batch", id: b.id })}>
														Edit
													</button>
												</td>
											</tr>
										))}
									{!data.medicineBatches.length && (
										<tr>
											<td colSpan="7">No medicine batches.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
			<div className="panel" style={{ marginTop: 16 }}>
				<div className="panel-head">
					<div>
						<div className="panel-title">Staff Commissions</div>
						<div className="muted">Set rates and calculate commission from completed sales</div>
					</div>
					<div className="range-fields">
						<input className="input" type="date" id="commission-from" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
						<input className="input" type="date" id="commission-to" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
					</div>
				</div>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Staff</th>
								<th>Rate</th>
								<th>Eligible Sales</th>
								<th>Commission</th>
								<th>Paid</th>
								<th>Balance</th>
								<th></th>
							</tr>
						</thead>
						<tbody id="commission-table">
							{commissionRows.map(({ u, sales, revenue, commission, paid, balance }) => (
								<tr key={u.id}>
									<td>
										<strong>{u.name}</strong>
										<br />
										<span className="muted">{u.role}</span>
									</td>
									<td>
										<input
											className="input commission-rate"
											style={{ width: 90 }}
											type="number"
											min="0"
											max="100"
											step="0.01"
											defaultValue={Number(u.commissionRate || 0)}
											disabled={dis}
											onBlur={(e) => svc.industry.setCommissionRate(u.id, e.target.value)}
										/>
										%
									</td>
									<td>
										{money(revenue)}
										<br />
										<span className="muted">{sales.length} sale(s)</span>
									</td>
									<td>{money(commission)}</td>
									<td>{money(paid)}</td>
									<td>
										<strong>{money(balance)}</strong>
									</td>
									<td>
										<button className="btn out commission-paid" disabled={balance <= 0 || dis} onClick={() => svc.industry.recordCommissionPayment(u.id, balance, range.from, range.to)}>
											Mark Paid
										</button>
									</td>
								</tr>
							))}
							{!data.users.length && (
								<tr>
									<td colSpan="7">No staff users.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
			<IndustryModals modal={modal} onClose={() => setModal(null)} />
		</section>
	);
}
