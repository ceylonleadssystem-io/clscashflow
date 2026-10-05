/**
 * Product Barcode Labels dialog (30 x 20, 50 x 25 or 60 x 40 mm): previews the label, sets the number of copies and prints
 * through the USB label printer or the browser (Android Print). Makes sure the product has a clean scannable code first.
 */
import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { cleanBarcode, uniqueBarcode } from "../services/printing/barcode";
import { barcodeLabelCopy, barcodeLabelsHtml, labelPrinter, resolveLabelStock } from "../services/printing/labelPrinter";
import { LabelStockPicker } from "../components/settings/LabelStockPicker";
import { printHtmlInFrame } from "../services/printing/printDocument";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";
import { T } from "../db/tables";

/** Product Barcode Labels: USB label printer or browser print. Items with a Size modifier group print labels per size. */
export function BarcodeModalHost() {
	const { barcodeProductId, closeBarcode } = useModals();
	const data = useData();
	const { ctx } = usePos();
	const ui = useUi();
	const usbLabels = useFeature("hardware.labelPrinter");
	const [copies, setCopies] = useState(1);
	const [sizeCopies, setSizeCopies] = useState({}); // size name -> number of labels (items with a Size modifier group)
	const [status, setStatus] = useState(labelPrinter.status);
	const product = data.products.find((p) => p.id === barcodeProductId);

	useEffect(() => labelPrinter.subscribe(setStatus), []);
	useEffect(() => setSizeCopies({}), [barcodeProductId]);
	// make sure the product has a scannable code and persist the cleaned value
	useEffect(() => {
		if (!product) return;
		const code = cleanBarcode(product.code || uniqueBarcode(data.products.map((p) => p.code)));
		if (code !== product.code) ctx.store.write((tx) => tx.put(T.products, { ...product, code }));
		labelPrinter.restore(data.settings.barcodePrinter || {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [barcodeProductId]);
	if (!product) return null;
	const safe = { ...product, code: cleanBarcode(product.code || ""), company: String(data.settings.business || "").trim() };
	const n = Math.max(1, Math.min(100, Number(copies) || 1));
	// The item's Size group (the one named "Size" first, else any group with "size" in its name) gives the label sizes.
	const groups = data.modifiers.filter((m) => (product.modifierIds || []).includes(m.id) && /size/i.test(m.name));
	const sizeGroup = groups.find((m) => m.name.trim().toLowerCase() === "size") || groups[0];
	const sizes = sizeGroup ? (sizeGroup.options || []).map((o) => o.name) : [];
	const clamp = (v) => Math.max(0, Math.min(100, Math.floor(Number(v) || 0)));
	const runs = sizes.length ? sizes.map((sizeLabel) => ({ sizeLabel, copies: clamp(sizeCopies[sizeLabel]) })).filter((r) => r.copies > 0) : [{ sizeLabel: "", copies: n }];
	const total = runs.reduce((a, r) => a + r.copies, 0);
	const stock = resolveLabelStock(data.settings.labelStock);
	const size = [String(stock.width), String(stock.height)];

	const printBrowser = async () => {
		if (!total) return void (await ui.alert("Enter how many labels to print for at least one size."));
		printHtmlInFrame(barcodeLabelsHtml(safe, runs, size), "Barcode label print job");
		closeBarcode();
		ui.notice(`${total} barcode label${total === 1 ? "" : "s"} sent to Android Print. Select the connected barcode printer.`);
	};
	const printUsb = async () => {
		if (!total) return void (await ui.alert("Enter how many labels to print for at least one size."));
		try {
			for (const run of runs)
				await labelPrinter.print({ ...safe, sizeLabel: run.sizeLabel }, run.copies, size, data.settings.barcodePrinter || {}, { gapMm: stock.gap, offsetX: stock.offsetX, offsetY: stock.offsetY, marginMm: stock.marginMm });
			closeBarcode();
			ui.notice(`${total} ${stock.width} × ${stock.height} mm barcode label${total === 1 ? "" : "s"} sent to the USB label printer using item code ${safe.code}.`);
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
			subtitle={`${stock.width} × ${stock.height} mm labels with business name, item name, description, size, barcode and price`}
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
				<div className="barcode-preview" id="barcode-preview" dangerouslySetInnerHTML={{ __html: barcodeLabelCopy({ ...safe, sizeLabel: (runs[0] || { sizeLabel: sizes[0] || "" }).sizeLabel }) }} />
				<div className="form-grid" style={{ marginTop: 12 }}>
					{sizes.length ? (
						sizes.map((sz) => (
							<div className="field" key={sz}>
								<label htmlFor={"barcode-copies-" + sz}>Labels · Size {sz}</label>
								<input className="input" id={"barcode-copies-" + sz} type="number" min="0" max="100" value={sizeCopies[sz] ?? ""} placeholder="0" onChange={(e) => setSizeCopies({ ...sizeCopies, [sz]: e.target.value })} />
							</div>
						))
					) : (
						<div className="field">
							<label>Label copies</label>
							<input className="input" id="barcode-copies" type="number" min="1" max="100" value={copies} onChange={(e) => setCopies(e.target.value)} />
						</div>
					)}
				</div>
				<LabelStockPicker />
				<div className={"hardware-status" + (status.connected ? "" : " offline")} id="barcode-printer-status">
					{status.message}
				</div>
			</ModalBody>
		</Modal>
	);
}
