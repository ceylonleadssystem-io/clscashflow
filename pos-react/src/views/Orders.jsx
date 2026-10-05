/**
 * Order Queue page: open orders with KPIs and actions to recall and pay, resend to the kitchen, or void.
 */
import { useMemo, useState } from "react";
import { money } from "../domain/format";
import { orderTotal } from "../domain/orders";
import { customerName, userName } from "../domain/names";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { usePos } from "../store/PosProvider";
import { Kpi, Panel } from "../components/ui";
import { MoveCheckModal } from "../modals/MoveCheckModal";

/** Order Queue: open checks waiting for payment / kitchen sending. */
export function Orders() {
	const data = useData();
	const { kitchen, svc } = usePos();
	const { loadOpenOrder, splitOpenOrder, newOpenOrder } = useCheckout();
	const canSplit = useFeature("checkout.splitBill");
	const [moving, setMoving] = useState(null);
	const tickets = useFeature("checkout.kitchenTickets");
	const open = useMemo(
		() => data.openOrders.filter((o) => o.status === "open").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
		[data.openOrders],
	);
	const sent = open.filter((o) => o.kitchenSentAt).length;
	const total = open.reduce((a, o) => a + orderTotal(o), 0);
	const showKitchen = kitchen && tickets;
	return (
		<section className="view active" id="view-orders">
			<div className="grid4" id="order-queue-kpis">
				<Kpi label="Open Orders" value={open.length} />
				<Kpi label={showKitchen ? "Sent to Kitchen" : "Saved Orders"} value={showKitchen ? sent : open.length} />
				<Kpi label={showKitchen ? "Not Yet Sent" : "Awaiting Payment"} value={showKitchen ? open.length - sent : open.length} />
				<Kpi label="Open Value" value={money(total)} />
			</div>
			<Panel
				style={{ marginTop: 16 }}
				title="Open Orders"
				subtitle="Recall a check, resend it to the kitchen or take payment"
				actions={
					<button className="btn gold" onClick={newOpenOrder}>
						+ New Order
					</button>
				}
			>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Opened</th>
								<th>Table / Order</th>
								<th>Customer</th>
								<th>Server</th>
								<th>Items</th>
								<th>Total</th>
								<th>Kitchen</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="order-queue-table">
							{open.map((o) => (
								<tr key={o.id}>
									<td>{new Date(o.openedAt).toLocaleString()}</td>
									<td>
										<strong>{o.orderReference || o.orderNumber}</strong>
										<br />
										<span className="muted">{o.orderNumber}</span>
										<br />
										<span className="order-channel-badge">
											{(o.orderChannel || (kitchen ? "Dine-in" : "Retail")) + (o.platformOrderId ? " · " + o.platformOrderId : "")}
										</span>
									</td>
									<td>{customerName(data.customers, o.customerId)}</td>
									<td>{userName(data.users, o.staffId)}</td>
									<td>{(o.lines || []).reduce((a, l) => a + l.qty, 0)}</td>
									<td>{money(orderTotal(o))}</td>
									<td>
										{showKitchen ? (
											<span className="badge" style={o.kitchenSentAt ? {} : { background: "#fff2d7", color: "#9a6411" }}>
												{o.kitchenSentAt ? "Sent " + new Date(o.kitchenSentAt).toLocaleTimeString() : "Not sent"}
											</span>
										) : (
											<span className="badge">Saved</span>
										)}
									</td>
									<td>
										<div className="tools">
											<button className="btn" onClick={() => loadOpenOrder(o.id)}>
												Open / Pay
											</button>
											{showKitchen && (
												<button className="btn out" onClick={() => svc.sales.resendOpenOrder(o.id)}>
													{o.kitchenSentAt ? "Resend KOT" : "Send KOT"}
												</button>
											)}
											{canSplit && (
												<button className="btn out" onClick={() => splitOpenOrder(o.id)}>
													Split
												</button>
											)}
											<button className="btn out" onClick={() => setMoving(o)}>
												Move / Merge
											</button>
											<button className="btn danger" onClick={() => svc.sales.voidOpenOrder(o.id)}>
												Void
											</button>
										</div>
									</td>
								</tr>
							))}
							{!open.length && (
								<tr>
									<td colSpan="8">No open orders. Save an order to recall and take payment later.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Panel>
			<MoveCheckModal order={moving} onClose={() => setMoving(null)} />
		</section>
	);
}
