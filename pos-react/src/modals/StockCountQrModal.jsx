import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Modal, ModalBody } from "../components/ui";
import { env } from "../config/env";

/** Shows a QR code; scanning it with a phone opens the mobile stock-count page. */
export function countUrl() {
	return window.location.origin + env.basePath.replace(/\/$/, "") + "/#/count";
}

export function StockCountQrModal({ open, onClose }) {
	const [img, setImg] = useState("");
	const url = countUrl();
	useEffect(() => {
		if (!open) return;
		QRCode.toDataURL(url, { width: 280, margin: 1, errorCorrectionLevel: "M" }).then(setImg).catch(() => setImg(""));
	}, [open, url]);
	return (
		<Modal id="stock-count-qr-modal" open={open} title="Phone stock count" subtitle="Scan with your phone camera" onClose={onClose} footer={<button className="btn out" onClick={onClose}>Close</button>}>
			<ModalBody>
				<div className="qr-box">
					{img ? <img src={img} alt="QR code for the phone stock count page" width="280" height="280" /> : <div className="muted">Generating QR code…</div>}
					<ol className="qr-steps">
						<li>Scan the code with the phone camera and open the link.</li>
						<li>Sign in with the business login and your PIN (same account, same location).</li>
						<li>Search an item, type the counted quantity and save — it is recorded as “Stock count correction” and syncs to this register.</li>
					</ol>
					<input className="input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Stock count link" />
				</div>
			</ModalBody>
		</Modal>
	);
}
