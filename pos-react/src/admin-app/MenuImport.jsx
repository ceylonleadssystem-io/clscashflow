/**
 * Admin portal > Menu > Import items: the same file import as the POS "Import Items" (Ceylonry template, Excel, CSV or a Square export),
 * with the same preview and editing, saved straight into this business' menu. A backup of the previous menu is kept by the server.
 */
import { useState } from "react";
import { catalogueNumber, parseCatalogueRows } from "../domain/catalog";
import { loadXlsx } from "../services/xlsx";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";
import { adminApi } from "./adminApi";

const log = createLogger("admin");
const NUMBERS = ["cost", "price", "stock"];
const START = "Choose a file to see a preview before anything is saved.";

export function MenuImport({ account, ui, reload }) {
	const [rows, setRows] = useState([]);
	const [mode, setMode] = useState("merge");
	const [status, setStatus] = useState(START);
	const [busy, setBusy] = useState(false);

	const read = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setStatus("Reading " + file.name + "…");
		try {
			const XLSX = await loadXlsx();
			const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
			const sheet = wb.Sheets[wb.SheetNames.includes("Items") ? "Items" : wb.SheetNames[0]];
			const parsed = parseCatalogueRows(XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }));
			if (!parsed.length) throw new Error("No importable products or services were found.");
			setRows(parsed);
			setStatus("File read successfully. Review the rows below before importing.");
		} catch (error) {
			setRows([]);
			setStatus(error.message);
		}
	};
	const update = (i, key, value) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: NUMBERS.includes(key) ? catalogueNumber(value) : value } : row)));

	const publish = async () => {
		const selected = rows.filter((r) => r.include);
		if (!selected.length) return void (await ui.alert("Select at least one row to import."));
		const invalid = selected.find((r) => !r.name.trim() || !r.category.trim() || !(r.price > 0));
		if (invalid) return void (await ui.alert(`Row ${invalid.rowNumber} needs a name, main category and selling price.`));
		if (mode === "replace" && !(await ui.confirm(`Replace the complete product catalogue of ${account.business || account.email} with these ${selected.length} items? The previous menu is kept as a backup.`))) return;
		setBusy(true);
		try {
			const res = await adminApi({
				action: "saveCatalog",
				userId: account.id,
				mode,
				products: selected.map((r) => ({ name: r.name.trim(), type: r.type, code: r.code.trim(), category: r.category.trim(), subcategory: (r.subcategory || "").trim(), description: r.description, cost: r.cost, price: r.price, stock: r.stock, unit: r.unit, supplier: r.supplier })),
				categories: [...new Set(selected.map((r) => r.category.trim()))],
				subcategories: selected.filter((r) => (r.subcategory || "").trim()).map((r) => ({ parent: r.category.trim(), name: r.subcategory.trim() })),
			});
			log.info("menu imported", { accountId: account.id, mode, items: res.imported, skipped: res.skipped });
			setRows([]);
			setStatus(`${res.imported} item${res.imported === 1 ? "" : "s"} saved${res.skipped ? ", " + res.skipped + " skipped (already in the menu)" : ""}. Their POS picks it up within a few seconds. A backup of the previous menu was kept (${res.backupId}).`);
			await reload?.();
		} catch (error) {
			await ui.alert(error.message);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="panel" id="menu-import" style={{ marginTop: 14 }}>
			<div className="panel-head">
				<div>
					<div className="panel-title">Import items</div>
					<div className="muted">Upload an Excel, CSV or Square file, review it, then save it into this business' menu.</div>
				</div>
			</div>
			<div className="modal-body" style={{ display: "grid", gap: 12 }}>
				<div className="import-step">
					<strong>1. Prepare your file</strong>
					<span>Use the Ceylonry template or the client's existing Square-style catalogue.</span>
					<a className="btn out" href={env.basePath + "assets/Ceylonry-POS-Catalogue-Template.xlsx"} download>
						Download Ceylonry Excel Template
					</a>
				</div>
				<div className="import-step">
					<strong>2. Choose the file</strong>
					<span>Supported: .xlsx, .xls and .csv. The Square format is detected automatically.</span>
					<input className="input" id="menu-import-file" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={read} />
				</div>
				<div className="import-step">
					<strong>3. Import method</strong>
					<select className="input" id="menu-import-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
						<option value="merge">Add new items and update matching SKU / Code</option>
						<option value="add">Add new items only</option>
						<option value="replace">Replace the complete product catalogue</option>
					</select>
				</div>
				<div id="menu-import-status" className="print-note" role="status">
					{status}
				</div>
				{rows.length > 0 && (
					<div id="menu-import-preview">
						<div className="import-preview-head">
							<strong id="menu-import-summary">{rows.length} rows ready</strong>
							<span className="muted">Review and edit cells before importing. Photos are added in the POS afterwards.</span>
						</div>
						<div className="table-wrap import-preview-table">
							<table>
								<thead>
									<tr>
										<th>Include</th>
										<th>Name</th>
										<th>Type</th>
										<th>SKU / Code</th>
										<th>Main category</th>
										<th>Subcategory</th>
										<th>Cost</th>
										<th>Selling</th>
										<th>Stock</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row, i) => (
										<tr key={i}>
											<td>
												<input type="checkbox" aria-label={"Include row " + row.rowNumber} checked={row.include} onChange={(e) => update(i, "include", e.target.checked)} />
											</td>
											{["name", "type", "code", "category", "subcategory", "cost", "price", "stock"].map((key) => (
												<td key={key}>
													{key === "type" ? (
														<select className="input" value={row.type} onChange={(e) => update(i, "type", e.target.value)}>
															<option>Product</option>
															<option>Service</option>
														</select>
													) : (
														<input className="input" type={NUMBERS.includes(key) ? "number" : "text"} min="0" step="0.01" value={row[key]} onChange={(e) => update(i, key, e.target.value)} />
													)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
				<div>
					<button className="btn gold" type="button" id="menu-import-save" disabled={!rows.length || busy} onClick={publish}>
						{busy ? "Saving…" : "Import items"}
					</button>
				</div>
			</div>
		</div>
	);
}
