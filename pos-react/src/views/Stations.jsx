/**
 * Stations page (Items menu): the kitchen printers and Kitchen Displays a business sends prep tickets to. For each printer station the
 * physical printer is chosen here (USB ESC/POS printer or the system print dialog); each Kitchen Display station is paired with its own
 * kitchen screen. Items are assigned to stations in the item form, and the main station is chosen in Settings, Receipt Printing.
 */
import { useEffect, useMemo, useState } from "react";
import { Panel } from "../components/ui";
import { kitchenStations, PRINTER_KINDS, STATION_TYPES } from "../domain/kitchenStations";
import { chooseKitchenPrinter, usbSupported } from "../services/printing/kitchenPrinters";
import { KdsPairing } from "../KDS/KdsPairing";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";

const newId = () => "st-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export function Stations() {
	const data = useData();
	const { svc, go, canView } = usePos();
	const ui = useUi();
	const kdsOn = useFeature("checkout.kds");
	const saved = useMemo(() => kitchenStations(data.settings, kdsOn), [data.settings, kdsOn]);
	const [rows, setRows] = useState(saved);
	const [busy, setBusy] = useState(false);
	const dirty = JSON.stringify(rows) !== JSON.stringify(saved);
	useEffect(() => setRows(saved), [saved]);
	const types = STATION_TYPES.filter((t) => t.value !== "kds" || kdsOn);
	const isSaved = (r) => JSON.stringify(saved.find((s) => s.id === r.id)) === JSON.stringify(r);
	const count = (id) => data.products.filter((p) => (p.stationIds || []).map(String).includes(String(id))).length;

	const patch = (i, next) => setRows((list) => list.map((r, j) => (j === i ? { ...r, ...next } : r)));
	const setType = (i, type) => patch(i, type === "kds" ? { type, printer: undefined } : { type, printer: { kind: "none" } });
	const move = (i, by) =>
		setRows((list) => {
			const next = [...list];
			[next[i], next[i + by]] = [next[i + by], next[i]];
			return next;
		});
	const remove = async (i) => {
		const r = rows[i];
		if (count(r.id) && !(await ui.confirm(`${count(r.id)} items go to ${r.name}. Remove it? Those items will go to the main station.`))) return;
		setRows((list) => list.filter((_, j) => j !== i));
	};
	const add = (type) => setRows((list) => [...list, { id: newId(), name: "", type, ...(type === "printer" ? { printer: { kind: "none" } } : {}) }]);
	const pickUsb = async (i) => {
		try {
			const usb = await chooseKitchenPrinter();
			if (usb) patch(i, { printer: { kind: "usb", usb } });
		} catch (e) {
			await ui.alert(e.message);
		}
	};
	const save = async () => {
		setBusy(true);
		try {
			await svc.settings.saveKitchenStations(rows);
		} finally {
			setBusy(false);
		}
	};

	return (
		<section className="view active" id="view-stations">
			<Panel
				title="Stations"
				subtitle="Kitchen printers and Kitchen Displays. Add them here, then choose where each item goes in the item form."
				actions={
					canView("products") && (
						<button type="button" className="btn out" onClick={() => go("products")}>
							Assign items
						</button>
					)
				}
			>
				<div className="modal-body">
					<div className="station-cards">
						{rows.map((r, i) => {
							const p = r.printer || { kind: "none" };
							return (
								<div className="station-card" key={r.id} data-station-id={r.id}>
									<div className="station-row">
										<input className="input" aria-label={"Name of station " + (i + 1)} placeholder="Kitchen, Bar, Pastry..." maxLength={40} value={r.name} onChange={(e) => patch(i, { name: e.target.value })} />
										<select className="input" aria-label={"Type of station " + (i + 1)} value={r.type === "kds" && kdsOn ? "kds" : "printer"} onChange={(e) => setType(i, e.target.value)}>
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
											<button type="button" className="btn out" aria-label={"Remove " + (r.name || "station")} onClick={() => remove(i)}>
												Remove
											</button>
										</div>
									</div>
									{r.type === "kds" && kdsOn ? (
										isSaved(r) ? (
											<div className="station-detail">
												<KdsPairing stationId={r.id} name={r.name} />
												<button type="button" className="btn out" onClick={() => svc.printing.testStation(r)}>
													Send test ticket
												</button>
											</div>
										) : (
											<div className="station-detail muted">Save the stations to pair this Kitchen Display with its screen.</div>
										)
									) : (
										<div className="station-detail">
											<label className="station-printer">
												<span className="label">Printer</span>
												<select className="input" value={p.kind} onChange={(e) => patch(i, { printer: { ...p, kind: e.target.value } })}>
													{PRINTER_KINDS.map((k) => (
														<option key={k.value} value={k.value} disabled={k.value === "usb" && !usbSupported()}>
															{k.label}
														</option>
													))}
												</select>
											</label>
											{p.kind === "usb" && (
												<>
													<span className="station-device">{p.usb ? p.usb.productName + (p.usb.serialNumber ? " · " + p.usb.serialNumber : "") : "No printer chosen yet"}</span>
													<button type="button" className="btn out" onClick={() => pickUsb(i)}>
														{p.usb ? "Change USB printer" : "Choose USB printer"}
													</button>
												</>
											)}
											{p.kind === "system" && <span className="muted station-device">Opens the print dialog for each order; choose this station's printer there.</span>}
											{p.kind !== "none" && (
												<button type="button" className="btn out" disabled={!isSaved(r)} title={isSaved(r) ? "" : "Save first"} onClick={() => svc.printing.testStation(r)}>
													Test print
												</button>
											)}
										</div>
									)}
								</div>
							);
						})}
						{!rows.length && <div className="muted">No stations yet: kitchen tickets stay in the Order Queue until you add one.</div>}
					</div>
					<div className="tools" style={{ marginTop: 12 }}>
						<button type="button" className="btn out" id="add-kitchen-printer" onClick={() => add("printer")}>
							+ Add kitchen printer
						</button>
						{kdsOn && (
							<button type="button" className="btn out" id="add-kitchen-display" onClick={() => add("kds")}>
								+ Add Kitchen Display
							</button>
						)}
						<button type="button" className="btn gold" id="save-stations" disabled={busy || !dirty} onClick={save} style={{ marginLeft: "auto" }}>
							{busy ? "Saving…" : dirty ? "Save stations" : "Saved"}
						</button>
					</div>
					<div className="print-note">
						Items with no station go to the main station (the first one; change it in Settings, Receipt Printing). USB printers print
						straight away without a dialog (Chrome on Android, Windows or macOS). A printer used for receipts can also be a kitchen station.
					</div>
				</div>
			</Panel>
		</section>
	);
}
