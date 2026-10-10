/**
 * Sales History page: search and date filters, CSV export and per-sale actions (download, WhatsApp). Three tabs:
 * Transactions (receipts), Voids & deletes and Refunds. Printing, refunds and voids live on the Receipts & Refunds page.
 */
import { useMemo, useState } from "react";
import { downloadCsv, money } from "../domain/format";
import { saleItemCount, statusOf } from "../domain/sales";
import { refundRows, voidRows } from "../domain/salesLog";
import { customerName } from "../domain/names";
import { Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { useScopedData } from "../hooks/useScopedData";
import { createLogger } from "../utils/logger";

const log = createLogger("ui");

/** Sales history: search, date filter, reprint/download/WhatsApp, refund, void, delete. */
export function Sales() {
	const data = useData();
	const { sales } = useScopedData();
	const { svc, locationId } = usePos();
	const exportCsv = useFeature("sales.exportCsv");
	const receiptTools = useFeature("sales.receiptDownload");
	const [q, setQ] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [tab, setTab] = useState("transactions");

	// the Voids & deletes and Refunds tabs follow the same search and date filters as Transactions
	const matches = (row) => {
		const query = q.trim().toLowerCase();
		const hay = [row.receipt, row.payment, row.reason, row.by, row.authorizedBy, row.kind].join(" ").toLowerCase();
		return (!query || hay.includes(query)) && (!from || row.date >= from) && (!to || row.date <= to);
	};
	const voidList = useMemo(
		() => voidRows({ sales, voidOrders: data.voidOrders, openOrders: data.openOrders, audit: data.supportAudit, users: data.users, locationId }).filter(matches),
		[sales, data.voidOrders, data.openOrders, data.supportAudit, data.users, locationId, q, from, to], // eslint-disable-line react-hooks/exhaustive-deps
	);
	const refundList = useMemo(() => refundRows(sales, data.users).filter(matches), [sales, data.users, q, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

	const list = useMemo(() => {
		const query = q.trim().toLowerCase();
		const qDigits = query.replace(/\D/g, "");
		return sales.filter((s) => {
			const c = data.customers.find((x) => x.id === s.customerId);
			const hay = [s.receipt, c?.name, c?.phone, s.payment, statusOf(s)].join(" ").toLowerCase();
			const phoneDigits = String(c?.phone || "").replace(/\D/g, "");
			const date = String(s.date || s.createdAt || "").slice(0, 10);
			return (!query || hay.includes(query) || (qDigits && phoneDigits.includes(qDigits))) && (!from || date >= from) && (!to || date <= to);
		});
	}, [sales, data.customers, q, from, to]);

	const exportSales = () => {
		log.info("sales exported", { rows: data.sales.length });
		return downloadCsv(
			[
				["Date", "Receipt", "Customer", "Payment", "Revenue", "Cost", "Profit"],
				...data.sales.map((s) => [s.date, s.receipt, customerName(data.customers, s.customerId), s.payment, s.total, s.cost, s.profit]),
			],
			"pos-sales.csv",
		);
	};

	return (
		<section className="view active" id="view-sales">
			<Panel
				title="Sales History"
				subtitle="Search by receipt, customer name, mobile number or payment"
				actions={
					<div className="tools">
						<div className="sales-date-filter">
							<div className="field">
								<label>Purchased from</label>
								<input className="input" type="date" id="sales-date-from" value={from} onChange={(e) => setFrom(e.target.value)} />
							</div>
							<div className="field">
								<label>Purchased to</label>
								<input className="input" type="date" id="sales-date-to" value={to} onChange={(e) => setTo(e.target.value)} />
							</div>
							<button
								className="btn out"
								type="button"
								onClick={() => {
									setFrom("");
									setTo("");
								}}
							>
								Clear dates
							</button>
						</div>
						<input className="input" id="sales-search" placeholder="Search receipt or customer mobile" value={q} onChange={(e) => setQ(e.target.value)} />
						{exportCsv && (
							<button className="btn out" onClick={exportSales}>
								Export CSV
							</button>
						)}
					</div>
				}
			>
				<div className="settings-tabs" role="tablist" style={{ marginBottom: 14 }}>
					{[["transactions", "Transactions"], ["voids", "Voids & deletes"], ["refunds", "Refunds"]].map(([id, label]) => (
						<button key={id} type="button" role="tab" aria-selected={tab === id} id={"sales-tab-" + id} className={"settings-tab" + (tab === id ? " active" : "")} onClick={() => setTab(id)}>
							{label}
						</button>
					))}
				</div>
				{tab === "voids" && (
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Date</th>
									<th>Receipt</th>
									<th>Type</th>
									<th>Payment</th>
									<th>Reason</th>
									<th>Authorized by</th>
									<th>Total</th>
								</tr>
							</thead>
							<tbody id="voids-table">
								{voidList.map((r) => (
									<tr key={r.key}>
										<td>{r.date}</td>
										<td>{r.receipt}</td>
										<td>{r.kind}</td>
										<td>{r.payment}</td>
										<td>{r.reason || "—"}</td>
										<td>{r.by}</td>
										<td>{r.total == null ? "—" : money(r.total)}</td>
									</tr>
								))}
								{!voidList.length && (
									<tr>
										<td colSpan="7">No voided or deleted orders match.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
				{tab === "refunds" && (
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Date</th>
									<th>Receipt</th>
									<th>Payment</th>
									<th>Authorized by</th>
									<th>Reason</th>
									<th>Total</th>
								</tr>
							</thead>
							<tbody id="refunds-table">
								{refundList.map((r) => (
									<tr key={r.key}>
										<td>{r.date}</td>
										<td>{r.receipt}</td>
										<td>{r.payment}</td>
										<td>{r.authorizedBy}</td>
										<td>{r.reason || "—"}</td>
										<td>{money(r.total)}</td>
									</tr>
								))}
								{!refundList.length && (
									<tr>
										<td colSpan="6">No refunds match.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
				{tab === "transactions" && (
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Date</th>
								<th>Receipt</th>
								<th>Customer</th>
								<th>Mobile</th>
								<th>Items</th>
								<th>Payment</th>
								<th>Total</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="sales-table">
							{list.map((s) => {
								const c = data.customers.find((x) => x.id === s.customerId);
								const status = statusOf(s);
								return (
									<tr key={s.id}>
										<td>{s.date}</td>
										<td>{s.receipt}</td>
										<td>{c?.name || "Walk-in Customer"}</td>
										<td>{c?.phone || "—"}</td>
										<td>{saleItemCount(s)}</td>
										<td>{s.payment}</td>
										<td>
											{money(s.total)}
											{s.originalTotal != null && (
												<>
													<br />
													<span className="muted">Original {money(s.originalTotal)}</span>
												</>
											)}
										</td>
										<td>
											<span className="badge">{status.replaceAll("_", " ")}</span>
										</td>
										<td>
											<div className="tools">
												{receiptTools && (
													<button className="btn out" onClick={() => svc.printing.downloadReceipt(s)}>
														Download
													</button>
												)}
												{receiptTools && c?.phone && (
													<button className="btn out" onClick={() => svc.printing.shareReceiptWhatsApp(s)}>
														WhatsApp
													</button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
							{!list.length && (
								<tr>
									<td colSpan="9">No sales match your search.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				)}
			</Panel>
		</section>
	);
}
