/**
 * Business Tools module: medicine batches and expiry. One of the pieces of the Business Tools page (views/Industry.jsx); a business type gets it through the
 * capability named in views/businessTools/index.js. Self-contained: it reads its own data and opens its edit dialog through `setModal`.
 */
import { batchStatus } from "../../domain/industry";
import { useData } from "../../store/DataProvider";

export function MedicineBatches({ canManage, setModal }) {
	const data = useData();
	const dis = !canManage;
	return (
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
	);
}
