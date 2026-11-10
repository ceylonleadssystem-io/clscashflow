/**
 * Two bulk-entry windows for the Stock page. "Set product stock" lists the products that have no stock record yet so their quantities can
 * be typed in one go; "Add ingredients" takes several new ingredients (name, unit, quantity, reorder level, cost) at once.
 */
import { useEffect, useMemo, useState } from "react";
import { STOCK_UNITS } from "../config/constants";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";

const blankIngredient = () => ({ name: "", unit: "each", qty: "", reorder: "", cost: "", usedIn: "", perUnit: "" });
const num = (v) => String(v ?? "").replace(/,/g, "");

export function BulkStockModal({ mode, open, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const recipesOn = useFeature("inventory.recipes");
	const [q, setQ] = useState("");
	const [values, setValues] = useState({}); // product id -> { qty, reorder }
	const [rows, setRows] = useState(() => Array.from({ length: 5 }, blankIngredient));
	const [busy, setBusy] = useState(false);
	useEffect(() => {
		if (!open) return;
		setQ("");
		setValues({});
		setRows(Array.from({ length: 5 }, blankIngredient));
	}, [open, mode]);

	const products = useMemo(() => {
		const s = q.trim().toLowerCase();
		return data.products
			.filter((p) => String(p.type).toLowerCase() !== "service" && !data.inventory.some((i) => i.productId === p.id))
			.filter((p) => !s || (p.name + " " + (p.code || "")).toLowerCase().includes(s))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [data.products, data.inventory, q]);
	const sellable = useMemo(() => data.products.filter((p) => String(p.type).toLowerCase() !== "service").sort((a, b) => a.name.localeCompare(b.name)), [data.products]);
	const setValue = (id, key, v) => setValues((m) => ({ ...m, [id]: { ...m[id], [key]: v } }));
	const setRow = (i, key, v) => setRows((list) => list.map((r, j) => (j === i ? { ...r, [key]: v } : r)));

	const save = async () => {
		const batch =
			mode === "products"
				? products
						.filter((p) => num(values[p.id]?.qty) !== "")
						.map((p) => ({ productId: p.id, name: p.name, sku: p.code || "", type: "Sellable Product", unit: "each", qty: num(values[p.id].qty), reorder: num(values[p.id].reorder) || "0", cost: String(p.cost ?? 0) }))
				: rows.filter((r) => r.name.trim() || num(r.qty) !== "").map((r) => ({ name: r.name, sku: "", type: "Ingredient", unit: r.unit, qty: num(r.qty) || "0", reorder: num(r.reorder) || "0", cost: num(r.cost) || "0", usedIn: r.usedIn, perUnit: num(r.perUnit) }));
		setBusy(true);
		try {
			if (await svc.inventory.addStockBatch(batch)) onClose();
		} finally {
			setBusy(false);
		}
	};

	const isProducts = mode === "products";
	return (
		<Modal
			id="bulk-stock-modal"
			open={open}
			title={isProducts ? "Set product stock" : "Add ingredients"}
			subtitle={isProducts ? "Type the quantity on hand for each product. Products you leave blank are skipped." : "Add several ingredients at once. Pick the item each one is used in and how much one sale uses, so selling that item reduces the ingredient count. Empty rows are skipped."}
			onClose={onClose}
			footer={
				<>
					<button type="button" className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button type="button" className="btn" id="bulk-stock-save" disabled={busy} onClick={save}>
						{isProducts ? "Save product stock" : "Add to stock"}
					</button>
				</>
			}
		>
			<ModalBody>
				{isProducts ? (
					<>
						<input className="input" id="bulk-stock-search" type="search" aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
						{!products.length ? (
							<p className="muted" style={{ marginTop: 12 }}>
								{q ? "No products match." : "Every product already has a stock record. Use Add Stock to receive more."}
							</p>
						) : (
							<div className="table-wrap" style={{ marginTop: 12 }}>
								<table>
									<thead>
										<tr>
											<th>Product</th>
											<th>On hand</th>
											<th>Reorder at</th>
										</tr>
									</thead>
									<tbody>
										{products.map((p) => (
											<tr key={p.id}>
												<td>
													<strong>{p.name}</strong>
													<br />
													<span className="muted">{p.code || "No code"}</span>
												</td>
												<td>
													<NumberInput aria-label={"On hand for " + p.name} value={values[p.id]?.qty ?? ""} onChange={(v) => setValue(p.id, "qty", v)} placeholder="0" />
												</td>
												<td>
													<NumberInput aria-label={"Reorder level for " + p.name} value={values[p.id]?.reorder ?? ""} onChange={(v) => setValue(p.id, "reorder", v)} placeholder="0" />
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				) : (
					<>
						{!recipesOn && (
							<p className="muted" id="bulk-stock-recipes-off">
								Recipes are switched off for this business, so ingredient counts will not reduce when an item is sold until “Recipes / stock usage” is turned on.
							</p>
						)}
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Ingredient</th>
										<th>Unit</th>
										<th>On hand</th>
										<th>Reorder at</th>
										<th>Unit cost</th>
										<th>Used in item</th>
										<th>Per item sold</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((r, i) => (
										<tr key={i}>
											<td>
												<input className="input" aria-label={"Ingredient " + (i + 1) + " name"} value={r.name} maxLength={80} onChange={(e) => setRow(i, "name", e.target.value)} />
											</td>
											<td>
												<select className="input" aria-label={"Ingredient " + (i + 1) + " unit"} value={r.unit} onChange={(e) => setRow(i, "unit", e.target.value)}>
													{STOCK_UNITS.map((u) => (
														<option key={u}>{u}</option>
													))}
												</select>
											</td>
											<td>
												<NumberInput aria-label={"Ingredient " + (i + 1) + " on hand"} value={r.qty} onChange={(v) => setRow(i, "qty", v)} placeholder="0" />
											</td>
											<td>
												<NumberInput aria-label={"Ingredient " + (i + 1) + " reorder level"} value={r.reorder} onChange={(v) => setRow(i, "reorder", v)} placeholder="0" />
											</td>
											<td>
												<NumberInput aria-label={"Ingredient " + (i + 1) + " unit cost"} value={r.cost} onChange={(v) => setRow(i, "cost", v)} placeholder="0" />
											</td>
											<td>
												<select className="input" aria-label={"Ingredient " + (i + 1) + " is used in"} value={r.usedIn} onChange={(e) => setRow(i, "usedIn", e.target.value)}>
													<option value="">Not linked</option>
													{sellable.map((p) => (
														<option key={p.id} value={p.id}>
															{p.name}
														</option>
													))}
												</select>
											</td>
											<td>
												<NumberInput aria-label={"Ingredient " + (i + 1) + " used per item sold"} value={r.perUnit} onChange={(v) => setRow(i, "perUnit", v)} placeholder="0" disabled={!r.usedIn} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<button type="button" className="btn out" id="bulk-stock-add-row" style={{ marginTop: 10 }} onClick={() => setRows((list) => [...list, blankIngredient()])}>
							+ Add another row
						</button>
					</>
				)}
			</ModalBody>
		</Modal>
	);
}
