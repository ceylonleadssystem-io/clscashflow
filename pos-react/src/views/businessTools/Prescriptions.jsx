/**
 * Business Tools module: prescription records, with the pharmacy KPIs (prescriptions, pending, expiring and expired batches). One of the pieces of the Business Tools page (views/Industry.jsx); a business type gets it through the
 * capability named in views/businessTools/index.js. Self-contained: it reads its own data and opens its edit dialog through `setModal`.
 */
import { Kpi } from "../../components/ui";
import { batchStatus } from "../../domain/industry";
import { customerName } from "../../domain/names";
import { useData } from "../../store/DataProvider";

export function Prescriptions({ canManage, setModal }) {
	const data = useData();
	const dis = !canManage;
	const name = (id) => customerName(data.customers, id);
	const expired = data.medicineBatches.filter((b) => batchStatus(b) === "Expired").length;
	const soon = data.medicineBatches.filter((b) => batchStatus(b).indexOf("Expir") === 0 && batchStatus(b) !== "Expired").length;
	return (
		<>
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
		</>
	);
}
