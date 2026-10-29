/**
 * Settings, Receipts & Printing: the list of kitchen printers and Kitchen Displays (KDS). Items are assigned to them in the item
 * form; an item with none goes to the first one in this list. Edits go into the Settings form and are saved with "Save All Settings".
 */
import { kitchenStations, STATION_TYPES } from "../../domain/kitchenStations";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";

export function KitchenStations({ form, setForm }) {
	const data = useData();
	const kdsOn = useFeature("checkout.kds");
	const rows = form.kitchenStations ?? kitchenStations(data.settings, kdsOn);
	const types = STATION_TYPES.filter((t) => t.value !== "kds" || kdsOn);
	const change = (next) => setForm((f) => ({ ...f, kitchenStations: next }));
	const edit = (i, key) => (e) => change(rows.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)));
	const move = (i, by) => {
		const next = [...rows];
		[next[i], next[i + by]] = [next[i + by], next[i]];
		change(next);
	};
	const count = (id) => data.products.filter((p) => (p.stationIds || []).map(String).includes(String(id))).length;

	return (
		<div className="plan-settings" id="kitchen-stations">
			<div className="label">Kitchen printers & displays</div>
			<div className="plan-settings-note">
				Add every kitchen printer and Kitchen Display. Choose which ones each item goes to in the item form (an item can go to several, for
				example the kitchen and the bar). Items with none go to the first one in this list.
			</div>
			<div className="station-list">
				{rows.map((r, i) => (
					<div className="station-row" key={r.id || i}>
						<input className="input" aria-label={"Name of station " + (i + 1)} placeholder="Kitchen, Bar, Pastry..." maxLength={40} value={r.name} onChange={edit(i, "name")} />
						<select className="input" aria-label={"Type of station " + (i + 1)} value={r.type === "kds" && kdsOn ? "kds" : "printer"} onChange={edit(i, "type")}>
							{types.map((t) => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
						<span className="muted station-meta">
							{i === 0 ? "Main · " : ""}
							{count(r.id)} item{count(r.id) === 1 ? "" : "s"}
						</span>
						<div className="station-actions">
							<button type="button" className="btn out" aria-label={"Move " + (r.name || "station") + " up"} disabled={!i} onClick={() => move(i, -1)}>
								↑
							</button>
							<button type="button" className="btn out" aria-label={"Move " + (r.name || "station") + " down"} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
								↓
							</button>
							<button type="button" className="btn out" aria-label={"Remove " + (r.name || "station")} onClick={() => change(rows.filter((_, j) => j !== i))}>
								Remove
							</button>
						</div>
					</div>
				))}
				{!rows.length && <div className="muted">No kitchen printer yet: tickets go to the Kitchen POS (Order Queue).</div>}
			</div>
			<button type="button" className="btn out" id="add-kitchen-station" style={{ marginTop: 10 }} onClick={() => change([...rows, { id: "st-" + Date.now().toString(36), name: "", type: "printer" }])}>
				+ Add printer or display
			</button>
		</div>
	);
}
