/**
 * Refund (full or partial by line) or void a completed sale, with the refund amount preview and a mandatory reason.
 */
import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { money } from "../domain/format";
import { calculateRefundAmount, refundableLines, selectedRefundLines } from "../domain/sales";
import { customerName } from "../domain/names";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

/** Refund (full / partial by line) or void a completed sale, with a mandatory reason. */
export function SaleActionModal({ target, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const [reason, setReason] = useState("");
	const [refundType, setRefundType] = useState("full");
	const [choices, setChoices] = useState({}); // lineIndex -> qty
	useEffect(() => {
		setReason("");
		setRefundType("full");
		setChoices({});
	}, [target?.id, target?.type]);
	const sale = target && data.sales.find((s) => s.id === target.id);
	if (!target || !sale) return null;
	const refund = target.type === "refund";
	const rows = refundableLines(sale);
	const lines = selectedRefundLines(sale, refundType, choices);
	const amount = calculateRefundAmount(sale, refundType, lines);
	const confirm = async () => {
		if (await svc.sales.reverseSale({ saleId: sale.id, type: target.type, reason, refundType, choices })) onClose();
	};
	return (
		<Modal
			id="sale-action-modal"
			open
			title={refund ? "Refund Sale" : "Void Sale"}
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn danger" id="sale-action-confirm" onClick={confirm}>
						{refund ? "Confirm Refund" : "Confirm Void"}
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="plan-settings" id="sale-action-summary">
					<div className="label">{sale.receipt}</div>
					<div className="plan-settings-price">{money(sale.total)} remaining</div>
					<div className="plan-settings-note">
						{customerName(data.customers, sale.customerId)} · {sale.payment}
					</div>
				</div>
				{refund && (
					<div id="refund-options">
						<div className="field" style={{ marginTop: 14 }}>
							<label>Refund Type</label>
							<select className="input" id="refund-type" value={refundType} onChange={(e) => setRefundType(e.target.value)}>
								<option value="full">Full refund</option>
								<option value="partial">Partial refund</option>
							</select>
						</div>
						<div id="refund-line-choices" style={{ display: "grid", gap: 8, marginTop: 12 }}>
							{refundType === "partial" ? (
								rows.map((x) => {
									const on = choices[x.lineIndex] != null;
									return (
										<div className="modifier-assignment" data-line-index={x.lineIndex} key={x.lineIndex}>
											<label>
												<input
													type="checkbox"
													checked={on}
													onChange={(e) =>
														setChoices((c) => {
															const n = { ...c };
															if (e.target.checked) n[x.lineIndex] = 1;
															else delete n[x.lineIndex];
															return n;
														})
													}
												/>{" "}
												{x.line.name} <span className="muted">{money(x.line.price)} each</span>
											</label>
											<input
												className="input"
												type="number"
												min="1"
												max={x.available}
												value={choices[x.lineIndex] ?? 1}
												disabled={!on}
												onChange={(e) => setChoices((c) => ({ ...c, [x.lineIndex]: e.target.value }))}
												aria-label={"Refund quantity for " + x.line.name}
											/>
										</div>
									);
								})
							) : (
								<div className="print-note">Every remaining item and the remaining paid balance will be refunded.</div>
							)}
						</div>
						<div className="plan-total">
							<span>Refund amount</span>
							<span id="refund-amount">{money(amount)}</span>
						</div>
					</div>
				)}
				<div className="field" style={{ marginTop: 14 }}>
					<label>Reason *</label>
					<textarea className="input" id="sale-action-reason" placeholder="Enter the reason for this action" value={reason} onChange={(e) => setReason(e.target.value)} />
				</div>
			</ModalBody>
		</Modal>
	);
}
