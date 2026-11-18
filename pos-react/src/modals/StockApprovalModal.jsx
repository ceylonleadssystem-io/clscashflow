/**
 * "Manager approval" dialog: an item whose stock or ingredients are short can still go on the order when a manager or owner enters their PIN.
 */
import { useEffect, useState } from "react";
import { Modal } from "../components/ui";
import { useCheckout } from "../store/CheckoutProvider";

export function StockApprovalModal() {
	const c = useCheckout();
	const [pin, setPin] = useState("");
	const [busy, setBusy] = useState(false);
	const a = c.stockApproval;
	useEffect(() => setPin(""), [a]);
	if (!a) return null;
	const close = () => c.setStockApproval(null);
	const submit = async () => {
		setBusy(true);
		try {
			await c.approveStock(pin);
		} finally {
			setBusy(false);
		}
	};
	return (
		<Modal
			id="stock-approval-modal"
			open
			title="Manager approval"
			subtitle={a.message}
			onClose={close}
			footer={
				<>
					<button className="btn out" onClick={close}>
						Cancel
					</button>
					<button className="btn gold" id="stock-approval-ok" disabled={busy || !pin} onClick={submit}>
						Approve and add
					</button>
				</>
			}
		>
			<p className="muted">A manager or owner can approve selling it anyway. The stock will show as short until it is topped up.</p>
			<label htmlFor="stock-approval-pin">Manager or owner PIN *</label>
			<input
				className="input"
				id="stock-approval-pin"
				type="password"
				inputMode="numeric"
				autoComplete="off"
				maxLength={6}
				autoFocus
				placeholder="PIN of the person approving this"
				value={pin}
				onChange={(e) => setPin(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && pin && submit()}
			/>
		</Modal>
	);
}
