/**
 * Admin portal: the business type of an account. A business picks it once during setup; from then on it can be changed only here.
 */
import { useState } from "react";
import { BUSINESS_TYPE_OPTIONS, POS_TYPE_PRESETS } from "../config/presets";
import { businessTypeLocked } from "../domain/businessType";

const label = (t) => (t === "cafe" ? "Café / Bakery" : POS_TYPE_PRESETS[t]?.label || t);

export function BusinessTypeTab({ settings, save, saving, ui }) {
	const current = settings.businessType || "";
	const [type, setType] = useState(current || "restaurant");
	const dirty = type !== current;
	const apply = async () => {
		if (current && !(await ui.confirm(`Change this business from ${label(current)} to ${label(type)}? Pages and features that belong to ${label(current)} will be hidden and those of ${label(type)} shown. Their items and sales are not changed.`))) return;
		save({ businessType: type, businessTypeLocked: true }, "Business type changed");
	};
	return (
		<section className="panel">
			<div className="panel-head">
				<div>
					<div className="panel-title">Business type</div>
					<div className="muted">
						{businessTypeLocked(settings) ? "The business chose its type during setup. Only you can change it now." : "The business has not completed setup yet, so it can still choose its own type. Changing it here sets it for good."}
					</div>
				</div>
			</div>
			<div className="modal-body">
				<div className="field" style={{ maxWidth: 360 }}>
					<label htmlFor="admin-business-type">Business type</label>
					<select id="admin-business-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
						{BUSINESS_TYPE_OPTIONS.map((t) => (
							<option key={t} value={t}>
								{label(t)}
							</option>
						))}
					</select>
				</div>
				<div className="plan-settings-note" style={{ marginTop: 8 }}>{(POS_TYPE_PRESETS[type] || POS_TYPE_PRESETS.other).note}</div>
				<button className="btn gold" id="admin-save-business-type" style={{ marginTop: 14 }} disabled={!dirty || saving} onClick={apply}>
					Save business type
				</button>
			</div>
		</section>
	);
}
