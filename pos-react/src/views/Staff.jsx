import { useState } from "react";
import { MANAGER_ROLES, OWNER_ROLES } from "../config/roles";
import { activeTimeEntry, currentCashShift, expectedCash, isOnBreak } from "../domain/sales";
import { money } from "../domain/format";
import { Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { UserModal } from "../modals/UserModal";
import { locationLabel } from "../services/pos/locations";

/** Staff & Shifts: attendance, cash register, users and register history. */
export function Staff() {
	const data = useData();
	const { currentUser, svc, locationId } = usePos();
	const { openCash } = useModals();
	const attendance = useFeature("staff.attendance");
	const register = useFeature("staff.cashRegister");
	const usersOn = useFeature("staff.users");
	const deletion = useFeature("staff.userDeletion");
	const multi = useFeature("business.locations");
	const [editing, setEditing] = useState(null);

	const entry = activeTimeEntry(data.timeEntries, currentUser?.id);
	const shift = currentCashShift(data.cashShifts, currentUser?.id);
	const onBreak = isOnBreak(entry);
	const manage = MANAGER_ROLES.includes(currentUser?.role) || currentUser?.role === "admin";
	const canDelete = deletion && OWNER_ROLES.includes(currentUser?.role);
	void locationId;

	const toggleClock = async () => {
		if (!entry) return openCash("clock-in");
		await svc.staff.clockOut();
	};

	return (
		<section className="view active" id="view-staff">
			<div className="shift-grid">
				{attendance && (
					<div className="card">
						<div className="label">Attendance</div>
						<div className="value" id="attendance-status">
							{!entry ? "Not clocked in" : onBreak ? "On break" : "Clocked in"}
						</div>
						<div className="muted" id="attendance-note">
							{entry ? "Since " + new Date(entry.clockIn).toLocaleString() : "Clock in to begin work."}
						</div>
						<div className="shift-actions">
							<button className="btn" id="clock-button" onClick={toggleClock}>
								{entry ? "Clock Out" : "Clock In"}
							</button>
							<button className="btn out" id="break-button" onClick={() => svc.staff.toggleBreak()} disabled={!entry}>
								{onBreak ? "End Break" : "Start Break"}
							</button>
						</div>
					</div>
				)}
				{register && (
					<div className="card">
						<div className="label">Cash Register</div>
						<div className="value" id="register-status">
							{shift ? money(expectedCash(shift, data.sales)) : "Closed"}
						</div>
						<div className="muted" id="register-note">
							{shift ? "Expected cash currently in drawer" : "Open a register before taking cash payments."}
						</div>
						<div className="shift-actions">
							<button className="btn gold" id="register-button" onClick={() => openCash(shift ? "close" : "open")}>
								{shift ? "Close Register" : "Open Register"}
							</button>
						</div>
					</div>
				)}
				<div className="card">
					<div className="label">Signed-in user</div>
					<div className="value" id="staff-current-name">
						{currentUser?.name || "—"}
					</div>
					<div className="muted" id="staff-current-role">
						{(currentUser?.role || "—").toUpperCase()}
					</div>
				</div>
			</div>
			{usersOn && manage && (
				<div className="panel" style={{ marginTop: 16 }} id="user-management">
					<div className="panel-head">
						<div>
							<div className="panel-title">Users & Access</div>
							<div className="muted">Owner, manager, accountant and cashier access</div>
						</div>
						<button className="btn" onClick={() => setEditing("")}>
							+ Add User
						</button>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Role</th>
									<th>Status</th>
									<th>Last clock in</th>
									<th></th>
								</tr>
							</thead>
							<tbody id="user-table">
								{data.users.map((u) => {
									const last = data.timeEntries.find((e) => e.userId === u.id);
									const all = u.locationAccess === "all" || u.role === "owner" || u.role === "admin";
									return (
										<tr key={u.id}>
											<td>
												<strong>{u.name}</strong>
											</td>
											<td>
												<span className="role-pill">{u.role}</span>
												{multi && <small className="table-subcategory">{all ? "All locations" : (u.locationIds || []).map((id) => locationLabel(data, id)).join(", ") || "No location"}</small>}
											</td>
											<td>{u.active === false ? "Inactive" : "Active"}</td>
											<td>{last ? new Date(last.clockIn).toLocaleString() : "—"}</td>
											<td>
												<div className="table-actions" style={{ display: "flex", gap: 8 }}>
													<button className="btn out" onClick={() => setEditing(u.id)}>
														Edit
													</button>
													{canDelete && u.id !== currentUser?.id && (
														<button className="btn danger" type="button" onClick={() => svc.staff.deleteUser(u.id)}>
															Delete
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
			{register && (
				<div className="panel" style={{ marginTop: 16 }}>
					<div className="panel-head">
						<div className="panel-title">Shift & Register History</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>User</th>
									<th>Opened</th>
									<th>Opening</th>
									<th>Expected</th>
									<th>Actual</th>
									<th>Variance</th>
								</tr>
							</thead>
							<tbody id="shift-table">
								{data.cashShifts.slice(0, 30).map((s) => {
									const u = data.users.find((x) => x.id === s.userId);
									const exp = s.status === "open" ? expectedCash(s, data.sales) : s.expectedCash;
									const v = s.status === "open" ? null : s.variance;
									return (
										<tr key={s.id}>
											<td>{u?.name || "Unknown"}</td>
											<td>{new Date(s.openedAt).toLocaleString()}</td>
											<td>{money(s.openingCash)}</td>
											<td>{money(exp)}</td>
											<td>{s.status === "open" ? "Open" : money(s.actualCash)}</td>
											<td className={v == null ? "" : v >= 0 ? "cash-positive" : "cash-negative"}>{v == null ? "—" : money(v)}</td>
										</tr>
									);
								})}
								{!data.cashShifts.length && (
									<tr>
										<td colSpan="6">No register shifts yet.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}
			<UserModal id={editing} open={editing !== null} onClose={() => setEditing(null)} />
		</section>
	);
}
