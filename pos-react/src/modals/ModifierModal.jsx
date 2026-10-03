/**
 * Create or edit a modifier group: name, single or multiple choice, required or optional, and options with extra prices.
 */
import { useEffect, useState } from "react";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

/** Create / edit a modifier group (name, selection mode, required, options + extra price). */
export function ModifierModal({ id, open, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const [f, setF] = useState({ id: "", name: "", mode: "single", required: true, options: [{ name: "", price: 0 }] });
	useEffect(() => {
		if (!open) return;
		const m = data.modifiers.find((x) => x.id === id);
		setF(m ? { id: m.id, name: m.name || "", mode: m.mode || "single", required: m.required !== false, options: m.options.map((o) => ({ ...o })) } : { id: "", name: "", mode: "single", required: true, options: [{ name: "", price: 0 }] });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, id]);
	const setOption = (i, patch) => setF((v) => ({ ...v, options: v.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));
	const save = async () => {
		if (await svc.catalog.saveModifier(f)) onClose();
	};
	return (
		<Modal
			id="modifier-modal"
			open={open}
			title="Modifier Group"
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn" onClick={save}>
						Save Modifier
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					<div className="field">
						<label>Group Name *</label>
						<input className="input" id="m-name" placeholder="e.g. Size" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
					</div>
					<div className="field">
						<label>Selection</label>
						<select className="input" id="m-mode" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>
							<option value="single">Choose one</option>
							<option value="multiple">Choose multiple</option>
						</select>
					</div>
					<div className="field">
						<label>Is a selection required?</label>
						<select className="input" id="m-required" value={String(f.required)} onChange={(e) => setF({ ...f, required: e.target.value === "true" })}>
							<option value="true">Required</option>
							<option value="false">Optional / Not required</option>
						</select>
					</div>
					<div className="field full">
						<label>Options and Extra Price</label>
						<div className="modifier-options" id="m-options">
							{f.options.map((o, i) => (
								<div className="modifier-option" key={i}>
									<input className="input m-option-name" placeholder="Option name" value={o.name} onChange={(e) => setOption(i, { name: e.target.value })} />
									<NumberInput className="input m-option-price" placeholder="Extra LKR" value={o.price} onChange={(v) => setOption(i, { price: v })} />
									<button className="btn out" type="button" onClick={() => setF((v) => ({ ...v, options: v.options.filter((_, j) => j !== i) }))}>
										×
									</button>
								</div>
							))}
						</div>
						<button className="btn out" style={{ marginTop: 8 }} onClick={() => setF((v) => ({ ...v, options: [...v.options, { name: "", price: 0 }] }))}>
							+ Add Option
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
}
