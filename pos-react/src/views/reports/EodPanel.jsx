/**
 * The End of Day report box: pick a day, then download it as a PDF, print it on paper, or print it as a receipt. The parts that appear
 * follow Settings > System Options > EOD Reports. Used by the End of Day page (views/EndOfDayPage.jsx) and the /admin portal's reports.
 */
import { useState } from "react";
import { applyEodOptions, endOfDayReport } from "../../domain/endOfDay";
import { today } from "../../domain/format";
import { resolveOptions } from "../../domain/systemOptions";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useScopedData } from "../../hooks/useScopedData";
import { printHtmlInFrame } from "../../services/printing/printDocument";
import { reportHtml } from "../../services/printing/reportDocument";
import { eodReceiptHtml } from "../../services/printing/documents";
import { downloadReportPdf, pdfSupportsText } from "../../services/printing/reportPdf";
import { createLogger } from "../../utils/logger";

const log = createLogger("ui");

export function EodPanel() {
	const data = useData();
	const { sales, cashShifts, timeEntries } = useScopedData();
	const { locationId } = usePos();
	const [eodDay, setEodDay] = useState(today);

	// one day's sales, refunds, voids, registers, staff hours and the current stock, as a PDF or printed
	const endOfDay = async (print, receipt) => {
		const report = applyEodOptions(
			endOfDayReport({
				day: eodDay,
				business: data.settings.business || "",
				locationName: locationId && locationId !== "all" ? data.locations.find((l) => l.id === locationId)?.name || "" : "All locations",
				locationId,
				sales,
				cashShifts,
				timeEntries,
				users: data.users,
				inventory: data.inventory,
				stockMovements: data.stockMovements,
				openOrders: data.openOrders,
				voidOrders: data.voidOrders,
				supportAudit: data.supportAudit,
			}),
			resolveOptions(data.settings, "eod", locationId),
		);
		log.info("end of day report", { day: eodDay, print, receipt: !!receipt });
		if (!print && pdfSupportsText(report)) {
			try {
				return await downloadReportPdf(report, `end-of-day-${eodDay}.pdf`);
			} catch (e) {
				log.error("pdf download failed, using the print dialog", e);
			}
		}
		printHtmlInFrame(receipt ? eodReceiptHtml(report, { settings: data.settings }) : reportHtml(report), report.title);
	};

	return (
		<div className="panel eod-panel" id="eod-report">
			<div className="panel-head">
				<div>
					<div className="panel-title">End of Day Report</div>
					<div className="muted">Sales, payments, refunds, voids, open orders, registers, staff hours and current stock for one day</div>
				</div>
				<div className="range-fields">
					<div className="field">
						<label htmlFor="eod-day">Day</label>
						<input className="input" type="date" id="eod-day" max={today()} value={eodDay} onChange={(e) => setEodDay(e.target.value || today())} />
					</div>
					<button className="btn gold" id="eod-pdf" onClick={() => endOfDay(false)}>
						Download PDF
					</button>
					<button className="btn out" id="eod-print" onClick={() => endOfDay(true)}>
						Print
					</button>
					<button className="btn out" id="eod-print-receipt" onClick={() => endOfDay(true, true)} title="Print as a receipt on the receipt printer (80 mm)">
						Print receipt
					</button>
				</div>
			</div>
		</div>
	);
}
