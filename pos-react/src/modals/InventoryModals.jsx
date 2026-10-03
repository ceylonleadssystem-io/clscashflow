/**
 * Inventory dialogs: add stock (search, receive or create), edit a stock item, adjust stock with a
 * reason, set one item's count per branch, and bulk-set many items for one branch.
 */
import { useEffect, useMemo, useState } from "react";
import { ADJUST_REASONS, STOCK_TYPES, STOCK_UNITS } from "../config/constants";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { ADJUST_RULES, adjustmentChange, locationStock } from "../domain/inventory";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { activeLocations } from "../services/pos/locations";

const blank = () => ({ id: "", name: "", sku: "", type: "Ingredient", unit: "each", qty: "0", reorder: "0", cost: "0", supplier: "", productId: "" });

/**
 * Add stock / edit stock item.
 *  - "Add Stock": type in a search box; pick an existing item to add quantity to it,
 *    or choose “Add stock item ‘name’” to create a new one.
 *  - Edit (id set): the full item form.
 */
export function InventoryItemModal({ id, open, onClose }) {
	const data = useData();
	const { svc, locationId } = usePos();
	const [f, setF] = useState(blank);
	const [step, setStep] = useState("search"); // search | receive | form
	const [query, setQuery] = useState("");
	const [picked, setPicked] = useState(null);
	const [addQty, setAddQty] = useState("");
	const [note, setNote] = useState("");
	useEffect(() => {
		if (!open) return;
		setQuery("");
		setPicked(null);
		setAddQty("");
		setNote("");
		const i = data.inventory.find((x) => x.id === id);
		if (i) {
			setStep("form");
			setF({ ...blank(), ...i, qty: String(locationStock(i, locationId === "all" ? "" : locationId)), reorder: String(i.reorder ?? 0), cost: String(i.cost ?? 0), sku: i.sku || "", supplier: i.supplier || "" });
		} else {
			setStep("search");
			setF(blank());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, id]);
	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

	const q = query.trim().toLowerCase();
	const existing = useMemo(
		() => data.inventory.filter((i) => !q || (i.name + " " + (i.sku || "")).toLowerCase().includes(q)).slice(0, 8),
		[data.inventory, q],
	);
	// products whose stock row was deleted can be tracked again from here
	const untracked = useMemo(
		() =>
			data.products
				.filter((p) => String(p.type).toLowerCase() !== "service" && p.trackStock === false && !data.inventory.some((i) => i.productId === p.id))
				.filter((p) => !q || (p.name + " " + (p.code || "")).toLowerCase().includes(q))
				.slice(0, 5),
		[data.products, data.inventory, q],
	);
	const exact = data.inventory.some((i) => i.name.toLowerCase() === q);

	const save = async () => {
		if (await svc.inventory.saveInventoryItem({ ...f, qty: f.qty.replace(/,/g, ""), reorder: f.reorder.replace(/,/g, ""), cost: f.cost.replace(/,/g, "") })) onClose();
	};
	const receive = async () => {
		if (await svc.inventory.adjustStock(picked.id, String(addQty).replace(/,/g, ""), "Stock received", note.trim())) onClose();
	};
	const startNew = (name, product) => {
		setF({ ...blank(), name, type: product ? "Sellable Product" : "Ingredient", unit: product ? "each" : "each", cost: String(product?.cost ?? 0), sku: product?.code || "", productId: product?.id || "" });
		setStep("form");
	};

	const title = id ? "Edit Stock Item" : step === "form" ? "Add Stock Item" : "Add Stock";
	const footer =
		step === "receive" ? (
			<>
				<button className="btn out" onClick={() => setStep("search")}>
					Back
				</button>
				<button className="btn gold" onClick={receive}>
					Add to stock
				</button>
			</>
		) : step === "form" ? (
			<>
				<button className="btn out" onClick={id ? onClose : () => setStep("search")}>
					{id ? "Cancel" : "Back"}
				</button>
				<button className="btn" onClick={save}>
					Save Stock Item
				</button>
			</>
		) : (
			<button className="btn out" onClick={onClose}>
				Cancel
			</button>
		);
	return (
		<Modal id="inventory-modal" open={open} title={title} subtitle={step === "search" ? "Search an existing item or add a new one" : undefined} onClose={onClose} footer={footer}>
			<ModalBody>
				{step === "search" && (
					<div className="stock-search">
						<input className="input" id="i-name" autoFocus placeholder="Item name — start typing to search…" value={query} onChange={(e) => setQuery(e.target.value)} />
						<div className="stock-search-list" role="listbox">
							{existing.map((i) => (
								<button
									type="button"
									key={i.id}
									role="option"
									className="stock-search-row"
									onClick={() => {
										setPicked(i);
										setStep("receive");
									}}
								>
									<span>
										<strong>{i.name}</strong>
										<small>
											{i.sku || "—"} · {i.type}
										</small>
									</span>
									<em>
										{locationStock(i, locationId === "all" ? "" : locationId).toLocaleString()} {i.unit} on hand
									</em>
								</button>
							))}
							{untracked.map((p) => (
								<button type="button" key={p.id} className="stock-search-row" onClick={() => startNew(p.name, p)}>
									<span>
										<strong>{p.name}</strong>
										<small>Product · stock tracking is off</small>
									</span>
									<em>Track stock again</em>
								</button>
							))}
							{q && !exact && (
								<button type="button" className="stock-search-row add-new" onClick={() => startNew(query.trim())}>
									<span>
										<strong>＋ Add stock item “{query.trim()}”</strong>
										<small>Create a new stock item with this name</small>
									</span>
								</button>
							)}
							{!q && !existing.length && <div className="muted" style={{ padding: 10 }}>No stock items yet — type a name to create the first one.</div>}
						</div>
					</div>
				)}
				{step === "receive" && picked && (
					<>
						<div className="plan-settings">
							<div className="label">{picked.name}</div>
							<div className="plan-settings-price">
								{locationStock(picked, locationId === "all" ? "" : locationId).toLocaleString()} {picked.unit}
							</div>
							<div className="plan-settings-note">Currently on hand</div>
						</div>
						<div className="form-grid" style={{ marginTop: 14 }}>
							<div className="field">
								<label>Quantity to add ({picked.unit}) *</label>
								<NumberInput id="add-stock-qty" value={addQty} onChange={setAddQty} autoFocus />
							</div>
							<div className="field">
								<label>Note (optional)</label>
								<input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Supplier, invoice no…" />
							</div>
						</div>
					</>
				)}
				{step === "form" && (
					<div className="form-grid">
						<div className="field">
							<label>Item Name *</label>
							<input className="input" value={f.name} onChange={set("name")} />
						</div>
						<div className="field">
							<label>SKU / Code</label>
							<input className="input" id="i-sku" value={f.sku} onChange={set("sku")} />
						</div>
						<div className="field">
							<label>Stock Type</label>
							<select className="input" id="i-type" value={f.type} onChange={set("type")}>
								{STOCK_TYPES.map((t) => (
									<option key={t}>{t}</option>
								))}
							</select>
						</div>
						<div className="field">
							<label>Unit</label>
							<select className="input" id="i-unit" value={f.unit} onChange={set("unit")}>
								{STOCK_UNITS.map((t) => (
									<option key={t}>{t}</option>
								))}
							</select>
						</div>
						<div className="field">
							<label>Current Stock *</label>
							<NumberInput id="i-qty" value={f.qty} onChange={(v) => setF((x) => ({ ...x, qty: v }))} />
						</div>
						<div className="field">
							<label>Reorder Alert At</label>
							<NumberInput id="i-reorder" value={f.reorder} onChange={(v) => setF((x) => ({ ...x, reorder: v }))} />
						</div>
						<div className="field">
							<label>Cost Per Unit</label>
							<NumberInput id="i-cost" value={f.cost} onChange={(v) => setF((x) => ({ ...x, cost: v }))} />
						</div>
						<div className="field">
							<label>Supplier (optional)</label>
							<input className="input" id="i-supplier" value={f.supplier} onChange={set("supplier")} />
						</div>
					</div>
				)}
			</ModalBody>
		</Modal>
	);
}

export function StockAdjustModal({ id, open, onClose }) {
	const data = useData();
	const { svc, locationId } = usePos();
	const [qty, setQty] = useState("");
	const [reason, setReason] = useState(ADJUST_REASONS[0]);
	const [note, setNote] = useState("");
	useEffect(() => {
		if (open) {
			setQty("");
			setNote("");
			setReason(ADJUST_REASONS[0]);
		}
	}, [open, id]);
	const item = data.inventory.find((i) => i.id === id);
	if (!open || !item) return null;
	const current = locationStock(item, locationId === "all" ? "" : locationId);
	const rule = ADJUST_RULES[reason];
	const change = qty === "" ? null : adjustmentChange(reason, String(qty).replace(/,/g, ""), current);
	const save = async () => {
		if (await svc.inventory.adjustStock(id, String(qty).replace(/,/g, ""), reason, note.trim())) onClose();
	};
	return (
		<Modal
			id="stock-adjust-modal"
			open
			title="Adjust Stock"
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn gold" onClick={save}>
						Update Stock
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="plan-settings" id="adjust-summary">
					<div className="label">{item.name}</div>
					<div className="plan-settings-price">
						{current} {item.unit}
					</div>
					<div className="plan-settings-note">Current stock on hand</div>
				</div>
				<div className="form-grid" style={{ marginTop: 14 }}>
					<div className="field">
						<label>Reason</label>
						<select className="input" id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
							{ADJUST_REASONS.map((r) => (
								<option key={r}>{r}</option>
							))}
						</select>
					</div>
					<div className="field">
						<label>{rule.label}</label>
						<NumberInput id="adjust-qty" value={qty} onChange={setQty} placeholder="Enter a positive number" />
					</div>
					{change != null && (
						<div className={"adjust-preview " + (change < 0 ? "neg" : change > 0 ? "pos" : "")}>
							{change === 0 ? "No change" : `${change > 0 ? "+" : ""}${change} ${item.unit}`} → new balance {current + change} {item.unit}
						</div>
					)}
					<div className="field full">
						<label>Note (optional)</label>
						<input className="input" id="adjust-note" value={note} onChange={(e) => setNote(e.target.value)} />
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
}

/** Owner/admin: set one item's count for every branch. */
export function BranchStockModal({ id, open, onClose }) {
	const data = useData();
	const { svc } = usePos();
	const item = data.inventory.find((i) => i.id === id);
	const [counts, setCounts] = useState({});
	useEffect(() => {
		if (open && item) setCounts(Object.fromEntries(activeLocations(data).map((l) => [l.id, String(Number(item.locationQuantities?.[l.id]) || 0)])));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, id]);
	if (!open || !item) return null;
	return (
		<Modal
			id="branch-stock-modal"
			open
			title={"Set Branch Stock · " + item.name}
			subtitle="Set this item count for each location"
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn gold"
						onClick={async () => {
							await svc.inventory.saveBranchStockCounts(item.id, counts);
							onClose();
						}}
					>
						Save Branch Counts
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="branch-stock-grid" id="branch-stock-grid">
					{activeLocations(data).map((l) => (
						<label className="branch-stock-row" key={l.id}>
							<span>
								<strong>{l.name}</strong>
								<small>
									{l.code || ""} · {item.unit || "each"}
								</small>
							</span>
							<input className="input" type="number" min="0" step="0.001" value={counts[l.id] ?? ""} onChange={(e) => setCounts((c) => ({ ...c, [l.id]: e.target.value }))} />
						</label>
					))}
				</div>
			</ModalBody>
		</Modal>
	);
}

/** Owner/admin: set many item counts for one location. */
export function BulkBranchStockModal({ open, onClose, search }) {
	const data = useData();
	const { svc } = usePos();
	const locations = activeLocations(data);
	const [locId, setLocId] = useState("");
	const [counts, setCounts] = useState({});
	useEffect(() => {
		if (open) setLocId(locations[0]?.id || "");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);
	const items = useMemo(() => {
		const s = (search || "").toLowerCase();
		return data.inventory.filter((i) => !s || (i.name + " " + i.sku + " " + i.type).toLowerCase().includes(s));
	}, [data.inventory, search]);
	useEffect(() => {
		if (open) setCounts(Object.fromEntries(items.map((i) => [i.id, String(Number(i.locationQuantities?.[locId]) || 0)])));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, locId, items.length]);
	if (!open) return null;
	return (
		<Modal
			id="bulk-branch-stock-modal"
			open
			title="Bulk Branch Count"
			subtitle="Set many item counts for one location"
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button
						className="btn gold"
						onClick={async () => {
							await svc.inventory.saveBulkBranchStockCounts(locId, counts, locations.find((l) => l.id === locId)?.name || "");
							onClose();
						}}
					>
						Apply Bulk Counts
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="field">
					<label>Location</label>
					<select className="input" id="bulk-stock-location" value={locId} onChange={(e) => setLocId(e.target.value)}>
						{locations.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name} — {l.code}
							</option>
						))}
					</select>
				</div>
				<div className="branch-stock-grid" id="bulk-branch-stock-grid" style={{ marginTop: 12 }}>
					{items.map((i) => (
						<label className="branch-stock-row" key={i.id}>
							<span>
								<strong>{i.name}</strong>
								<small>
									{i.sku || ""} · {i.unit || "each"}
								</small>
							</span>
							<input className="input" type="number" min="0" step="0.001" value={counts[i.id] ?? ""} onChange={(e) => setCounts((c) => ({ ...c, [i.id]: e.target.value }))} />
						</label>
					))}
					{!items.length && <div className="empty">No matching stock items.</div>}
				</div>
			</ModalBody>
		</Modal>
	);
}
