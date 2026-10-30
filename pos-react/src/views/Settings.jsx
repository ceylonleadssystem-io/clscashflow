/**
 * Settings page: tabbed sections (Business Profile, POS Setup, Operations, Receipt Printing, Plan & Support)
 * sharing one form state with a single Save All Settings button.
 */
import { useEffect, useState } from "react";
import { hasCapability } from "../config/capabilities";
import { formFrom } from "../domain/settingsForm";
import { emailError } from "../domain/validators";
import { useUi } from "../store/UiProvider";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { KdsScreens } from "../KDS/KdsPairing";
import { kitchenStations } from "../domain/kitchenStations";
import { onSettingsTab, requestedSettingsTab } from "../store/settingsTab";
import { CeyloMascot } from "../components/ceylo/Ceylo";
import { CeyloAiKeyPanel } from "../components/ceylo/CeyloAiKey";
import { SystemOptionsProvider } from "../components/settings/kit/SystemOptionsContext";
import { SettingsHome } from "./settings/SettingsHome";
import {
	AppearancePanel,
	BillingPanel,
	BusinessProfilePanel,
	DisplayPanel,
	FeedbackPanel,
	LiveScreenPanel,
	LocationsPanel,
	PlanSupportPanel,
	PosTypePanel,
	PrintingPanel,
	ServiceChargePanel,
} from "../components/settings/panels";

const ALL_TABS = [
	{ id: "business", label: "Business Profile" },
	{ id: "operations", label: "Operations" },
	{ id: "printing", label: "Receipt Printing" }, // full-access users find this under Device Manager; everyone else keeps it so a USB printer can be reconnected
	{ id: "kds", label: "KDS" },
	{ id: "plan", label: "Plan & Support" },
];

