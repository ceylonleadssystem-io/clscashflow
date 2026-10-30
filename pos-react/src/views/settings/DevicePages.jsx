/**
 * Settings > Device Manager > Printers. Left: the POS devices (registers and order pads) of the chosen location. Right: that device's
 * printers: its Receipt printer, then kitchen printers (each serving a station). Printers are connected from the device itself,
 * because USB access belongs to the browser it was granted in; from another device they can be set up but not connected.
 */
import { useMemo, useState } from "react";
import { DetailDrawer, EmptyState, StatusBadge } from "../../components/settings/kit/entities";
import { NumberRow, PageHeader, SectionCard, SelectRow, SettingRow, TextRow, ToggleRow } from "../../components/settings/kit/rows";
import { DEVICE_KINDS, KITCHEN_CONNECTIONS, MAX_COPIES, RECEIPT_CONNECTIONS, connectionLabel, devicesOf, printerError, printersOf, receiptPlan, stationsWithoutPrinter } from "../../domain/devices";
import { kitchenStations } from "../../domain/kitchenStations";
import { chooseKitchenPrinter, usbSupported } from "../../services/printing/kitchenPrinters";
import { receiptPrinter } from "../../services/printing/receiptPrinter";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { HardwarePanel } from "../../components/settings/HardwarePanel";
import { PrintWhenCard } from "../../components/settings/PrintingExtras";
import { useUi } from "../../store/UiProvider";

const none = { value: "", label: "None" };

