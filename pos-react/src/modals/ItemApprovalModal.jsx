/**
 * "Manager approval" dialog: taking items that were already sent to the kitchen off an order needs a manager's PIN when the item's
 * category asks for it (Menu Admin, Categories).
 */
import { useEffect, useState } from "react";
import { Modal } from "../components/ui";
import { useCheckout } from "../store/CheckoutProvider";

export function ItemApprovalModal() {
	const c = useCheckout();
	const [pin, setPin] = useState("");
	const [busy, setBusy] = useState(false);
	const a = c.approval;
	useEffect(() => setPin(""), [a]);
	if (!a) return null;
	const close = () => c.setApproval(null);
	const submit = async () => {
		setBusy(true);
		try {
			await c.approveRemoval(pin);
		} finally {
			setBusy(false);
		}
	};
	return (
		<Modal
			id="item-approval-modal"
			open
			title="Manager approval"
			subtitle={`${a.removed} x ${a.line.name} ${a.removed === 1 ? "was" : "were"} already sent to the kitchen`}
			onClose={close}
			footer={
				<>
					<button className="btn out" onClick={close}>
						Cancel
					</button>
					<button className="btn gold" id="item-approval-ok" disabled={busy || !pin} onClick={submit}>
						Approve removal
					</button>
				</>
			}
		>
			<label htmlFor="item-approval-pin">Manager or owner PIN *</label>
			<input
				className="input"
				id="item-approval-pin"
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
