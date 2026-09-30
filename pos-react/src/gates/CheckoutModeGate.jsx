import { useState } from "react";
import { usePos } from "../store/PosProvider";

/** "Choose Your Checkout": phone layout or full POS layout. */
export function CheckoutModeGate() {
	const { setCheckoutMode } = usePos();
	const [remember, setRemember] = useState(false);
	return (
		<div id="checkout-mode-gate" className="checkout-mode-gate">
			<section className="checkout-mode-card" role="dialog" aria-modal="true" aria-labelledby="checkout-mode-title">
				<h2 id="checkout-mode-title">Choose Your Checkout</h2>
				<p>How would you like to use Ceylonry POS?</p>
				<div className="checkout-mode-options">
					<button type="button" className="checkout-mode-option" data-checkout-mode="mobile" onClick={() => setCheckoutMode("mobile", remember)}>
						<span className="checkout-mode-icon">📱</span>
						<span>
							<strong>Mobile Checkout</strong>
							<span>Optimised for phones and smaller screens.</span>
							<small>Open Mobile Checkout →</small>
						</span>
					</button>
					<button type="button" className="checkout-mode-option" data-checkout-mode="pos" onClick={() => setCheckoutMode("pos", remember)}>
						<span className="checkout-mode-icon">🖥️</span>
						<span>
							<strong>POS Checkout</strong>
							<span>Full checkout interface for POS terminals, desktops, laptops and tablets.</span>
							<small>Open POS Checkout →</small>
						</span>
					</button>
				</div>
				<label className="checkout-mode-remember">
					<input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember my choice on this device
				</label>
			</section>
		</div>
	);
}
