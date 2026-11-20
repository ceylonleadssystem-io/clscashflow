import { useState } from "react";
import { adminApi } from "./adminApi";
import { STATUSES, SUBSCRIPTIONS, accessWarning, statusOf, subscriptionOf } from "./status";

export function AccessTab({ account, profile, settings, save, saving, onChanged, ui }) {
	const plan = settings.plan || {};
	// The tier itself is no longer edited here; it is kept as-is because invoices still read it.
	const tier = plan.tier || "starter";
	const [fixed, setFixed] = useState(plan.exceptionAmount ? String(plan.exceptionAmount) : "");
	const [note, setNote] = useState(plan.exceptionNote || "");
	const [cycle, setCycle] = useState(subscriptionOf(account).value);
	const [amount, setAmount] = useState("");
	const [days, setDays] = useState("14");
	const [busy, setBusy] = useState(false);
	const status = statusOf(account);
	const warning = accessWarning(account, profile.posAccountPaused === true);
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
	const change = (action, key, current, next, label, text, warn = "") => async () => {
		if (next === current) return;
		if (!(await ui.confirm(`Change ${text} to ${label}?${warn ? "\n\n" + warn : ""}`))) return;
		try {
			await adminApi({ action, userId: account.id, [key]: next });
			ui.notice(`${text[0].toUpperCase() + text.slice(1)} set to ${label}.`);
			onChanged();
		} catch (e) {
			await ui.alert(e.message);
		}
	};
	const segmented = (options, current, action, key, text, warn = () => "") => (
		<div style={{ display: "flex", gap: 8 }}>
			{options.map((o) => (
				<button key={o.value} className={"btn " + (o.value === current ? "gold" : "out")} aria-pressed={o.value === current} onClick={change(action, key, current, o.value, o.label, text, warn(o.value))}>
					{o.label}
				</button>
			))}
		</div>
	);
	const LIVE_WARN = "Live means paid. This marks the account as paid for one billing period without a payment record; use Record payment below to log a real payment.";
	const TRIAL_WARN = "Trial means not paid yet. Staff are asked for payment as soon as the trial end date has passed; use Extend trial below to give more time.";
	const statusWarn = (v) => (v === "live" ? LIVE_WARN : v === "trial" ? TRIAL_WARN : "Test accounts (demos) are never asked for payment.");
	const run = async (action, body, done) => {
		setBusy(true);
		try {
			await adminApi({ action, userId: account.id, ...body });
			ui.notice(done);
			onChanged();
		} catch (e) {
			await ui.alert(e.message);
		} finally {
			setBusy(false);
		}
	};
	const recordPayment = async () => {
		const value = amount.trim() ? Number(amount.replace(/,/g, "")) : 0;
		if (amount.trim() && (!Number.isFinite(value) || value <= 0)) return ui.alert("Enter a valid amount or leave it empty for the standard price.");
		const shown = value ? "LKR " + value.toLocaleString("en-US") : cycle === "annual" ? "the standard annual price (LKR 62,000)" : "the standard monthly price (LKR 5,500)";
		if (!(await ui.confirm(`Record a ${cycle} payment of ${shown} for ${account.business || account.email || "this account"}?\n\nThe account becomes Live and is paid until the next billing date.`))) return;
		await run("recordPayment", { billingCycle: cycle, amountLkr: value || undefined }, "Payment recorded. The account is Live.");
		setAmount("");
	};
	const extendTrial = async () => {
		if (!(await ui.confirm(`Extend the trial by ${days} days?\n\nThe days count from today, or from the current end date if that is still ahead.`))) return;
		await run("extendTrial", { days: Number(days) }, `Trial extended by ${days} days.`);
	};
	const savePlan = () => {
		const amount = Number(fixed.replace(/,/g, ""));
		if (fixed && (!Number.isFinite(amount) || amount <= 0)) return ui.alert("Enter a valid fixed amount or leave it empty.");
		return save({ plan: { tier, exceptionAmount: fixed ? amount : 0, exceptionNote: note.trim() } }, `Tier ${tier}${fixed ? ", fixed amount " + amount : ""}`);
	};
	return (
		<>
		{warning && (
			<div role="alert" id="access-warning" style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, border: "1px solid #f0c36d", background: "#fff4d6", color: "#7a5300", fontWeight: 600 }}>
				{warning}
			</div>
		)}
		<div className="admin-two">
			<div className="panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Account status</div>
						<div className="muted">Live means paid and Trial means not paid yet, so this always matches the billing below. Test accounts (demos) are never asked for payment and stay out of the reporting figures.</div>
					</div>
					<span className="badge" style={statusOf(account).style}>{statusOf(account).label}</span>
				</div>
				<div className="modal-body">{segmented(STATUSES, status.value, "setAccountStatus", "status", "account status", statusWarn)}</div>
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
						<dt>Status</dt><dd title={"Billing: " + (pay.status || "trial")}>{status.label}</dd>
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
		<div className="admin-two" style={{ marginTop: 16 }}>
			<div className="panel" id="record-payment-panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Record payment</div>
						<div className="muted">Use this when the client has paid. The account becomes Live and is paid until the next billing date.</div>
					</div>
				</div>
				<div className="modal-body">
					<div className="form-grid">
						<div className="field">
							<label htmlFor="rp-cycle">Billing cycle</label>
							<select className="input" id="rp-cycle" value={cycle} onChange={(e) => setCycle(e.target.value)}>
								{SUBSCRIPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>
						<div className="field">
							<label htmlFor="rp-amount">Amount received (LKR, optional)</label>
							<input className="input" id="rp-amount" inputMode="decimal" placeholder={cycle === "annual" ? "Standard: 62,000" : "Standard: 5,500"} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} />
						</div>
					</div>
					<button className="btn gold" id="record-payment-btn" disabled={busy} style={{ marginTop: 12 }} onClick={recordPayment}>
						Record payment
					</button>
				</div>
			</div>
			<div className="panel" id="extend-trial-panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Extend trial</div>
						<div className="muted">Gives an unpaid account more time before staff are asked for payment.</div>
					</div>
				</div>
				<div className="modal-body">
					{status.value === "live" ? (
						<p className="muted">This account is Live (paid), so it has no trial to extend.</p>
					) : (
						<>
							<div className="field" style={{ maxWidth: 240 }}>
								<label htmlFor="et-days">Extend by</label>
								<select className="input" id="et-days" value={days} onChange={(e) => setDays(e.target.value)}>
									{[7, 14, 30, 60].map((d) => (
										<option key={d} value={d}>
											{d} days
										</option>
									))}
								</select>
							</div>
							<button className="btn gold" id="extend-trial-btn" disabled={busy} style={{ marginTop: 12 }} onClick={extendTrial}>
								Extend trial
							</button>
						</>
					)}
				</div>
			</div>
		</div>
		</>
	);
}
