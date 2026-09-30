import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

const blank = () => ({ id: "", name: "", code: "", address: "", phone: "", email: "", openingHours: "", active: true, receiptHeader: "", receiptFooter: "" });

/** Add / edit a business location (branch). */
export function LocationEditorModal({ id, open, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const [f, setF] = useState(blank);
	useEffect(() => {
		if (!open) return;
		const l = data.locations.find((x) => x.id === id);
		setF(l ? { ...blank(), ...l } : blank());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, id]);
	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
	const save = async () => {
		if (await svc.locations.saveLocation(f)) onClose();
	};
	return (
		<Modal
			id="location-editor-modal"
			open={open}
			title={id ? "Edit Location" : "Add Location"}
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn" onClick={save}>
						Save Location
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					<div className="field">
						<label>Location name *</label>
						<input className="input" id="loc-name" value={f.name} onChange={set("name")} />
					</div>
					<div className="field">
						<label>Location code *</label>
						<input className="input" id="loc-code" maxLength={12} value={f.code} onChange={set("code")} />
					</div>
					<div className="field full">
						<label>Address</label>
						<textarea className="input" id="loc-address" rows={2} value={f.address} onChange={set("address")} />
					</div>
					<div className="field">
						<label>Contact number</label>
						<input className="input" id="loc-phone" value={f.phone} onChange={set("phone")} />
					</div>
					<div className="field">
						<label>Email</label>
						<input className="input" id="loc-email" type="email" value={f.email} onChange={set("email")} />
					</div>
					<div className="field">
						<label>Opening hours</label>
						<input className="input" id="loc-hours" placeholder="Mon–Sun, 9:00–18:00" value={f.openingHours} onChange={set("openingHours")} />
					</div>
					<div className="field">
						<label>Status</label>
						<select className="input" id="loc-active" value={String(f.active !== false)} onChange={(e) => setF((v) => ({ ...v, active: e.target.value === "true" }))}>
							<option value="true">Active</option>
							<option value="false">Inactive</option>
						</select>
					</div>
					<div className="field full">
						<label>Receipt header</label>
						<input className="input" id="loc-receipt-header" value={f.receiptHeader} onChange={set("receiptHeader")} />
					</div>
					<div className="field full">
						<label>Receipt footer</label>
						<input className="input" id="loc-receipt-footer" value={f.receiptFooter} onChange={set("receiptFooter")} />
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
}
