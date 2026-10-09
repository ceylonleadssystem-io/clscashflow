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

export function Sidebar() {
	const { view, go, canView, currentUser, staffLogout } = usePos();
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
