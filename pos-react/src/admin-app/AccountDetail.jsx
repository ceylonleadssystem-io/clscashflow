/**
 * Admin portal: detail screen for one business account, with tabs for access (enable/disable and fixed-amount pricing), subscription (plan limits),
 * per-business and per-location feature switches, the first-login welcome message, invoices, the menu export, diagnostics and delete account.
 */
import { GearLoader } from "../components/ui/GearLoader";
import { useCallback, useEffect, useState } from "react";
import { AccessTab } from "./AccessTab";
import { FeaturesTab } from "./FeaturesTab";
import { WelcomeTab } from "./WelcomeTab";
import { InvoicesTab } from "./InvoicesTab";
import { DiagnosticsTab } from "./DiagnosticsTab";
import { MenuTab } from "./MenuTab";
import { BusinessTypeTab } from "./BusinessTypeTab";
import { SubscriptionTab } from "./SubscriptionTab";
import { DeleteAccountTab } from "./DeleteAccountTab";
import { useUi } from "../store/UiProvider";
import { adminApi } from "./adminApi";
import { beginAssist } from "../services/assist";

const TABS = [
	["access", "Access"],
	["businessType", "Business type"],
	["subscription", "Subscription"],
	["features", "Features"],
	["welcome", "Welcome message"],
	["invoices", "Invoices"],
	["menu", "Menu"],
	["diagnostics", "Diagnostics"],
	["delete", "Delete account"],
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

	// Opens the POS on a COPY of this business' configuration (not a live view) so the administrator can help set it up; see services/assist.js
	const [opening, setOpening] = useState(false);
	const openPos = () => {
		const tab = window.open("", "_blank"); // opened inside the click so the browser does not block it
		if (!tab) return ui.alert("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
		setOpening(true);
		try {
			beginAssist({ accountId: account.id, business: settings.business || account.business || account.email });
			tab.location.href = "/posv2/?assist=1"; // the new tab builds the copy from the server
		} finally {
			setTimeout(() => setOpening(false), 800);
		}
	};

	// Live access: the POS opens signed in as the client (no password). The token travels in the URL fragment, which is never sent to a server.
	const signInAsClient = async () => {
		const tab = window.open("", "_blank");
		if (!tab) return ui.alert("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
		if (!(await ui.confirm("Open this business' live POS signed in as the client? Anything you change there changes their real data. This is recorded in the admin log."))) return tab.close();
		setOpening(true);
		try {
			const r = await adminApi({ action: "openPos", userId: account.id });
			tab.location.href = r.local ? "/posv2/" : "/posv2/#cls-access=" + encodeURIComponent(r.userId) + "." + encodeURIComponent(r.secret);
		} catch (e) {
			tab.close();
			await ui.alert(e.message);
		} finally {
			setOpening(false);
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
				<button className="btn gold" type="button" id="open-client-pos" disabled={opening} onClick={openPos} style={{ marginLeft: "auto" }} title="Opens a copy of this business' menu and settings in the POS to help set it up. It is not a live view: nothing reaches the client until you press Send changes.">
					{opening ? "Opening…" : "Open client's POS"}
				</button>
				<button className="btn out" type="button" id="open-client-pos-live" disabled={opening} onClick={signInAsClient} title="Opens the live POS signed in as this business, no login needed. Changes are real and recorded in the admin log.">
					Sign in as client (live)
				</button>
			</div>
			<div className="settings-tabs" role="tablist" style={{ marginBottom: 14 }}>
				{TABS.map(([id, label]) => (
					<button key={id} type="button" className={"settings-tab" + (tab === id ? " active" : "")} onClick={() => setTab(id)}>
						{label}
					</button>
				))}
			</div>
			{tab === "access" && <AccessTab account={account} profile={profile} settings={settings} save={save} saving={saving} onChanged={() => { onChanged(); reload(); }} ui={ui} />}
			{tab === "businessType" && <BusinessTypeTab settings={settings} save={save} saving={saving} ui={ui} />}
			{tab === "subscription" && <SubscriptionTab settings={settings} workspace={data.workspace} save={save} saving={saving} />}
			{tab === "features" && <FeaturesTab settings={settings} locations={locations} save={save} saving={saving} ui={ui} />}
			{tab === "welcome" && <WelcomeTab settings={settings} save={save} saving={saving} />}
			{tab === "menu" && <MenuTab account={account} workspace={data.workspace} ui={ui} reload={reload} />}
			{tab === "delete" && <DeleteAccountTab account={account} ui={ui} onDeleted={onBack} />}
			{tab === "diagnostics" && <DiagnosticsTab account={account} ui={ui} />}
			{tab === "invoices" && <InvoicesTab account={account} profile={profile} settings={settings} save={save} saving={saving} invoices={invoices} reload={reload} ui={ui} />}
		</div>
	);
}
