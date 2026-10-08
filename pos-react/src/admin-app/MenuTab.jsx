/**
 * Admin portal: export one business' menu in the catalogue template format (Excel or CSV), which the POS
 * "Import Catalogue" option reads back. The menu comes from the workspace the admin screen already loaded.
 */
import { useState } from "react";
import { catalogueExportMatrix, menuFileName } from "../domain/catalogExport";
import { downloadBlob, downloadCsv } from "../domain/format";
import { loadXlsx } from "../services/xlsx";
import { createLogger } from "../utils/logger";

const log = createLogger("admin");

export function MenuTab({ account, workspace, ui }) {
	const products = workspace?.products || [];
	const inventory = workspace?.inventory || [];
	const business = workspace?.settings?.business || account.business || account.email;
	const categories = new Set(products.map((p) => p.category).filter(Boolean)).size;
	const [busy, setBusy] = useState(false);

	const matrix = () => catalogueExportMatrix(products, inventory);
	const exportExcel = async () => {
		setBusy(true);
		try {
			const XLSX = await loadXlsx();
			const book = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(matrix()), "Catalogue");
			const bytes = XLSX.write(book, { bookType: "xlsx", type: "array" });
			downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), menuFileName(business, "xlsx"));
			log.info("menu exported", { accountId: account.id, items: products.length, format: "xlsx" });
		} catch (e) {
			await ui.alert(e.message + " You can download the CSV instead.");
		} finally {
			setBusy(false);
		}
	};
	const exportCsv = () => {
		downloadCsv(matrix(), menuFileName(business, "csv"));
		log.info("menu exported", { accountId: account.id, items: products.length, format: "csv" });
	};

	return (
		<div className="panel">
			<div className="panel-head">
				<div>
					<div className="panel-title">Export menu</div>
					<div className="muted">Download this business' products and services in the same format as the catalogue template.</div>
				</div>
			</div>
			<div className="modal-body">
				<p style={{ marginTop: 0 }}>
					<strong>{products.length}</strong> item{products.length === 1 ? "" : "s"} in <strong>{categories}</strong> categor{categories === 1 ? "y" : "ies"}.
				</p>
				<div className="tools">
					<button className="btn gold" id="menu-export-xlsx" disabled={!products.length || busy} onClick={exportExcel}>
						Download Excel (.xlsx)
					</button>
					<button className="btn out" id="menu-export-csv" disabled={!products.length} onClick={exportCsv}>
						Download CSV
					</button>
				</div>
				<div className="print-note" style={{ marginTop: 12 }}>
					The file can be uploaded again in the POS under Products &amp; Services &gt; Import Catalogue. It carries name, type, code, categories, description, prices, stock, unit and supplier. Photos, modifiers (sizes, add-ons) and recipes are not part of that format, so they are not exported.
				</div>
			</div>
		</div>
	);
}
