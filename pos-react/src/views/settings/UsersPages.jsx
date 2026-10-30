/**
 * Settings > Users: the users list with a detail view (General, Permissions, POS setup), and Jobs with hourly rates.
 * Jobs and personal permission changes are stored in settings (jobs, userAccess; see domain/access.js); the user record itself is saved
 * through svc.staff.saveUser as before. A person's pay rate comes from their first job and prices hours in Reports.
 */
import { useEffect, useMemo, useState } from "react";
import { ConditionalGroup, NumberRow, PageHeader, SectionCard, SelectRow, TextRow, ToggleRow } from "../../components/settings/kit/rows";
import { DetailDrawer, EmptyState, SortableList, StatusBadge } from "../../components/settings/kit/entities";
import { PERMISSIONS, PRESET_ROLES, accessOf, effectivePermissions, jobError, jobsOf, rolePreset, userRate } from "../../domain/access";
import { money } from "../../domain/format";
import { reorder } from "../../domain/thirdPartyPayments";
import { activeLocations } from "../../services/pos/locations";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";

const ROLE_LABEL = { owner: "Owner", admin: "Admin", manager: "Manager", accountant: "Accountant", cashier: "Cashier" };
const TABS = [
	["general", "General"],
	["permissions", "Permissions"],
	["pos", "POS setup"],
];

