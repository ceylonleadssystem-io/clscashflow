/**
 * Left navigation: business logo, brand and plan, signed-in user, role-filtered page buttons with
 * icons, and Lock POS / Sign Out. Collapses to an icon strip and expands on hover (see styles/nav-rail.css).
 */
import { Fragment, useEffect, useState } from "react";
import { NavIcon } from "./NavIcon";
import { NAV_ITEMS } from "../../config/roles";
import { planForSettings } from "../../config/plans";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { useReportGroups } from "../../hooks/useReportGroups";
import { firstSub } from "../../domain/reportsCatalog";

export function Sidebar() {
	const { view, go, canView, currentUser, staffLogout, reportNav, setReportNav } = usePos();
	const reportGroups = useReportGroups();
	const { signOut } = useSession();
	const { settings } = useData();
	const logo = settings.logo;
	const plan = planForSettings(settings);
	// Icons-only rail; CSS expands it as an overlay on hover / keyboard focus (nav-rail.css).
	useEffect(() => {
		document.body.classList.add("nav-rail");
		return () => document.body.classList.remove("nav-rail");
	}, []);
	// touch screens: the rail opens from its Menu button (hover does not exist there) and closes on a page choice or any other tap
	const [open, setOpen] = useState(false);
	useEffect(() => {
		if (!open) return;
		const close = (e) => {
			if (e.type === "keydown" ? e.key === "Escape" : !e.target.closest?.(".side")) setOpen(false);
		};
		document.addEventListener("keydown", close);
		document.addEventListener("pointerdown", close);
		return () => {
			document.removeEventListener("keydown", close);
			document.removeEventListener("pointerdown", close);
		};
	}, [open]);
	return (
		<aside className={"side" + (logo ? " has-business-logo" : "") + (open ? " rail-open" : "")}>
			{logo && <img id="side-business-logo" className="side-business-logo" alt={(settings.business || "") + " logo"} src={logo} />}
			<div className="brand" aria-label="Powered by Ceylonry POS">
				Ceylonry<span>POS</span>
				<small className="plan">
					{plan.name} · LKR {plan.price.toLocaleString()} {plan.term}
				</small>
			</div>
			<div className="session-user" id="session-user">
				<strong>{currentUser?.name || "Not signed in"}</strong>
				<span>{currentUser?.role || "Staff session"}</span>
			</div>
			{view === "reports" && reportNav ? (
				<nav className="nav report-nav" id="report-nav" aria-label="Reports">
					<button type="button" className="rail-toggle" aria-expanded={open} aria-label="Show page names" onClick={() => setOpen((o) => !o)}>
						<span className="nav-icon" aria-hidden="true">☰</span>
						<span>Show Navigation</span>
					</button>
					<button type="button" id="report-back-home" className="report-back" title="Back to home" onClick={() => go("dashboard")}>
						<span className="nav-icon" aria-hidden="true">←</span>
						<span>Back to home</span>
					</button>
					<button type="button" id="report-all" title="All reports" onClick={() => setReportNav(null)}>
						<span className="nav-icon" aria-hidden="true">▤</span>
						<span>All reports</span>
					</button>
					<div className="nav-group nav-sep" role="separator" />
					{reportGroups.map((g) => (
						<div key={g.key} className="report-nav-group">
							<button
								type="button"
								data-report={g.key}
								className={reportNav.group === g.key ? "active" : ""}
								title={g.title}
								aria-current={reportNav.group === g.key && !reportNav.sub ? "page" : undefined}
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
			) : (
			<nav className="nav" id="nav">
					<button type="button" className="rail-toggle" aria-expanded={open} aria-label="Show page names" onClick={() => setOpen((o) => !o)}>
						<span className="nav-icon" aria-hidden="true">☰</span>
						<span>Show Navigation</span>
					</button>
					{NAV_ITEMS.filter((item) => canView(item.view)).map((item, i, list) => {
						const group = item.group || "";
						const heading = i && (list[i - 1].group || "") !== group ? group || "-" : "";
						return (
							<Fragment key={item.view}>
								{heading === "-" && <div className="nav-group nav-sep" role="separator" />}
								{heading && heading !== "-" && <div className="nav-group">{heading}</div>}
								<button data-view={item.view} className={view === item.view ? "active" : ""} title={item.label.slice(2)} onClick={() => {
										go(item.view);
										setOpen(false);
									}}>
									<NavIcon view={item.view} />
									<span>{item.label.slice(2)}</span>
								</button>
							</Fragment>
						);
					})}
				</nav>
			)}
			<div className="side-foot">
				<strong id="side-business">{settings.business || "My Business"}</strong>
				<br />
				Standalone POS System
				<br />
				<button className="btn out" style={{ marginTop: 10, width: "100%" }} onClick={staffLogout}>
					Lock POS
				</button>
				<button className="btn out" style={{ marginTop: 7, width: "100%" }} onClick={signOut}>
					Sign Out Business
				</button>
			</div>
		</aside>
	);
}
void useFeature;
