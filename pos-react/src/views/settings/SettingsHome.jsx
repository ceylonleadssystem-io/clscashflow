/**
 * Settings with a sidebar: System Options pages (new) and "More settings", the existing tabs, which keep their own content and Save All button.
 * Rendered inside SystemOptionsProvider so the draft survives moving between System Options pages.
 */
import { SYSTEM_PAGES } from "../../domain/systemOptions";
import { SaveBar, SettingsShell } from "../../components/settings/kit/SettingsShell";
import { SystemOptionsProvider, useSystemOptionsDraft } from "../../components/settings/kit/SystemOptionsContext";
import { Overview, PAGE_COMPONENTS as SYSTEM_COMPONENTS } from "./SystemOptionsPages";
import { DEVICE_COMPONENTS } from "./DevicePages";
import { Timesheets } from "../Timesheets";
import { AppearancePage, FeedbackPage, ServiceChargePage, StationsPage } from "./MovedPages";
import { hasCapability } from "../../config/capabilities";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { MENU_ADMIN_COMPONENTS } from "./MenuAdminPages";
import { HealthPage, KdsPage } from "./KdsHealthPages";
import { PublishBar } from "../../components/settings/kit/PublishBar";
import { Jobs, Users } from "./UsersPages";
import { usePos } from "../../store/PosProvider";

export const PAGE_COMPONENTS = { ...SYSTEM_COMPONENTS, users: Users, jobs: Jobs, timesheets: Timesheets, serviceCharge: ServiceChargePage, appearance: AppearancePage, feedback: FeedbackPage, stations: StationsPage, kds: KdsPage, health: HealthPage, ...DEVICE_COMPONENTS, ...MENU_ADMIN_COMPONENTS };

/** The Menu Admin pages in the order the menu is built: items, categories, modifiers, availability, taxes, sales categories. */
export const MENU_ADMIN_NAV = [
	{ key: "items", label: "Items" },
	{ key: "categories", label: "Categories" },
	{ key: "modifiers", label: "Modifiers" },
	{ key: "availability", label: "Availability" },
	{ key: "taxes", label: "Taxes" },
	{ key: "salesCategories", label: "Sales Categories" },
];

/**
 * The four areas of Settings and the pages in each, for the grid and the sidebar. `legacyTabs` are the older tabs that still exist
 * (Business Profile, Operations, Plan & Support live under System Options). Areas the person has no permission for are left out.
 */
export function settingsGroups({ can, serviceChargeOn, kitchen, legacyTabs }) {
	const legacy = (id) => legacyTabs.filter((t) => t.id === id).map((t) => ({ key: "legacy:" + t.id, label: t.label }));
	return [
		{
			title: "System Options",
			blurb: "How the business runs: profile, ordering, receipts, sign in, clock in and out, payroll, zones, service charge, appearance and feedback.",
			items: [
				...legacy("business"),
				...SYSTEM_PAGES.map((p) => ({ key: p.key, label: p.title })),
				...(serviceChargeOn ? [{ key: "serviceCharge", label: "Service Charge" }] : []),
				{ key: "appearance", label: "Appearance" },
				{ key: "feedback", label: "Customer Feedback" },
				...legacy("operations"),
				...legacy("plan"),
			],
		},
		...(can("users.view") ? [{ title: "Users", blurb: "The people who work here: their roles, permissions, jobs, pay rates and timesheets.", items: [{ key: "users", label: "Users" }, { key: "jobs", label: "Jobs" }, { key: "timesheets", label: "Timesheets" }] }] : []),
		...(can("menu.view") ? [{ title: "Menu Admin", blurb: "What you sell: items, categories, modifiers, availability, taxes and sales categories.", items: MENU_ADMIN_NAV }] : []),
		{
			title: "Device Manager",
			blurb: "The equipment: printers, kitchen screens, stations and the health of this device.",
			items: [{ key: "printers", label: "Printers" }, ...(kitchen ? [{ key: "kds", label: "KDS" }] : []), ...(can("menu.view") ? [{ key: "stations", label: "Stations" }] : []), { key: "health", label: "Health" }],
		},
	];
}

export function SettingsHome({ page, setPage, legacyTabs, tab, setTab, legacyView }) {
	const draft = useSystemOptionsDraft();
	const { can } = usePos();
	const current = page === "legacy" ? "legacy:" + tab : page;
	const { settings } = useData();
	const serviceChargeOn = useFeature("checkout.serviceCharge") && hasCapability(settings.businessType, "serviceCharge");
	const groups = settingsGroups({ can, serviceChargeOn, kitchen: hasCapability(settings.businessType, "kitchen"), legacyTabs });
	const select = (key) => {
		if (key.startsWith("legacy:")) {
			setTab(key.slice(7));
			setPage("legacy");
		} else setPage(key);
	};
	if (page === "home")
		return (
			<section className="view active" id="view-settings" data-settings-home>
				<div className="sk-page-head" style={{ marginBottom: 14 }}>
					<div>
						<h2>Settings</h2>
						<p className="muted">Choose an area.</p>
					</div>
				</div>
				<div className="sk-grid4">
					{groups.map((g) => (
						<button key={g.title} type="button" className="sk-tile" data-settings-group={g.title} onClick={() => select(g.items[0].key)}>
							<strong>{g.title}</strong>
							<span className="muted">{g.blurb}</span>
						</button>
					))}
				</div>
			</section>
		);
	// only the open area's pages are listed
	const open = groups.find((g) => g.items.some((i) => i.key === current)) || groups[0];
	const Page = PAGE_COMPONENTS[page];
	return (
		<SettingsShell
			groups={[open]}
			back={{ label: "All settings", onClick: () => setPage("home") }}
			current={current}
			onSelect={select}
			guard={() => !draft.dirty}
			bottom={page in MENU_ADMIN_COMPONENTS ? <PublishBar /> : page !== "legacy" && <SaveBar count={draft.changes.length} onDiscard={draft.discard} onSave={draft.save} saving={draft.saving} />}
		>
			{page === "legacy" ? (
				legacyView
			) : (
				<section className="view active" id="view-settings" data-system-options={page}>
					{page === "overview" ? <Overview onOpen={select} /> : Page ? <Page /> : null}
				</section>
			)}
		</SettingsShell>
	);
}

/**
 * One Settings page for the account admin portal (/admin): the same page components, save bar and publish bar as Settings, so the portal can
 * never lag behind the POS. `onOpen(key)` lets the overview tiles move to another page of the portal.
 */
export function PortalSettingsPage({ page, onOpen }) {
	return (
		<SystemOptionsProvider>
			<PortalPageBody page={page} onOpen={onOpen} />
		</SystemOptionsProvider>
	);
}
function PortalPageBody({ page, onOpen }) {
	const draft = useSystemOptionsDraft();
	const Page = PAGE_COMPONENTS[page];
	const menu = page in MENU_ADMIN_COMPONENTS;
	return (
		<section className="view active sk-main" id="view-portal-page" data-system-options={page}>
			<div className="sk-main-body" data-page={page}>
				{page === "overview" ? <Overview onOpen={onOpen} /> : Page ? <Page /> : null}
			</div>
			{menu ? <PublishBar /> : <SaveBar count={draft.changes.length} onDiscard={draft.discard} onSave={draft.save} saving={draft.saving} />}
		</section>
	);
}
