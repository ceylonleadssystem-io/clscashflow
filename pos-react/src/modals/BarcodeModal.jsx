/**
 * Product Barcode Labels dialog (30 x 25 mm): previews the label, sets the number of copies and prints
 * through the USB label printer or the browser (Android Print). Makes sure the product has a clean scannable code first.
 */
import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { cleanBarcode, uniqueBarcode } from "../services/printing/barcode";
import { barcodeLabelCopy, barcodeLabelsHtml, labelPrinter } from "../services/printing/labelPrinter";
import { printHtmlInFrame } from "../services/printing/printDocument";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";
import { T } from "../db/tables";

/** Product Barcode Labels (30 × 25 mm): USB label printer or browser print. */
export function BarcodeModalHost() {
	const { barcodeProductId, closeBarcode } = useModals();
	const data = useData();
	const { ctx } = usePos();
	const ui = useUi();
	const usbLabels = useFeature("hardware.labelPrinter");
	const [copies, setCopies] = useState(1);
	const [status, setStatus] = useState(labelPrinter.status);
	const product = data.products.find((p) => p.id === barcodeProductId);

	useEffect(() => labelPrinter.subscribe(setStatus), []);
	// make sure the product has a scannable code and persist the cleaned value
	useEffect(() => {
		if (!product) return;
		const code = cleanBarcode(product.code || uniqueBarcode(data.products.map((p) => p.code)));
		if (code !== product.code) ctx.store.write((tx) => tx.put(T.products, { ...product, code }));
		labelPrinter.restore(data.settings.barcodePrinter || {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [barcodeProductId]);
	if (!product) return null;
	const safe = { ...product, code: cleanBarcode(product.code || "") };
	const n = Math.max(1, Math.min(100, Number(copies) || 1));
	const size = ["30", "25"];

	const printBrowser = () => {
		printHtmlInFrame(barcodeLabelsHtml(safe, n, size), "Barcode label print job");
		closeBarcode();
		ui.notice(`${n} barcode label${n === 1 ? "" : "s"} sent to Android Print. Select the connected barcode printer.`);
	};
	const printUsb = async () => {
		try {
			await labelPrinter.print(safe, n, size, data.settings.barcodePrinter || {});
			closeBarcode();
			ui.notice(`${n} 30 × 25 mm barcode label${n === 1 ? "" : "s"} sent to the USB label printer using item code ${safe.code}.`);
		} catch (e) {
			await ui.alert("Barcode labels were not printed. " + (e.message || "Reconnect the USB barcode printer and try again."));
		}
	};
	const detect = async () => {
		try {
			await labelPrinter.connect();
		} catch (e) {
			await ui.alert("Could not connect the USB barcode printer. " + (e.message || ""));
		}
	};

	return (
		<Modal
			id="barcode-modal"
			open
			title="Product Barcode Labels"
			subtitle="Labels are fixed to 30 × 25 mm with product name, barcode and price only"
			onClose={closeBarcode}
			footer={
				<>
					{usbLabels && (
						<button className="btn out" onClick={detect}>
							Detect USB Label Printer
						</button>
					)}
					<button className="btn out" onClick={closeBarcode}>
						Cancel
					</button>
					<button className="btn out" onClick={printBrowser}>
						Android Print
					</button>
					{usbLabels && (
						<button className="btn" onClick={printUsb}>
							Print Labels
						</button>
					)}
				</>
			}
		>
			<ModalBody>
				<div className="barcode-preview" id="barcode-preview" dangerouslySetInnerHTML={{ __html: barcodeLabelCopy(safe) }} />
				<div className="form-grid" style={{ marginTop: 12 }}>
					<div className="field">
						<label>Label copies</label>
						<input className="input" id="barcode-copies" type="number" min="1" max="100" value={copies} onChange={(e) => setCopies(e.target.value)} />
					</div>
					<div className="field">
						<label>Label size</label>
						<select className="input" id="barcode-size" defaultValue="30x25">
							<option value="30x25">30 × 25 mm standard</option>
						</select>
					</div>
				</div>
				<div className={"hardware-status" + (status.connected ? "" : " offline")} id="barcode-printer-status">
					{status.message}
				</div>
			</ModalBody>
		</Modal>
	);
}
