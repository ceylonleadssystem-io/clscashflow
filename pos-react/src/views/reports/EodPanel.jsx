/**
 * The End of Day report box: pick a day, then download it as a PDF, print it on paper, or print it as a receipt. The parts that appear
 * follow Settings > System Options > EOD Reports. With `preview`, the chosen day's report is shown underneath, as it will print.
 * Used by the End of Day page (views/EndOfDayPage.jsx) and the /admin portal's reports.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { applyEodOptions, endOfDayReport } from "../../domain/endOfDay";
import { today } from "../../domain/format";
import { resolveOptions } from "../../domain/systemOptions";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useScopedData } from "../../hooks/useScopedData";
import { printHtmlInFrame } from "../../services/printing/printDocument";
import { reportHtml } from "../../services/printing/reportDocument";
import { eodReceiptHtml } from "../../services/printing/documents";
import { previewHtml } from "../../services/printing/eodPrint";
import { downloadReportPdf, pdfSupportsText } from "../../services/printing/reportPdf";
import { createLogger } from "../../utils/logger";

const log = createLogger("ui");

export function EodPanel({ preview = false }) {
	const data = useData();
	const { sales, cashShifts, timeEntries } = useScopedData();
	const { locationId } = usePos();
	const [eodDay, setEodDay] = useState(today);

	const report = useMemo(
		() =>
			applyEodOptions(
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
			),
		[eodDay, locationId, sales, cashShifts, timeEntries, data],
	);

	// one day's sales, refunds, voids, registers, staff hours and the current stock, as a PDF or printed
	const endOfDay = async (print, receipt) => {
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
		<>
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
			{preview && <EodPreview report={report} settings={data.settings} />}
		</>
	);
}

/** The report on screen: the page layout (Download PDF and Print) or the receipt (Print receipt). */
function EodPreview({ report, settings }) {
	const [kind, setKind] = useState("page");
	const frame = useRef(null);
	const html = useMemo(() => previewHtml(kind === "receipt" ? eodReceiptHtml(report, { settings, autoPrint: false }) : reportHtml(report), kind), [kind, report, settings]);
	// the frame is as tall as the report, so the page scrolls as one; re-measured when its width changes
	const fit = () => {
		const f = frame.current;
		const body = f?.contentDocument?.body;
		if (body) f.style.height = body.scrollHeight + 4 + "px";
	};
	useEffect(() => {
		if (typeof ResizeObserver === "undefined" || !frame.current) return undefined;
		const watch = new ResizeObserver(fit);
		watch.observe(frame.current);
		return () => watch.disconnect();
	}, []);
	return (
		<div className="panel eod-panel" id="eod-preview">
			<div className="panel-head">
				<div className="panel-title">Preview</div>
				<div className="range-fields" role="group" aria-label="Preview layout">
					{[["page", "Page"], ["receipt", "Receipt"]].map(([key, label]) => (
						<button key={key} type="button" className={"btn " + (kind === key ? "gold" : "out")} aria-pressed={kind === key} onClick={() => setKind(key)}>
							{label}
						</button>
					))}
				</div>
			</div>
			{/* no scripts run in the preview; same-origin only lets this page measure its height */}
			<iframe ref={frame} className="eod-preview-frame" title={report.title + " preview"} sandbox="allow-same-origin" srcDoc={html} onLoad={fit} />
		</div>
	);
}
