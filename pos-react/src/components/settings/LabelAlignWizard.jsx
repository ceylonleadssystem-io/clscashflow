import { useEffect, useRef, useState } from "react";
import { Modal, ModalBody } from "../ui";
import { alignmentAdjust, drawAlignmentLabel, labelPrinter, resolveLabelStock } from "../../services/printing/labelPrinter";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useUi } from "../../store/UiProvider";

const SIDES = [
	["top", "Top"],
	["bottom", "Bottom"],
	["left", "Left"],
	["right", "Right"],
];

/**
 * Guided label alignment: prints the calibration label, asks whether it is aligned, and if not asks which sides are
 * cut off and by how many mm, moves the content by that much, prints again and asks again until the user says yes.
 * The shift is saved with settings.labelStock after every round.
 */
export function LabelAlignWizard({ onClose }) {
	const { svc } = usePos();
	const { settings } = useData();
	const ui = useUi();
	const [step, setStep] = useState("start"); // start | ask | sides | done
	const [sides, setSides] = useState({});
	const [rounds, setRounds] = useState(0);
	const [busy, setBusy] = useState(false);
	const stock = resolveLabelStock(settings.labelStock);
	const preview = useRef(null);

	useEffect(() => {
		const host = preview.current;
		if (!host) return;
		const canvas = drawAlignmentLabel([String(stock.width), String(stock.height)], stock);
		canvas.setAttribute("role", "img");
		canvas.setAttribute("aria-label", `Preview of the ${stock.width} × ${stock.height} mm calibration label`);
		host.replaceChildren(canvas);
	}, [stock.width, stock.height, stock.offsetX, stock.offsetY, step]);

	const print = async (next) => {
		setBusy(true);
		try {
			await labelPrinter.printAlignment(settings.barcodePrinter || {}, next);
			setRounds((r) => r + 1);
			setStep("ask");
		} catch (e) {
			await ui.alert("The calibration label was not printed. " + (e.message || "Connect the USB label printer first."));
		} finally {
			setBusy(false);
		}
	};

	const applyAndPrint = async () => {
		const adj = alignmentAdjust(stock, sides);
		if (!adj.any) return void (await ui.alert("Enter how many millimetres are missing on at least one side."));
		if (adj.clash)
			return void (await ui.alert("Both opposite sides are cut off, so moving the label cannot fix it. Check that the selected label size matches the labels in the printer, press Calibrate Label Gap, then start again."));
		const next = { ...stock, offsetX: adj.offsetX, offsetY: adj.offsetY };
		await svc.settings.patchSettings({ labelStock: next });
		setSides({});
		await print(next);
	};

	return (
		<Modal id="label-align-wizard" open title="Align label printer" subtitle={`${stock.width} × ${stock.height} mm labels`} onClose={onClose} boxStyle={{ width: "min(560px,100%)" }}>
			<ModalBody>
				<div className="label-test-canvas" ref={preview} />
				{step === "start" && (
					<>
						<p>
							Load the labels, make sure the size above is the size of the labels in the printer, then print the calibration label. It has a border on the very edge of the label, a ruler and a cross in the middle.
						</p>
						<button className="btn" id="align-print" onClick={() => print(stock)} disabled={busy}>
							{busy ? "Printing…" : "Print calibration label"}
						</button>
					</>
				)}
				{step === "ask" && (
					<>
						<p>
							<strong>Is the printed label aligned properly?</strong> All four edges of the border are visible and the cross is in the middle.
						</p>
						<div className="tools">
							<button className="btn gold" id="align-yes" onClick={() => setStep("done")}>
								Yes, it is aligned
							</button>
							<button className="btn out" id="align-no" onClick={() => setStep("sides")}>
								No
							</button>
						</div>
					</>
				)}
				{step === "sides" && (
					<>
						<p>
							<strong>Which sides are cut off or missing?</strong> Count the ruler marks (1 mm each) that are missing at each side. Leave a side empty if it is fine.
						</p>
						<div className="form-grid">
							{SIDES.map(([key, label]) => (
								<div className="field" key={key}>
									<label htmlFor={"align-" + key}>{label} (mm missing)</label>
									<input
										className="input"
										id={"align-" + key}
										type="number"
										inputMode="decimal"
										min="0"
										max="10"
										step="0.5"
										placeholder="0"
										value={sides[key] ?? ""}
										onChange={(e) => setSides({ ...sides, [key]: e.target.value })}
									/>
								</div>
							))}
						</div>
						<div className="tools">
							<button className="btn gold" id="align-apply" onClick={applyAndPrint} disabled={busy}>
								{busy ? "Printing…" : "Apply and print again"}
							</button>
							<button className="btn out" onClick={() => setStep("ask")} disabled={busy}>
								Back
							</button>
						</div>
					</>
				)}
				{step === "done" && (
					<>
						<p id="align-done">
							<strong>Alignment saved.</strong> Shift: left/right {stock.offsetX > 0 ? "+" : ""}
							{stock.offsetX.toFixed(1)} mm, up/down {stock.offsetY > 0 ? "+" : ""}
							{stock.offsetY.toFixed(1)} mm{rounds > 1 ? ` (after ${rounds} test labels)` : ""}. Print a product label to check it.
						</p>
						<button className="btn gold" onClick={onClose}>
							Done
						</button>
					</>
				)}
			</ModalBody>
		</Modal>
	);
}
