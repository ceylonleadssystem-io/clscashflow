/**
 * One dialog serving the Business Tools records: appointments, memberships, prescriptions and medicine batches.
 */
import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { today } from "../domain/format";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

const TITLES = { appointment: "Appointment", membership: "Membership", prescription: "Prescription Record", batch: "Medicine Batch" };

const defaults = {
	appointment: (modal) => ({ id: "", customerId: "", serviceId: "", time: (modal?.date || today()) + "T09:00", staffId: "", status: "Booked", notes: "" }),
	membership: () => ({ id: "", customerId: "", name: "", discount: "", status: "Active", start: today(), end: "" }),
	prescription: () => ({ id: "", customerId: "", date: today(), reference: "", prescriber: "", status: "Pending", notes: "" }),
	batch: () => ({ id: "", itemId: "", batchNumber: "", quantity: "", received: today(), expiry: "", supplier: "" }),
};
const collectionOf = { appointment: "appointments", membership: "memberships", prescription: "prescriptions", batch: "medicineBatches" };
const saverOf = { appointment: "saveAppointment", membership: "saveMembership", prescription: "savePrescription", batch: "saveMedicineBatch" };

/** One dialog component serving appointments, memberships, prescriptions and medicine batches. */
export function IndustryModals({ modal, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const [f, setF] = useState({});
	useEffect(() => {
		if (!modal) return;
		const existing = modal.id ? data[collectionOf[modal.kind]].find((x) => x.id === modal.id) : null;
		setF(existing ? { ...defaults[modal.kind](modal), ...existing } : defaults[modal.kind](modal));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [modal?.kind, modal?.id]);
	if (!modal) return null;
	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
	const save = async () => {
		if (await svc.industry[saverOf[modal.kind]](f)) onClose();
	};
	const remove = async () => {
		if (await svc.industry.removeRecord(collectionOf[modal.kind], modal.id)) onClose();
	};
	const customers = (
		<>
			<option value="">Select customer</option>
			{data.customers.map((c) => (
				<option key={c.id} value={c.id}>
					{c.name}
				</option>
			))}
		</>
	);
	const services = data.products.filter((p) => String(p.type).toLowerCase() === "service");
	return (
		<Modal
			id={modal.kind + "-modal"}
			open
			title={TITLES[modal.kind]}
			onClose={onClose}
			footer={
				<>
					{modal.id && (
						<button className="btn danger" onClick={remove}>
							Delete
						</button>
					)}
					<button className="btn gold" onClick={save}>
						Save {TITLES[modal.kind].replace(" Record", "")}
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					{modal.kind === "appointment" && (
						<>
							<div className="field">
								<label>Customer *</label>
								<select className="input" value={f.customerId || ""} onChange={set("customerId")}>
									{customers}
								</select>
							</div>
							<div className="field">
								<label>Service *</label>
								<select className="input" value={f.serviceId || ""} onChange={set("serviceId")}>
									<option value="">Select service</option>
									{services.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name}
										</option>
									))}
								</select>
							</div>
							<div className="field">
								<label>Date & Time *</label>
								<input className="input" type="datetime-local" value={f.time || ""} onChange={set("time")} />
							</div>
							<div className="field">
								<label>Staff</label>
								<select className="input" value={f.staffId || ""} onChange={set("staffId")}>
									<option value="">Select staff member</option>
									{data.users.filter((u) => u.active !== false).map((u) => (
										<option key={u.id} value={u.id}>
											{u.name}
										</option>
									))}
								</select>
							</div>
							<div className="field">
								<label>Status</label>
								<select className="input" value={f.status || "Booked"} onChange={set("status")}>
									{["Booked", "Confirmed", "Completed", "Cancelled", "No-show"].map((s) => (
										<option key={s}>{s}</option>
									))}
								</select>
							</div>
							<div className="field full">
								<label>Notes</label>
								<textarea className="input" rows={3} value={f.notes || ""} onChange={set("notes")} />
							</div>
						</>
					)}
					{modal.kind === "membership" && (
						<>
							<div className="field">
								<label>Customer *</label>
								<select className="input" value={f.customerId || ""} onChange={set("customerId")}>
									{customers}
								</select>
							</div>
							<div className="field">
								<label>Membership name *</label>
								<input className="input" placeholder="e.g. Gold Member" value={f.name || ""} onChange={set("name")} />
							</div>
							<div className="field">
								<label>Discount %</label>
								<input className="input" type="number" min="0" max="100" value={f.discount ?? ""} onChange={set("discount")} />
							</div>
							<div className="field">
								<label>Status</label>
								<select className="input" value={f.status || "Active"} onChange={set("status")}>
									{["Active", "Paused", "Expired", "Cancelled"].map((s) => (
										<option key={s}>{s}</option>
									))}
								</select>
							</div>
							<div className="field">
								<label>Start date</label>
								<input className="input" type="date" value={f.start || ""} onChange={set("start")} />
							</div>
							<div className="field">
								<label>End date</label>
								<input className="input" type="date" value={f.end || ""} onChange={set("end")} />
							</div>
						</>
					)}
					{modal.kind === "prescription" && (
						<>
							<div className="field">
								<label>Customer *</label>
								<select className="input" value={f.customerId || ""} onChange={set("customerId")}>
									{customers}
								</select>
							</div>
							<div className="field">
								<label>Date *</label>
								<input className="input" type="date" value={f.date || ""} onChange={set("date")} />
							</div>
							<div className="field">
								<label>Reference *</label>
								<input className="input" value={f.reference || ""} onChange={set("reference")} />
							</div>
							<div className="field">
								<label>Prescriber</label>
								<input className="input" value={f.prescriber || ""} onChange={set("prescriber")} />
							</div>
							<div className="field">
								<label>Status</label>
								<select className="input" value={f.status || "Pending"} onChange={set("status")}>
									{["Pending", "Partially Fulfilled", "Fulfilled", "Cancelled"].map((s) => (
										<option key={s}>{s}</option>
									))}
								</select>
							</div>
							<div className="field full">
								<label>Medicine / Instructions</label>
								<textarea className="input" rows={4} value={f.notes || ""} onChange={set("notes")} />
							</div>
						</>
					)}
					{modal.kind === "batch" && (
						<>
							<div className="field">
								<label>Inventory item *</label>
								<select className="input" value={f.itemId || ""} onChange={set("itemId")}>
									<option value="">Select inventory item</option>
									{data.inventory.map((i) => (
										<option key={i.id} value={i.id}>
											{i.name}
										</option>
									))}
								</select>
							</div>
							<div className="field">
								<label>Batch number *</label>
								<input className="input" value={f.batchNumber || ""} onChange={set("batchNumber")} />
							</div>
							<div className="field">
								<label>Quantity *</label>
								<input className="input" type="number" min="0" step="0.001" value={f.quantity ?? ""} onChange={set("quantity")} />
							</div>
							<div className="field">
								<label>Received date</label>
								<input className="input" type="date" value={f.received || ""} onChange={set("received")} />
							</div>
							<div className="field">
								<label>Expiry date *</label>
								<input className="input" type="date" value={f.expiry || ""} onChange={set("expiry")} />
							</div>
							<div className="field">
								<label>Supplier</label>
								<input className="input" value={f.supplier || ""} onChange={set("supplier")} />
							</div>
						</>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
}
