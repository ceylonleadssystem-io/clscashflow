/**
 * The Service charge switch under Quick Pay and Pay Now: staff turn the service charge on or off for the order in front of them. The rules in
 * Settings > Service Charge decide where it starts; switching off a charge that would apply needs someone who may remove it (CheckoutProvider).
 */
import { ORDER_CHANNELS } from "../../config/constants";
import { money } from "../../domain/format";
import { useCheckout } from "../../store/CheckoutProvider";
import { useData } from "../../store/DataProvider";

/** One short line saying why the switch is where it is. */
function why(c, settings) {
	const r = c.serviceRules;
	if (c.serviceOn) {
		if (r.maxOn && +r.maxCharge > 0 && c.totals.service >= +r.maxCharge) return "Capped at " + money(r.maxCharge) + ".";
		return "";
	}
	if (!r.autoApply) return "Not added automatically. Switch on to add it to this order.";
	if (ORDER_CHANNELS.includes(c.orderChannel) && !r.orderTypes.includes(c.orderChannel)) return "Not added automatically to " + c.orderChannel + " orders.";
	if (r.minOn) return "Added automatically when the order total is above " + money(r.minTotal) + ".";
	return "";
}

export function ServiceChargeToggle() {
	const c = useCheckout();
	const { settings } = useData();
	if (!c.serviceAvailable) return null;
	const rate = +settings.serviceChargeRate || 0;
	const note = why(c, settings);
	return (
		<div className="service-toggle" id="service-charge-toggle">
			<div className="service-toggle-text">
				<strong id="service-toggle-label">Service charge ({rate}%)</strong>
				<span className="muted" id="service-toggle-amount">
					{c.serviceOn ? money(c.totals.service) + " added" : "Not added"}
				</span>
				{note && <small className="muted">{note}</small>}
			</div>
			<label className="sk-switch">
				<input type="checkbox" role="switch" aria-labelledby="service-toggle-label" checked={c.serviceOn} disabled={!c.cart.length || c.busy} onChange={(e) => c.setServiceCharge(e.target.checked)} />
				<span aria-hidden="true" />
			</label>
		</div>
	);
}
