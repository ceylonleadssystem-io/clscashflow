/** Connected-device names shown on the Settings > Printing buttons. */
import { describe, expect, it } from "vitest";
import { barcodeScanner } from "../services/printing/scanner";
import { receiptPrinter } from "../services/printing/receiptPrinter";
import { labelPrinter } from "../services/printing/labelPrinter";

describe("deviceName", () => {
	it("is empty until a device is attached and then reports its product name", () => {
		barcodeScanner.device = null;
		expect(barcodeScanner.deviceName).toBe("");
		barcodeScanner.device = { productName: "NETUM NT-1228BL" };
		expect(barcodeScanner.deviceName).toBe("NETUM NT-1228BL");
		barcodeScanner.device = {};
		expect(barcodeScanner.deviceName).toBe("USB barcode scanner");
		barcodeScanner.device = null;
	});
	it("printers only report a name while the device is open", () => {
		receiptPrinter.device = { productName: "Azure Swim", opened: false };
		expect(receiptPrinter.deviceName).toBe("");
		receiptPrinter.device = { productName: "Azure Swim", opened: true };
		expect(receiptPrinter.deviceName).toBe("Azure Swim");
		receiptPrinter.device = null;
		labelPrinter.device = { opened: true };
		expect(labelPrinter.deviceName).toBe("USB barcode label printer");
		labelPrinter.device = null;
	});
});
