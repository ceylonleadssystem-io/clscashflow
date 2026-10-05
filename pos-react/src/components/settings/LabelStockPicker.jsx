import { LABEL_GAPS, LABEL_SIZES, labelPrinter, resolveLabelStock } from "../../services/printing/labelPrinter";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useUi } from "../../store/UiProvider";

const STEP = 0.5;
const fmt = (v) => (v > 0 ? "+" : "") + v.toFixed(1) + " mm";

/** − / + control for a signed millimetre value. */
function Nudge({ label, hint, value, onChange, min, max, minusLabel, plusLabel }) {
	const set = (v) => onChange(Math.max(min, Math.min(max, Math.round(v * 10) / 10)));
	return (
		<div className="field">
			<label>{label}</label>
			<div className="label-nudge">
				<button type="button" className="btn out" aria-label={minusLabel} onClick={() => set(value - STEP)} disabled={value <= min}>
					−
				</button>
				<strong aria-live="polite">{fmt(value)}</strong>
				<button type="button" className="btn out" aria-label={plusLabel} onClick={() => set(value + STEP)} disabled={value >= max}>
					+
				</button>
			</div>
			<div className="plan-settings-note">{hint}</div>
		</div>
	);
}

/**
 * Size and gap of the label roll loaded in the USB label printer plus the alignment of the printed content, saved in
 * settings.labelStock and used for every print job and calibration. A wrong size/gap makes the printer feed a blank
 * label between prints; a wrong shift crops one edge of the barcode or leaves it off-centre.
 */
export function LabelStockPicker() {
	const { svc } = usePos();
	const { settings } = useData();
	const ui = useUi();
	const stock = resolveLabelStock(settings.labelStock);
	const size = `${stock.width}x${stock.height}`;
	const sizes = LABEL_SIZES.includes(size) ? LABEL_SIZES : [size, ...LABEL_SIZES];
	const gaps = LABEL_GAPS.includes(stock.gap) ? LABEL_GAPS : [stock.gap, ...LABEL_GAPS];
	const save = (patch) => svc.settings.patchSettings({ labelStock: { ...stock, ...patch } });
	const test = async () => {
		try {
			await labelPrinter.printAlignment(settings.barcodePrinter || {}, settings.labelStock);
			ui.notice("Alignment test label sent. Check which edges are cut, adjust the shift, and print it again.");
		} catch (e) {
			await ui.alert("The alignment label was not printed. " + (e.message || "Connect the USB label printer first."));
		}
	};
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
			<div className="form-grid" style={{ marginTop: 10 }}>
				<Nudge
					label="Move left / right"
					hint="Barcode cut on the left or sitting too far left: press +. Cut on the right: press −."
					value={stock.offsetX}
					min={-10}
					max={10}
					minusLabel="Move content left"
					plusLabel="Move content right"
					onChange={(v) => save({ offsetX: v })}
				/>
				<Nudge
					label="Move up / down"
					hint="Top cut off: press +. Bottom cut off: press −."
					value={stock.offsetY}
					min={-6}
					max={6}
					minusLabel="Move content up"
					plusLabel="Move content down"
					onChange={(v) => save({ offsetY: v })}
				/>
				<div className="field">
					<label htmlFor="label-stock-margin">Side margin</label>
					<select className="input" id="label-stock-margin" value={stock.marginMm == null ? "" : String(stock.marginMm)} onChange={(e) => save({ marginMm: e.target.value === "" ? null : Number(e.target.value) })}>
						<option value="">Automatic</option>
						{[2, 3, 4, 5, 6].map((m) => (
							<option key={m} value={m}>
								{m} mm
							</option>
						))}
					</select>
					<div className="plan-settings-note">A bigger margin makes the barcode narrower so it stays inside the label.</div>
				</div>
			</div>
			<button type="button" className="btn out" id="label-alignment-test" onClick={test} style={{ marginTop: 10 }}>
				Print alignment test label
			</button>
		</div>
	);
}
