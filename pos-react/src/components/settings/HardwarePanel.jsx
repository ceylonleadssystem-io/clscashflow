/**
 * Hardware controls in Settings: connect the USB receipt printer, the USB label printer (with gap
 * calibration) and the USB barcode scanner, with status lines and a scanner test.
 */
import { useEffect, useState } from "react";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { useUi } from "../../store/UiProvider";
import { receiptPrinter } from "../../services/printing/receiptPrinter";
import { labelPrinter } from "../../services/printing/labelPrinter";
import { LabelStockPicker } from "./LabelStockPicker";
import { barcodeScanner, findScannedProduct } from "../../services/printing/scanner";

const AZURE = "Azure Swim tablet printer: USB 1046:20497 · 80 mm ESC/POS";

/** Connect button that turns into "Connected · <device name>" once a device is attached (tap again to pick another). */
function ConnectButton({ name, label, className = "btn", onClick }) {
	return (
		<button className={className + (name ? " connected" : "")} type="button" onClick={onClick} title={name ? "Tap to choose a different device" : undefined}>
			{name ? (
				<>
					<span aria-hidden="true">✓ </span>
					Connected · {name}
				</>
			) : (
				label
			)}
		</button>
	);
}

/** USB receipt printer, label printer and barcode scanner connection controls. */
export function HardwarePanel() {
	const data = useData();
	const { svc, currentUser } = usePos();
	const ui = useUi();
	const usb = useFeature("hardware.usbPrinter");
	const label = useFeature("hardware.labelPrinter");
	const scanner = useFeature("hardware.barcodeScanner");
	const [printer, setPrinter] = useState(receiptPrinter.status);
	const [labels, setLabels] = useState(labelPrinter.status);
	const [scan, setScan] = useState(barcodeScanner.status);
	const [testOpen, setTestOpen] = useState(false);
	const [testValue, setTestValue] = useState("");
	const settings = data.settings;

	useEffect(() => {
		receiptPrinter.onRemember = (usbPrinter) => svc.settings.patchSettings({ usbPrinter, printerType: "usb-direct", autoPrint: true });
		labelPrinter.onRemember = (barcodePrinter) => svc.settings.patchSettings({ barcodePrinter });
		barcodeScanner.onRemember = (usbScanner) => svc.settings.patchSettings({ usbScanner });
		const subs = [receiptPrinter.subscribe(setPrinter), labelPrinter.subscribe(setLabels), barcodeScanner.subscribe(setScan)];
		return () => subs.forEach((u) => u());
	}, [svc]);

	// restore previously authorised devices once
	useEffect(() => {
		if (usb) receiptPrinter.restore(settings.usbPrinter || {});
		if (label) labelPrinter.restore(settings.barcodePrinter || {});
		if (scanner) barcodeScanner.restore(settings.usbScanner || {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usb, label, scanner]);

	if (!currentUser) return null;
	const attempt = async (fn, message) => {
		try {
			await fn();
		} catch (e) {
			await ui.alert(message + " " + (e.message || ""));
		}
	};
	const finishTest = () => {
		const code = testValue.trim();
		setTestOpen(false);
		if (!code) return barcodeScanner.setMessage("No barcode received yet. Tap Start Scanner Test and scan again.", false);
		const product = findScannedProduct(data.products, code);
		barcodeScanner.setMessage(product ? `Scanner received ${code} and matched ${product.name}.` : `Scanner received ${code}, but no matching item code was found.`, !!product);
	};

	return (
		<div className="usb-printer-controls">
			{usb && (
				<div className="hw-section" id="hw-receipt-printer">
					<div>
						<strong>USB receipt printer</strong>
						<div className="plan-settings-note">{AZURE}</div>
					</div>
					<ConnectButton name={receiptPrinter.deviceName} label="Connect USB Printer" onClick={() => attempt(() => receiptPrinter.connect(), "Could not connect the USB printer.")} />
					<div id="register-hardware-status" className={"hardware-status" + (printer.connected ? "" : " offline")}>
						{printer.message}
					</div>
				</div>
			)}
			{label && (
				<div className="hw-section" id="hw-label-printer">
					<div>
						<strong>USB barcode label printer</strong>
						<div className="plan-settings-note">Saved USB label printers reconnect automatically after the first browser permission approval.</div>
					</div>
					<div className="hw-actions">
						<ConnectButton className="btn out" name={labelPrinter.deviceName} label="Connect Label Printer" onClick={() => attempt(() => labelPrinter.connect(), "Could not connect the USB barcode printer.")} />
						<button
							className="btn out"
							type="button"
							onClick={() =>
								attempt(async () => {
									await labelPrinter.calibrate(settings.barcodePrinter || {}, settings.labelStock);
									ui.notice("Barcode label printer calibrated for the selected label size and gap. Print one test label next.");
								}, "Barcode label printer calibration failed.")
							}
						>
							Calibrate Label Gap
						</button>
					</div>
					<div id="settings-barcode-printer-status" className={"hardware-status" + (labels.connected ? "" : " offline")}>
						{labels.message}
					</div>
					<div className="hw-wide">
						<LabelStockPicker />
					</div>
				</div>
			)}
			{scanner && (
				<div className="hw-section" id="hw-scanner">
					<div>
						<strong>USB barcode scanner</strong>
						<div className="plan-settings-note">
							Android usually exposes USB scanners as keyboards. Tap Start Scanner Test, scan a label, and it will add matched item codes to Current Order.
						</div>
					</div>
					<div className="hw-actions">
						<ConnectButton
							className="btn out"
							name={barcodeScanner.deviceName}
							label="Connect USB Scanner"
							onClick={async () => {
								const res = await barcodeScanner.connect().catch(() => "error");
								if (res === "unsupported") setTestOpen(true);
							}}
						/>
						<button
							className="btn out"
							type="button"
							onClick={() => {
								setTestValue("");
								setTestOpen(true);
								barcodeScanner.setMessage("Scanner test active. Scan any item barcode now.", true);
							}}
						>
							Start Scanner Test
						</button>
					</div>
					<div id="settings-scanner-status" className={"hardware-status" + (scan.connected ? "" : " offline")}>
						{scan.message}
					</div>
					{testOpen && (
						<input
							className="input hw-wide"
							id="scanner-test-input"
							placeholder="Scan barcode now"
							value={testValue}
							autoFocus
							onChange={(e) => setTestValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									finishTest();
								}
							}}
							onBlur={() => testValue && finishTest()}
						/>
					)}
				</div>
			)}
		</div>
	);
}
