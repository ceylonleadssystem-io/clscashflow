/**
 * Admin portal: detail screen for one business account, with tabs for access (enable/disable and
 * fixed-amount pricing), per-business and per-location feature switches, the first-login welcome message and invoices.
 */
import { GearLoader } from "../components/ui/GearLoader";
import { useCallback, useEffect, useState } from "react";
import { AccessTab } from "./AccessTab";
import { FeaturesTab } from "./FeaturesTab";
import { WelcomeTab } from "./WelcomeTab";
import { InvoicesTab } from "./InvoicesTab";
import { DiagnosticsTab } from "./DiagnosticsTab";
import { useUi } from "../store/UiProvider";
import { adminApi } from "./adminApi";

const TABS = [
	["access", "Access"],
	["features", "Features"],
	["welcome", "Welcome message"],
	["invoices", "Invoices"],
	["diagnostics", "Diagnostics"],
];

export function AccountDetail({ account, onBack, onChanged }) {
	const ui = useUi();
	const [tab, setTab] = useState("access");
	const [data, setData] = useState(null);
	const [invoices, setInvoices] = useState([]);
	const [saving, setSaving] = useState(false);

	const reload = useCallback(async () => {
		const res = await adminApi({ action: "get", userId: account.id });
		setData(res);
		const inv = await adminApi({ action: "listInvoices", userId: account.id }).catch(() => ({ invoices: [] }));
		setInvoices(inv.invoices || []);
	}, [account.id]);
	useEffect(() => {
		reload().catch((e) => ui.alert(e.message));
	}, [reload, ui]);

	const settings = data?.workspace?.settings || {};
	const locations = data?.workspace?.locations || [];
	const profile = data?.user?.profile || {};

	const save = async (patch, summary) => {
		setSaving(true);
		try {
			await adminApi({ action: "saveSettings", userId: account.id, settings: patch, summary });
			ui.notice("Saved. The POS picks this up on its next sync.");
			await reload();
		} catch (e) {
			await ui.alert(e.message);
		} finally {
			setSaving(false);
		}
	};

	if (!data) return <div className="gear-overlay"><GearLoader /></div>;
	return (
		<div>
			<div className="admin-crumb">
				<button className="link-btn" onClick={onBack}>
					← All accounts
				</button>
				<h2>{account.business || account.email}</h2>
				<span className="muted">{account.email}</span>
			</div>
			<div className="settings-tabs" role="tablist" style={{ marginBottom: 14 }}>
				{TABS.map(([id, label]) => (
					<button key={id} type="button" className={"settings-tab" + (tab === id ? " active" : "")} onClick={() => setTab(id)}>
						{label}
					</button>
				))}
			</div>
			{tab === "access" && <AccessTab account={account} profile={profile} settings={settings} save={save} saving={saving} onChanged={() => { onChanged(); reload(); }} ui={ui} />}
			{tab === "features" && <FeaturesTab settings={settings} locations={locations} save={save} saving={saving} ui={ui} />}
			{tab === "welcome" && <WelcomeTab settings={settings} save={save} saving={saving} />}
			{tab === "diagnostics" && <DiagnosticsTab account={account} ui={ui} />}
			{tab === "invoices" && <InvoicesTab account={account} profile={profile} settings={settings} invoices={invoices} reload={reload} ui={ui} />}
		</div>
	);
}
