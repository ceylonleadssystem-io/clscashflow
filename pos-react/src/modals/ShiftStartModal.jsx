import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { activeTimeEntry, currentCashShift } from "../domain/sales";
import { useData } from "../store/DataProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";

/** Offered right after sign-in according to the user's clock-in / register behaviour. */
export function ShiftStartModal() {
	const { shiftStart, setShiftStart, go, welcomeUser } = usePos();
	const { openCash } = useModals();
	const data = useData();
	const user = shiftStart;
	const needsClock = user && !activeTimeEntry(data.timeEntries, user.id) && user.clockInBehaviour !== "manual";
	const needsRegister = user && !currentCashShift(data.cashShifts, user.id) && user.registerBehaviour !== "manual";

	// "Clock in automatically": open the clock-in dialog straight away
	useEffect(() => {
		if (user && user.clockInBehaviour === "automatic" && !activeTimeEntry(data.timeEntries, user.id)) {
			openCash("clock-in");
			setShiftStart(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	if (!user || welcomeUser) return null; // the welcome message comes first
	const automatic = user.clockInBehaviour === "automatic";
	const showClock = needsClock && !automatic;
	if (!showClock && !needsRegister) return null;
	return (
		<Modal id="signin-shift-modal" open title="Start your shift" subtitle="Choose what you need for this session." closable={false}>
			<ModalBody>
				<p>
					Signed in as <strong>{user.name}</strong>.
				</p>
				<div className="signin-shift-actions">
					{showClock && (
						<button
							className="btn gold"
							type="button"
							onClick={() => {
								// hand over to the "Clock In & Open Register" dialog
								setShiftStart(null);
								openCash("clock-in");
							}}
						>
							Clock In
						</button>
					)}
					{needsRegister && (
						<button
							className="btn"
							type="button"
							onClick={() => {
								setShiftStart(null);
								go("staff");
								openCash(activeTimeEntry(data.timeEntries, user.id) ? "open" : "clock-in");
							}}
						>
							Open Register
						</button>
					)}
					<button className="btn out wide" type="button" onClick={() => setShiftStart(null)}>
						Continue without these
					</button>
				</div>
			</ModalBody>
		</Modal>
	);
}
