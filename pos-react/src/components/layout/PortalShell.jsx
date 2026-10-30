/**
 * The /admin portal shell: sidebar (Home, the portal sections, Open POS, Lock, Sign Out) and the open section. It reuses the POS
 * business login and staff PIN, then offers only account management: Location Info, Reports, Menu Admin, User Admin, Timesheets
 * and Shop. While a report is open the sidebar becomes the report list with a Back to home button (see ReportNav).
 */
import { Suspense, lazy, useEffect, useState } from "react";
import { PORTAL_SECTIONS, visiblePortalSections } from "../../config/portal";
import { planForSettings } from "../../config/plans";
import { useFeature } from "../../store/FeatureProvider";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { useNotice } from "../../store/UiProvider";
import { LocationSwitcherModal } from "../../modals/LocationSwitcherModal";
import { ProductModalHost } from "../../modals/ProductModal";
import { BarcodeModalHost } from "../../modals/BarcodeModal";
import { ModifierPickerModal } from "../../modals/ModifierPickerModal";
import { PortalIcon } from "./PortalIcon";
import { ReportNav } from "./ReportNav";

const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const Settings = page(() => import("../../views/Settings"), "Settings");
const Reports = page(() => import("../../views/Reports"), "Reports");
const PortalSettingsPage = page(() => import("../../views/settings/SettingsHome"), "PortalSettingsPage");
const Timesheets = page(() => import("../../views/Timesheets"), "Timesheets");
const Shop = page(() => import("../../views/Shop"), "Shop");

export function PortalHome({ sections, open }) {
	return (
		<section className="view active" id="portal-home">
			<div className="dashboard-toolbar">
				<div>
					<div className="panel-title">Manage your account</div>
					<div className="muted">Choose what you want to manage. The POS (checkout, tables, orders) is not part of this page.</div>
				</div>
			</div>
			<div className={"portal-hub" + (sections.length > 6 ? " portal-hub-8" : "")} id="portal-hub">
				{sections.map((s) => (
					<button key={s.key} type="button" className="portal-box" data-portal={s.key} onClick={() => open(s.key)}>
						<span className="portal-box-icon"><PortalIcon name={s.icon} size={56} /></span>
						<strong>{s.title}</strong>
						<span className="muted">{s.blurb}</span>
					</button>
				))}
			</div>
		</section>
	);
}

export function PortalShell() {
	const { view, setView, canView, can, currentUser, staffLogout, reportNav, locationId } = usePos();
	const { signOut } = useSession();
	const { settings, locations } = useData();
	const notice = useNotice();
	const multi = useFeature("business.locations") && locations.filter((l) => l.active !== false).length > 1;
	const [section, setSection] = useState("home");
	const [sub, setSub] = useState("");
	const [rail, setRail] = useState(false);
	const [locationsOpen, setLocationsOpen] = useState(false);
	const sections = visiblePortalSections({ canView, can });
	const plan = planForSettings(settings);
	const current = PORTAL_SECTIONS.find((s) => s.key === section);

	useEffect(() => {
		document.body.classList.add("nav-rail");
		return () => document.body.classList.remove("nav-rail");
	}, []);
	// PosProvider keeps the report choice only while its view is "reports"; every other section parks it on a page every role has
	useEffect(() => {
		const want = section === "reports" ? "reports" : "settings";
		if (view !== want) setView(want);
	}, [section, view, setView]);

	const open = (key, next = "") => {
		setSection(key);
		setSub(next || PORTAL_SECTIONS.find((s) => s.key === key)?.subs?.[0]?.view || "");
		setRail(false);
	};
	const locName = locations.find((l) => l.id === locationId)?.name || "All locations";
	const loadingFallback = <div className="empty" role="status" style={{ padding: 20 }}>Loading…</div>;

	let content = <PortalHome sections={sections} open={open} />;
	if (current && sections.includes(current)) {
		if (section === "location") content = <Settings only={["business"]} />;
		else if (section === "reports") content = <Reports />;
		else if (["system", "menu", "users", "devices"].includes(section)) content = <PortalSettingsPage key={sub} page={sub} onOpen={(k) => open(section, k)} />;
		else if (section === "timesheets") content = <Timesheets />;
		else if (section === "shop") content = <Shop />;
	}

	return (
		<>
			<div className="app portal">
				<aside className={"side" + (rail ? " rail-open" : "")}>
					<div className="brand" aria-label="Powered by Ceylonry POS">
						Ceylonry<span>POS</span>
						<small className="plan">Account admin · {plan.name}</small>
					</div>
					<div className="session-user" id="session-user">
						<strong>{currentUser?.name || "Not signed in"}</strong>
						<span>{currentUser?.role || ""}</span>
					</div>
					{section === "reports" && reportNav ? (
						<ReportNav open={rail} setOpen={setRail} onHome={() => open("home")} homeLabel="Back to home" />
					) : (
						<nav className="nav portal-nav" id="nav" aria-label="Account admin">
							<button type="button" className="rail-toggle" aria-expanded={rail} aria-label="Show page names" onClick={() => setRail((r) => !r)}>
								<span className="nav-icon" aria-hidden="true">☰</span>
								<span>Show Navigation</span>
							</button>
							<button type="button" data-portal="home" className={section === "home" ? "active" : ""} title="Home" onClick={() => open("home")}>
								<PortalIcon name="home" />
								<span>Home</span>
							</button>
							<div className="nav-group nav-sep" role="separator" />
							{sections.map((s) => (
								<div key={s.key} className={"report-nav-group" + (section === s.key ? " open" : "") + (s.subs ? " has-subs" : "")}>
									<button type="button" data-portal={s.key} className={section === s.key ? "active" : ""} title={s.title} onClick={() => open(s.key)}>
										<PortalIcon name={s.icon} />
										<span>{s.title}</span>
									</button>
									{section === s.key && s.subs && (
										<div className="report-subnav">
											{s.subs.map((x) => (
												<button key={x.view} type="button" data-portal-sub={x.view} className={sub === x.view ? "active" : ""} onClick={() => open(s.key, x.view)}>
													<span>{x.title}</span>
												</button>
											))}
										</div>
									)}
								</div>
							))}
						</nav>
					)}
					<div className="side-foot">
						<strong id="side-business">{settings.business || "My Business"}</strong>
						<a className="btn out" id="portal-open-pos" style={{ marginTop: 10, width: "100%", display: "block", textAlign: "center" }} href="/posv2/">
							Open POS
						</a>
						<button className="btn out" style={{ marginTop: 7, width: "100%" }} onClick={staffLogout}>
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
							<h1 id="title">{current && section !== "home" ? current.title : "Account admin"}</h1>
							<p id="subtitle">{settings.business || "My Business"}</p>
						</div>
						<div className="top-right">
							{multi && (
								<button type="button" id="location-switcher" className="location-switcher" onClick={() => setLocationsOpen(true)}>
									<span>
										<small>Location</small>
										{locName}
									</span>
									<b>⌄</b>
								</button>
							)}
						</div>
					</header>
					<div className="content">
						<div className={"notice" + (notice.show ? " show" : "")} id="notice">
							{notice.text}
						</div>
						<Suspense fallback={loadingFallback}>{content}</Suspense>
					</div>
				</main>
			</div>
			<ProductModalHost />
			<BarcodeModalHost />
			<ModifierPickerModal />
			<LocationSwitcherModal open={locationsOpen} onClose={() => setLocationsOpen(false)} />
		</>
	);
}
