/**
 * The two dialogs of the Online Orders page: Decline (reason, and what Shopify should do) and Fulfill / Tracking (delivery company,
 * number and link, and whether Shopify e-mails the customer).
 */
import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { CARRIERS, DECLINE_REASONS, trackingError } from "../domain/onlineFlow";

const label = (order) => order?.platformOrderId || order?.orderNumber || "";

export function DeclineOrderModal({ order, busy, onClose, onDecline }) {
	const [reason, setReason] = useState("out_of_stock");
	const [note, setNote] = useState("");
	const [refund, setRefund] = useState(true);
	const [restock, setRestock] = useState(true);
	const [notify, setNotify] = useState(true);
	useEffect(() => {
		setReason("out_of_stock");
		setNote("");
		setRefund(true);
		setRestock(true);
		setNotify(true);
	}, [order?.id]);
	return (
		<Modal
			id="decline-online-order"
			open={!!order}
			title={"Decline " + label(order)}
			subtitle="The order is cancelled here and in Shopify."
			onClose={onClose}
			footer={
				<>
					<button className="btn out" type="button" onClick={onClose}>
						Keep order
					</button>
					<button className="btn danger" type="button" id="decline-confirm" disabled={busy} onClick={() => onDecline({ reason, note, refund, restock, notify })}>
						Decline order
					</button>
				</>
			}
		>
			<ModalBody style={{ display: "grid", gap: 12 }}>
				<div className="field">
					<label htmlFor="decline-reason">Reason</label>
					<select className="input" id="decline-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
						{DECLINE_REASONS.map((r) => (
							<option key={r.value} value={r.value}>
								{r.label}
							</option>
						))}
					</select>
				</div>
				<div className="field">
					<label htmlFor="decline-note">Note (optional)</label>
					<input className="input" id="decline-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
				</div>
				<label style={{ display: "flex", gap: 8, alignItems: "center" }}>
					<input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} /> Refund the customer in Shopify
				</label>
				<label style={{ display: "flex", gap: 8, alignItems: "center" }}>
					<input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} /> Put the items back in Shopify stock
				</label>
				<label style={{ display: "flex", gap: 8, alignItems: "center" }}>
					<input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> E-mail the customer about the cancellation
				</label>
			</ModalBody>
		</Modal>
	);
}

/** `fulfil` true: marks the order fulfilled with this tracking; false: only adds or changes the tracking. */
export function FulfillOrderModal({ order, fulfil, busy, onClose, onSave }) {
	const t = order?.online?.tracking || {};
	const [company, setCompany] = useState("");
	const [number, setNumber] = useState("");
	const [url, setUrl] = useState("");
	const [notify, setNotify] = useState(true);
	useEffect(() => {
		setCompany(t.company || "");
		setNumber(t.number || "");
		setUrl(t.url || "");
		setNotify(true);
	}, [order?.id, fulfil]); // eslint-disable-line react-hooks/exhaustive-deps
	const tracking = { company, number, url };
	const problem = trackingError(tracking);
	return (
		<Modal
			id="fulfill-online-order"
			open={!!order}
			title={(fulfil ? "Fulfill " : "Tracking for ") + label(order)}
			subtitle={fulfil ? "Marks the order paid and fulfilled here and in Shopify. Tracking is optional." : "The customer can be told in Shopify."}
			onClose={onClose}
			footer={
				<>
					<button className="btn out" type="button" onClick={onClose}>
						Cancel
					</button>
					<button className="btn gold" type="button" id="fulfill-confirm" disabled={busy || !!problem} onClick={() => onSave({ tracking, notify })}>
						{fulfil ? "Mark fulfilled" : "Save tracking"}
					</button>
				</>
			}
		>
			<ModalBody style={{ display: "grid", gap: 12 }}>
				<div className="field">
					<label htmlFor="track-company">Delivery company</label>
					<input className="input" id="track-company" list="track-carriers" value={company} maxLength={60} onChange={(e) => setCompany(e.target.value)} placeholder="Choose or type" />
					<datalist id="track-carriers">
						{CARRIERS.map((c) => (
							<option key={c} value={c} />
						))}
					</datalist>
				</div>
				<div className="field">
					<label htmlFor="track-number">Tracking number</label>
					<input className="input" id="track-number" value={number} maxLength={80} onChange={(e) => setNumber(e.target.value)} />
				</div>
				<div className="field">
					<label htmlFor="track-url">Tracking link (optional)</label>
					<input className="input" id="track-url" type="url" value={url} maxLength={400} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
				</div>
				{problem && (
					<div role="alert" className="ceylo-error">
						{problem}
					</div>
				)}
				<label style={{ display: "flex", gap: 8, alignItems: "center" }}>
					<input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> E-mail the customer from Shopify
				</label>
			</ModalBody>
		</Modal>
	);
}
