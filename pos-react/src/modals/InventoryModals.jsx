import { useEffect, useMemo, useState } from "react";
import { ADJUST_REASONS, STOCK_TYPES, STOCK_UNITS } from "../config/constants";
import { Modal, ModalBody, NumberInput } from "../components/ui";
import { locationStock } from "../domain/inventory";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { activeLocations } from "../services/pos/locations";

const blank = () => ({ id: "", name: "", sku: "", type: "Ingredient", unit: "each", qty: "0", reorder: "0", cost: "0", supplier: "" });

export function InventoryItemModal({ id, open, onClose }) {
	const data = useData();
	const { svc, locationId } = usePos();
	const [f, setF] = useState(blank);
	useEffect(() => {
		if (!open) return;
		const i = data.inventory.find((x) => x.id === id);
		setF(i ? { ...blank(), ...i, qty: String(locationStock(i, locationId === "all" ? "" : locationId)), reorder: String(i.reorder ?? 0), cost: String(i.cost ?? 0), sku: i.sku || "", supplier: i.supplier || "" } : blank());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, id]);
	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
	const save = async () => {
		if (await svc.inventory.saveInventoryItem({ ...f, qty: f.qty.replace(/,/g, ""), reorder: f.reorder.replace(/,/g, ""), cost: f.cost.replace(/,/g, "") })) onClose();
	};
	return (
		<Modal
			id="inventory-modal"
			open={open}
			title={id ? "Edit Stock Item" : "Add Stock Item"}
			onClose={onClose}
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn" onClick={save}>
						Save Stock Item
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					<div className="field">
						<label>Item Name *</label>
						<input className="input" id="i-name" placeholder="e.g. Burger Buns" value={f.name} onChange={set("name")} />
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
	const save = async () => {
		if (await svc.inventory.adjustStock(id, Number(String(qty).replace(/,/g, "")), reason, note.trim())) onClose();
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
						{locationStock(item, locationId === "all" ? "" : locationId)} {item.unit}
					</div>
					<div className="plan-settings-note">Current stock on hand</div>
				</div>
				<div className="form-grid" style={{ marginTop: 14 }}>
					<div className="field">
						<label>Adjustment</label>
						<NumberInput id="adjust-qty" value={qty} onChange={setQty} placeholder="Use - for stock out" />
					</div>
					<div className="field">
						<label>Reason</label>
						<select className="input" id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
							{ADJUST_REASONS.map((r) => (
								<option key={r}>{r}</option>
							))}
						</select>
					</div>
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
