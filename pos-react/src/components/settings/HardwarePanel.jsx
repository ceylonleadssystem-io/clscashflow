import { useEffect, useState } from "react";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { useUi } from "../../store/UiProvider";
import { receiptPrinter } from "../../services/printing/receiptPrinter";
import { labelPrinter } from "../../services/printing/labelPrinter";
import { barcodeScanner, findScannedProduct } from "../../services/printing/scanner";

const AZURE = "Azure Swim tablet printer: USB 1046:20497 · 80 mm ESC/POS";

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
				<>
					<div>
						<strong>USB receipt printer</strong>
						<div className="plan-settings-note">{AZURE}</div>
					</div>
					<button className="btn" type="button" onClick={() => attempt(() => receiptPrinter.connect(), "Could not connect the USB printer.")}>
						Connect USB Printer
					</button>
					<div id="register-hardware-status" className={"hardware-status" + (printer.connected ? "" : " offline")}>
						{printer.message}
					</div>
				</>
			)}
			{label && (
				<>
					<div>
						<strong>USB barcode label printer</strong>
						<div className="plan-settings-note">Saved USB label printers reconnect automatically after the first browser permission approval.</div>
					</div>
					<button className="btn out" type="button" onClick={() => attempt(() => labelPrinter.connect(), "Could not connect the USB barcode printer.")}>
						Connect Label Printer
					</button>
					<button
						className="btn out"
						type="button"
						onClick={() =>
							attempt(async () => {
								await labelPrinter.calibrate(settings.barcodePrinter || {});
								ui.notice("Barcode label printer calibrated. Print one test label next.");
							}, "Barcode label printer calibration failed.")
						}
					>
						Calibrate Label Gap
					</button>
					<div id="settings-barcode-printer-status" className={"hardware-status" + (labels.connected ? "" : " offline")}>
						{labels.message}
					</div>
				</>
			)}
			{scanner && (
				<>
					<div>
						<strong>USB barcode scanner</strong>
						<div className="plan-settings-note">
							Android usually exposes USB scanners as keyboards. Tap Start Scanner Test, scan a label, and it will add matched item codes to Current Order.
						</div>
					</div>
					<button
						className="btn out"
						type="button"
						onClick={async () => {
							const res = await barcodeScanner.connect().catch(() => "error");
							if (res === "unsupported") setTestOpen(true);
						}}
					>
						Connect USB Scanner
					</button>
					<div id="settings-scanner-status" className={"hardware-status" + (scan.connected ? "" : " offline")}>
						{scan.message}
					</div>
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
					{testOpen && (
						<input
							className="input"
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
				</>
			)}
		</div>
	);
}
