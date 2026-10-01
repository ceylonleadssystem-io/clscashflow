import { useEffect, useState } from "react";
import { CUSTOMER_TYPES } from "../config/constants";
import { cap } from "../domain/format";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { FieldError } from "../components/ui/FieldError";
import { cleanPhoneInput, emailError, phoneError, requiredError } from "../domain/validators";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { usePos } from "../store/PosProvider";

const blank = (phone = "") => ({
	id: "",
	name: "",
	phone,
	email: "",
	birthday: "",
	company: "",
	type: "regular",
	address: "",
	tags: "",
	notes: "",
	discountEligible: false,
	discountType: "percent",
	discountValue: "",
	discountExpiry: "",
	discountNote: "",
});

/** Customer profile dialog, opened from the directory, CRM and checkout. */
export function CustomerModalHost() {
	const { customerModal, setCustomerModal, onCustomerSaved } = useCheckout();
	const data = useData();
	const { svc } = usePos();
	const discounts = useFeature("customers.discounts");
	const [f, setF] = useState(blank());
	const [touched, setTouched] = useState(false);
	const open = !!customerModal;
	useEffect(() => {
		if (!customerModal) return;
		const c = data.customers.find((x) => x.id === customerModal.id);
		setTouched(false);
		setF(c ? { ...blank(), ...c, discountValue: c.discountValue || "" } : blank(customerModal.phone));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [customerModal]);
	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
	const errors = { name: requiredError(f.name, "Name"), phone: phoneError(f.phone, { required: true }), email: emailError(f.email) };
	const save = async () => {
		setTouched(true);
		if (Object.values(errors).some(Boolean)) return;
		const saved = await svc.customers.saveCustomer({ ...f, discountValue: String(f.discountValue).replace(/,/g, "") });
		if (!saved) return;
		onCustomerSaved(saved, customerModal.source);
		setCustomerModal(null);
	};
	return (
		<Modal
			id="customer-modal"
			open={open}
			title="Customer Profile"
			subtitle="Contact, preferences and optional next-visit discount"
			onClose={() => setCustomerModal(null)}
			footer={
				<>
					<button className="btn out" onClick={() => setCustomerModal(null)}>
						Cancel
					</button>
					<button className="btn" onClick={save}>
						Save Customer
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					<div className="field">
						<label>Name *</label>
						<input className={"input" + (touched && errors.name ? " invalid" : "")} id="c-name" value={f.name} onChange={set("name")} autoFocus={!f.id} />
						{touched && <FieldError message={errors.name} />}
					</div>
					<div className="field">
						<label>Phone *</label>
						<input className={"input" + (touched && errors.phone ? " invalid" : "")} id="c-phone" type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF((v) => ({ ...v, phone: cleanPhoneInput(e.target.value) }))} />
						{touched && <FieldError message={errors.phone} />}
					</div>
					<div className="field">
						<label>Email (optional)</label>
						<input className={"input" + (touched && errors.email ? " invalid" : "")} id="c-email" type="email" value={f.email} onChange={set("email")} />
						{touched && <FieldError message={errors.email} />}
					</div>
					<div className="field">
						<label>Birthday</label>
						<input className="input" id="c-birthday" type="date" value={f.birthday} onChange={set("birthday")} />
					</div>
					<div className="field">
						<label>Company (optional)</label>
						<input className="input" id="c-company" value={f.company} onChange={set("company")} />
					</div>
					<div className="field">
						<label>Customer type</label>
						<select className="input" id="c-type" value={f.type} onChange={set("type")}>
							{CUSTOMER_TYPES.map((t) => (
								<option key={t} value={t}>
									{t === "vip" ? "VIP" : cap(t)}
								</option>
							))}
						</select>
					</div>
					<div className="field full">
						<label>Address (optional)</label>
						<input className="input" id="c-address" value={f.address} onChange={set("address")} />
					</div>
					<div className="field full">
						<label>Tags (optional)</label>
						<input className="input" id="c-tags" placeholder="e.g. vegetarian, office delivery" value={f.tags} onChange={set("tags")} />
					</div>
					{discounts && (
						<div className="field full discount-settings">
							<label className="discount-toggle">
								<input type="checkbox" id="c-discount-eligible" checked={f.discountEligible} onChange={set("discountEligible")} />
								<span>
									<strong>Eligible for a next-visit discount</strong>
									<small>Optional — leave off when no discount is promised.</small>
								</span>
							</label>
							{f.discountEligible && (
								<div id="c-discount-fields" className="form-grid">
									<div className="field">
										<label>Discount type</label>
										<select className="input" id="c-discount-type" value={f.discountType} onChange={set("discountType")}>
											<option value="percent">Percentage (%)</option>
											<option value="fixed">Fixed amount (LKR)</option>
										</select>
									</div>
									<div className="field">
										<label>Discount value</label>
										<NumberInput id="c-discount-value" value={f.discountValue} onChange={(v) => setF((x) => ({ ...x, discountValue: v }))} />
									</div>
									<div className="field">
										<label>Valid until (optional)</label>
										<input className="input" id="c-discount-expiry" type="date" value={f.discountExpiry} onChange={set("discountExpiry")} />
									</div>
									<div className="field">
										<label>Reason / note (optional)</label>
										<input className="input" id="c-discount-note" placeholder="Loyalty reward, service recovery…" value={f.discountNote} onChange={set("discountNote")} />
									</div>
								</div>
							)}
						</div>
					)}
					<div className="field full">
						<label>Notes</label>
						<textarea className="input" id="c-notes" value={f.notes} onChange={set("notes")} />
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
}
