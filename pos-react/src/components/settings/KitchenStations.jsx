/**
 * Settings, Receipts & Printing: the kitchen stations (added on the Stations page) and the main station, which receives every item
 * that has no station of its own. Choosing the main station moves it to the top of the list; it is saved with "Save All Settings".
 */
import { kitchenStations, PRINTER_KINDS } from "../../domain/kitchenStations";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";

const how = (s, kdsOn) =>
	s.type === "kds" && kdsOn ? "Kitchen Display" : s.printer?.kind === "usb" && s.printer.usb ? "USB: " + s.printer.usb.productName : PRINTER_KINDS.find((k) => k.value === (s.printer?.kind || "none")).label;

export function KitchenStations({ form, setForm }) {
	const data = useData();
	const { go, canView } = usePos();
	const kdsOn = useFeature("checkout.kds");
	const rows = form.kitchenStations ?? kitchenStations(data.settings, kdsOn);
	const count = (id) => data.products.filter((p) => (p.stationIds || []).map(String).includes(String(id))).length;
	const setMain = (id) => setForm((f) => ({ ...f, kitchenStations: [...rows.filter((r) => r.id === id), ...rows.filter((r) => r.id !== id)] }));

	return (
		<div className="plan-settings" id="kitchen-stations">
			<div className="label">Kitchen stations</div>
			<div className="plan-settings-note">
				Kitchen tickets go to the stations each item is assigned to (in the item form). Items without a station go to the main station.
			</div>
			{rows.length > 0 ? (
				<>
					<label className="station-printer" style={{ marginTop: 10 }}>
						<span className="label">Main station</span>
						<select className="input" id="set-main-station" value={rows[0].id} onChange={(e) => setMain(e.target.value)}>
							{rows.map((r) => (
								<option key={r.id} value={r.id}>
									{r.name}
								</option>
							))}
						</select>
					</label>
					<ul className="station-summary">
						{rows.map((r) => (
							<li key={r.id}>
								<strong>{r.name}</strong>
								<span className="muted">
									{how(r, kdsOn)} · {count(r.id)} item{count(r.id) === 1 ? "" : "s"}
								</span>
							</li>
						))}
					</ul>
				</>
			) : (
				<div className="muted" style={{ marginTop: 8 }}>No stations yet: kitchen tickets stay in the Order Queue.</div>
			)}
			{canView("stations") && (
				<button type="button" className="btn out" id="manage-stations" style={{ marginTop: 10 }} onClick={() => go("stations")}>
					{rows.length ? "Manage stations and printers" : "Add stations"}
				</button>
			)}
		</div>
	);
}
