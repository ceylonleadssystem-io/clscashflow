/**
 * The Automobile (car detailing) system, served at automobile.<site host> and /Automobile. It reuses the POS business login, staff PIN and
 * database, but shows only the detailing pages (dashboard, bookings, jobs, vehicles, packages, customers, inventory, invoices, reports),
 * never the POS register. A business whose type is not Automobile sees a notice instead.
 */
import { Suspense, lazy, useEffect, useState } from "react";
import { hasCapability } from "../../config/capabilities";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { useNotice } from "../../store/UiProvider";
import { CustomerModalHost } from "../../modals/CustomerModal";

const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const Detailing = page(() => import("../../views/Detailing"), "Detailing");
const Customers = page(() => import("../../views/Customers"), "Customers");
const Inventory = page(() => import("../../views/Inventory"), "Inventory");
const Staff = page(() => import("../../views/Staff"), "Staff");
const Timesheets = page(() => import("../../views/Timesheets"), "Timesheets");
const Settings = page(() => import("../../views/Settings"), "Settings");
const BusinessSettings = () => <Settings only={["business"]} />;

/** Stroke icons (24px grid, same style as NavIcon) for the sidebar entries. */
const ICONS = {
	overview: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
	jobs: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 15l2.5 2.5L16 13" /></>,
	customers: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 4a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6" /></>,
	vehicles: <><path d="M5 16l1.5-5a2 2 0 0 1 1.9-1.4h7.2a2 2 0 0 1 1.9 1.4L19 16" /><rect x="3" y="16" width="18" height="4" rx="1.5" /><path d="M7 20v1.5M17 20v1.5M7 18h.01M17 18h.01" /></>,
	packages: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
	employees: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
	timesheets: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
	inventory: <><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9v11h18V9M3 9h18M9 13h6" /></>,
	invoices: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
	reports: <><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></>,
	settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
};
const Icon = ({ id }) => (
	<svg className="nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		{ICONS[id]}
	</svg>
);

/** Sidebar entries: `tab` is a Detailing tab, `view` one of the shared POS pages (customers, inventory). */
const ITEMS = [
	{ id: "overview", tab: "overview", label: "Dashboard", title: "Dashboard", sub: "Your team is on the move. Keep the day running smoothly." },
	{ id: "jobs", tab: "jobs", label: "Bookings & Jobs", title: "Bookings & Jobs", sub: "Follow every job, from booking to invoice." },
	{ id: "customers", view: Customers, label: "Customers", title: "Customers", sub: "Keep customer details, vehicles and service history together." },
	{ id: "technicians", tab: "technicians", label: "Technicians", title: "Technicians", sub: "Add the people who do the work; they appear when you assign a booking." },
	{ id: "vehicles", tab: "vehicles", label: "Vehicles", title: "Vehicles", sub: "Find a vehicle and view its details or past services." },
	{ id: "packages", tab: "packages", label: "Services & Packages", title: "Services & Packages", sub: "Set your service prices, duration and supplies." },
	{ id: "employees", view: Staff, label: "Employees", title: "Employees", sub: "See your team, assigned jobs and access." },
	{ id: "timesheets", view: Timesheets, label: "Timesheets", title: "Timesheets", sub: "Clock in, manage breaks and review working hours." },
	{ id: "inventory", view: Inventory, label: "Inventory", title: "Inventory", sub: "Check supplies, receive stock and review movements." },
	{ id: "invoices", tab: "invoices", label: "Invoices", title: "Invoices", sub: "Open an invoice to review charges and record payment." },
	{ id: "reports", tab: "reports", label: "Reports", title: "Reports", sub: "Revenue, jobs and team performance." },
	{ id: "settings", view: BusinessSettings, label: "Settings", title: "Settings", sub: "Manage business details and your interface." },
];
/** Pages each role opens: technicians (the cashier role) only their own work and timesheet, accountants only money pages. */
const ROLE_ITEMS = { technician: ["jobs", "timesheets"], cashier: ["jobs", "timesheets"], accountant: ["invoices", "reports"] };

