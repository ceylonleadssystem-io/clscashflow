import { useState } from "react";
import { adminApi } from "./adminApi";
import { STATUSES, SUBSCRIPTIONS, statusOf, subscriptionOf } from "./status";

export function AccessTab({ account, profile, settings, save, saving, onChanged, ui }) {
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
	const change = (action, key, current, next, label, text) => async () => {
		if (next === current) return;
		if (!(await ui.confirm(`Change ${text} to ${label}?`))) return;
		try {
			await adminApi({ action, userId: account.id, [key]: next });
			ui.notice(`${text[0].toUpperCase() + text.slice(1)} set to ${label}.`);
			onChanged();
		} catch (e) {
			await ui.alert(e.message);
		}
	};
	const segmented = (options, current, action, key, text) => (
		<div style={{ display: "flex", gap: 8 }}>
			{options.map((o) => (
				<button key={o.value} className={"btn " + (o.value === current ? "gold" : "out")} aria-pressed={o.value === current} onClick={change(action, key, current, o.value, o.label, text)}>
					{o.label}
				</button>
			))}
		</div>
	);
	const savePlan = () => {
		const amount = Number(fixed.replace(/,/g, ""));
		if (fixed && (!Number.isFinite(amount) || amount <= 0)) return ui.alert("Enter a valid fixed amount or leave it empty.");
		return save({ plan: { tier, exceptionAmount: fixed ? amount : 0, exceptionNote: note.trim() } }, `Tier ${tier}${fixed ? ", fixed amount " + amount : ""}`);
	};
	return (
		<>
		<div className="admin-two">
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Account status</div>
						<div className="muted">Label and reporting bucket only; billing is not changed.</div>
					</div>
					<span className="badge" style={statusOf(account).style}>{statusOf(account).label}</span>
				</div>
				<div className="modal-body">{segmented(STATUSES, statusOf(account).value, "setAccountStatus", "status", "account status")}</div>
			</div>
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Subscription type</div>
						<div className="muted">Billing cycle used for payments and invoices.</div>
					</div>
					<span className="badge">{subscriptionOf(account).label}</span>
				</div>
				<div className="modal-body">{segmented(SUBSCRIPTIONS, subscriptionOf(account).value, "setSubscriptionType", "subscriptionType", "subscription type")}</div>
			</div>
		</div>
		<div className="admin-two" style={{ marginTop: 16 }}>
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
		</>
	);
}
