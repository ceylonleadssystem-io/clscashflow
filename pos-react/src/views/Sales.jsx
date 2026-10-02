import { useMemo, useState } from "react";
import { MANAGER_ROLES, OWNER_ROLES } from "../config/roles";
import { downloadCsv, money } from "../domain/format";
import { saleItemCount, statusOf } from "../domain/sales";
import { customerName } from "../domain/names";
import { Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { useScopedData } from "../hooks/useScopedData";
import { SaleActionModal } from "../modals/SaleActionModal";
import { createLogger } from "../utils/logger";

const log = createLogger("ui");

/** Sales history: search, date filter, reprint/download/WhatsApp, refund, void, delete. */
export function Sales() {
	const data = useData();
	const { sales } = useScopedData();
	const { role, svc } = usePos();
	const refunds = useFeature("sales.refunds");
	const voids = useFeature("sales.voids");
	const permanent = useFeature("sales.permanentDelete");
	const exportCsv = useFeature("sales.exportCsv");
	const receiptTools = useFeature("sales.receiptDownload");
	const [q, setQ] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [action, setAction] = useState(null); // { id, type }

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
								const active = ["completed", "partially_refunded"].includes(status);
								const canReverse = MANAGER_ROLES.includes(role) && active;
								const canDelete = permanent && OWNER_ROLES.includes(role) && ["refunded", "voided"].includes(status);
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
												<button className="btn out" onClick={() => svc.printing.printReceipt(s)}>
													Print
												</button>
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
												{canReverse && refunds && (
													<button className="btn out" onClick={() => setAction({ id: s.id, type: "refund" })}>
														Refund
													</button>
												)}
												{canReverse && voids && (
													<button className="btn danger" onClick={() => setAction({ id: s.id, type: "void" })}>
														Void
													</button>
												)}
												{canDelete && (
													<button type="button" className="btn danger" data-delete-sale={s.id} onClick={() => svc.sales.deleteSalePermanently(s.id)}>
														Delete
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
			</Panel>
			<SaleActionModal target={action} onClose={() => setAction(null)} />
		</section>
	);
}
