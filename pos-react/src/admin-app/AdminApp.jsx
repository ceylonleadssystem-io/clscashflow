/**
 * Admin portal root: handles the separate administrator sign-in, loads the list of POS accounts with
 * summary stats, and shows either that list (with search) or the selected account's AccountDetail.
 */
import { GearLoader } from "../components/ui/GearLoader";
import { useCallback, useEffect, useState } from "react";
import { env } from "../config/env";
import { adminSession } from "./adminSession";
import { AdminLogin } from "./AdminLogin";
import { AccountDetail } from "./AccountDetail";
import { adminApi } from "./adminApi";
import { localAdminSession } from "./localAdmin";
import { createLogger } from "../utils/logger";

const log = createLogger("admin");

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

/** Administration portal: separate login + accounts list + per-account dashboard. */
export function AdminApp() {
	const [user, setUser] = useState(null);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState("");
	const [q, setQ] = useState("");

	// Restore a still-valid administrator session (kept in sessionStorage for this tab only).
	useEffect(() => {
		if (env.authProvider === "local") {
			if (localAdminSession.get()) setUser({ email: "dev admin" });
		} else {
			const s = adminSession.get();
			if (s) setUser({ email: s.email });
		}
		setReady(true);
	}, []);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await adminApi();
			setAccounts(res.users || []);
			setStats(res.stats || null);
			setError("");
		} catch (e) {
			log.error("could not load admin account list", e);
			if (e.status === 401) {
				// Token expired or revoked: return to the sign-in form.
				adminSession.clear();
				setUser(null);
			}
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		if (user) load();
	}, [user, load]);

	const signIn = async (email, password) => {
		setBusy(true);
		setError("");
		try {
			if (env.authProvider === "local") {
				localAdminSession.signIn(email, password);
				setUser({ email });
				return;
			}
			// Credentials are checked server-side against the separate admin database.
			const res = await fetch(env.adminLoginUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
			const json = await res.json().catch(() => ({}));
			if (!res.ok || !json.ok) throw new Error(json.error || "Sign-in failed (" + res.status + ").");
			adminSession.set({ token: json.token, expiresAt: json.expiresAt, email: json.email, name: json.name });
			setUser({ email: json.email });
		} catch (e) {
			log.warn("admin sign-in failed", e);
			setError(e.message);
		} finally {
			setBusy(false);
		}
	};

	if (!ready) return <div className="app-loading"><GearLoader /></div>;
	if (!user) return <AdminLogin onSignIn={signIn} error={error} busy={busy} />;

	const list = accounts.filter((a) => !q.trim() || (a.business + " " + a.email + " " + a.name).toLowerCase().includes(q.trim().toLowerCase()));
	const current = accounts.find((a) => a.id === selected);

	return (
		<div className="admin-app">
			{loading && !accounts.length && <div className="gear-overlay"><GearLoader /></div>}
			<header className="admin-top">
				<div>
					<div className="admin-brand">
						Ceylonry<span>POS</span> <em>Administration</em>
					</div>
					<div className="muted">Signed in as {user.email}</div>
				</div>
				<div className="admin-top-actions">
					<button className="btn out" onClick={load} disabled={loading}>
						{loading ? "Refreshing…" : "Refresh"}
					</button>
					<button className="btn out" onClick={() => { localAdminSession.signOut(); adminSession.clear(); setUser(null); }}>
						Sign out
					</button>
				</div>
			</header>
			{error && <div className="print-note" style={{ marginBottom: 12 }}>{error}</div>}

			{current ? (
				<AccountDetail
					account={current}
					onBack={() => {
						setSelected("");
						load();
					}}
					onChanged={load}
				/>
			) : (
				<>
					{stats && (
						<section className="admin-summary">
							<div className="card"><div className="label">POS customers</div><div className="value">{stats.realCustomers}</div></div>
							<div className="card"><div className="label">Test accounts</div><div className="value">{stats.testAccounts}</div></div>
							<div className="card"><div className="label">Revenue this month</div><div className="value admin-small">LKR {Number(stats.revenueThisMonth || 0).toLocaleString()}</div></div>
							<div className="card"><div className="label">Disabled accounts</div><div className="value" style={{ color: accounts.some((a) => a.paused) ? "#a5362b" : undefined }}>{accounts.filter((a) => a.paused).length}</div></div>
						</section>
					)}
					<section className="admin-toolbar" style={{ gridTemplateColumns: "1fr" }}>
						<input className="input" placeholder="Search business, e-mail or name…" value={q} onChange={(e) => setQ(e.target.value)} />
					</section>
					<div className="panel">
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Business</th>
										<th>Contact</th>
										<th>Payment</th>
										<th>Next due</th>
										<th>Access</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{list.map((a) => (
										<tr key={a.id}>
											<td>
												<strong>{a.business || "—"}</strong>
												<small className="table-subcategory">{a.setupStatus}</small>
											</td>
											<td>
												{a.name || "—"}
												<small className="table-subcategory">{a.email}</small>
											</td>
											<td>
												<span className="badge">{a.payment?.status || "trial"}</span>
											</td>
											<td>{fmtDate(a.payment?.paid ? a.payment?.nextPaymentDue : a.payment?.trialEnd)}</td>
											<td>
												<span className="badge" style={a.paused ? { background: "#fde9e7", color: "#a5362b" } : { background: "#e7f6ee", color: "#168653" }}>
													{a.paused ? "Disabled" : "Active"}
												</span>
											</td>
											<td>
												<button className="btn out" onClick={() => setSelected(a.id)}>
													Manage
												</button>
											</td>
										</tr>
									))}
									{!list.length && (
										<tr>
											<td colSpan="6">{loading ? "Loading accounts…" : "No POS accounts found."}</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
					<p className="muted" style={{ marginTop: 10 }}>
						Open an account to switch its features on or off (per business or per location), edit its welcome message and manage invoices.
					</p>
				</>
			)}
		</div>
	);
}
