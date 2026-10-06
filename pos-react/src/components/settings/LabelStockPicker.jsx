import { useState } from "react";
import { LABEL_SIZES, resolveLabelStock } from "../../services/printing/labelPrinter";
import { LabelAlignWizard } from "./LabelAlignWizard";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";

/**
 * Size of the label roll loaded in the USB label printer (30 × 20, 38 × 25, 50 × 25 or 60 × 40 mm, 3 mm gap), saved in
 * settings.labelStock and used for every print job and calibration, plus the button that opens the guided alignment
 * wizard (which saves the shift). A wrong size makes the printer feed a blank label between prints; a wrong shift crops
 * one edge of the barcode or leaves it off-centre.
 */
export function LabelStockPicker() {
	const { svc } = usePos();
	const { settings } = useData();
	const stock = resolveLabelStock(settings.labelStock);
	const size = `${stock.width}x${stock.height}`;
	const [aligning, setAligning] = useState(false);
	const save = (patch) => svc.settings.patchSettings({ labelStock: { ...stock, ...patch } });
	return (
		<div className="label-stock-picker">
			<div className="field" style={{ maxWidth: 360 }}>
				<label htmlFor="label-stock-size">Label size</label>
				<select
					className="input"
					id="label-stock-size"
					value={size}
					onChange={(e) => {
						const [width, height] = e.target.value.split("x").map(Number);
						save({ width, height });
					}}
				>
					{LABEL_SIZES.map((s) => (
						<option key={s} value={s}>
							{s.replace("x", " × ")} mm
						</option>
					))}
				</select>
			</div>
			<div className="plan-settings-note">Must match the labels in the printer (the gap between labels is 3 mm). If every other label comes out blank, pick the real size here, then press Calibrate Label Gap.</div>
			<button type="button" className="btn out" id="label-alignment-test" onClick={() => setAligning(true)} style={{ marginTop: 10 }}>
				Align label printer…
			</button>
			{aligning && <LabelAlignWizard onClose={() => setAligning(false)} />}
		</div>
	);
}
