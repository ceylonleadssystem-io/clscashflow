/**
 * "Select POS Location" dialog: switch the branch for this session, or All Locations for reporting roles.
 */
import { REPORTING_ROLES } from "../config/roles";
import { Modal, ModalBody } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";
import { activeLocations, locationLabel, userLocationIds } from "../services/pos/locations";

/** "Select POS Location": switch branch for the session (or All Locations for reporting roles). */
export function LocationSwitcherModal({ open, onClose }) {
	const data = useData();
	const { currentUser, locationId, setLocationId, svc, view, go, setView } = usePos();
	const ui = useUi();
	if (!open) return null;
	const allowed = userLocationIds(currentUser, data);
	const reporting = currentUser && REPORTING_ROLES.includes(currentUser.role);
	const choose = async (id) => {
		if (id !== "all" && !allowed.includes(id)) return ui.notice("You do not have access to that location.");
		if (id === "all" && !reporting) return ui.notice("All Locations is available for reporting roles only.");
		if (id === locationId) return onClose();
		const previous = locationId;
		setLocationId(id);
		onClose();
		ui.notice(id === "all" ? "Showing consolidated reporting. Checkout is disabled." : "Active location: " + locationLabel(data, id) + ".");
		svc.locations.auditLocationSwitch(previous, id);
		if (id === "all" && view === "checkout") setView("dashboard");
		else go(view);
	};
	return (
		<Modal id="location-select-modal" open title="Select POS Location" subtitle="Choose the branch for this session" onClose={onClose} boxClassName="location-select-card">
			<ModalBody>
				<div className="location-choice-list" id="location-choice-list">
					{activeLocations(data)
						.filter((l) => allowed.includes(l.id))
						.map((l) => (
							<button key={l.id} className={"location-choice " + (locationId === l.id ? "active" : "")} type="button" onClick={() => choose(l.id)}>
								<span className="location-choice-copy">
									<strong>{l.name}</strong>
									<small>
										{l.code || ""}
										{l.address ? " · " + l.address : ""}
									</small>
								</span>
								<span className="location-choice-action">Continue →</span>
							</button>
						))}
					{reporting && (
						<button className={"location-choice " + (locationId === "all" ? "active" : "")} type="button" onClick={() => choose("all")}>
							<span className="location-choice-copy">
								<strong>All Locations</strong>
								<small>Consolidated dashboards and reports only</small>
							</span>
							<span className="location-choice-action">View →</span>
						</button>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
}
