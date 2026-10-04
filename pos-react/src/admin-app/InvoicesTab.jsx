import { useMemo, useState } from "react";
import { PLANS } from "../config/plans";
import { adminApi, emailInvoice } from "./adminApi";
import { buildInvoiceLines } from "./billing";
import { fmt } from "./format";
import { Switch } from "../components/ui";

export function InvoicesTab({ account, profile, settings, save, saving, invoices, reload, ui }) {
	const plan = settings.plan || {};
	const tier = plan.tier || "starter";
	const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
	const [due, setDue] = useState(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
	const [to, setTo] = useState(profile.email || account.email || "");
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);
	const [ex, setEx] = useState({ enabled: !!settings.invoiceExtras?.enabled, description: settings.invoiceExtras?.description || "", amount: settings.invoiceExtras?.amount ?? "" });
	const [tx, setTx] = useState({ enabled: !!settings.invoiceTax?.enabled, rate: settings.invoiceTax?.rate ?? "" });
	const calc = useMemo(
		() => buildInvoiceLines({ tier, exceptionAmount: plan.exceptionAmount, exceptionNote: plan.exceptionNote, period, extras: ex, tax: tx }),
		[tier, plan.exceptionAmount, plan.exceptionNote, period, ex, tx],
	);
	const saveExtras = () => {
		const amount = Number(ex.amount) || 0;
		if (ex.enabled && (amount < 0 || !ex.description.trim())) return ui.alert("Enter a description and an amount of 0 or more.");
		save({ invoiceExtras: { enabled: ex.enabled, description: ex.description.trim().slice(0, 200), amount: Math.max(0, amount) } }, "Invoice additional features");
	};
	const saveTax = () => {
		const rate = Number(tx.rate) || 0;
		if (rate < 0 || rate > 100) return ui.alert("Tax must be between 0 and 100%.");
		save({ invoiceTax: { enabled: tx.enabled, rate: Math.round(rate * 100) / 100 } }, "Invoice tax");
	};

	const create = async (send) => {
		if (send && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return ui.alert("Enter a valid e-mail address to send the invoice to.");
		setBusy(true);
		try {
			const res = await adminApi({ action: "saveInvoice", userId: account.id, invoice: { tier, period, dueDate: due, note, exception: calc.exception, lines: calc.lines, extras: calc.extras, tax: calc.tax, total: calc.total } });
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
							{plainTier?.name} · {calc.exception ? "fixed amount exception" : "tier price"}
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
					{calc.exception && <div className="plan-settings-note">Computed from the tier would be {fmt(calc.computedTotal)}; the client has an agreed fixed amount. The fixed amount is final: additional features and tax are not added.</div>}
					<div className="inv-block">
						<div className="inv-block-head">
							<b>Additional features</b>
							<Switch checked={ex.enabled} onChange={(v) => setEx({ ...ex, enabled: v })} label="Additional features" />
						</div>
						{ex.enabled && (
							<div className="form-grid">
								<div className="field">
									<label>Description</label>
									<input className="input" maxLength={200} value={ex.description} onChange={(e) => setEx({ ...ex, description: e.target.value })} />
								</div>
								<div className="field">
									<label>Amount (LKR)</label>
									<input className="input" type="number" min="0" step="0.01" value={ex.amount} onChange={(e) => setEx({ ...ex, amount: e.target.value })} />
								</div>
							</div>
						)}
						<button className="btn out" disabled={saving} onClick={saveExtras}>
							Save
						</button>
					</div>
					<div className="inv-block">
						<div className="inv-block-head">
							<b>Tax</b>
							<Switch checked={tx.enabled} onChange={(v) => setTx({ ...tx, enabled: v })} label="Tax" />
						</div>
						{tx.enabled && (
							<div className="field">
								<label>Tax (%)</label>
								<input className="input" type="number" min="0" max="100" step="0.01" value={tx.rate} onChange={(e) => setTx({ ...tx, rate: e.target.value })} />
							</div>
						)}
						<button className="btn out" disabled={saving} onClick={saveTax}>
							Save
						</button>
					</div>
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
											{inv.tax?.amount ? " · tax " + fmt(inv.tax.amount) : ""}
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