function UserDetail({ id, onBack }) {
	const data = useData();
	const { svc, currentUser, can } = usePos();
	const multi = useFeature("business.locations");
	const jobs = jobsOf(data.settings).filter((j) => j.active !== false);
	const existing = data.users.find((u) => u.id === id);
	const [tab, setTab] = useState("general");
	const [busy, setBusy] = useState(false);
	const [form, setForm] = useState(null);
	const [keys, setKeys] = useState([]);
	const [picked, setPicked] = useState({}); // jobId -> rate string ("" = the job's default)
	useEffect(() => {
		const u = existing || { id: "", name: "", pin: "", role: "cashier", active: true, clockInBehaviour: "prompt", registerBehaviour: "prompt", locationAccess: multi ? "selected" : "all", locationIds: [] };
		setForm({ ...u, pin: u.pin || "", locationIds: u.locationIds || [] });
		setKeys(existing ? effectivePermissions(existing, data.settings) : rolePreset("cashier"));
		setPicked(Object.fromEntries(accessOf(data.settings, id).jobs.map((j) => [j.jobId, j.rate === undefined ? "" : String(j.rate)])));
		setTab("general");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);
	if (!form) return null;
	const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
	const all = form.role === "owner" || form.role === "admin";
	const mayAssign = (r) => ["owner", "admin"].includes(currentUser?.role) || !["owner", "admin"].includes(r);
	const roles = PRESET_ROLES.filter((r) => mayAssign(r) || r === form.role);
	const changeRole = (role) => {
		setForm((f) => ({ ...f, role }));
		setKeys(rolePreset(role)); // a new role starts from its own permissions
	};
	const toggle = (k, on) => setKeys((cur) => (on ? [...new Set([...cur, k])] : cur.filter((x) => x !== k)));
	const save = async () => {
		setBusy(true);
		try {
			const user = await svc.staff.saveUser({ ...form });
			if (!user) return;
			const ok = await svc.settings.saveUserAccess(user.id, { keys: all ? [] : keys, jobs: Object.entries(picked).map(([jobId, rate]) => ({ jobId, rate })) });
			if (ok) onBack();
		} finally {
			setBusy(false);
		}
	};
	const groups = [...new Set(PERMISSIONS.map((p) => p.group))];
	const locs = activeLocations(data);
	return (
		<>
			<PageHeader
				title={existing ? existing.name : "New user"}
				description={existing ? "Change this person's details, permissions and jobs." : "Add a person who will use the POS."}
				actions={
					<button type="button" className="btn out" id="user-back" onClick={onBack}>
						← All users
					</button>
				}
			/>
			<div className="sk-tabs" role="tablist" aria-label="User details">
				{TABS.map(([k, label]) => (
					<button key={k} type="button" role="tab" id={"ut-" + k} aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
						{label}
					</button>
				))}
			</div>
			{tab === "general" && (
				<SectionCard title="General">
					<TextRow id="u-name" label="Name" value={form.name} max={60} onChange={set("name")} />
					<SelectRow id="u-role" label="Role" help="The role sets the starting permissions. You can adjust them on the Permissions tab." value={form.role} onChange={changeRole} options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
					<ToggleRow id="u-active" label="Active" help="Inactive people cannot sign in. Their history stays in reports." value={form.active !== false} onChange={set("active")} />
					{multi && !all && (
						<>
							<SelectRow id="u-access" label="Locations" value={form.locationAccess} onChange={set("locationAccess")} options={[{ value: "all", label: "All locations" }, { value: "selected", label: "Selected locations" }]} />
							<ConditionalGroup show={form.locationAccess === "selected"}>
								{locs.map((l) => (
									<ToggleRow key={l.id} id={"u-loc-" + l.id} label={l.name} value={form.locationIds.includes(l.id)} onChange={(on) => setForm((f) => ({ ...f, locationIds: on ? [...f.locationIds, l.id] : f.locationIds.filter((x) => x !== l.id) }))} />
								))}
							</ConditionalGroup>
						</>
					)}
				</SectionCard>
			)}
			{tab === "permissions" && (
				<>
					<SectionCard>
						<SelectRow id="u-copy" label="Copy from" help="Start from a role's permissions, then change what you need." value="" onChange={(r) => r && setKeys(rolePreset(r))} disabled={all} options={[{ value: "", label: "Choose a role…" }, ...PRESET_ROLES.filter((r) => r !== "owner" && r !== "admin").map((r) => ({ value: r, label: ROLE_LABEL[r] }))]} />
						{all && <p className="muted">Owners and admins always hold every permission.</p>}
					</SectionCard>
					{groups.map((g) => (
						<SectionCard key={g} title={g}>
							{PERMISSIONS.filter((p) => p.group === g).map((p) => (
								<ToggleRow key={p.key} id={"perm-" + p.key} label={p.label} tip={p.tip} value={all || keys.includes(p.key)} disabled={all || (!can(p.key) && !keys.includes(p.key))} onChange={(on) => toggle(p.key, on)} help={!can(p.key) && !all ? "You do not hold this permission, so you cannot give it." : undefined} />
							))}
						</SectionCard>
					))}
				</>
			)}
			{tab === "pos" && (
				<>
					<SectionCard title="Jobs and pay rates" description="Pay rate prices the person's hours in Reports. The first job ticked is the one used.">
						{jobs.length ? (
							jobs.map((j) => (
								<div key={j.id}>
									<ToggleRow id={"job-" + j.id} label={j.title} help={`Default ${money(j.rate)} an hour`} value={j.id in picked} onChange={(on) => setPicked((p) => (on ? { ...p, [j.id]: "" } : Object.fromEntries(Object.entries(p).filter(([k]) => k !== j.id))))} />
									<ConditionalGroup show={j.id in picked}>
										<NumberRow id={"rate-" + j.id} label="Hourly rate" help="Leave empty to use the job's default." value={picked[j.id]} onChange={(v) => setPicked((p) => ({ ...p, [j.id]: v === "" ? "" : String(v) }))} min={0} step={0.01} suffix="an hour" />
									</ConditionalGroup>
								</div>
							))
						) : (
							<EmptyState title="No jobs yet">Add jobs (Server, Cashier, Chef...) under Users › Jobs, then choose them here.</EmptyState>
						)}
					</SectionCard>
					<SectionCard title="Sign in">
						<TextRow id="u-pin" label="PIN" help="4 to 6 digits, different from everyone else's." value={form.pin} max={6} onChange={(v) => set("pin")(v.replace(/\D/g, ""))} />
						<SelectRow id="u-clock" label="Clock in after sign-in" value={form.clockInBehaviour} onChange={set("clockInBehaviour")} options={[{ value: "prompt", label: "Ask each time" }, { value: "automatic", label: "Clock in automatically" }, { value: "manual", label: "Do not ask" }]} />
					</SectionCard>
				</>
			)}
			<div className="sk-detail-actions">
				<button type="button" className="btn out" onClick={onBack}>
					Cancel
				</button>
				<button type="button" className="btn gold" id="save-user" disabled={busy} onClick={save}>
					{busy ? "Saving…" : existing ? "Save" : "Create user"}
				</button>
			</div>
		</>
	);
}

export function Users() {
	const data = useData();
	const { can } = usePos();
	const [editing, setEditing] = useState(null); // null = list, "" = new user, id = that user
	const [search, setSearch] = useState("");
	const jobs = jobsOf(data.settings);
	const rows = useMemo(() => data.users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)), [data.users, search]);
	if (!can("users.view")) return <EmptyState title="No access">You need the "See users" permission to open this page.</EmptyState>;
	if (editing !== null) return <UserDetail id={editing} onBack={() => setEditing(null)} />;
	const edit = can("users.edit");
	return (
		<>
			<PageHeader
				title="Users"
				description="People who sign in to the POS, their roles, jobs and permissions."
				actions={
					edit && (
						<button type="button" className="btn gold" id="add-user" onClick={() => setEditing("")}>
							Add user
						</button>
					)
				}
			/>
			<SectionCard>
				<div className="sk-search">
					<label htmlFor="user-search" className="sr-only">
						Search users
					</label>
					<input id="user-search" className="input" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
				{rows.length ? (
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Role</th>
									<th>Jobs</th>
									<th>Hourly rate</th>
									<th>Status</th>
									<th></th>
								</tr>
							</thead>
							<tbody id="users-table">
								{rows.map((u) => {
									const held = accessOf(data.settings, u.id).jobs.map((j) => jobs.find((x) => x.id === j.jobId)?.title).filter(Boolean);
									const rate = userRate(data.settings, u.id);
									return (
										<tr key={u.id} data-user={u.id}>
											<td>
												<strong>{u.name}</strong>
											</td>
											<td>{ROLE_LABEL[u.role] || u.role}</td>
											<td>{held.join(", ") || "—"}</td>
											<td>{rate === null ? "—" : money(rate)}</td>
											<td>
												<StatusBadge status={u.active === false ? "inactive" : "active"} />
											</td>
											<td>
												<button type="button" className="btn out" onClick={() => setEditing(u.id)}>
													{edit ? "Edit" : "View"}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<EmptyState title="No users found">Try a different name.</EmptyState>
				)}
			</SectionCard>
		</>
	);
}

export function Jobs() {
	const data = useData();
	const { svc, can } = usePos();
	const jobs = jobsOf(data.settings);
	const edit = can("users.edit");
	const [form, setForm] = useState(null);
	const [touched, setTouched] = useState(false);
	const holders = (id) => data.users.filter((u) => accessOf(data.settings, u.id).jobs.some((x) => x.jobId === id)).length;
	const error = form ? jobError(form, jobs.filter((j) => j.id !== form.id)) : "";
	const close = () => (setForm(null), setTouched(false));
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveJob(form)) close();
	};
	if (!can("users.view")) return <EmptyState title="No access">You need the "See users" permission to open this page.</EmptyState>;
	return (
		<>
			<PageHeader
				title="Jobs"
				description="What people do (Server, Cashier, Chef...) and what they are paid an hour. A person's rate prices their hours in Reports."
				actions={
					edit && (
						<button type="button" className="btn gold" id="add-job" onClick={() => setForm({ title: "", code: "", rate: "", active: true })}>
							Add job
						</button>
					)
				}
			/>
			<SectionCard>
				{jobs.length ? (
					<SortableList
						items={jobs}
						label="Job"
						onReorder={(ids) => edit && svc.settings.reorderJobs(reorder(jobs, ids))}
						render={(j) => (
							<div className="sk-list-line" data-job={j.id}>
								<strong>{j.title}</strong>
								{j.code && <span className="muted">{j.code}</span>}
								<span>{money(j.rate)} an hour</span>
								<StatusBadge status={j.active === false ? "inactive" : "active"} />
								<span className="muted">{holders(j.id)} {holders(j.id) === 1 ? "person" : "people"}</span>
								{edit && (
									<span className="sk-list-actions">
										<button type="button" className="btn out" onClick={() => setForm({ id: j.id, title: j.title, code: j.code || "", rate: j.rate, active: j.active !== false })}>
											Edit
										</button>
										<button type="button" className="btn danger" onClick={() => svc.settings.deleteJob(j.id)}>
											Delete
										</button>
									</span>
								)}
							</div>
						)}
					/>
				) : (
					<EmptyState title="No jobs yet">Add the jobs in your business so people can be paid and reports can show labor cost.</EmptyState>
				)}
			</SectionCard>
			<DetailDrawer
				open={!!form}
				title={form?.id ? "Edit job" : "Add job"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-job" onClick={save}>
							Save
						</button>
					</>
				}
			>
				{form && (
					<>
						<TextRow id="job-title" label="Title" value={form.title} max={40} autoFocus onChange={(title) => setForm((f) => ({ ...f, title }))} error={touched ? error : ""} />
						<TextRow id="job-code" label="Code" help="A short code, for example SRV. Optional." value={form.code} max={8} onChange={(code) => setForm((f) => ({ ...f, code }))} />
						<NumberRow id="job-rate" label="Default hourly rate" help="Used for everyone who holds this job, unless their own rate is set." value={form.rate} min={0} step={0.01} suffix="an hour" onChange={(rate) => setForm((f) => ({ ...f, rate }))} />
						<ToggleRow id="job-active" label="Active" help="Inactive jobs cannot be chosen for new people." value={form.active} onChange={(active) => setForm((f) => ({ ...f, active }))} />
					</>
				)}
			</DetailDrawer>
		</>
	);
}

