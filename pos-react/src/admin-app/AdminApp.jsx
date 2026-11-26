/**
 * Admin portal root: handles the separate administrator sign-in, loads the list of POS accounts with
 * summary stats, and shows either that list (with search) or the selected account's AccountDetail.
 */
import { GearLoader } from "../components/ui/GearLoader";
import { useCallback, useEffect, useState } from "react";
import { adminSession } from "./adminSession";
import { AdminLogin } from "./AdminLogin";
import { AccountDetail } from "./AccountDetail";
import { OverallAnalytics } from "./OverallAnalytics";
import { ChurnPanel, FunnelPanel, HeatmapPanel, KitchenPanel, LossPanel, TypesPanel } from "./InsightPanels";
import { SubscriptionManagement } from "./SubscriptionManagement";
import { NewAccountPanel } from "./NewAccountPanel";
import { SupportViewer } from "./SupportViewer";
import { KanbanBoard } from "../kanban-board/KanbanBoard";
import { useUi } from "../store/UiProvider";
import { adminApi } from "./adminApi";
import { STATUSES, SUBSCRIPTIONS, appsOf, fmtDay, lastUsedOf, statusOf, subscriptionOf } from "./status";
import { AdminFeedbackBar } from "./AdminFeedbackBar";
import { restoreAdmin, signInAdmin, signOutAdmin } from "./adminSignIn";
import { createLogger } from "../utils/logger";

