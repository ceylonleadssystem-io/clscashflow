/**
 * Left navigation shown while a report is open (POS Reports page and the /admin portal): Back to home, All reports and the report
 * groups with the sub-reports of the open group. `onHome` leaves Reports; `open`/`setOpen` is the touch-screen rail state.
 */
import { firstSub } from "../../domain/reportsCatalog";
import { useReportGroups } from "../../hooks/useReportGroups";
import { usePos } from "../../store/PosProvider";

export function ReportNav({ open, setOpen, onHome, homeLabel = "Back to home" }) {
	const { reportNav, setReportNav } = usePos();
	const groups = useReportGroups();
	return (
		<nav className="nav report-nav" id="report-nav" aria-label="Reports">
			<button type="button" className="rail-toggle" aria-expanded={open} aria-label="Show page names" onClick={() => setOpen((o) => !o)}>
				<span className="nav-icon" aria-hidden="true">☰</span>
				<span>Show Navigation</span>
			</button>
			<button type="button" id="report-back-home" className="report-back" title={homeLabel} onClick={onHome}>
				<span className="nav-icon" aria-hidden="true">←</span>
				<span>{homeLabel}</span>
			</button>
			<button type="button" id="report-all" title="All reports" onClick={() => setReportNav(null)}>
				<span className="nav-icon" aria-hidden="true">▤</span>
				<span>All reports</span>
			</button>
			<div className="nav-group nav-sep" role="separator" />
			{groups.map((g) => (
				<div key={g.key} className="report-nav-group">
					<button
						type="button"
						data-report={g.key}
						className={reportNav.group === g.key ? "active" : ""}
						title={g.title}
						onClick={() => {
							setReportNav({ group: g.key, sub: firstSub(g.key) });
							setOpen(false);
						}}
					>
						<span className="nav-icon" aria-hidden="true">{g.icon}</span>
						<span>{g.title}</span>
					</button>
					{reportNav.group === g.key && g.subs.length > 0 && (
						<div className="report-subnav">
							{g.subs.map((sub) => (
								<button
									key={sub.key}
									type="button"
									data-report-sub={sub.key}
									className={reportNav.sub === sub.key ? "active" : ""}
									aria-current={reportNav.sub === sub.key ? "page" : undefined}
									onClick={() => {
										setReportNav({ group: g.key, sub: sub.key });
										setOpen(false);
									}}
								>
									<span>{sub.title}</span>
								</button>
							))}
						</div>
					)}
				</div>
			))}
		</nav>
	);
}