/** Settings: business, POS setup, operations, receipt printing and plan & support (tabbed). */
export function Settings({ only = null }) {
	const { settings } = useData();
	const { currentUser, svc, setSetupOpen, setLayout, canView, go, can } = usePos();
	const locationsOn = useFeature("business.locations");
	const themes = useFeature("settings.themes");
	const serviceCharge = useFeature("checkout.serviceCharge");
	const kdsOn = useFeature("checkout.kds");
	const billing = useFeature("settings.billing");
	const ceylo = useFeature("settings.ceylo");
	const ceyloAi = useFeature("settings.ceyloAi");
	const ui = useUi();
	// a request is a legacy tab id, or "page:<key>" for one of the pages in the sidebar (Menu Admin, Device Manager ...)
	const asked = requestedSettingsTab();
	const [tab, setTab] = useState(() => (only && !only.includes(asked) ? only[0] : asked.startsWith("page:") ? "" : asked) || "business");
	// "legacy" shows the tab content below; any other value is a page of the sidebar (views/settings/)
	const [page, setPage] = useState(() => (asked.startsWith("page:") && !only ? asked.slice(5) : "legacy"));
	// Ceylo's fix buttons and the moved pages can ask for a tab or page while Settings is already open
	useEffect(() => onSettingsTab((t) => (t.startsWith("page:") ? setPage(t.slice(5)) : (setTab(t), setPage("legacy")))), []);
	const [form, setForm] = useState(() => formFrom(settings));
	useEffect(() => {
		// reload when a preset/setup is applied elsewhere
		setForm((f) => ({ ...f, businessType: settings.businessType || f.businessType }));
	}, [settings.businessType]);
	// the receipt footer can also be saved from System Options > Receipts: keep this form from overwriting it later
	useEffect(() => {
		setForm((f) => ({ ...f, receiptFooter: settings.receiptFooter || f.receiptFooter }));
	}, [settings.receiptFooter]);
	const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
	// who may change settings: owners, managers and admins by default, or anyone given the permission
	const full = can("settings.system.edit");
	const save = () => {
		const bad = emailError(form.email);
		if (bad) {
			setTab("business");
			return ui.alert("Business email: " + bad);
		}
		return svc.settings.saveSettings(form);
	};
	const kitchen = hasCapability(form.businessType, "kitchen");
	// the KDS tab exists only for kitchen businesses whose account has the Kitchen Display switched on
	// the System Options sidebar is for people who may change settings, and not for the portal's single-tab Location Info
	const sidebar = full && !only;
	const TABS = ALL_TABS.filter((t) => (!only || only.includes(t.id)) && (t.id !== "kds" || (kitchen && kdsOn && !full)) && (t.id !== "printing" || !full));

	const sections = {
		business: full && (
			<>
				<BusinessProfilePanel form={form} set={set} />
				<PosTypePanel form={form} onApplyPreset={() => setSetupOpen(true)} />
				{locationsOn && <LocationsPanel />}
			</>
		),
		operations: (
			<>
				{!full && <DisplayPanel />}
				<LiveScreenPanel />
			</>
		),
		printing: <PrintingPanel form={form} set={set} setForm={setForm} />,
		kds: <KdsScreens stations={kitchenStations(settings, kdsOn)} onManage={canView("stations") ? () => go("stations") : null} />,
		plan: full && (
			<>
				{ceylo && (
					<div className="panel" id="ceylo-settings">
						<div className="panel-head" style={{ gap: 12, justifyContent: "flex-start" }}>
							<CeyloMascot size={40} />
							<div style={{ flex: 1, minWidth: 0 }}>
								<div className="panel-title">Check my setup</div>
								<div className="muted">Ceylo checks your profile, menu, printing, users, stock and sync, and shows what needs attention.</div>
							</div>
							<button className="btn gold" type="button" id="ceylo-check-setup" onClick={() => setLayout((l) => ({ ...l, ceyloOpen: true }))}>
								Check my setup
							</button>
						</div>
					</div>
				)}
				{ceyloAi && <CeyloAiKeyPanel />}
				{billing && <BillingPanel />}
				<PlanSupportPanel form={form} set={set} onRegenerate={() => svc.settings.regenerateSupportCode()} />
			</>
		),
	};

	const legacyView = (
		<section className="view active" id="view-settings">
			<div className="settings-tabbed" style={{ maxWidth: 900, display: "grid", gap: 16 }}>
				<div className="settings-tabs" role="tablist" aria-label="Settings sections" style={TABS.length < 2 || sidebar ? { display: "none" } : undefined}>
					{TABS.map((t, i) => (
						<button
							key={t.id}
							type="button"
							className={"settings-tab" + (tab === t.id ? " active" : "")}
							data-settings-tab={t.id}
							id={"settings-tab-" + t.id}
							role="tab"
							aria-controls={"settings-section-" + t.id}
							aria-selected={tab === t.id}
							tabIndex={tab === t.id ? 0 : -1}
							onClick={() => setTab(t.id)}
							onKeyDown={(e) => {
								if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
								const next = TABS[(i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length];
								setTab(next.id);
								requestAnimationFrame(() => document.getElementById("settings-tab-" + next.id)?.focus());
							}}
						>
							{t.label}
						</button>
					))}
				</div>
				<div className="settings-tab-content">
					{TABS.map((t) => (
						<section
							key={t.id}
							className={"settings-tab-section" + (tab === t.id ? " active" : "")}
							id={"settings-section-" + t.id}
							data-settings-section={t.id}
							role="tabpanel"
							aria-labelledby={"settings-tab-" + t.id}
						>
							{tab === t.id && sections[t.id]}
						</section>
					))}
				</div>
				{full && (
					<button className="btn gold settings-tab-save" style={{ position: "sticky", bottom: 14, width: "100%", padding: 14 }} onClick={save}>
						Save All Settings
					</button>
				)}
			</div>
		</section>
	);
	if (!sidebar) return legacyView;
	return (
		<SystemOptionsProvider>
			<SettingsHome page={page} setPage={setPage} legacyTabs={TABS} tab={tab} setTab={setTab} legacyView={legacyView} />
		</SystemOptionsProvider>
	);
}
