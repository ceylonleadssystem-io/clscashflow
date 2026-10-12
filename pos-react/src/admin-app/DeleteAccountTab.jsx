/**
 * Account detail > Delete account: permanently removes one business (its users, database documents, sales, images, payment records,
 * profile and sign-in) so old data does not pile up. Step 1 runs the pre-delete checks (nothing is changed), step 2 and step 3 are the
 * two confirmations; the server verifies both and the business name again, then reports what was deleted and what is left.
 */
import { useState } from "react";
import { adminApi } from "./adminApi";
import { fmtDay, lastUsedOf } from "./status";

const COUNT_LABELS = [["staffUsers", "POS users"], ["locations", "Locations"], ["products", "Products"], ["customers", "Customers"], ["sales", "Sales"], ["invoices", "Invoices"], ["paymentRecords", "Payment records"], ["images", "Image files"], ["databaseRows", "Database documents (all pieces)"]];

export function DeleteAccountTab({ account, ui, onDeleted }) {
	const [keepPayments, setKeepPayments] = useState(false);
	const [check, setCheck] = useState(null);
	const [reviewed, setReviewed] = useState(false);
	const [typed, setTyped] = useState("");
	const [busy, setBusy] = useState(false);
	const [report, setReport] = useState(null);
	const business = account.business || "";

	const runCheck = async () => {
		setBusy(true);
		try {
			const r = await adminApi({ action: "previewDeleteAccount", userId: account.id, keepPayments });
			setCheck(r.check);
			setReviewed(false);
			setTyped("");
		} catch (e) {
			await ui.alert(e.message);
		} finally {
			setBusy(false);
		}
	};
	const remove = async () => {
		setBusy(true);
		try {
			const r = await adminApi({ action: "deleteAccount", userId: account.id, keepPayments, confirmBusiness: typed, confirmedReview: true, confirmedFinal: true });
			setReport(r.result);
			ui.notice(r.result.clean ? "Account deleted." : "Account deleted with leftovers: see the report.");
		} catch (e) {
			await ui.alert(e.message);
		} finally {
			setBusy(false);
		}
	};

	if (report)
		return (
			<div className="panel" id="delete-report">
				<div className="panel-head"><div className="panel-title">{report.clean ? "Account deleted" : "Deleted, but some items remain"}</div></div>
				<div className="modal-body">
					<dl className="admin-dl">
						<dt>Documents deleted</dt><dd>{report.done.rows}</dd>
						<dt>Image files deleted</dt><dd>{report.done.images}</dd>
						<dt>Payment records deleted</dt><dd>{report.done.payments}</dd>
						<dt>Sign-in deleted</dt><dd>{report.done.authUser ? "Yes" : "No" + (report.done.authError ? ": " + report.done.authError : "")}</dd>
						<dt>Left after the check</dt><dd>{report.remaining.databaseRows} documents, {report.remaining.images} images, {report.remaining.paymentRecords} payment records</dd>
					</dl>
					{!report.clean && <div className="print-note">Something could not be removed. Run the delete again from this screen if the account is still listed.</div>}
					<button className="btn gold" type="button" onClick={onDeleted}>Back to all accounts</button>
				</div>
			</div>
		);

	return (
		<div className="panel" id="delete-account">
			<div className="panel-head">
				<div>
					<div className="panel-title">Delete this account</div>
					<div className="muted">Removes the business, its users, sales, files and sign-in permanently. Use it for accounts that are finished, so old data does not fill the database.</div>
				</div>
			</div>
			<div className="modal-body">
				<dl className="admin-dl" id="delete-last-used" style={{ marginBottom: 12 }}>
					<dt>Last used</dt><dd>{fmtDay(lastUsedOf(account))}</dd>
					<dt>Last signed in</dt><dd>{fmtDay(account.authLastSignInAt)}</dd>
					<dt>Last synced</dt><dd>{fmtDay(account.updatedAt)}</dd>
				</dl>
				<div className="print-note">This cannot be undone from the POS. The only way back is a database backup, and only until it expires. Run the checks first.</div>
				<label style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
					<input type="checkbox" checked={keepPayments} onChange={(e) => { setKeepPayments(e.target.checked); setCheck(null); setReviewed(false); }} /> Keep payment records (receipts) for accounting
				</label>
				<button className="btn out" type="button" disabled={busy} onClick={runCheck}>{check ? "Run the checks again" : "1. Run pre-delete checks"}</button>
				{check && (
					<div style={{ marginTop: 14 }}>
						<h4 style={{ margin: "0 0 6px" }}>What will be deleted{check.business ? " · " + check.business : ""}</h4>
						<dl className="admin-dl">
							{COUNT_LABELS.map(([k, label]) => (
								<span key={k} style={{ display: "contents" }}><dt>{label}</dt><dd>{k === "paymentRecords" && keepPayments ? "kept" : check.counts[k]}</dd></span>
							))}
						</dl>
						<h4 style={{ margin: "14px 0 6px" }}>Warnings</h4>
						{check.warnings.length ? (
							<ul className="plan-bullets" id="delete-warnings">{check.warnings.map((w) => <li key={w.code}>⚠ {w.text}</li>)}</ul>
						) : <p className="muted">No warnings: the account is disabled, idle and has nothing outstanding.</p>}
						<div style={{ marginTop: 12 }}>
							<button className="btn out" type="button" id="delete-confirm-1" disabled={reviewed} onClick={() => setReviewed(true)}>
								{reviewed ? "✓ Checks reviewed" : "2. I have reviewed the checks and warnings"}
							</button>
						</div>
						{reviewed && (
							<div style={{ marginTop: 12 }}>
								<div className="field" style={{ maxWidth: 420 }}>
									<label htmlFor="delete-business">Type the business name “{business}” to continue</label>
									<input className="input" id="delete-business" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
								</div>
								<button className="btn danger" type="button" id="delete-confirm-2" style={{ marginTop: 10 }} disabled={busy || typed !== business} onClick={remove}>
									3. Permanently delete this account
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
