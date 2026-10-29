/**
 * Reports home: one box per report group the user can open. Choosing a box opens its first report and replaces the
 * left navigation with the report list (see the Sidebar).
 */
import { firstSub } from "../../domain/reportsCatalog";
import { useReportGroups } from "../../hooks/useReportGroups";
import { usePos } from "../../store/PosProvider";

export function ReportsHub() {
	const { setReportNav } = usePos();
	const groups = useReportGroups();
	return (
		<section className="view active" id="view-reports">
			<div className="dashboard-toolbar">
				<div>
					<div className="panel-title">Reports</div>
					<div className="muted">Choose a report. The navigation on the left switches to the reports so you can move between them.</div>
				</div>
			</div>
			<div className="reports-hub" id="reports-hub">
				{groups.map((g) => (
					<button key={g.key} type="button" className="report-box" data-report={g.key} onClick={() => setReportNav({ group: g.key, sub: firstSub(g.key) })}>
						<span className="report-box-icon" aria-hidden="true">{g.icon}</span>
						<strong>{g.title}</strong>
						<span className="muted">{g.blurb}</span>
						{g.subs.length > 0 && <small>{g.subs.length} reports</small>}
					</button>
				))}
			</div>
		</section>
	);
}
