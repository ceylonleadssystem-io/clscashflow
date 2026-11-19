/**
 * Top-bar cart button "Online orders": opens the page of orders that arrive from an online store, with a badge for new ones.
 */
import { newOnlineCount } from "../../domain/onlineOrders";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";

const CART = (
	<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<circle cx="9" cy="20" r="1.4" />
		<circle cx="18" cy="20" r="1.4" />
		<path d="M2.5 3.5h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
	</svg>
);

export function OnlineOrdersButton() {
	const { openOrders } = useData();
	const { view, go, canView } = usePos();
	if (!canView("online")) return null;
	const fresh = newOnlineCount(openOrders);
	const label = fresh ? `Online orders, ${fresh} new` : "Online orders";
	return (
		<button type="button" id="online-orders-btn" className={"btn out online-orders-btn" + (view === "online" ? " active" : "")} aria-label={label} aria-current={view === "online" ? "page" : undefined} title={label} onClick={() => go("online")}>
			{CART}
			<span className="oo-text">Online orders</span>
			{fresh > 0 && <b className="oo-badge">{fresh}</b>}
		</button>
	);
}
