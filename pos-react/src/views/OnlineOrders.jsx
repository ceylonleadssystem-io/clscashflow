/**
 * Online orders page (cart button in the top bar): orders that arrive from an online store, such as Shopify, waiting to be prepared.
 * Until a store is connected the list is empty.
 */
import { useMemo } from "react";
import { money } from "../domain/format";
import { orderTotal } from "../domain/orders";
import { openOnlineOrders } from "../domain/onlineOrders";
import { useData } from "../store/DataProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { Kpi, Panel } from "../components/ui";

export function OnlineOrders() {
	const data = useData();
	const { loadOpenOrder } = useCheckout();
	const orders = useMemo(() => openOnlineOrders(data.openOrders), [data.openOrders]);
	const fresh = orders.filter((o) => !o.kitchenSentAt).length;
	return (
		<section className="view active" id="view-online">
			<div className="grid4" id="online-orders-kpis">
				<Kpi label="Online Orders" value={orders.length} />
				<Kpi label="New" value={fresh} />
				<Kpi label="Sent to Kitchen" value={orders.length - fresh} />
				<Kpi label="Value" value={money(orders.reduce((a, o) => a + orderTotal(o), 0))} />
			</div>
			<Panel title="Online orders" id="online-orders-panel">
				{orders.length ? (
					<ul className="plan-bullets" id="online-orders-list">
						{orders.map((o) => (
							<li key={o.id} data-order={o.id} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
								<b>{o.orderNumber}</b>
								<span className="badge">{o.orderChannel}</span>
								<span className="muted">{o.platformOrderId ? "#" + o.platformOrderId : ""}</span>
								<span>{(o.lines || []).reduce((a, l) => a + (Number(l.qty) || 0), 0)} items</span>
								<span>{money(orderTotal(o))}</span>
								<span className="muted">{o.kitchenSentAt ? "Sent to kitchen" : "New"}</span>
								<button type="button" className="btn gold" style={{ marginLeft: "auto" }} onClick={() => loadOpenOrder(o.id)}>
									Open
								</button>
							</li>
						))}
					</ul>
				) : (
					<div className="empty" id="online-orders-empty">
						No online orders yet. Orders from your online store will appear here as soon as the store is connected.
					</div>
				)}
			</Panel>
		</section>
	);
}