export function AutomobileShell() {
	const { currentUser, staffLogout, setView } = usePos();
	const { signOut } = useSession();
	const { settings } = useData();
	const notice = useNotice();
	const [id, setId] = useState("overview");
	const [rail, setRail] = useState(false);
	const logo = settings.logo;
	const enabled = hasCapability(settings.businessType, "detailing");
	const items = ITEMS.filter((i) => !ROLE_ITEMS[currentUser?.role] || ROLE_ITEMS[currentUser.role].includes(i.id));
	const current = items.find((i) => i.id === id) || items[0];
	const View = current.view;

	useEffect(() => {
		document.body.classList.add("nav-rail");
		return () => document.body.classList.remove("nav-rail");
	}, []);
	// the shared POS pages read the active view from PosProvider: keep it on the matching page
	useEffect(() => {
		if (enabled) setView(["customers", "inventory"].includes(current.id) ? current.id : current.id === "employees" ? "staff" : "settings");
	}, [current.id, enabled, setView]);

	return (
		<>
			<div className="app portal automobile">
				<aside className={"side" + (logo ? " has-business-logo" : "") + (rail ? " rail-open" : "")}>
					{/* the business logo, as in the POS sidebar: it follows Settings > Business Logo */}
					{logo && <img id="side-business-logo" className="side-business-logo" alt={(settings.business || "") + " logo"} src={logo} />}
					<div className="brand" aria-label="Powered by Ceylonry POS">
						Ceylonry<span>Detailing</span>
						<small className="plan">Car detailing edition</small>
					</div>
					<div className="session-user" id="session-user">
						<strong>{currentUser?.name || "Not signed in"}</strong>
						<span>{currentUser?.role || ""}</span>
					</div>
					<nav className="nav portal-nav" id="nav" aria-label="Detailing">
						<button type="button" className="rail-toggle" aria-expanded={rail} aria-label="Show page names" onClick={() => setRail((r) => !r)}>
							<span className="nav-icon" aria-hidden="true">☰</span>
							<span>Show Navigation</span>
						</button>
						{enabled &&
							items.map((i) => (
								<button key={i.id} type="button" data-auto={i.id} className={current.id === i.id ? "active" : ""} title={i.label} onClick={() => { setId(i.id); setRail(false); }}>
									<Icon id={i.id} />
									<span>{i.label}</span>
								</button>
							))}
					</nav>
					<div className="side-foot">
						<strong id="side-business">{settings.business || "My Business"}</strong>
						<button className="btn out" style={{ marginTop: 10, width: "100%" }} onClick={staffLogout}>
							Lock
						</button>
						<button className="btn out" style={{ marginTop: 7, width: "100%" }} onClick={signOut}>
							Sign Out Business
						</button>
					</div>
				</aside>
				<main className="main">
					<header className="top">
						<div className="top-title">
							<h1 id="title">{enabled ? current.title : "Automobile"}</h1>
							<p id="subtitle">{enabled ? current.sub : settings.business || "My Business"}</p>
						</div>
					</header>
					<div className="content">
						<div className={"notice" + (notice.show ? " show" : "")} id="notice">
							{notice.text}
						</div>
						{enabled ? (
							<Suspense fallback={<div className="empty" role="status" style={{ padding: 20 }}>Loading…</div>}>{View ? <View /> : <Detailing tab={current.tab} />}</Suspense>
						) : (
							<div className="panel" id="automobile-not-enabled">
								<div className="panel-head">
									<div className="panel-title">Automobile is not switched on for this business</div>
								</div>
								<div className="modal-body">
									<p>Ask the Ceylonry administrator to set this business's type to Automobile, then sign in here again.</p>
								</div>
							</div>
						)}
					</div>
				</main>
			</div>
			<CustomerModalHost />
		</>
	);
}
