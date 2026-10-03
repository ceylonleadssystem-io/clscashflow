import { useEffect, useState } from "react";
import { FULL_SETTINGS_ROLES } from "../config/roles";
import { KITCHEN_TYPES, SERVICE_CHARGE_TYPES } from "../config/presets";
import { ORDER_CHANNELS } from "../config/constants";
import { emailError } from "../domain/validators";
import { useUi } from "../store/UiProvider";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import {
	AppearancePanel,
	BillingPanel,
	BusinessProfilePanel,
	DisplayPanel,
	FeedbackPanel,
	LocationsPanel,
	PlanSupportPanel,
	PosTypePanel,
	PrintingPanel,
	ServiceChargePanel,
} from "../components/settings/panels";
import { DiagnosticsPanel } from "../components/settings/DiagnosticsPanel";

const TABS = [
	{ id: "business", label: "Business Profile" },
	{ id: "pos", label: "POS Setup" },
	{ id: "operations", label: "Operations" },
	{ id: "printing", label: "Receipt Printing" },
	{ id: "plan", label: "Plan & Support" },
];

const formFrom = (s) => ({
	business: s.business || "",
	email: s.email || "",
	address: s.address || "",
	businessType: s.businessType || "other",
	feedbackLink: s.feedbackLink || "",
	feedbackDelay: s.feedbackDelay ?? 2,
	posUsers: Math.max(1, +s.posUsers || 1),
	printerType: s.printerType || "system",
	printerAddress: s.printerAddress || "",
	autoPrint: !!s.autoPrint,
	autoPrintKot: !!s.autoPrintKot,
	kotPrinter: s.kotPrinter || "",
	receiptFooter: s.receiptFooter || "Thank you for your purchase",
	supportEnabled: !!s.supportEnabled,
	serviceChargeEnabled: !!s.serviceChargeEnabled,
	serviceChargeRate: Math.max(0, Math.min(100, +s.serviceChargeRate || 0)),
	orderChannels: Array.isArray(s.orderChannels) && s.orderChannels.length ? s.orderChannels.filter((c) => ORDER_CHANNELS.includes(c)) : ORDER_CHANNELS,
	socials: { instagram: "", facebook: "", tiktok: "", website: "", ...(s.receiptSocials || {}) },
});

/** Settings: business, POS setup, operations, receipt printing and plan & support (tabbed). */
export function Settings() {
	const { settings } = useData();
	const { currentUser, svc, setSetupOpen } = usePos();
	const locationsOn = useFeature("business.locations");
	const themes = useFeature("settings.themes");
	const serviceCharge = useFeature("checkout.serviceCharge");
	const billing = useFeature("settings.billing");
	const ui = useUi();
	const [tab, setTab] = useState("business");
	const [form, setForm] = useState(() => formFrom(settings));
	useEffect(() => {
		// reload when a preset/setup is applied elsewhere
		setForm((f) => ({ ...f, businessType: settings.businessType || f.businessType }));
	}, [settings.businessType]);
	const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
	const full = FULL_SETTINGS_ROLES.includes(currentUser?.role);
	const save = () => {
		const bad = emailError(form.email);
		if (bad) {
			setTab("business");
			return ui.alert("Business email: " + bad);
		}
		return svc.settings.saveSettings(form);
	};
	const kitchen = KITCHEN_TYPES.includes(form.businessType);
	void kitchen;

	const sections = {
		business: full && (
			<>
				<BusinessProfilePanel form={form} set={set} />
				{locationsOn && <LocationsPanel />}
			</>
		),
		pos: full && (
			<>
				<PosTypePanel form={form} set={set} onApplyPreset={() => setSetupOpen(true)} />
				{serviceCharge && SERVICE_CHARGE_TYPES.includes(form.businessType) && <ServiceChargePanel form={form} set={set} />}
			</>
		),
		operations: (
			<>
				{full && themes && <AppearancePanel />}
				<DisplayPanel />
				{full && <FeedbackPanel form={form} set={set} />}
			</>
		),
		printing: <PrintingPanel form={form} set={set} setForm={setForm} />,
		plan: full && (
			<>
				{billing && <BillingPanel />}
				<PlanSupportPanel form={form} set={set} onRegenerate={() => svc.settings.regenerateSupportCode()} />
				<DiagnosticsPanel />
			</>
		),
	};

	return (
		<section className="view active" id="view-settings">
			<div className="settings-tabbed" style={{ maxWidth: 900, display: "grid", gap: 16 }}>
				<div className="settings-tabs" role="tablist" aria-label="Settings sections">
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
}
