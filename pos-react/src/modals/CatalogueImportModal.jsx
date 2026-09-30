import { useEffect, useState } from "react";
import { Modal, ModalBody } from "../components/ui";
import { catalogueNumber, parseCatalogueRows } from "../domain/catalog";
import { usePos } from "../store/PosProvider";
import { loadXlsx } from "../services/xlsx";
import { env } from "../config/env";

/** Import Catalogue: upload Excel/CSV/Square export, review & edit rows, then import. */
export function CatalogueImportModal({ open, onClose }) {
	const { svc } = usePos();
	const [rows, setRows] = useState([]);
	const [mode, setMode] = useState("merge");
	const [status, setStatus] = useState("Choose a file to see a preview before anything is saved.");
	useEffect(() => {
		if (open) {
			setRows([]);
			setMode("merge");
			setStatus("Choose a file to see a preview before anything is saved.");
		}
	}, [open]);

	const read = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setStatus("Reading " + file.name + "…");
		try {
			const XLSX = await loadXlsx();
			const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
			const sheet = wb.Sheets[wb.SheetNames.includes("Items") ? "Items" : wb.SheetNames[0]];
			const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
			const parsed = parseCatalogueRows(matrix);
			if (!parsed.length) throw new Error("No importable products or services were found.");
			setRows(parsed);
			setStatus("File read successfully. Review the rows below before importing.");
		} catch (error) {
			setRows([]);
			setStatus(error.message);
		}
	};
	const update = (i, key, value) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: ["cost", "price", "stock"].includes(key) ? catalogueNumber(value) : value } : row)));
	const publish = async () => {
		if (await svc.catalog.importCatalogue(rows, mode)) onClose();
	};

	return (
		<Modal
			id="catalogue-import-modal"
			open={open}
			title="Import Catalogue"
			subtitle="Upload Excel, review the mapping, then import editable products and services."
			onClose={onClose}
			boxClassName="catalogue-import-box"
			footer={
				<>
					<button className="btn out" onClick={onClose}>
						Cancel
					</button>
					<button className="btn gold" disabled={!rows.length} onClick={publish}>
						Import Items
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="import-step">
					<strong>1. Prepare your file</strong>
					<span>Use the Ceylonry template or upload an existing Square-style catalogue.</span>
					<a className="btn out" href={env.basePath + "assets/Ceylonry-POS-Catalogue-Template.xlsx"} download>
						Download Ceylonry Excel Template
					</a>
				</div>
				<div className="import-step">
					<strong>2. Choose Excel file</strong>
					<span>Supported: .xlsx, .xls and .csv. Your supplied Square catalogue format is detected automatically.</span>
					<input className="input" id="catalogue-import-file" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={read} />
				</div>
				<div className="import-step">
					<strong>3. Import method</strong>
					<select className="input" id="catalogue-import-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
						<option value="merge">Add new items and update matching SKU / Code</option>
						<option value="add">Add new items only</option>
						<option value="replace">Replace the complete product catalogue</option>
					</select>
				</div>
				<div id="catalogue-import-status" className="print-note">
					{status}
				</div>
				{rows.length > 0 && (
					<div id="catalogue-import-preview">
						<div className="import-preview-head">
							<strong id="catalogue-import-summary">{rows.length} rows ready</strong>
							<span className="muted">Review and edit cells before importing. Images can be added from Edit Item afterwards.</span>
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
								<tbody id="catalogue-import-body">
									{rows.map((row, i) => (
										<tr key={i}>
											<td>
												<input type="checkbox" checked={row.include} onChange={(e) => update(i, "include", e.target.checked)} />
											</td>
											{["name", "type", "code", "category", "subcategory", "cost", "price", "stock"].map((key) => (
												<td key={key}>
													{key === "type" ? (
														<select className="input" value={row.type} onChange={(e) => update(i, "type", e.target.value)}>
															<option>Product</option>
															<option>Service</option>
														</select>
													) : (
														<input
															className="input"
															type={["cost", "price", "stock"].includes(key) ? "number" : "text"}
															min="0"
															step="0.01"
															value={row[key]}
															onChange={(e) => update(i, key, e.target.value)}
														/>
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
			</ModalBody>
		</Modal>
	);
}