export function Printers() {
	const data = useData();
	const { settings, locations } = data;
	const { svc, locationId, deviceId } = usePos();
	const ui = useUi();
	const kdsOn = useFeature("checkout.kds");
	const usbReceipt = useFeature("hardware.usbPrinter");
	const stations = useMemo(() => kitchenStations(settings, kdsOn).filter((s) => s.type === "printer"), [settings, kdsOn]);
	const devices = devicesOf(settings, locationId);
	const [picked, setPicked] = useState("");
	const [edit, setEdit] = useState(null);
	const [touched, setTouched] = useState(false);
	const [renaming, setRenaming] = useState(null);
	const current = devices.find((x) => x.id === picked) || devices.find((x) => x.id === deviceId) || devices[0];
	const mine = current?.id === deviceId;
	const printers = current ? printersOf(settings, current.id) : [];
	const gaps = stationsWithoutPrinter(settings, stations);
	const stationName = (id) => stations.find((s) => s.id === id)?.name || "";
	// a kitchen printer is named after its station
	const printerName = (p) => (p.role === "receipt" ? p.name : stationName(p.stationId) || p.name || "Kitchen printer");
	const locationName = (id) => locations.find((l) => l.id === id)?.name || "";

	const siblings = edit ? printers.filter((x) => x.id !== edit.id) : [];
	const error = edit ? printerError({ ...edit, receiptCopies: edit.role === "receipt" ? Number(edit.receiptCopies) : 1 }, siblings, stations) : "";
	const close = () => (setEdit(null), setTouched(false));
	const patch = (next) => setEdit((x) => ({ ...x, ...next }));
	const setConn = (kind) => patch({ connection: { kind } });
	const open = (p) => setEdit({ ...p, isNew: false });
	const add = () => setEdit({ isNew: true, id: "", deviceId: current.id, role: "kitchen", name: "", connection: { kind: "none" }, stationId: stations[0]?.id || "", receiptCopies: 1, printFromThisDevice: true, backupPrinterId: "", duplicateToPrinterId: "" });
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveDevicePrinter({ ...edit, id: edit.isNew ? "" : edit.id })) close();
	};

	// the receipt printer reuses the Receipt Printing connect flow and remembers the printer there too, so receipts print as before
	const connect = async () => {
		try {
			if (edit.role === "receipt") {
				receiptPrinter.onRemember = (usbPrinter) => svc.settings.patchSettings({ usbPrinter, printerType: "usb-direct", autoPrint: true });
				if (!(await receiptPrinter.connect())) return;
				const d = receiptPrinter.device;
				patch({ connection: { kind: "usb", usb: { vendorId: d.vendorId, productId: d.productId, serialNumber: d.serialNumber || "", productName: d.productName || "USB receipt printer" } } });
			} else {
				const usb = await chooseKitchenPrinter();
				if (usb) patch({ connection: { kind: "usb", usb } });
			}
		} catch (e) {
			await ui.alert("Could not connect the printer. " + (e.message || ""));
		}
	};
	const testPrint = async () => {
		if (edit.role === "receipt") return void (await svc.printing.printTestReceipt({ ...receiptPlan({ devicePrinters: [{ ...edit, receiptCopies: Number(edit.receiptCopies) || 1 }] }, edit.deviceId), print: true }));
		const station = stations.find((s) => s.id === edit.stationId);
		if (!station) return void (await ui.alert("Choose a station first."));
		await svc.printing.testStation({ ...station, printer: edit.connection });
	};

	const connections = edit?.role === "receipt" ? RECEIPT_CONNECTIONS.filter((c) => c.value !== "usb" || usbReceipt) : KITCHEN_CONNECTIONS;
	const conn = edit?.connection || {};
	const linkChoices = (self) => [none, ...siblings.filter((x) => x.role === "kitchen" && x.id !== self).map((x) => ({ value: x.id, label: printerName(x) + " · " + connectionLabel(x) }))];

	return (
		<>
			<PageHeader
				title="Printers"
				description="Set up the receipt and kitchen printers of each register or order pad. A device without a setup keeps using Receipt Printing and the Stations page."
				note={locationId && locationId !== "all" ? "Devices at " + (locationName(locationId) || "this location") + "." : "Devices of every location."}
			/>
			<PrintWhenCard />
			{!devices.length ? (
				<SectionCard>
					<EmptyState title="No devices yet">A register appears here the first time someone signs in to the POS on it.</EmptyState>
				</SectionCard>
			) : (
				<div className="sk-devices">
					<nav className="sk-device-list" aria-label="Devices">
						{devices.map((x) => (
							<button key={x.id} type="button" className={x.id === current.id ? "active" : ""} onClick={() => setPicked(x.id)} data-device={x.id}>
								<strong>{x.name}</strong>
								<span>{DEVICE_KINDS.find((k) => k.value === x.kind)?.label}{x.id === deviceId ? " · This device" : ""}</span>
							</button>
						))}
					</nav>
					<div className="sk-device-main">
						<SectionCard
							title={current.name}
							description={mine ? "You are on this device, so you can connect and test its printers." : "To connect or test a printer, open the POS on " + current.name + "."}
						>
							<div className="sk-list-line" style={{ padding: "8px 0" }}>
								<button type="button" className="btn out" onClick={() => setRenaming({ id: current.id, name: current.name, kind: current.kind })}>
									Rename or change type
								</button>
								{!mine && (
									<button type="button" className="btn danger" onClick={() => svc.settings.deleteDevice(current.id)}>
										Remove device
									</button>
								)}
								{devices.length > 1 && (
									<label className="sk-inline">
										<span className="muted">Copy setup from</span>
										<select
											className="input"
											aria-label="Copy setup from another device"
											value=""
											onChange={(e) => e.target.value && svc.settings.copyDevicePrinters(e.target.value, current.id)}
										>
											<option value="">Choose a device</option>
											{devices.filter((x) => x.id !== current.id).map((x) => (
												<option key={x.id} value={x.id}>
													{x.name}
												</option>
											))}
										</select>
									</label>
								)}
							</div>
						</SectionCard>
						<SectionCard title="Printers">
							<ul className="sk-list">
								{printers.map((p) => (
									<li key={p.id} className="sk-list-row" data-printer={p.id}>
										<div className="sk-list-main">
											<div className="sk-list-line">
												<strong>{printerName(p)}</strong>
												<span className="muted">
													{p.role === "receipt" ? "Receipts" : "Station: " + (stationName(p.stationId) || "none")} · {connectionLabel(p)}
													{p.role === "receipt" && p.receiptCopies > 1 ? " · " + p.receiptCopies + " copies" : ""}
												</span>
												{!p.printFromThisDevice && <span className="sk-badge">Log only</span>}
												{p.role === "receipt" && p.connection.kind === "usb" && mine && <StatusBadge status={receiptPrinter.connected ? "online" : "offline"} />}
											</div>
										</div>
										<span className="sk-list-actions">
											<button type="button" className="btn out" onClick={() => open(p)}>
												Edit
											</button>
										</span>
									</li>
								))}
							</ul>
							<div className="sk-list-line" style={{ padding: "12px 0 4px" }}>
								<button type="button" className="btn gold" id="add-printer" onClick={add} disabled={!stations.length} title={stations.length ? "" : "Add a kitchen printer station on the Stations page first"}>
									Add printer
								</button>
								{!stations.length && <span className="muted">Kitchen printers serve a station. Add one on the Stations page first.</span>}
							</div>
						</SectionCard>
					</div>
				</div>
			)}
			{current && mine && (
				<SectionCard title="USB devices on this device" description="Connect a USB receipt printer, label printer or barcode scanner plugged into this device. Access is remembered on this device only.">
					<HardwarePanel />
				</SectionCard>
			)}
			{gaps.length > 0 && (
				<SectionCard title="Stations without a printer" description="Tickets for these stations stay in the Order Queue because no printer serves them.">
					<ul className="sk-list">
						{gaps.map((s) => (
							<li key={s.id} className="sk-list-row">
								{s.name}
							</li>
						))}
					</ul>
				</SectionCard>
			)}

			<DetailDrawer
				open={!!edit}
				title={edit?.isNew ? "Add printer" : printerName(edit || {}) }
				wide
				subtitle={edit && current ? "On " + current.name : ""}
				onClose={close}
				footer={
					<>
						{edit && !edit.isNew && settings.devicePrinters?.some((x) => x.id === edit.id) && (
							<button type="button" className="btn danger" style={{ marginRight: "auto" }} onClick={async () => (await svc.settings.deleteDevicePrinter(edit.id)) && close()}>
								{edit.role === "receipt" ? "Reset to default" : "Delete"}
							</button>
						)}
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-printer" onClick={save}>
							Save
						</button>
					</>
				}
			>
				{edit && (
					<>
						{edit.role === "kitchen" && (
							<SelectRow id="printer-station" label="Station" help="The tickets this printer prints. Items are assigned to stations in the item form." value={edit.stationId} options={[{ value: "", label: "Choose a station" }, ...stations.map((s) => ({ value: s.id, label: s.name }))]} onChange={(stationId) => patch({ stationId })} error={touched && !edit.stationId ? "Choose the station this printer serves." : ""} />
						)}
						<SelectRow id="printer-connection" label="Connection" value={conn.kind} options={connections} onChange={setConn} />
						{conn.kind === "usb" && (
							<SettingRow label="USB printer" help={mine ? (usbSupported() ? "Choose the printer in the browser's list. Access is remembered on this device." : "USB printing is not available in this browser. Use Chrome on Android, Windows or macOS.") : "USB printers are connected on the device itself."} wide>
								<div className="sk-list-line">
									<button type="button" className="btn out" id="connect-printer" disabled={!mine || !usbSupported()} onClick={connect}>
										{conn.usb ? "Choose another printer" : "Connect printer"}
									</button>
									<span className={conn.usb ? "" : "muted"}>{conn.usb ? "✓ " + (conn.usb.productName || "USB printer") : "Not connected"}</span>
								</div>
							</SettingRow>
						)}
						{mine && (
							<SettingRow label="Test print" help="Prints a sample on this setup, so you can check it before saving." wide>
								<button type="button" className="btn out" id="test-print" disabled={conn.kind === "none" || (conn.kind === "usb" && !conn.usb)} onClick={testPrint}>
									Test print
								</button>
							</SettingRow>
						)}
						{edit.role === "receipt" && (
							<NumberRow
								id="printer-copies"
								label="Receipt copies"
								help={conn.kind === "system" ? "Not used with the system print dialog: choose the number of copies in the dialog." : "How many copies print for each receipt."}
								value={edit.receiptCopies}
								min={1}
								max={MAX_COPIES}
								disabled={conn.kind === "system"}
								onChange={(receiptCopies) => patch({ receiptCopies })}
								error={touched && error.startsWith("Receipt copies") ? error : ""}
							/>
						)}
						<ToggleRow id="printer-print" label="Print from this device" help="Off keeps a record of each ticket or receipt but does not print it." value={edit.printFromThisDevice} onChange={(printFromThisDevice) => patch({ printFromThisDevice })} />
						{edit.role === "kitchen" && (
							<>
								<SelectRow id="printer-backup" label="Backup printer" help="If this printer fails, the ticket goes here." value={edit.backupPrinterId} options={linkChoices(edit.id)} onChange={(backupPrinterId) => patch({ backupPrinterId })} />
								<SelectRow id="printer-duplicate" label="Duplicate to" help="Also print a copy here, for example kitchen to expo." value={edit.duplicateToPrinterId} options={linkChoices(edit.id)} onChange={(duplicateToPrinterId) => patch({ duplicateToPrinterId })} />
							</>
						)}
						{touched && error && !error.startsWith("Receipt copies") && !error.startsWith("Choose the station") && <p className="sk-error" role="alert">{error}</p>}
					</>
				)}
			</DetailDrawer>

			<DetailDrawer
				open={!!renaming}
				title="Device"
				onClose={() => setRenaming(null)}
				footer={
					<>
						<button type="button" className="btn out" onClick={() => setRenaming(null)}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-device" onClick={async () => (await svc.settings.saveDevice(renaming)) && setRenaming(null)}>
							Save
						</button>
					</>
				}
			>
				{renaming && (
					<>
						<TextRow id="device-name" label="Name" help="For example Front counter or Patio order pad." value={renaming.name} max={40} autoFocus onChange={(name) => setRenaming((x) => ({ ...x, name }))} />
						<SelectRow id="device-kind" label="Type" value={renaming.kind} options={DEVICE_KINDS} onChange={(kind) => setRenaming((x) => ({ ...x, kind }))} />
					</>
				)}
			</DetailDrawer>
		</>
	);
}

export const DEVICE_COMPONENTS = { printers: Printers };
