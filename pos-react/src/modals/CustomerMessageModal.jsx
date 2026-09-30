import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { birthdayMessage, specialMessage } from "../services/pos/customers";

/** WhatsApp a customer (birthday / special message), logged to the communications history. */
export function CustomerMessageModal({ target, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const customer = target && data.customers.find((c) => c.id === target.id);
	const [text, setText] = useState("");
	useEffect(() => {
		if (!customer) return;
		setText(target.kind === "birthday" ? birthdayMessage(customer, data.settings.business) : specialMessage(customer, data.settings.business));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target?.id, target?.kind]);
	if (!customer) return null;
	return (
		<Modal
			id="customer-message-modal"
			open
			title="WhatsApp Customer"
			subtitle={customer.name + " · " + customer.phone}
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn gold"
						onClick={async () => {
							if (await svc.customers.sendCustomerWhatsApp(customer.id, text)) onClose();
						}}
					>
						Open WhatsApp
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="field">
					<label>Message</label>
					<textarea className="input" id="customer-message-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} />
				</div>
				<div className="print-note" style={{ marginTop: 10 }}>
					WhatsApp will open with this message prepared. Review it before pressing Send.
				</div>
			</ModalBody>
		</Modal>
	);
}
