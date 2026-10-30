/**
 * Cash register dialog: clock in (the register opens with the opening cash) and clock out (the register closes with the
 * expected-versus-counted reconciliation). There is no separate open or close register step.
 */
import { useEffect, useState } from "react";
import { money } from "../domain/format";
import { currentCashShift, expectedCash } from "../domain/sales";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { parseNumber } from "../domain/format";
import { useData } from "../store/DataProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";

const COPY = {
	"clock-in": { title: "Clock In & Open Register", label: "How much cash is currently in the register?", button: "Clock In" },
	"clock-out": { title: "Clock Out & Close Register", label: "Actual cash counted", button: "Clock Out" },
};

/** Clock in (+ open register) or clock out (+ close register with reconciliation). */
export function CashModal() {
	const { cashMode, closeCash } = useModals();
	const data = useData();
	const { currentUser, svc, go, canView } = usePos();
	const ui = useUi();
	const [amount, setAmount] = useState("");
	useEffect(() => setAmount(""), [cashMode]);
	if (!cashMode) return null;
	const copy = COPY[cashMode];
	const shift = currentCashShift(data.cashShifts, currentUser?.id);
	const submit = async () => {
		const value = parseNumber(amount === "" ? "0" : amount);
		const ok = cashMode === "clock-in" ? await svc.staff.clockInAndOpenRegister(value) : await svc.staff.clockOut(value);
		if (!ok) return;
		closeCash();
		// end of the day: offer the End of Day report (Reports page) to whoever may see it
		if (cashMode === "clock-out" && canView("reports") && (await ui.confirm("Clocked out and register closed. Open the End of Day report?"))) go("reports");
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
				{cashMode === "clock-out" && shift && (
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
