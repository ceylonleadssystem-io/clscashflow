/**
 * Payment popups opened from the Current Order panel.
 *   Quick Pay: just take the payment (method, cash tendered / split) and finish the sale.
 *   Pay Now:   customer details, discount, order reference/channel, payment and receipt options, then finish.
 * Both reuse the same checkout state and sections, so every existing option is still available.
 */
import { money } from "../../domain/format";
import { Modal, ModalBody } from "../ui";
import { useCheckout } from "../../store/CheckoutProvider";
import { useFeature } from "../../store/FeatureProvider";
import { CheckoutFields, PaymentSection } from "./CheckoutFields";

export function PayPopup({ mode, onClose }) {
	const c = useCheckout();
	const print = useFeature("checkout.printReceipt");
	if (!mode) return null;
	const t = c.totals;
	const quick = mode === "quick";
	const pay = async () => {
		if (await c.completeSale()) onClose();
	};
	return (
		<Modal
			id={quick ? "quick-pay-modal" : "pay-now-modal"}
			open
			onClose={onClose}
			title={quick ? "Quick Pay" : "Pay Now"}
			subtitle={quick ? "Take the payment and finish the sale." : "Customer details, discount, payment and receipt options."}
			boxClassName="pay-popup"
			footer={
				<>
					<button className="btn out" type="button" onClick={onClose}>
						Cancel
					</button>
					<button className="btn gold" id="complete-btn" type="button" onClick={pay} disabled={!c.cart.length || c.busy}>
						{c.busy ? "Processing…" : quick ? "Pay & Finish" : "Complete Sale"}
						<span className="complete-amount"> · {money(t.total)}</span>
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="pay-summary">
					<div>
						<span className="muted">{t.count} item{t.count === 1 ? "" : "s"}</span>
						{t.discount > 0 && <span className="muted"> · discount -{money(t.discount)}</span>}
						{t.service > 0 && <span className="muted"> · service {money(t.service)}</span>}
					</div>
					<strong className="pay-summary-total">{money(t.total)}</strong>
				</div>
				{quick ? (
					<div className="checkout-fields">
						<PaymentSection />
						{print && (
							<label className="muted receipt-print-choice">
								<input type="checkbox" id="print-sale-receipt" checked={c.printAfter} onChange={(e) => c.setPrintAfter(e.target.checked)} /> Print receipt after checkout
							</label>
						)}
					</div>
				) : (
					<CheckoutFields />
				)}
			</ModalBody>
		</Modal>
	);
}
