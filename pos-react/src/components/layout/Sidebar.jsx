import { NAV_ITEMS } from "../../config/roles";
import { posMonthlyPrice } from "../../domain/format";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";

export function Sidebar() {
	const { view, go, canView, currentUser, staffLogout } = usePos();
	const { signOut } = useSession();
	const { settings } = useData();
	const logo = settings.logo;
	const users = Math.max(1, +settings.posUsers || 1);
	const monthly = posMonthlyPrice(users);
	return (
		<aside className={"side" + (logo ? " has-business-logo" : "")}>
			{logo && <img id="side-business-logo" className="side-business-logo" alt={(settings.business || "") + " logo"} src={logo} />}
			<div className="brand" aria-label="Powered by Ceylonry POS">
				Ceylonry<span>POS</span>
				<small className="plan">
					POS · LKR {monthly.toLocaleString()} / month · {Math.max(5, users)} users
				</small>
			</div>
			<div className="session-user" id="session-user">
				<strong>{currentUser?.name || "Not signed in"}</strong>
				<span>{currentUser?.role || "Staff session"}</span>
			</div>
			<nav className="nav" id="nav">
				{NAV_ITEMS.filter((item) => canView(item.view)).map((item) => (
					<button key={item.view} data-view={item.view} className={view === item.view ? "active" : ""} onClick={() => go(item.view)}>
						{item.label}
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
