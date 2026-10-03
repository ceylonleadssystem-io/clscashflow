/**
 * Admin portal: detail screen for one business account, with tabs for access (enable/disable and
 * fixed-amount pricing), per-business and per-location feature switches, the first-login welcome message and invoices.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FEATURES, FEATURE_GROUPS, FEATURE_MAP, defaultFeatureFlags, dependentsOf, resolveFeatures } from "../config/features";
import { PLANS } from "../config/plans";
import { DEFAULT_WELCOME } from "../config/welcome";
import { Switch } from "../components/ui";
import { useUi } from "../store/UiProvider";
import { adminApi, emailInvoice } from "./adminApi";
import { buildInvoiceLines } from "./billing";

const fmt = (n) => "LKR " + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TABS = [
	["access", "Access"],
	["features", "Features"],
	["welcome", "Welcome message"],
	["invoices", "Invoices"],
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

	if (!data) return <div className="app-loading" style={{ minHeight: 200 }}>Loading account…</div>;
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
			{tab === "invoices" && <InvoicesTab account={account} profile={profile} settings={settings} invoices={invoices} reload={reload} ui={ui} />}
		</div>
	);
}

// ------------------------------------------------------------------ access ---
function AccessTab({ account, profile, settings, save, saving, onChanged, ui }) {
	const plan = settings.plan || {};
	// The tier itself is no longer edited here; it is kept as-is because invoices still read it.
	const tier = plan.tier || "starter";
	const [fixed, setFixed] = useState(plan.exceptionAmount ? String(plan.exceptionAmount) : "");
	const [note, setNote] = useState(plan.exceptionNote || "");
	const paused = profile.posAccountPaused === true;
	const pay = account.payment || {};

	const toggleAccess = async () => {
		const next = !paused;
		if (!(await ui.confirm(next ? "Disable this POS account for non-payment? Staff will see the payment screen immediately." : "Re-enable this POS account?"))) return;
		try {
			await adminApi({ action: "setAccess", userId: account.id, paused: next });
			ui.notice(next ? "Account disabled." : "Account enabled.");
			onChanged();
		} catch (e) {
			await ui.alert(e.message);
		}
	};
	const savePlan = () => {
		const amount = Number(fixed.replace(/,/g, ""));
		if (fixed && (!Number.isFinite(amount) || amount <= 0)) return ui.alert("Enter a valid fixed amount or leave it empty.");
		return save({ plan: { tier, exceptionAmount: fixed ? amount : 0, exceptionNote: note.trim() } }, `Tier ${tier}${fixed ? ", fixed amount " + amount : ""}`);
	};
	return (
		<div className="admin-two">
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Account access</div>
						<div className="muted">Disable an account when payment is overdue.</div>
					</div>
					<span className="badge" style={paused ? { background: "#fde9e7", color: "#a5362b" } : { background: "#e7f6ee", color: "#168653" }}>
						{paused ? "Disabled" : "Active"}
					</span>
				</div>
				<div className="modal-body">
					<dl className="admin-dl">
						<dt>Status</dt><dd>{pay.status || "trial"}</dd>
						<dt>Billing cycle</dt><dd>{pay.billingCycle || "monthly"}</dd>
						<dt>Trial ends</dt><dd>{pay.trialEnd ? new Date(pay.trialEnd).toLocaleDateString("en-GB") : "—"}</dd>
						<dt>Next payment due</dt><dd>{pay.nextPaymentDue ? new Date(pay.nextPaymentDue).toLocaleDateString("en-GB") : "—"}</dd>
						<dt>Last payment</dt><dd>{pay.lastPaymentAt ? new Date(pay.lastPaymentAt).toLocaleDateString("en-GB") : "—"}</dd>
					</dl>
					<button className={"btn " + (paused ? "gold" : "danger")} onClick={toggleAccess}>
						{paused ? "Enable account" : "Disable account (non-payment)"}
					</button>
				</div>
			</div>
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Fixed amount</div>
						<div className="muted">Optional agreed amount that overrides the calculated invoice total.</div>
					</div>
				</div>
				<div className="modal-body">
					<div className="form-grid">
						<div className="field">
							<label>Fixed amount exception (LKR, optional)</label>
							<input className="input" inputMode="decimal" placeholder="e.g. 6000" value={fixed} onChange={(e) => setFixed(e.target.value.replace(/[^\d.,]/g, ""))} />
						</div>
						<div className="field full">
							<label>Exception note</label>
							<input className="input" placeholder="Why this client has a fixed price" value={note} onChange={(e) => setNote(e.target.value)} />
						</div>
					</div>
					<p className="muted">When a fixed amount is set, invoices charge exactly that amount instead of the calculated total.</p>
					<button className="btn gold" disabled={saving} onClick={savePlan}>
						Save amount
					</button>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------- features ---
function FeaturesTab({ settings, locations, save, saving, ui }) {
	const [scope, setScope] = useState("business");
	const [base, setBase] = useState({ ...defaultFeatureFlags(), ...(settings.features || {}) });
	const [byLoc, setByLoc] = useState(() => JSON.parse(JSON.stringify(settings.locationFeatures || {})));
	const [q, setQ] = useState("");
	const [group, setGroup] = useState("all");
	const isBusiness = scope === "business";
	const override = isBusiness ? {} : byLoc[scope] || {};
	const effective = useMemo(() => resolveFeatures({ ...base, ...override }), [base, override]);
	const setBaseFlag = async (f, on) => {
		if (f.core) return;
		if (!on) {
			const deps = dependentsOf(f.id).filter((id) => base[id] && !FEATURE_MAP[id].core);
			if (deps.length && !(await ui.confirm(`Turning off “${f.label}” also disables: ${deps.map((id) => FEATURE_MAP[id].label).join(", ")}. Continue?`))) return;
		}
		setBase((b) => ({ ...b, [f.id]: on }));
	};
	const setLocFlag = (id, value) =>
		setByLoc((m) => {
			const cur = { ...(m[scope] || {}) };
			if (value === "inherit") delete cur[id];
			else cur[id] = value === "on";
			const next = { ...m, [scope]: cur };
			if (!Object.keys(cur).length) delete next[scope];
			return next;
		});
	const dirty = JSON.stringify(base) !== JSON.stringify({ ...defaultFeatureFlags(), ...(settings.features || {}) }) || JSON.stringify(byLoc) !== JSON.stringify(settings.locationFeatures || {});
	const needle = q.trim().toLowerCase();
	const visible = FEATURES.filter((f) => (group === "all" || f.group === group) && (!needle || (f.label + f.description + f.id).toLowerCase().includes(needle)));
	const locName = locations.find((l) => l.id === scope)?.name;

	return (
		<div>
			<section className="admin-toolbar">
				<select className="input" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope">
					<option value="business">All locations (business default)</option>
					{locations.map((l) => (
						<option key={l.id} value={l.id}>
							Location: {l.name}
						</option>
					))}
				</select>
				<input className="input" placeholder="Search features…" value={q} onChange={(e) => setQ(e.target.value)} />
				<select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
					<option value="all">All groups</option>
					{FEATURE_GROUPS.map((g) => (
						<option key={g.id} value={g.id}>
							{g.label}
						</option>
					))}
				</select>
				{isBusiness && (
					<div className="admin-bulk">
						<button className="btn out" onClick={() => setBase(defaultFeatureFlags())}>Reset defaults</button>
					</div>
				)}
			</section>
			{!isBusiness && (
				<div className="print-note" style={{ marginBottom: 12 }}>
					Overrides for <strong>{locName}</strong> only. “Inherit” follows the business default; On/Off forces the feature for this location.
				</div>
			)}
			{FEATURE_GROUPS.filter((g) => visible.some((f) => f.group === g.id)).map((g) => (
				<section className="admin-group" key={g.id}>
					<div className="admin-group-head">
						<h2>
							<span aria-hidden="true">{g.icon}</span> {g.label}
						</h2>
					</div>
					<div className="admin-grid">
						{visible
							.filter((f) => f.group === g.id)
							.map((f) => {
								const on = effective.enabled[f.id];
								const blocked = effective.blockedBy[f.id];
								const ov = override[f.id];
								return (
									<div className={"admin-feature" + (on ? " is-on" : "")} key={f.id}>
										<div className="admin-feature-copy">
											<strong>
												{f.label}
												{f.core && <span className="badge">Required</span>}
												{!isBusiness && ov !== undefined && <span className="badge admin-dirty">Override</span>}
											</strong>
											<span>{f.description}</span>
											{blocked && base[f.id] !== false && <small className="admin-warning">Inactive: needs {blocked.map((id) => FEATURE_MAP[id].label).join(", ")}</small>}
											<code>{f.id}</code>
										</div>
										{isBusiness ? (
											<Switch checked={!!base[f.id]} onChange={(v) => setBaseFlag(f, v)} disabled={f.core} label={f.label} />
										) : (
											<div className="tri" role="group" aria-label={f.label}>
												{["inherit", "on", "off"].map((v) => (
													<button key={v} type="button" disabled={f.core} className={(ov === undefined ? "inherit" : ov ? "on" : "off") === v ? "sel " + v : ""} onClick={() => setLocFlag(f.id, v)}>
														{v === "inherit" ? "Inherit" : v === "on" ? "On" : "Off"}
													</button>
												))}
											</div>
										)}
									</div>
								);
							})}
					</div>
				</section>
			))}
			<footer className="admin-savebar">
				<span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
				<div>
					<button
						className="btn out"
						disabled={!dirty}
						onClick={() => {
							setBase({ ...defaultFeatureFlags(), ...(settings.features || {}) });
							setByLoc(JSON.parse(JSON.stringify(settings.locationFeatures || {})));
						}}
					>
						Discard
					</button>
					<button className="btn gold" disabled={!dirty || saving} onClick={() => save({ features: base, locationFeatures: byLoc }, "Feature switches updated")}>
						Save features
					</button>
				</div>
			</footer>
		</div>
	);
}

// ----------------------------------------------------------------- welcome ---
function WelcomeTab({ settings, save, saving }) {
	const current = { ...DEFAULT_WELCOME, ...(settings.welcome || {}) };
	const [w, setW] = useState(current);
	const set = (k) => (e) => setW((v) => ({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
	return (
		<div className="admin-two">
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">First-login message</div>
						<div className="muted">Shown once to every POS user the first time they sign in.</div>
					</div>
				</div>
				<div className="modal-body">
					<label className="muted admin-check">
						<input type="checkbox" checked={w.enabled} onChange={set("enabled")} /> Show the welcome message
					</label>
					<div className="field" style={{ marginTop: 12 }}>
						<label>Title</label>
						<input className="input" value={w.title} onChange={set("title")} maxLength={120} />
					</div>
					<div className="field" style={{ marginTop: 12 }}>
						<label>Message</label>
						<textarea className="input" rows={6} value={w.message} onChange={set("message")} maxLength={1500} />
					</div>
					<div className="tools" style={{ marginTop: 14 }}>
						<button className="btn gold" disabled={saving} onClick={() => save({ welcome: { ...w, showPlans: false, version: current.version } }, "Welcome message updated")}>
							Save message
						</button>
						<button className="btn out" disabled={saving} onClick={() => save({ welcome: { ...w, showPlans: false, version: (Number(current.version) || 1) + 1 } }, "Welcome message re-published to all users")}>
							Save & show again to every user
						</button>
					</div>
					<p className="muted">Version {current.version}. “Show again” raises the version so each user sees the message at their next sign-in.</p>
				</div>
			</div>
			<div className="panel">
				<div className="panel-head">
					<div className="panel-title">Preview</div>
				</div>
				<div className="modal-body">
					<h3 style={{ marginTop: 0 }}>{w.title}</h3>
					<p className="welcome-message">{w.message}</p>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------- invoices ---
function InvoicesTab({ account, profile, settings, invoices, reload, ui }) {
	const plan = settings.plan || {};
	const tier = plan.tier || "starter";
	const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
	const [due, setDue] = useState(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
	const [to, setTo] = useState(profile.email || account.email || "");
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);
	const flags = { ...defaultFeatureFlags(), ...(settings.features || {}) };
	const calc = useMemo(() => buildInvoiceLines({ tier, flags, exceptionAmount: plan.exceptionAmount, exceptionNote: plan.exceptionNote, period }), [tier, settings.features, plan.exceptionAmount, plan.exceptionNote, period]); // eslint-disable-line

	const create = async (send) => {
		if (send && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return ui.alert("Enter a valid e-mail address to send the invoice to.");
		setBusy(true);
		try {
			const res = await adminApi({ action: "saveInvoice", userId: account.id, invoice: { tier, period, dueDate: due, note, exception: calc.exception, lines: calc.lines } });
			let inv = res.invoice;
			if (send) {
				await emailInvoice({ to, invoice: inv, clientName: profile.name, businessName: account.business });
				inv = (await adminApi({ action: "saveInvoice", userId: account.id, invoice: { ...inv, emailedTo: to, lines: inv.lines, number: inv.number } })).invoice;
			}
			ui.notice(send ? `Invoice ${inv.number} created and e-mailed.` : `Invoice ${inv.number} created.`);
			await reload();
		} catch (e) {
			await ui.alert(e.message);
		} finally {
			setBusy(false);
		}
	};
	const resend = async (inv) => {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return ui.alert("Enter a valid e-mail address first.");
		try {
			await emailInvoice({ to, invoice: inv, clientName: profile.name, businessName: account.business });
			await adminApi({ action: "saveInvoice", userId: account.id, invoice: { ...inv, emailedTo: to } });
			ui.notice("Invoice e-mailed to " + to + ".");
			reload();
		} catch (e) {
			ui.alert(e.message);
		}
	};
	const setStatus = async (inv, status) => {
		await adminApi({ action: "saveInvoice", userId: account.id, invoice: { ...inv, status } });
		reload();
	};
	const plainTier = PLANS.find((p) => p.id === tier);
	return (
		<div className="admin-two">
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">New invoice</div>
						<div className="muted">
							{plainTier?.name} · {calc.exception ? "fixed amount exception" : "tier price + additional features"}
						</div>
					</div>
				</div>
				<div className="modal-body">
					<div className="table-wrap">
						<table style={{ minWidth: 0 }}>
							<thead>
								<tr>
									<th>Description</th>
									<th>Qty</th>
									<th>Price</th>
									<th>Total</th>
								</tr>
							</thead>
							<tbody>
								{calc.lines.map((l, i) => (
									<tr key={i}>
										<td style={{ whiteSpace: "normal" }}>{l.desc}</td>
										<td>{l.qty}</td>
										<td>{fmt(l.price)}</td>
										<td>{fmt(l.qty * l.price)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="plan-total">
						<span>Total</span>
						<span>{fmt(calc.total)}</span>
					</div>
					{calc.exception && <div className="plan-settings-note">Computed from the tier would be {fmt(calc.computedTotal)}; the client has an agreed fixed amount.</div>}
					{!calc.exception && calc.extras.length > 0 && <div className="plan-settings-note">{calc.extras.length} additional feature(s) outside the tier: {calc.extras.map((id) => FEATURE_MAP[id].label).join(", ")}.</div>}
					<div className="form-grid" style={{ marginTop: 12 }}>
						<div className="field">
							<label>Billing period</label>
							<input className="input" value={period} onChange={(e) => setPeriod(e.target.value)} />
						</div>
						<div className="field">
							<label>Due date</label>
							<input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
						</div>
						<div className="field full">
							<label>E-mail to</label>
							<input className="input" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
						</div>
						<div className="field full">
							<label>Note</label>
							<input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
						</div>
					</div>
					<div className="tools" style={{ marginTop: 12 }}>
						<button className="btn out" disabled={busy} onClick={() => create(false)}>
							Create invoice
						</button>
						<button className="btn gold" disabled={busy} onClick={() => create(true)}>
							Create & e-mail
						</button>
					</div>
				</div>
			</div>
			<div className="panel">
				<div className="panel-head">
					<div className="panel-title">Invoice history</div>
				</div>
				<div className="table-wrap">
					<table style={{ minWidth: 0 }}>
						<thead>
							<tr>
								<th>No.</th>
								<th>Amount</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{invoices.map((inv) => (
								<tr key={inv.id}>
									<td>
										{inv.number}
										<small className="table-subcategory">
											{inv.period} · {inv.exception ? "fixed" : inv.tier}
											{inv.emailedTo ? " · e-mailed" : ""}
										</small>
									</td>
									<td>{fmt(inv.amount)}</td>
									<td>
										<select className="input" value={inv.status} onChange={(e) => setStatus(inv, e.target.value)}>
											<option value="unpaid">Unpaid</option>
											<option value="paid">Paid</option>
											<option value="void">Void</option>
										</select>
									</td>
									<td>
										<button className="btn out" onClick={() => resend(inv)}>
											E-mail
										</button>
									</td>
								</tr>
							))}
							{!invoices.length && (
								<tr>
									<td colSpan="4">No invoices yet.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
