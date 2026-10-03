/**
 * Inventory & Stock page: stock KPIs, counting tools (phone count QR, count sheet upload, low-stock WhatsApp),
 * the stock items table with per-location views for owners, and recent stock movements.
 */
import { useMemo, useState } from "react";
import { money } from "../domain/format";
import { locationStock, stockStatus } from "../domain/inventory";
import { userName } from "../domain/names";
import { Kpi } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { lowStockWhatsAppUrl } from "../services/pos/inventory";
import { activeLocations, locationLabel } from "../services/pos/locations";
import { StockCountQrModal } from "../modals/StockCountQrModal";
import { InventoryItemModal, StockAdjustModal, BranchStockModal, BulkBranchStockModal } from "../modals/InventoryModals";
import { useDeferredLocationOpen } from "../hooks/useLocationSwitcher";
import { useUi } from "../store/UiProvider";

const statusStyle = (status) =>
	status === "In stock" || status === "OK" ? {} : status === "Low stock" || status === "Low" ? { background: "#fff2d7", color: "#9a6411" } : { background: "#fde9e7", color: "#a5362b" };

/** Inventory & stock: items, movements, counting tools and branch stock. */
export function Inventory() {
	const data = useData();
	const { role, locationId, svc } = usePos();
	const ui = useUi();
	const multi = useFeature("business.locations");
	const branchStock = useFeature("business.branchStock");
	const tools = useFeature("inventory.stockTools");
	const openLocations = useDeferredLocationOpen();
	const [q, setQ] = useState("");
	const [item, setItem] = useState(null); // null | "" | id
	const [adjust, setAdjust] = useState(null);
	const [branch, setBranch] = useState(null);
	const [bulk, setBulk] = useState(false);
	const [file, setFile] = useState(null);
	const [qrOpen, setQrOpen] = useState(false);

	const canEdit = ["owner", "manager", "admin"].includes(role);
	const allMode = branchStock && locationId === "all" && ["owner", "admin"].includes(role);
	const locations = activeLocations(data);
	const items = useMemo(() => {
		const s = q.toLowerCase();
		return data.inventory.filter((i) => !s || (i.name + " " + i.sku + " " + i.type).toLowerCase().includes(s));
	}, [data.inventory, q]);
	const qtyOf = (i) => locationStock(i, locationId === "all" ? "" : locationId);

	let kpis;
	if (allMode) {
		let low = 0;
		let out = 0;
		items.forEach((i) =>
			locations.forEach((l) => {
				const qty = Number(i.locationQuantities?.[l.id]) || 0;
				if (qty <= 0) out++;
				else if (qty <= Number(i.reorder || 0)) low++;
			}),
		);
		const value = items.reduce((s, i) => s + locations.reduce((t, l) => t + (Number(i.locationQuantities?.[l.id]) || 0) * (Number(i.cost) || 0), 0), 0);
		kpis = (
			<>
				<Kpi label="Locations" value={locations.length} />
				<Kpi label="Low Stock by Branch" value={low} style={{ color: "#b97913" }} />
				<Kpi label="Out of Stock by Branch" value={out} style={{ color: "#a5362b" }} />
				<Kpi label="All-Location Value" value={money(value)} />
			</>
		);
	} else {
		const low = data.inventory.filter((i) => qtyOf(i) > 0 && qtyOf(i) <= i.reorder).length;
		const out = data.inventory.filter((i) => qtyOf(i) <= 0).length;
		const value = data.inventory.reduce((a, i) => a + qtyOf(i) * i.cost, 0);
		kpis = (
			<>
				<Kpi label="Stock Items" value={data.inventory.length} />
				<Kpi label="Low Stock" value={low} style={{ color: "#b97913" }} />
				<Kpi label="Out of Stock" value={out} style={{ color: "#a5362b" }} />
				<Kpi label="Inventory Value" value={money(value)} />
			</>
		);
	}

	const whatsapp = () => {
		const url = lowStockWhatsAppUrl(data);
		if (!url) return ui.notice("No low-stock items right now.");
		window.open(url, "_blank");
	};

	return (
		<section className="view active" id="view-inventory">
			<div className="grid4" id="inventory-kpis">
				{kpis}
			</div>
			{tools && (
				<div className="panel" id="stock-tools-panel" style={{ marginTop: 16 }}>
					<div className="panel-head">
						<div>
							<div className="panel-title">Stock counting tools</div>
							<div className="muted">Count stock from a phone or upload a count sheet without changing sales or product settings.</div>
						</div>
					</div>
					<div className="modal-body">
						<div className="stock-tools-grid">
							<div className="stock-tool">
								<strong>Phone stock count</strong>
								<small>Scan a QR code with your phone to open a touch-friendly count page, type the counted quantities and they sync back here.</small>
								<button
									className="btn"
									type="button"
									onClick={() => setQrOpen(true)}
								>
									Start phone count
								</button>
							</div>
							<div className="stock-tool">
								<strong>Upload count sheet</strong>
								<small>Upload CSV, XLSX or XLS with an Item Name or SKU column and a Count, Stock or Quantity column. Review is handled by the existing catalogue import flow.</small>
								<input className="stock-count-file" id="stock-count-file" type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
								<button
									className="btn out"
									type="button"
									onClick={async () => {
										if (await svc.inventory.importStockCountFile(file)) setFile(null);
									}}
								>
									Apply stock counts
								</button>
							</div>
							<div className="stock-tool">
								<strong>Low-stock WhatsApp</strong>
								<small>Prepare a WhatsApp alert for all low and out-of-stock items. Connect a WhatsApp Business provider later for fully automatic background delivery.</small>
								<button className="btn out" type="button" onClick={whatsapp}>
									Prepare alert
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			<div className="panel" style={{ marginTop: 16 }}>
				<div className="panel-head">
					<div>
						<div className="panel-title">Stock Items</div>
						<div className="muted">Ingredients, sellable products and operating supplies</div>
					</div>
					<div className="tools">
						{multi && (
							<button type="button" id="inventory-location-button" className="btn out" onClick={openLocations}>
								{locationId === "all" ? "All Locations" : "Location: " + (locationLabel(data, locationId) || "Select Location")}
							</button>
						)}
						{allMode && (
							<button id="bulk-branch-stock" type="button" className="btn out" onClick={() => setBulk(true)}>
								Bulk Branch Count
							</button>
						)}
						<input className="input" id="inventory-search" placeholder="Search stock" value={q} onChange={(e) => setQ(e.target.value)} />
						{(canEdit || allMode) && (
							<button className="btn" id="inventory-add" onClick={() => setItem("")}>
								+ Add Stock
							</button>
						)}
					</div>
				</div>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>SKU</th>
								<th>Item</th>
								<th>Type</th>
								<th>On Hand</th>
								<th>Reorder At</th>
								<th>Unit Cost</th>
								<th>Stock Value</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody id="inventory-table">
							{items.map((i) => {
								if (allMode)
									return (
										<tr key={i.id}>
											<td>{i.sku || "—"}</td>
											<td>
												<strong>{i.name}</strong>
												{i.supplier && (
													<>
														<br />
														<span className="muted">{i.supplier}</span>
													</>
												)}
											</td>
											<td>{i.type}</td>
											<td colSpan="4">
												{locations.map((l) => {
													const qty = Number(i.locationQuantities?.[l.id]) || 0;
													const st = qty <= 0 ? "Out" : qty <= Number(i.reorder || 0) ? "Low" : "OK";
													return (
														<span key={l.id} className="badge" style={{ margin: 2, ...statusStyle(st) }}>
															{(l.code || l.name) + ": " + qty.toLocaleString() + " " + (i.unit || "each")}
														</span>
													);
												})}
												<span className="branch-stock-table-note">Owner view: stock is counted separately per location.</span>
											</td>
											<td>{money(locations.reduce((s, l) => s + (Number(i.locationQuantities?.[l.id]) || 0) * (Number(i.cost) || 0), 0))}</td>
											<td>
												<div className="tools">
													<button className="btn out" onClick={() => setBranch(i.id)}>
														Set Branch Stock
													</button>
													<button className="btn out" onClick={() => setItem(i.id)}>
														Edit
													</button>
												</div>
											</td>
										</tr>
									);
								const status = stockStatus({ ...i, qty: qtyOf(i) });
								return (
									<tr key={i.id}>
										<td>{i.sku || "—"}</td>
										<td>
											<strong>{i.name}</strong>
											{i.supplier && (
												<>
													<br />
													<span className="muted">{i.supplier}</span>
												</>
											)}
										</td>
										<td>{i.type}</td>
										<td>
											<strong>
												{Number(qtyOf(i)).toLocaleString()} {i.unit}
											</strong>
										</td>
										<td>
											{Number(i.reorder).toLocaleString()} {i.unit}
										</td>
										<td>{money(i.cost)}</td>
										<td>{money(qtyOf(i) * i.cost)}</td>
										<td>
											<span className="badge" style={statusStyle(status)}>
												{status}
											</span>
										</td>
										<td>
											{canEdit && (
												<div className="tools">
													<button className="btn out" onClick={() => setAdjust(i.id)}>
														Adjust
													</button>
													<button className="btn out" onClick={() => setItem(i.id)}>
														Edit
													</button>
													<button className="btn danger" onClick={() => svc.inventory.deleteInventoryItem(i.id)}>
														Delete
													</button>
												</div>
											)}
										</td>
									</tr>
								);
							})}
							{!items.length && (
								<tr>
									<td colSpan="9">No stock items yet. Add ingredients such as buns, tomatoes or packaging.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
			<div className="panel" style={{ marginTop: 16 }}>
				<div className="panel-head">
					<div>
						<div className="panel-title">Recent Stock Movements</div>
						<div className="muted">Purchases, counts, wastage and recipe deductions</div>
					</div>
				</div>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Date</th>
								<th>Item</th>
								<th>Reason</th>
								<th>Change</th>
								<th>Balance</th>
								<th>User</th>
							</tr>
						</thead>
						<tbody id="stock-movement-table">
							{data.stockMovements.slice(0, 50).map((m) => {
								const i = data.inventory.find((x) => x.id === m.itemId);
								return (
									<tr key={m.id}>
										<td>{new Date(m.at).toLocaleString()}</td>
										<td>{i?.name || m.itemName || "Deleted item"}</td>
										<td>
											{m.reason}
											{m.note && (
												<>
													<br />
													<span className="muted">{m.note}</span>
												</>
											)}
											{m.locationId && (
												<>
													<br />
													<span className="muted">{locationLabel(data, m.locationId)}</span>
												</>
											)}
										</td>
										<td style={{ color: m.change < 0 ? "#a5362b" : "#168653" }}>
											{m.change > 0 ? "+" : ""}
											{m.change}
										</td>
										<td>{m.balance}</td>
										<td>{userName(data.users, m.userId, "System")}</td>
									</tr>
								);
							})}
							{!data.stockMovements.length && (
								<tr>
									<td colSpan="6">No stock movements yet.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
			<StockCountQrModal open={qrOpen} onClose={() => setQrOpen(false)} />
			<InventoryItemModal id={item} open={item !== null} onClose={() => setItem(null)} />
			<StockAdjustModal id={adjust} open={adjust !== null} onClose={() => setAdjust(null)} />
			<BranchStockModal id={branch} open={branch !== null} onClose={() => setBranch(null)} />
			<BulkBranchStockModal open={bulk} onClose={() => setBulk(false)} search={q} />
		</section>
	);
}
