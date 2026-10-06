/**
 * Hook that listens for keyboard-wedge / HID barcode scans and adds the matching product to the
 * current order (switching to Checkout if needed), with a notice when nothing matches.
 */
import { useEffect } from "react";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";
import { createLogger } from "../utils/logger";
import { barcodeScanner, findScannedItem } from "../services/printing/scanner";

const log = createLogger("scanner");

/** Keyboard-wedge / HID barcode scans add the matching product to the current order. */
export function useBarcodeScanning() {
	const enabled = useFeature("hardware.barcodeScanner");
	const data = useData();
	const { addScanned } = useCheckout();
	const { currentUser, canView, go, view } = usePos();
	const ui = useUi();
	useEffect(() => {
		if (!enabled || !currentUser) return undefined;
		// Re-attaches whenever the product list changes, so this is logged at debug level only.
		log.debug("barcode scanner attached");
		const detach = barcodeScanner.attach(
			(code) => findScannedItem(data.products, data.modifiers, code),
			(code, hit) => {
				if (!hit) log.info("scanned barcode matched no item");
				if (!hit) return ui.notice(`Barcode ${code} was scanned but no matching item code was found.`);
				const { product, size } = hit;
				if (canView("checkout") && view !== "checkout") go("checkout");
				// no modifier question for scans: a size barcode carries its size, a plain code adds the item as it is
				if (addScanned(product.id, size) === false) return;
				ui.notice(`${product.name}${size ? " (Size " + size + ")" : ""} added to current order by barcode ${code}.`);
			},
		);
		return detach;
	}, [enabled, currentUser, data.products, data.modifiers, addScanned, canView, go, view, ui]);
}
