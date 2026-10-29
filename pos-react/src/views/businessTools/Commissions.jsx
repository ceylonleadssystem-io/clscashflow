/**
 * Business Tools module: staff commissions (rate per user, eligible sales, mark paid). One of the pieces of the Business Tools page (views/Industry.jsx); a business type gets it through the
 * capability named in views/businessTools/index.js. Self-contained: it reads its own data and opens its edit dialog through `setModal`.
 */
import { useMemo, useState } from "react";
import { commissionRows } from "../../domain/industry";
import { money, today } from "../../domain/format";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";

export function Commissions({ canManage }) {
	const data = useData();
	const { svc } = usePos();
	const dis = !canManage;
	const [range, setRange] = useState({ from: today().slice(0, 7) + "-01", to: today() });
	const rows = useMemo(() => commissionRows(data.users, data.sales, data.commissionPayments, range), [data.users, data.sales, data.commissionPayments, range]);
	return (
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
						{rows.map(({ u, sales, revenue, commission, paid, balance }) => (
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
	);
}
