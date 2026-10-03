/**
 * "Choose Modifiers" dialog shown at checkout: pick the options for a product (or edit an existing
 * line) with required-group validation and a live price.
 */
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/ui";
import { missingRequiredGroup, productModifiers, selectionExtra } from "../domain/cart";
import { money } from "../domain/format";
import { useData } from "../store/DataProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { useUi } from "../store/UiProvider";

/** "Choose Modifiers": pick options for a product before it joins the ticket. */
export function ModifierPickerModal() {
	const data = useData();
	const c = useCheckout();
	const ui = useUi();
	const picker = c.picker;
	const product = picker && data.products.find((p) => p.id === picker.productId);
	const groups = useMemo(() => (product ? productModifiers(product, data.modifiers) : []), [product, data.modifiers]);
	const [chosen, setChosen] = useState({}); // groupId -> array of option indexes

	useEffect(() => {
		if (!picker || !product) return;
		const line = picker.lineKey ? c.cart.find((l) => l.key === picker.lineKey) : null;
		const init = {};
		groups.forEach((g) => {
			init[g.id] = g.options.map((o, i) => ((line?.modifiers || []).some((s) => s.groupId === g.id && s.optionName === o.name) ? i : -1)).filter((i) => i >= 0);
		});
		setChosen(init);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [picker?.productId, picker?.lineKey]);

	if (!picker || !product || !groups.length) return null;
	const selections = groups.flatMap((g) =>
		(chosen[g.id] || []).map((i) => ({ groupId: g.id, groupName: g.name, optionName: g.options[i].name, price: +g.options[i].price || 0 })),
	);
	const toggle = (g, i) =>
		setChosen((cur) => {
			const list = cur[g.id] || [];
			if (g.mode === "multiple") return { ...cur, [g.id]: list.includes(i) ? list.filter((x) => x !== i) : [...list, i] };
			return { ...cur, [g.id]: i < 0 ? [] : [i] };
		});
	const close = () => c.setPicker(null);
	const save = async () => {
		const missing = missingRequiredGroup(groups, selections);
		if (missing) return ui.alert("Choose at least one option for " + missing.name + ".");
		if (c.addConfigured(product, selections, picker.lineKey)) close();
	};
	return (
		<Modal
			id="modifier-picker-modal"
			open
			title="Choose Modifiers"
			subtitle="Customize this item before adding it to the ticket"
			onClose={close}
			boxClassName="modifier-picker-box"
			footer={
				<>
					<button className="btn out" onClick={close}>
						Cancel
					</button>
					<button className="btn gold" onClick={save}>
						Save to Ticket
					</button>
				</>
			}
		>
			<div className="modifier-picker-summary">
				<strong id="modifier-picker-item">{product.name}</strong>
				<span id="modifier-picker-price">{money((+product.price || 0) + selectionExtra(selections))}</span>
			</div>
			<div className="modifier-picker-groups" id="modifier-picker-groups">
				{groups.map((g) => {
					const optional = g.required === false;
					const list = chosen[g.id] || [];
					return (
						<section className="modifier-pick-group" data-group-id={g.id} data-mode={g.mode} key={g.id}>
							<div className="modifier-pick-title">
								<strong>{g.name}</strong>
								<span>
									{optional ? "Optional · " : "Required · "}
									{g.mode === "multiple" ? "Choose any" : "Choose one"}
								</span>
							</div>
							<div className="modifier-pick-options">
								{optional && g.mode === "single" && (
									<label className="modifier-choice">
										<span>
											<input type="radio" name={"modifier-" + g.id} checked={!list.length} onChange={() => toggle(g, -1)} /> No modifier
										</span>
										<strong>Included</strong>
									</label>
								)}
								{g.options.map((o, i) => (
									<label className="modifier-choice" key={i}>
										<span>
											<input
												type={g.mode === "multiple" ? "checkbox" : "radio"}
												name={"modifier-" + g.id}
												checked={list.includes(i)}
												onChange={() => toggle(g, i)}
											/>{" "}
											{o.name}
										</span>
										<strong>{+o.price ? "+" + money(o.price) : "Included"}</strong>
									</label>
								))}
							</div>
							{optional && g.mode === "multiple" && <div className="muted" style={{ marginTop: 8 }}>Optional — leave every option unchecked to skip this modifier.</div>}
						</section>
					);
				})}
			</div>
		</Modal>
	);
}
