/**
 * Prints the End of Day report as a receipt, with only the parts switched on in System Options > EOD Reports.
 * Shared by the End of Day page and the automatic daily print (hooks/useEodAutoPrint.js).
 */
import { applyEodOptions, endOfDayReport } from "../../domain/endOfDay";
import { resolveOptions } from "../../domain/systemOptions";
import { eodReceiptHtml } from "./documents";
import { printHtmlInFrame } from "./printDocument";

/** `input` is the arguments of endOfDayReport. */
export function printEodReceipt(input, settings) {
	const report = applyEodOptions(endOfDayReport(input), resolveOptions(settings, "eod", input.locationId));
	printHtmlInFrame(eodReceiptHtml(report, { settings }), report.title);
}
