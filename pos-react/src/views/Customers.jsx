import { useMemo, useState } from "react";
import { CUSTOMER_TYPES } from "../config/constants";
import { customerStats } from "../domain/analytics";
import { cap, money } from "../domain/format";
import { Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useCheckout } from "../store/CheckoutProvider";

/** Customer directory with search and type/activity filters. */
export function Customers() {
	const data = useData();
	const { setCustomerModal } = useCheckout();
	const [q, setQ] = useState("");
	const [type, setType] = useState("all");
	const [activity, setActivity] = useState("all");
	const rows = useMemo(() => {
		const search = q.trim().toLowerCase();
		return data.customers
			.map((c) => ({ c, s: customerStats(c.id, data.sales, data.customers) }))
			.filter(({ c, s }) => {
				const text = [c.name, c.phone, c.email, c.company, c.tags].join(" ").toLowerCase();
				return (
					(!search || text.includes(search)) &&
					(type === "all" || (c.type || "regular") === type) &&
					(activity === "all" || (activity === "purchased" && s.visits > 0) || (activity === "new" && s.visits === 0) || (activity === "discount" && c.discountEligible))
				);
			});
	}, [data.customers, data.sales, q, type, activity]);
	return (
		<section className="view active" id="view-customers">
			<Panel
				title="Customers"
				subtitle="Customer details and purchase history"
				actions={
					<button className="btn" onClick={() => setCustomerModal({ id: "", phone: "", source: "directory" })}>
						+ Add Customer
					</button>
				}
			>
				<div className="customer-directory-tools">
					<input className="input" id="customer-directory-search" placeholder="Search name, phone, email, company or tag" value={q} onChange={(e) => setQ(e.target.value)} />
					<select className="input" id="customer-type-filter" value={type} onChange={(e) => setType(e.target.value)}>
						<option value="all">All customer types</option>
						{CUSTOMER_TYPES.map((t) => (
							<option key={t} value={t}>
								{cap(t)}
							</option>
						))}
					</select>
					<select className="input" id="customer-activity-filter" value={activity} onChange={(e) => setActivity(e.target.value)}>
						<option value="all">All activity</option>
						<option value="purchased">Has purchases</option>
						<option value="new">No purchases yet</option>
						<option value="discount">Discount eligible</option>
					</select>
					<button
						className="btn out"
						type="button"
						onClick={() => {
							setQ("");
							setType("all");
							setActivity("all");
						}}
					>
						Clear
					</button>
				</div>
				<div className="customer-result-count" id="customer-result-count">
					{rows.length} of {data.customers.length} customers
				</div>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Name</th>
								<th>Email</th>
								<th>Phone</th>
								<th>Type</th>
								<th>Visits</th>
								<th>Total Spent</th>
								<th></th>
							</tr>
						</thead>
						<tbody id="customer-table">
							{rows.map(({ c, s }) => (
								<tr key={c.id}>
									<td>
										<strong>{c.name}</strong>
										{c.company && <small className="table-subcategory">{c.company}</small>}
									</td>
									<td>{c.email || "—"}</td>
									<td>{c.phone || "—"}</td>
									<td>
										<span className="badge">{cap(c.type || "regular")}</span>
									</td>
									<td>{s.visits}</td>
									<td>{money(s.spent)}</td>
									<td>
										<button className="btn out" onClick={() => setCustomerModal({ id: c.id, phone: "", source: "directory" })}>
											Edit
										</button>
									</td>
								</tr>
							))}
							{!rows.length && (
								<tr>
									<td colSpan="7">
										<div className="empty">No customers match these filters.</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Panel>
		</section>
	);
}
