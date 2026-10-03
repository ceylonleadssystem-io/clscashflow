/**
 * POS user dialog: name, PIN, role, status, clock-in and register behaviour, and branch access.
 */
import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { activeLocations } from "../services/pos/locations";

const blank = () => ({ id: "", name: "", pin: "", role: "cashier", active: true, clockInBehaviour: "prompt", registerBehaviour: "prompt", locationAccess: "selected", locationIds: [] });

/** POS user: name, PIN, role, status, sign-in behaviour and branch access. */
export function UserModal({ id, open, onClose }) {
	const data = useData();
	const { svc, locationId } = usePos();
	const multi = useFeature("business.locations");
	const [f, setF] = useState(blank);
	useEffect(() => {
		if (!open) return;
		const u = data.users.find((x) => x.id === id);
		const fallback = locationId && locationId !== "all" ? [locationId] : activeLocations(data)[0] ? [activeLocations(data)[0].id] : [];
		setF(u ? { ...blank(), ...u, pin: u.pin || "", locationAccess: u.locationAccess || "selected", locationIds: u.locationIds || [] } : { ...blank(), locationIds: fallback });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, id]);
	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
	const save = async () => {
		if (await svc.staff.saveUser({ ...f, active: f.active === true || f.active === "true" })) onClose();
	};
	const all = f.locationAccess === "all" || f.role === "owner" || f.role === "admin";
	return (
		<Modal
			id="user-modal"
			open={open}
			title="POS User"
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn" onClick={save}>
						Save User
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					<div className="field">
						<label>Name *</label>
						<input className="input" id="u-name" value={f.name} onChange={set("name")} />
					</div>
					<div className="field">
						<label>4–6 digit PIN *</label>
						<input className="input" id="u-pin" inputMode="numeric" maxLength={6} value={f.pin} onChange={set("pin")} />
					</div>
					<div className="field">
						<label>Access role</label>
						<select className="input" id="u-role" value={f.role} onChange={set("role")}>
							<option value="cashier">Cashier</option>
							<option value="manager">Manager</option>
							<option value="accountant">Accountant</option>
							<option value="admin">Admin</option>
							<option value="owner">Owner</option>
						</select>
					</div>
					<div className="field">
						<label>Status</label>
						<select className="input" id="u-active" value={String(f.active !== false)} onChange={(e) => setF((v) => ({ ...v, active: e.target.value === "true" }))}>
							<option value="true">Active</option>
							<option value="false">Inactive</option>
						</select>
					</div>
					<div className="user-behaviour-fields">
						<div className="field">
							<label>Clock in after sign-in</label>
							<select className="input" id="u-clock-behaviour" value={f.clockInBehaviour} onChange={set("clockInBehaviour")}>
								<option value="prompt">Ask each time</option>
								<option value="automatic">Clock in automatically</option>
								<option value="manual">Do not ask</option>
							</select>
						</div>
						<div className="field">
							<label>Cash register after sign-in</label>
							<select className="input" id="u-register-behaviour" value={f.registerBehaviour} onChange={set("registerBehaviour")}>
								<option value="prompt">Offer register opening</option>
								<option value="manual">Do not ask</option>
							</select>
						</div>
					</div>
					{multi && (
						<div className="field full">
							<label>Branch access</label>
							<select className="input" id="u-location-access" value={all ? "all" : "selected"} onChange={set("locationAccess")}>
								<option value="selected">Selected locations</option>
								<option value="all">All locations</option>
							</select>
							{!all && (
								<div className="location-access-list" id="u-location-list">
									{activeLocations(data).map((loc) => (
										<label className="location-access-option" key={loc.id}>
											<input
												type="checkbox"
												checked={f.locationIds.includes(loc.id)}
												onChange={(e) => setF((v) => ({ ...v, locationIds: e.target.checked ? [...v.locationIds, loc.id] : v.locationIds.filter((x) => x !== loc.id) }))}
											/>{" "}
											{loc.name}
										</label>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
}
