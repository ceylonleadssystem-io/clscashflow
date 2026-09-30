import { useCallback, useEffect, useMemo, useState } from "react";
import { env } from "../config/env";
import { getAuthService, friendlyAuthError } from "../services/auth.service";
import { AdminLogin } from "./AdminLogin";
import { AccountDetail } from "./AccountDetail";
import { adminApi } from "./adminApi";
import { PLANS } from "../config/plans";

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

/** Administration portal: separate login + accounts list + per-account dashboard. */
export function AdminApp() {
	const auth = useMemo(() => getAuthService(), []);

	const [user, setUser] = useState(null);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [accounts, setAccounts] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState("");
	const [q, setQ] = useState("");

	useEffect(() => {
		if (env.authProvider !== "appwrite") return setReady(true);
		return auth.onChange((u) => {
			setUser(u && env.adminEmails.includes(String(u.email).toLowerCase()) ? u : null);
			setReady(true);
		});
	}, [auth]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await adminApi();
			setAccounts(res.users || []);
			setStats(res.stats || null);
			setError("");
		} catch (e) {
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
			if (!env.adminEmails.includes(email)) throw new Error("This account is not an administrator.");
			await auth.signIn(email, password);
		} catch (e) {
			setError(friendlyAuthError(e));
		} finally {
			setBusy(false);
		}
	};

	if (!ready) return <div className="app-loading">Loading…</div>;
	if (!user) return <AdminLogin onSignIn={signIn} error={error} busy={busy} />;

	const list = accounts.filter((a) => !q.trim() || (a.business + " " + a.email + " " + a.name).toLowerCase().includes(q.trim().toLowerCase()));
	const current = accounts.find((a) => a.id === selected);

	return (
		<div className="admin-app">
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
					<button className="btn out" onClick={async () => { await auth.signOut(); setUser(null); }}>
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
						Tiers: {PLANS.map((p) => p.name).join(" · ")}. Open an account to change its tier, features per location, welcome message and invoices.
					</p>
				</>
			)}
		</div>
	);
}
