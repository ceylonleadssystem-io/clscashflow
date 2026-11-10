/**
 * Ingredients of one item (a product with its own stock count): what one sale of it uses. Each line picks an ingredient from the stock, or
 * creates a new one, and says how much one item uses. Selling the item reduces the item's own stock and each ingredient by that amount.
 */
import { useEffect, useMemo, useState } from "react";
import { STOCK_UNITS } from "../config/constants";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { useFeature } from "../store/FeatureProvider";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

const NEW = "__new__";
const num = (v) => String(v ?? "").replace(/,/g, "");
const blankLine = () => ({ itemId: "", perUnit: "", name: "", unit: "g", qty: "", reorder: "", cost: "" });

export function ItemIngredientsModal({ stockId, open, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const recipesOn = useFeature("inventory.recipes");
	const stock = data.inventory.find((i) => i.id === stockId);
	const product = stock && data.products.find((p) => p.id === stock.productId);
	const [lines, setLines] = useState([]);
	const [busy, setBusy] = useState(false);
	const ingredients = useMemo(() => data.inventory.filter((i) => !i.productId).sort((a, b) => a.name.localeCompare(b.name)), [data.inventory]);
	useEffect(() => {
		if (!open || !product) return;
		setLines((product.recipe || []).map((r) => ({ ...blankLine(), itemId: r.itemId, perUnit: String(r.qty) })));
	}, [open, product?.id]); // eslint-disable-line react-hooks/exhaustive-deps
	if (!open || !product) return null;

	const setLine = (i, patch) => setLines((list) => list.map((l, j) => (j === i ? { ...l, ...patch } : l)));
	const unitOf = (l) => (l.itemId === NEW ? l.unit : ingredients.find((x) => x.id === l.itemId)?.unit || "");
	const save = async () => {
		setBusy(true);
		try {
			const payload = lines.map((l) => (l.itemId === NEW ? { perUnit: num(l.perUnit), newItem: { name: l.name, unit: l.unit, qty: num(l.qty) || "0", reorder: num(l.reorder) || "0", cost: num(l.cost) || "0" } } : { itemId: l.itemId, perUnit: num(l.perUnit) }));
			if (await svc.inventory.saveItemIngredients(product.id, payload)) onClose();
		} finally {
			setBusy(false);
		}
	};

	return (
		<Modal
			id="item-ingredients-modal"
			open
			title={"Ingredients · " + product.name}
			subtitle="What one sale of this item uses. Selling it reduces this item's own stock and each ingredient below."
			onClose={onClose}
			footer={
				<>
					<button type="button" className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button type="button" className="btn" id="item-ingredients-save" disabled={busy} onClick={save}>
						Save ingredients
					</button>
				</>
			}
		>
			<ModalBody>
				{!recipesOn && (
					<p className="muted" id="item-ingredients-off">
						Recipes are switched off for this business, so ingredient counts will not reduce when this item is sold until “Recipes / stock usage” is turned on.
					</p>
				)}
				{!lines.length && <p className="muted">No ingredients yet. Add the ingredients this item uses.</p>}
				{lines.map((l, i) => (
					<div className="panel" key={i} style={{ padding: 12, marginTop: 10 }}>
						<div className="form-grid">
							<div className="field">
								<label htmlFor={"ing-item-" + i}>Ingredient</label>
								<select className="input" id={"ing-item-" + i} value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })}>
									<option value="">Choose an ingredient</option>
									{ingredients.map((x) => (
										<option key={x.id} value={x.id}>
											{x.name} ({x.unit})
										</option>
									))}
									<option value={NEW}>+ New ingredient…</option>
								</select>
							</div>
							<div className="field">
								<label htmlFor={"ing-qty-" + i}>Used per item sold{unitOf(l) ? " (" + unitOf(l) + ")" : ""}</label>
								<NumberInput id={"ing-qty-" + i} value={l.perUnit} onChange={(v) => setLine(i, { perUnit: v })} placeholder="0" />
							</div>
							{l.itemId === NEW && (
								<>
									<div className="field">
										<label htmlFor={"ing-name-" + i}>New ingredient name</label>
										<input className="input" id={"ing-name-" + i} value={l.name} maxLength={80} onChange={(e) => setLine(i, { name: e.target.value })} />
									</div>
									<div className="field">
										<label htmlFor={"ing-unit-" + i}>Unit</label>
										<select className="input" id={"ing-unit-" + i} value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })}>
											{STOCK_UNITS.map((u) => (
												<option key={u}>{u}</option>
											))}
										</select>
									</div>
									<div className="field">
										<label htmlFor={"ing-have-" + i}>On hand now</label>
										<NumberInput id={"ing-have-" + i} value={l.qty} onChange={(v) => setLine(i, { qty: v })} placeholder="0" />
									</div>
									<div className="field">
										<label htmlFor={"ing-reorder-" + i}>Reorder at</label>
										<NumberInput id={"ing-reorder-" + i} value={l.reorder} onChange={(v) => setLine(i, { reorder: v })} placeholder="0" />
									</div>
								</>
							)}
						</div>
						<button type="button" className="btn danger" style={{ marginTop: 8 }} onClick={() => setLines((list) => list.filter((_, j) => j !== i))}>
							Remove
						</button>
					</div>
				))}
				<button type="button" className="btn out" id="item-ingredients-add" style={{ marginTop: 12 }} onClick={() => setLines((list) => [...list, blankLine()])}>
					+ Add ingredient
				</button>
			</ModalBody>
		</Modal>
	);
}
