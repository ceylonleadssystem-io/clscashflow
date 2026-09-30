import { useEffect, useState } from "react";
import { money } from "../domain/format";
import { currentCashShift, expectedCash } from "../domain/sales";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { parseNumber } from "../domain/format";
import { useData } from "../store/DataProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";

const COPY = {
	"clock-in": { title: "Clock In & Open Register", label: "How much cash is currently in the register?", button: "Clock In" },
	open: { title: "Open Cash Register", label: "Opening cash amount", button: "Open Register" },
	close: { title: "Close Cash Register", label: "Actual cash counted", button: "Close Register" },
};

/** Clock in (+ open register), open register, or close register with reconciliation. */
export function CashModal() {
	const { cashMode, closeCash } = useModals();
	const data = useData();
	const { currentUser, svc } = usePos();
	const [amount, setAmount] = useState("");
	useEffect(() => setAmount(""), [cashMode]);
	if (!cashMode) return null;
	const copy = COPY[cashMode];
	const shift = currentCashShift(data.cashShifts, currentUser?.id);
	const submit = async () => {
		const value = parseNumber(amount === "" ? "0" : amount);
		const ok =
			cashMode === "clock-in"
				? await svc.staff.clockInAndOpenRegister(value)
				: cashMode === "open"
					? await svc.staff.openRegister(value)
					: await svc.staff.closeRegister(value);
		if (ok) closeCash();
	};
	return (
		<Modal
			id="cash-modal"
			open
			title={copy.title}
			onClose={closeCash}
			footer={
				<>
					<button className="btn out" onClick={closeCash}>
						Cancel
					</button>
					<button className="btn gold" id="cash-confirm" onClick={submit}>
						{copy.button}
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="field">
					<label id="cash-amount-label">{copy.label}</label>
					<NumberInput id="cash-amount" value={amount} onChange={setAmount} autoFocus />
				</div>
				{cashMode === "close" && shift && (
					<div id="cash-close-summary" className="plan-settings">
						<div className="label">Expected in drawer</div>
						<div className="plan-settings-price">{money(expectedCash(shift, data.sales))}</div>
						<div className="plan-settings-note">Opening cash plus completed cash sales.</div>
					</div>
				)}
			</ModalBody>
		</Modal>
	);
}
