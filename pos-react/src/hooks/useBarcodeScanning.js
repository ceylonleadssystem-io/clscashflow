import { useEffect } from "react";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";
import { barcodeScanner, findScannedProduct } from "../services/printing/scanner";

/** Keyboard-wedge / HID barcode scans add the matching product to the current order. */
export function useBarcodeScanning() {
	const enabled = useFeature("hardware.barcodeScanner");
	const data = useData();
	const { addProduct } = useCheckout();
	const { currentUser, canView, go, view } = usePos();
	const ui = useUi();
	useEffect(() => {
		if (!enabled || !currentUser) return undefined;
		return barcodeScanner.attach(
			(code) => findScannedProduct(data.products, code),
			(code, product) => {
				if (!product) return ui.notice(`Barcode ${code} was scanned but no matching item code was found.`);
				if (canView("checkout") && view !== "checkout") go("checkout");
				addProduct(product.id);
				ui.notice(`${product.name} added to current order by barcode ${product.code || code}.`);
			},
		);
	}, [enabled, currentUser, data.products, addProduct, canView, go, view, ui]);
}
