/**
 * "Connect via Print Helper": lists the printers Windows has (through the print helper app on this computer) and remembers the one chosen for
 * barcode labels. Use it when the browser is refused direct USB access to the printer ("Access denied").
 */
import { useEffect, useState } from "react";
import { Modal } from "../ui";
import { HELPER_NAME, HELPER_URL, helperPrinters } from "../../services/printing/printBridge";

export function PrintHelperPicker({ open, current, onClose, onPick }) {
	const [state, setState] = useState({ phase: "loading", printers: [], error: "" });
	const [name, setName] = useState("");
	useEffect(() => {
		if (!open) return undefined;
		let live = true;
		setState({ phase: "loading", printers: [], error: "" });
		helperPrinters()
			.then((printers) => {
				if (!live) return;
				setState({ phase: "ready", printers, error: "" });
				setName(printers.includes(current) ? current : printers.find((p) => /xp-?365|label|barcode|tsc|xprinter/i.test(p)) || printers[0] || "");
			})
			.catch((e) => live && setState({ phase: "error", printers: [], error: e.message }));
		return () => {
			live = false;
		};
	}, [open, current]);
	const { phase, printers, error } = state;
	return (
		<Modal
			id="print-helper-modal"
			open={open}
			title="Connect via Print Helper"
			subtitle={"Sends the label commands through the Windows printer driver, using the free " + HELPER_NAME + " app on this computer."}
			onClose={onClose}
			footer={
				<>
					<button type="button" className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button type="button" className="btn gold" id="print-helper-use" disabled={phase !== "ready" || !name} onClick={() => onPick(name)}>
						Use this printer
					</button>
				</>
			}
		>
			<div className="modal-body" aria-live="polite">
				{phase === "loading" && <p className="muted">Looking for the print helper and the printers on this computer…</p>}
				{phase === "error" && (
					<>
						<p role="alert">{error}</p>
						<p className="muted">
							Get it from{" "}
							<a href={HELPER_URL} target="_blank" rel="noopener noreferrer">
								{HELPER_URL.replace("https://", "")}
							</a>
							. After installing, start it (it sits in the system tray) and press Cancel, then Connect via Print Helper again. The first time, {HELPER_NAME} asks to allow this site: choose Allow and tick Remember this decision.
						</p>
					</>
				)}
				{phase === "ready" && (
					<div className="field">
						<label htmlFor="print-helper-printer">Label printer</label>
						<select id="print-helper-printer" className="input" value={name} onChange={(e) => setName(e.target.value)}>
							{printers.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
						{!printers.length && <p className="muted">The helper found no printers. Install the printer's Windows driver first.</p>}
					</div>
				)}
			</div>
		</Modal>
	);
}
