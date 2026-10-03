import { useEffect } from "react";
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
	return (
		<aside className={"side" + (logo ? " has-business-logo" : "")}>
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
				{NAV_ITEMS.filter((item) => canView(item.view)).map((item) => (
					<button key={item.view} data-view={item.view} className={view === item.view ? "active" : ""} title={item.label.slice(2)} onClick={() => go(item.view)}>
						<NavIcon view={item.view} />
							<span>{item.label.slice(2)}</span>
					</button>
				))}
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