const log = createLogger("admin");

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
	const [page, setPage] = useState("accounts"); // "accounts" | "subscriptions" | "board"
	const [mainTab, setMainTab] = useState("analytics"); // the main page: "analytics" | "accounts" (account management)
	const [q, setQ] = useState("");
	const [fStatus, setFStatus] = useState("");
	const [fSub, setFSub] = useState("");
	const ui = useUi();
	const [creating, setCreating] = useState(false);
	const [supportOpen, setSupportOpen] = useState(false);

	// Restore a still-valid administrator session (kept in sessionStorage for this tab only).
	useEffect(() => {
		setUser(restoreAdmin());
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
		if (user && user.role !== "support") load(); // a support-only account has no accounts to list
	}, [user, load]);

	const signIn = async (email, password) => {
		setBusy(true);
		setError("");
		try {
			setUser(await signInAdmin(email, password));
		} catch (e) {
			log.warn("admin sign-in failed", e);
			setError(e.message);
		} finally {
			setBusy(false);
		}
	};

	if (!ready) return <div className="app-loading"><GearLoader /></div>;
	if (!user) return <AdminLogin onSignIn={signIn} error={error} busy={busy} />;

	// A support-only account sees live support and nothing else: no accounts, billing, settings or analytics
	if (user.role === "support")
		return (
			<div className="admin-app">
				<header className="admin-top">
					<div>
						<div className="admin-brand">
							Ceylonry<span>POS</span> <em>Live support</em>
						</div>
						<div className="muted">Signed in as {user.email}</div>
					</div>
					<div className="admin-top-actions">
						<button className="btn out" onClick={() => { signOutAdmin(); setUser(null); }}>
							Sign out
						</button>
					</div>
				</header>
				<SupportViewer standalone onClose={() => {}} />
			</div>
		);

	const list = accounts.filter((a) => (!fStatus || statusOf(a).value === fStatus) && (!fSub || subscriptionOf(a).value === fSub)).filter((a) => !q.trim() || (a.business + " " + a.email + " " + a.name).toLowerCase().includes(q.trim().toLowerCase()));
	const current = accounts.find((a) => a.id === selected);

	return (
		<div className="admin-app">
			<AdminFeedbackBar />
			{loading && !accounts.length && <div className="gear-overlay"><GearLoader /></div>}
			<header className="admin-top">
				<div>
					<div className="admin-brand">
						Ceylonry<span>POS</span> <em>Administration</em>
					</div>
					<div className="muted">Signed in as {user.email}</div>
				</div>
				<div className="admin-top-actions">
					<button className={"btn " + (page === "subscriptions" ? "gold" : "out")} id="admin-nav-subscriptions" aria-pressed={page === "subscriptions"} onClick={() => { setPage(page === "subscriptions" ? "accounts" : "subscriptions"); setSelected(""); }}>
						Subscription management
					</button>
					<button className={"btn " + (page === "board" ? "gold" : "out")} id="admin-nav-board" aria-pressed={page === "board"} onClick={() => { setPage(page === "board" ? "accounts" : "board"); setSelected(""); }}>
						Feature board
					</button>
					<button className={"btn " + (supportOpen ? "gold" : "out")} id="admin-nav-support" aria-pressed={supportOpen} onClick={() => setSupportOpen((v) => !v)}>
						Live support
					</button>
					<button className="btn out" onClick={load} disabled={loading}>
						{loading ? "Refreshing…" : "Refresh"}
					</button>
					<button className="btn out" onClick={() => { signOutAdmin(); setUser(null); }}>
						Sign out
					</button>
				</div>
			</header>
			{error && <div className="print-note" style={{ marginBottom: 12 }}>{error}</div>}
			{supportOpen && <SupportViewer onClose={() => setSupportOpen(false)} />}

			{page === "subscriptions" ? (
				<SubscriptionManagement />
			) : page === "board" ? (
				<KanbanBoard />
			) : current ? (
				<AccountDetail
					account={current}
					accounts={accounts}
					onBack={() => {
						setSelected("");
						load();
					}}
					onChanged={load}
				/>
			) : (
				<>
					<div className="admin-tabs sk-tabs" role="tablist" aria-label="Administration">
						{[["analytics", "Analytics"], ["accounts", "Account management"]].map(([k, label]) => (
							<button key={k} type="button" role="tab" aria-selected={mainTab === k} id={"admin-tab-" + k} className={mainTab === k ? "active" : ""} onClick={() => setMainTab(k)}>
								{label}
							</button>
						))}
					</div>
					{mainTab === "analytics" && (
						<div role="tabpanel" aria-labelledby="admin-tab-analytics">
					{stats && (
						<section className="admin-summary">
							<div className="card"><div className="label">Trial</div><div className="value">{stats.trialAccounts ?? accounts.filter((a) => statusOf(a).value === "trial").length}</div></div>
							<div className="card"><div className="label">Test</div><div className="value">{stats.testAccounts}</div></div>
							<div className="card"><div className="label">Live</div><div className="value">{stats.liveAccounts ?? accounts.filter((a) => statusOf(a).value === "live").length}</div></div>
							<div className="card"><div className="label">Revenue this month</div><div className="value admin-small">LKR {Number(stats.revenueThisMonth || 0).toLocaleString()}</div></div>
							<div className="card"><div className="label">Disabled accounts</div><div className="value" style={{ color: accounts.some((a) => a.paused) ? "#a5362b" : undefined }}>{accounts.filter((a) => a.paused).length}</div></div>
						</section>
					)}
					<ChurnPanel accounts={accounts} onOpen={setSelected} />
					<OverallAnalytics accounts={accounts} onOpen={setSelected} />
					<HeatmapPanel accounts={accounts} />
					<FunnelPanel accounts={accounts} onOpen={setSelected} />
					<TypesPanel accounts={accounts} />
					<LossPanel accounts={accounts} onOpen={setSelected} />
					<KitchenPanel accounts={accounts} onOpen={setSelected} />
						</div>
					)}
					{mainTab === "accounts" && (
						<div role="tabpanel" aria-labelledby="admin-tab-accounts">
					<div className="tools" style={{ marginBottom: 12, justifyContent: "flex-end" }}>
						<button type="button" className="btn gold" id="new-account-open" aria-expanded={creating} onClick={() => setCreating((v) => !v)}>
							+ New POS account
						</button>
					</div>
					{creating && <NewAccountPanel ui={ui} onClose={() => setCreating(false)} onCreated={load} />}
					<section className="admin-toolbar" style={{ gridTemplateColumns: "1fr auto auto" }}>
						<input className="input" placeholder="Search business, e-mail or name…" value={q} onChange={(e) => setQ(e.target.value)} />
						<select className="input" aria-label="Filter by status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
							<option value="">All statuses</option>
							{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
						</select>
						<select className="input" aria-label="Filter by subscription" value={fSub} onChange={(e) => setFSub(e.target.value)}>
							<option value="">All subscriptions</option>
							{SUBSCRIPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
						</select>
					</section>
					<div className="panel">
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Business</th>
										<th>Contact</th>
										<th>Status</th>
										<th>Subscription</th>
										<th>Products</th>
										<th>Payment</th>
										<th>Next due</th>
										<th>Last used</th>
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
												<span className="badge" style={statusOf(a).style}>{statusOf(a).label}</span>
											</td>
											<td>
												<span className="badge">{subscriptionOf(a).label}</span>
											</td>
											<td>
												<div className="admin-apps">
													{appsOf(a).map((app) => (
														<span className="badge" key={app}>{app}</span>
													))}
												</div>
											</td>
											<td>
												<span className="badge">{a.payment?.status || "trial"}</span>
											</td>
											<td>{fmtDay(a.payment?.paid ? a.payment?.nextPaymentDue : a.payment?.trialEnd)}</td>
											<td>{fmtDay(lastUsedOf(a))}</td>
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
											<td colSpan="10">{loading ? "Loading accounts…" : "No POS accounts found."}</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
					<p className="muted" style={{ marginTop: 10 }}>
						Open an account to switch its features on or off (per business or per location), edit its welcome message and manage invoices.
					</p>
						</div>
					)}
				</>
			)}
		</div>
	);
}
