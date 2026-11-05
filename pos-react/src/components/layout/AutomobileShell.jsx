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

/** Sidebar entries: `tab` is a Detailing tab, `view` one of the shared POS pages (customers, inventory). */
const ITEMS = [
	{ id: "overview", tab: "overview", label: "Dashboard", title: "Dashboard", sub: "Your team is on the move. Keep the day running smoothly." },
	{ id: "jobs", tab: "jobs", label: "Bookings & Jobs", title: "Bookings & Jobs", sub: "Follow every job, from booking to invoice." },
	{ id: "customers", view: Customers, label: "Customers", title: "Customers", sub: "Keep customer details, vehicles and service history together." },
	{ id: "vehicles", tab: "vehicles", label: "Vehicles", title: "Vehicles", sub: "Find a vehicle and view its details or past services." },
	{ id: "packages", tab: "packages", label: "Services & Packages", title: "Services & Packages", sub: "Set your service prices, duration and supplies." },
	{ id: "inventory", view: Inventory, label: "Inventory", title: "Inventory", sub: "Check supplies, receive stock and review movements." },
	{ id: "invoices", tab: "invoices", label: "Invoices", title: "Invoices", sub: "Open an invoice to review charges and record payment." },
	{ id: "reports", tab: "reports", label: "Reports", title: "Reports", sub: "Revenue, jobs and team performance." },
];

export function AutomobileShell() {
	const { currentUser, staffLogout, setView } = usePos();
	const { signOut } = useSession();
	const { settings } = useData();
	const notice = useNotice();
	const [id, setId] = useState("overview");
	const [rail, setRail] = useState(false);
	const enabled = hasCapability(settings.businessType, "detailing");
	const current = ITEMS.find((i) => i.id === id) || ITEMS[0];
	const View = current.view;

	useEffect(() => {
		document.body.classList.add("nav-rail");
		return () => document.body.classList.remove("nav-rail");
	}, []);
	// the shared POS pages read the active view from PosProvider: keep it on the matching page
	useEffect(() => {
		if (enabled) setView(id === "customers" ? "customers" : id === "inventory" ? "inventory" : "settings");
	}, [id, enabled, setView]);

	return (
		<>
			<div className="app portal automobile">
				<aside className={"side" + (rail ? " rail-open" : "")}>
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
							ITEMS.map((i) => (
								<button key={i.id} type="button" data-auto={i.id} className={id === i.id ? "active" : ""} title={i.label} onClick={() => { setId(i.id); setRail(false); }}>
									<span className="nav-icon" aria-hidden="true">{i.label[0]}</span>
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
