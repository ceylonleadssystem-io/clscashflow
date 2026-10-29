/**
 * Reports page: the box home (ReportsHub), then the chosen report. The choice lives in PosProvider (`reportNav`), which also
 * switches the left navigation to the report list. Business reports as defined in the Ceylonry POS Reports specification.
 */
import { EndOfDay } from "./reports/EndOfDay";
import { ReportPage } from "./reports/ReportPage";
import { ReportsHub } from "./reports/ReportsHub";
import { groupOf } from "../domain/reportsCatalog";
import { useReportGroups } from "../hooks/useReportGroups";
import { usePos } from "../store/PosProvider";

export function Reports() {
	const { reportNav } = usePos();
	const groups = useReportGroups();
	if (!reportNav || !groupOf(reportNav.group) || !groups.some((g) => g.key === reportNav.group)) return <ReportsHub />;
	if (reportNav.group === "end-of-day") return <EndOfDay />;
	return <ReportPage key={reportNav.group + "/" + reportNav.sub} group={reportNav.group} sub={reportNav.sub} />;
}
