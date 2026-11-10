/**
 * Ingredients of one item (a product): what one sale of it uses, laid out like the supplies of an Automobile package. Each row is a stock
 * item and the quantity one item uses; selling the item reduces each ingredient by that quantity.
 */
import { useEffect, useMemo, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { useFeature } from "../store/FeatureProvider";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

export function ItemIngredientsModal({ productId, open, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const recipesOn = useFeature("inventory.recipes");
	const product = data.products.find((p) => p.id === productId);
	const [lines, setLines] = useState([]);
	const [busy, setBusy] = useState(false);
	const stock = useMemo(() => data.inventory.filter((i) => !i.productId).sort((a, b) => a.name.localeCompare(b.name)), [data.inventory]);
	useEffect(() => {
		if (!open || !product) return;
		setLines((product.recipe || []).map((r) => ({ itemId: r.itemId, qty: r.qty })));
	}, [open, product?.id]); // eslint-disable-line react-hooks/exhaustive-deps
	if (!open || !product) return null;

	const setLine = (i, patch) => setLines((list) => list.map((l, n) => (n === i ? { ...l, ...patch } : l)));
	const save = async () => {
		setBusy(true);
		try {
			if (await svc.inventory.saveItemIngredients(product.id, lines.map((l) => ({ itemId: l.itemId, perUnit: l.qty })))) onClose();
		} finally {
			setBusy(false);
		}
	};

	return (
		<Modal
			id="item-ingredients-modal"
			open
			title={"Ingredients · " + product.name}
			subtitle="What one sale of this item uses from the stock."
			onClose={onClose}
			footer={
				<button type="button" className="btn gold" id="item-ingredients-save" disabled={busy} onClick={save}>
					Save
				</button>
			}
		>
			<ModalBody>
				{!recipesOn && (
					<p className="muted" id="item-ingredients-off">
						Recipes are switched off for this business, so ingredient counts will not reduce when this item is sold until “Recipes / stock usage” is turned on.
					</p>
				)}
				<div className="form-grid">
					<div className="field full">
						<label>Ingredients used per item (taken from the stock when it is sold)</label>
						{lines.map((l, i) => (
							<div key={i} className="tools" style={{ marginBottom: 6 }}>
								<select className="input" aria-label="Ingredient" value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })}>
									<option value="">Select item</option>
									{stock.map((it) => (
										<option key={it.id} value={it.id}>
											{it.name} ({it.unit})
										</option>
									))}
								</select>
								<input className="input" type="number" min="0" step="any" aria-label="Quantity" style={{ maxWidth: 110 }} value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
								<button type="button" className="btn out" aria-label="Remove ingredient" onClick={() => setLines((list) => list.filter((_, n) => n !== i))}>
									×
								</button>
							</div>
						))}
						<button type="button" className="btn out" id="item-ingredients-add" onClick={() => setLines((list) => [...list, { itemId: "", qty: 1 }])}>
							+ Add ingredient
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
}
