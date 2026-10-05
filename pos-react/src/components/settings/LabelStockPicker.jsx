import { LABEL_GAPS, LABEL_SIZES, resolveLabelStock } from "../../services/printing/labelPrinter";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";

/**
 * Size and gap of the label roll loaded in the USB label printer, saved in settings.labelStock and used for every
 * print job and calibration. A wrong value here makes the printer feed a blank label between prints.
 */
export function LabelStockPicker() {
	const { svc } = usePos();
	const { settings } = useData();
	const stock = resolveLabelStock(settings.labelStock);
	const size = `${stock.width}x${stock.height}`;
	const sizes = LABEL_SIZES.includes(size) ? LABEL_SIZES : [size, ...LABEL_SIZES];
	const gaps = LABEL_GAPS.includes(stock.gap) ? LABEL_GAPS : [stock.gap, ...LABEL_GAPS];
	const save = (patch) => svc.settings.patchSettings({ labelStock: { ...stock, ...patch } });
	return (
		<div className="label-stock-picker">
			<div className="form-grid">
				<div className="field">
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
						{sizes.map((s) => (
							<option key={s} value={s}>
								{s.replace("x", " × ")} mm
							</option>
						))}
					</select>
				</div>
				<div className="field">
					<label htmlFor="label-stock-gap">Gap between labels</label>
					<select className="input" id="label-stock-gap" value={stock.gap} onChange={(e) => save({ gap: Number(e.target.value) })}>
						{gaps.map((g) => (
							<option key={g} value={g}>
								{g} mm
							</option>
						))}
					</select>
				</div>
			</div>
			<div className="plan-settings-note">Must match the labels in the printer. If every other label comes out blank, set the real size and gap here, then press Calibrate Label Gap.</div>
		</div>
	);
}
