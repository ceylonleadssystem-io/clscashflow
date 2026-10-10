/**
 * Receipts & Refunds: open to every staff role. Find a receipt, reprint or download it, or refund / void it.
 * Owners and managers approve their own refunds and voids; everyone else enters a manager's PIN in the dialog.
 */
import { useMemo, useState } from "react";
import { money } from "../domain/format";
import { saleItemCount, statusOf } from "../domain/sales";
import { Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { useScopedData } from "../hooks/useScopedData";
import { SaleActionModal } from "../modals/SaleActionModal";

const SHOWN = 100; // rows drawn at once; search or date filters narrow the rest

export function Receipts() {
	const data = useData();
	const { sales } = useScopedData();
	const { svc } = usePos();
	const refunds = useFeature("sales.refunds");
	const voids = useFeature("sales.voids");
	const downloads = useFeature("sales.receiptDownload");
	const [q, setQ] = useState("");
	const [date, setDate] = useState("");
	const [action, setAction] = useState(null); // { id, type }

	const list = useMemo(() => {
		const query = q.trim().toLowerCase();
		const qDigits = query.replace(/\D/g, "");
		return sales.filter((s) => {
			const c = data.customers.find((x) => x.id === s.customerId);
			const hay = [s.receipt, c?.name, c?.phone, s.payment].join(" ").toLowerCase();
			const phone = String(c?.phone || "").replace(/\D/g, "");
			return (!query || hay.includes(query) || (qDigits && phone.includes(qDigits))) && (!date || String(s.date || s.createdAt || "").slice(0, 10) === date);
		});
	}, [sales, data.customers, q, date]);

	return (
		<section className="view active" id="view-receipts">
			<Panel
				title="Receipts & Refunds"
				subtitle="Find a receipt to reprint, download, refund or void. Refunds and voids by cashiers need a manager PIN."
				actions={
					<div className="tools">
						<div className="field">
							<label htmlFor="receipts-date">Date</label>
							<input className="input" type="date" id="receipts-date" value={date} onChange={(e) => setDate(e.target.value)} />
						</div>
						<input className="input" id="receipts-search" aria-label="Search receipts" placeholder="Search receipt, customer or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
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
								<th>Items</th>
								<th>Payment</th>
								<th>Total</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="receipts-table">
							{list.slice(0, SHOWN).map((s) => {
								const c = data.customers.find((x) => x.id === s.customerId);
								const status = statusOf(s);
								const active = ["completed", "partially_refunded"].includes(status);
								return (
									<tr key={s.id}>
										<td>{s.date}</td>
										<td>{s.receipt}</td>
										<td>{c?.name || "Walk-in Customer"}</td>
										<td>{saleItemCount(s)}</td>
										<td>{s.payment}</td>
										<td>{money(s.total)}</td>
										<td>
											<span className="badge">{status.replaceAll("_", " ")}</span>
										</td>
										<td>
											<div className="tools">
												<button className="btn out" onClick={() => svc.printing.printReceipt(s)}>Print</button>
												{downloads && (
													<button className="btn out" onClick={() => svc.printing.downloadReceipt(s)}>Download</button>
												)}
												{active && refunds && (
													<button className="btn out" onClick={() => setAction({ id: s.id, type: "refund" })}>Refund</button>
												)}
												{active && voids && (
													<button className="btn danger" onClick={() => setAction({ id: s.id, type: "void" })}>Void</button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
							{!list.length && (
								<tr>
									<td colSpan="8">No receipts match your search.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				{list.length > SHOWN && <div className="muted" style={{ marginTop: 8 }}>Showing the newest {SHOWN} of {list.length}. Search or pick a date to narrow the list.</div>}
			</Panel>
			<SaleActionModal target={action} onClose={() => setAction(null)} />
		</section>
	);
}
