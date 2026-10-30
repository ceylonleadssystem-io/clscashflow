/**
 * Settings with a sidebar: System Options pages (new) and "More settings", the existing tabs, which keep their own content and Save All button.
 * Rendered inside SystemOptionsProvider so the draft survives moving between System Options pages.
 */
import { SYSTEM_PAGES } from "../../domain/systemOptions";
import { SaveBar, SettingsShell } from "../../components/settings/kit/SettingsShell";
import { useSystemOptionsDraft } from "../../components/settings/kit/SystemOptionsContext";
import { Overview, PAGE_COMPONENTS as SYSTEM_COMPONENTS } from "./SystemOptionsPages";
import { DEVICE_COMPONENTS } from "./DevicePages";
import { AppearancePage, FeedbackPage, ServiceChargePage, StationsPage } from "./MovedPages";
import { hasCapability } from "../../config/capabilities";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { MENU_ADMIN_COMPONENTS } from "./MenuAdminPages";
import { PublishBar } from "../../components/settings/kit/PublishBar";
import { Jobs, Users } from "./UsersPages";
import { usePos } from "../../store/PosProvider";

const PAGE_COMPONENTS = { ...SYSTEM_COMPONENTS, users: Users, jobs: Jobs, serviceCharge: ServiceChargePage, appearance: AppearancePage, feedback: FeedbackPage, stations: StationsPage, ...DEVICE_COMPONENTS, ...MENU_ADMIN_COMPONENTS };

/** The Menu Admin pages in the order the menu is built: items, categories, modifiers, availability, taxes, sales categories. */
export const MENU_ADMIN_NAV = [
	{ key: "items", label: "Items" },
	{ key: "categories", label: "Categories" },
	{ key: "modifiers", label: "Modifiers" },
	{ key: "availability", label: "Availability" },
	{ key: "taxes", label: "Taxes" },
	{ key: "salesCategories", label: "Sales Categories" },
];

export function SettingsHome({ page, setPage, legacyTabs, tab, setTab, legacyView }) {
	const draft = useSystemOptionsDraft();
	const { can } = usePos();
	const current = page === "legacy" ? "legacy:" + tab : page;
	const { settings } = useData();
	const serviceChargeOn = useFeature("checkout.serviceCharge") && hasCapability(settings.businessType, "serviceCharge");
	const groups = [
		{
			title: "System Options",
			items: [
				...SYSTEM_PAGES.map((p) => ({ key: p.key, label: p.title })),
				...(serviceChargeOn ? [{ key: "serviceCharge", label: "Service Charge" }] : []),
				{ key: "appearance", label: "Appearance" },
				{ key: "feedback", label: "Customer Feedback" },
			],
		},
		...(can("users.view") ? [{ title: "Users", items: [{ key: "users", label: "Users" }, { key: "jobs", label: "Jobs" }] }] : []),
		...(can("menu.view") ? [{ title: "Menu Admin", items: MENU_ADMIN_NAV }] : []),
		{ title: "Device Manager", items: [{ key: "printers", label: "Printers" }, ...(can("menu.view") ? [{ key: "stations", label: "Stations" }] : [])] },
		{ title: "More settings", items: legacyTabs.map((t) => ({ key: "legacy:" + t.id, label: t.label })) },
	];
	const select = (key) => {
		if (key.startsWith("legacy:")) {
			setTab(key.slice(7));
			setPage("legacy");
		} else setPage(key);
	};
	const Page = PAGE_COMPONENTS[page];
	return (
		<SettingsShell
			groups={groups}
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
