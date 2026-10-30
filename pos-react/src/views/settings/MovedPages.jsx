/**
 * Settings pages that used to be tabs under "More settings": Service Charge, Appearance and text size, and Customer Feedback (System Options),
 * Receipts & Printing and Stations (Device Manager), and the full catalogue and modifier editors (Menu Admin). Each wraps the existing panel, so what
 * it can do is unchanged; only where it lives changed.
 */
import { useEffect, useState } from "react";
import { hasCapability } from "../../config/capabilities";
import { formFrom } from "../../domain/settingsForm";
import { emailError } from "../../domain/validators";
import { PageHeader, SectionCard } from "../../components/settings/kit/rows";
import { AppearancePanel, DisplayPanel, FeedbackPanel, PrintingPanel, ServiceChargePanel } from "../../components/settings/panels";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { useUi } from "../../store/UiProvider";
import { Modifiers } from "../Modifiers";
import { Products } from "../Products";
import { Stations } from "../Stations";

/** A page of the older business-settings form: the same fields and the same save, with its own Save bar. */
function FormPage({ title, description, children }) {
	const { settings } = useData();
	const { svc } = usePos();
	const ui = useUi();
	const [form, setForm] = useState(() => formFrom(settings));
	const [busy, setBusy] = useState(false);
	// settings saved elsewhere meanwhile (another page, another device) must not be overwritten by an old copy of this form
	useEffect(() => setForm((f) => ({ ...f, receiptFooter: settings.receiptFooter || f.receiptFooter, businessType: settings.businessType || f.businessType })), [settings.receiptFooter, settings.businessType]);
	const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
	const saved = formFrom(settings);
	const dirty = JSON.stringify(saved) !== JSON.stringify(form);
	const save = async () => {
		const bad = emailError(form.email);
		if (bad) return ui.alert("Business email: " + bad);
		setBusy(true);
		try {
			await svc.settings.saveSettings(form);
		} finally {
			setBusy(false);
		}
	};
	return (
		<>
			<PageHeader title={title} description={description} />
			{children(form, set, setForm)}
			<div className="sk-savebar" role="region" aria-label="Save" style={dirty ? undefined : { display: "none" }}>
				<span>You have unsaved changes</span>
				<span className="sk-savebar-actions">
					<button type="button" className="btn out" disabled={busy} onClick={() => setForm(saved)}>
						Discard
					</button>
					<button type="button" className="btn gold" id="save-moved-settings" disabled={busy} onClick={save}>
						{busy ? "Saving…" : "Save"}
					</button>
				</span>
			</div>
		</>
	);
}

export function ServiceChargePage() {
	const { settings } = useData();
	const on = useFeature("checkout.serviceCharge") && hasCapability(settings.businessType, "serviceCharge");
	return (
		<FormPage title="Service Charge" description="An optional percentage added to every bill.">
			{(form, set) => (on ? <ServiceChargePanel form={form} set={set} /> : <SectionCard><p className="muted">A service charge is not available for this type of business.</p></SectionCard>)}
		</FormPage>
	);
}

export function AppearancePage() {
	const themes = useFeature("settings.themes");
	return (
		<>
			<PageHeader title="Appearance" description="Colour theme for the account, and text size and thickness for the person signed in." />
			{themes && <AppearancePanel />}
			<DisplayPanel />
		</>
	);
}

export function FeedbackPage() {
	return (
		<FormPage title="Customer Feedback" description="Where customers are sent to review you, and how long after their visit.">
			{(form, set) => <FeedbackPanel form={form} set={set} />}
		</FormPage>
	);
}

export function ReceiptPrintingPage() {
	return (
		<FormPage title="Receipts & Printing" description="Receipt and kitchen ticket printing, order types on the checkout, socials on the receipt, and USB printers and scanners.">
			{(form, set, setForm) => <PrintingPanel form={form} set={set} setForm={setForm} />}
		</FormPage>
	);
}

export const StationsPage = () => <Stations />;
export const CatalogueEditor = () => <Products />;
export const ModifierGroupEditor = () => <Modifiers />;
