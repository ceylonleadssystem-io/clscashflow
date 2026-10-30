/**
 * "Choose Modifiers" dialog shown at checkout: pick the options for a product (or edit an existing
 * line) with required-group validation and a live price.
 */
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/ui";
import { missingRequiredGroup, productModifiers, selectionExtra } from "../domain/cart";
import { money } from "../domain/format";
import { GLOBAL_GROUP_ID, globalModifiersOf, limitProblem, limitsById, prefixesOf } from "../domain/menuAdmin";
import { resolveOptions } from "../domain/systemOptions";
import { usePos } from "../store/PosProvider";
import { useData } from "../store/DataProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { useUi } from "../store/UiProvider";

/** "Choose Modifiers": pick options for a product before it joins the ticket. */
export function ModifierPickerModal() {
	const data = useData();
	const c = useCheckout();
	const ui = useUi();
	const { locationId } = usePos();
	const picker = c.picker;
	const product = picker && data.products.find((p) => p.id === picker.productId);
	const groups = useMemo(() => (product ? productModifiers(product, data.modifiers) : []), [product, data.modifiers]);
	const [chosen, setChosen] = useState({}); // groupId -> array of option indexes
	// global modifiers (Menu Admin, Modifiers): "No onion", "Extra sauce" on any item, when switched on in Order Entry
	const globals = globalModifiersOf(data.settings);
	const prefixes = prefixesOf(data.settings);
	const globalsOn = resolveOptions(data.settings, "orderEntry", locationId).globalModifiers && globals.length > 0;
	const limits = limitsById(data.settings);
	const [extras, setExtras] = useState([]); // [{ prefix, name, price }]
	const [pickPrefix, setPickPrefix] = useState("");
	const [pickGlobal, setPickGlobal] = useState("");

	useEffect(() => {
		if (!picker || !product) return;
		const line = picker.lineKey ? c.cart.find((l) => l.key === picker.lineKey) : null;
		const init = {};
		groups.forEach((g) => {
			init[g.id] = g.options.map((o, i) => ((line?.modifiers || []).some((s) => s.groupId === g.id && s.optionName === o.name) ? i : -1)).filter((i) => i >= 0);
		});
		setChosen(init);
		setExtras((line?.modifiers || []).filter((s) => s.groupId === GLOBAL_GROUP_ID).map((s) => ({ prefix: s.prefix || "", name: s.name || s.optionName, price: +s.price || 0 })));
		setPickPrefix("");
		setPickGlobal("");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [picker?.productId, picker?.lineKey]);

	if (!picker || !product || (!groups.length && !globalsOn)) return null;
	const selections = [
		...groups.flatMap((g) => (chosen[g.id] || []).map((i) => ({ groupId: g.id, groupName: g.name, optionName: g.options[i].name, price: +g.options[i].price || 0 }))),
		...extras.map((x) => ({ groupId: GLOBAL_GROUP_ID, groupName: "", optionName: (x.prefix ? x.prefix + " " : "") + x.name, prefix: x.prefix, name: x.name, price: x.price })),
	];
	const addExtra = () => {
		const g = globals.find((x) => x.id === pickGlobal);
		if (!g) return;
		setExtras((list) => [...list, { prefix: pickPrefix || prefixes[0], name: g.name, price: g.price }]);
		setPickGlobal("");
	};
	const toggle = (g, i) =>
		setChosen((cur) => {
			const list = cur[g.id] || [];
			if (g.mode === "multiple") {
				const next = list.includes(i) ? list.filter((x) => x !== i) : [...list, i];
				const max = limits[g.id]?.max;
				if (max && next.length > max) {
					ui.notice(`Choose no more than ${max} options for ${g.name}.`);
					return cur;
				}
				return { ...cur, [g.id]: next };
			}
			return { ...cur, [g.id]: i < 0 ? [] : [i] };
		});
	const close = () => c.setPicker(null);
	const save = async () => {
		const missing = missingRequiredGroup(groups, selections);
		if (missing) return ui.alert("Choose at least one option for " + missing.name + ".");
		const broken = groups.map((g) => limitProblem(g, (chosen[g.id] || []).length, limits[g.id])).find(Boolean);
		if (broken) return ui.alert(broken);
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
									{g.mode === "multiple" ? (limits[g.id]?.min || limits[g.id]?.max ? "Choose " + [limits[g.id].min && "at least " + limits[g.id].min, limits[g.id].max && "up to " + limits[g.id].max].filter(Boolean).join(", ") : "Choose any") : "Choose one"}
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
				{globalsOn && (
					<section className="modifier-pick-group" data-group-id={GLOBAL_GROUP_ID}>
						<div className="modifier-pick-title">
							<strong>Extras</strong>
							<span>Optional · Add, remove or change something</span>
						</div>
						{extras.length > 0 && (
							<div className="modifier-pick-options">
								{extras.map((x, i) => (
									<div className="modifier-choice" key={i}>
										<span>{(x.prefix ? x.prefix + " " : "") + x.name}</span>
										<span>
											<strong>{x.price ? "+" + money(x.price) : "Included"}</strong>{" "}
											<button type="button" className="btn out" aria-label={"Remove " + x.name} onClick={() => setExtras((list) => list.filter((_, j) => j !== i))}>
												Remove
											</button>
										</span>
									</div>
								))}
							</div>
						)}
						<div className="modifier-extra-add">
							<select className="input" aria-label="Instruction" value={pickPrefix || prefixes[0]} onChange={(e) => setPickPrefix(e.target.value)}>
								{prefixes.map((x) => (
									<option key={x} value={x}>
										{x}
									</option>
								))}
							</select>
							<select className="input" aria-label="Extra" value={pickGlobal} onChange={(e) => setPickGlobal(e.target.value)}>
								<option value="">Choose…</option>
								{globals.map((x) => (
									<option key={x.id} value={x.id}>
										{x.name}
										{x.price ? " (+" + money(x.price) + ")" : ""}
									</option>
								))}
							</select>
							<button type="button" className="btn out" disabled={!pickGlobal} onClick={addExtra}>
								Add
							</button>
						</div>
					</section>
				)}
			</div>
		</Modal>
	);
}
