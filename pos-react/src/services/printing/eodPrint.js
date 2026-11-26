/**
 * Prints the End of Day report as a receipt, with only the parts switched on in System Options > EOD Reports.
 * Shared by the End of Day page and the automatic daily print (hooks/useEodAutoPrint.js).
 */
import { applyEodOptions, endOfDayReport } from "../../domain/endOfDay";
import { resolveOptions } from "../../domain/systemOptions";
import { eodReceiptHtml } from "./documents";
import { printHtmlInFrame } from "./printDocument";

/** The printable document with screen-only spacing, for showing it on the End of Day page. Printing is not affected. */
export const previewHtml = (html, kind) =>
	html.replace(
		"</style>",
		kind === "receipt" ? "@media screen{body{margin:0 auto;padding:12px 0}}</style>" : "@media screen{body{padding:16px}.kpis{flex-wrap:wrap}.kpi{min-width:110px}}@media screen and (max-width:480px){body{padding:10px}th,td{padding:4px 2px;font-size:10px}th{font-size:9px;letter-spacing:0}td.n{white-space:normal}}</style>",
	);

/** `input` is the arguments of endOfDayReport. */
export function printEodReceipt(input, settings) {
	const report = applyEodOptions(endOfDayReport(input), resolveOptions(settings, "eod", input.locationId));
	printHtmlInFrame(eodReceiptHtml(report, { settings }), report.title);
}
