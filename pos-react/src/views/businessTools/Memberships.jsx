/**
 * Business Tools module: customer memberships (plans, discounts, validity). One of the pieces of the Business Tools page (views/Industry.jsx); a business type gets it through the
 * capability named in views/businessTools/index.js. Self-contained: it reads its own data and opens its edit dialog through `setModal`.
 */
import { today } from "../../domain/format";
import { customerName } from "../../domain/names";
import { useData } from "../../store/DataProvider";

export function Memberships({ canManage, setModal }) {
	const data = useData();
	const dis = !canManage;
	const name = (id) => customerName(data.customers, id);
	const activeMembership = (cid) => data.memberships.find((m) => m.customerId === cid && m.status === "Active" && (!m.start || m.start <= today()) && (!m.end || m.end >= today()));
	return (
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
	);
}
