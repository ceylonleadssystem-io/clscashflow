/**
 * Online orders page (cart button in the top bar): orders that arrive from an online store, such as Shopify. Staff accept or decline each one,
 * print its packing label, add tracking and mark it fulfilled, all here; the store is told at the same time (see domain/onlineFlow.js).
 */
import { useMemo, useState } from "react";
import { money, whatsappPhone } from "../domain/format";
import { orderTotal } from "../domain/orders";
import { STATES, canAccept, canDecline, canFulfill, canPack, canTrack, declineReasonOf, hasTracking, shopifyAdminUrl, stateOf, customerMessage } from "../domain/onlineFlow";
import { allOnlineOrders } from "../domain/onlineOrders";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { Kpi, Panel } from "../components/ui";
import { DeclineOrderModal, FulfillOrderModal } from "../modals/OnlineOrderModals";

const FILTERS = [{ value: "active", label: "New and accepted" }, ...STATES.map((s) => ({ value: s.value, label: s.label })), { value: "all", label: "All" }];
const stateLabel = (o) => STATES.find((s) => s.value === stateOf(o))?.label || "New";

function ShopifyStatus({ order, onRetry, busy }) {
	const s = order.online?.shopify;
	if (!s?.lastAction) return <span className="muted">Shopify not updated yet</span>;
	if (s.status === "done") return <span className="muted">Shopify updated ✓</span>;
	return (
		<span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
			<span className="badge" title={s.error || ""} style={{ background: s.status === "failed" ? "#fde7e4" : undefined }}>
				{s.status === "failed" ? "Shopify not updated" : "Shopify access not connected"}
			</span>
			<button type="button" className="btn out" disabled={busy} onClick={() => onRetry(order.id)}>
				Send to Shopify again
			</button>
		</span>
	);
}

export function OnlineOrders() {
	const data = useData();
	const { svc } = usePos();
	const [filter, setFilter] = useState("active");
	const [busy, setBusy] = useState(false);
	const [declining, setDeclining] = useState(null);
	const [fulfilling, setFulfilling] = useState(null); // { order, fulfil }
	const orders = useMemo(() => allOnlineOrders(data.openOrders), [data.openOrders]);
	const count = (state) => orders.filter((o) => stateOf(o) === state).length;
	const list = orders.filter((o) => filter === "all" || (filter === "active" ? ["new", "accepted"].includes(stateOf(o)) : stateOf(o) === filter));
	const run = async (fn) => {
		setBusy(true);
		try {
			return await fn();
		} finally {
			setBusy(false);
		}
	};
	const whatsapp = (o) => {
		const phone = whatsappPhone(o.online?.customer?.phone);
		if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(customerMessage(o, data.settings.business))}`, "_blank", "noopener");
	};
	return (
		<section className="view active" id="view-online">
			<div className="grid4" id="online-orders-kpis">
				<Kpi label="New" value={count("new")} />
				<Kpi label="Accepted" value={count("accepted")} />
				<Kpi label="Fulfilled" value={count("fulfilled")} />
				<Kpi label="Declined" value={count("declined")} />
			</div>
			<Panel
				title="Online orders"
				id="online-orders-panel"
				actions={
					<select className="input" id="online-filter" aria-label="Show" value={filter} onChange={(e) => setFilter(e.target.value)}>
						{FILTERS.map((f) => (
							<option key={f.value} value={f.value}>
								{f.label}
							</option>
						))}
					</select>
				}
			>
				{list.length ? (
					<div id="online-orders-list" style={{ display: "grid", gap: 12 }}>
						{list.map((o) => {
							const on = o.online || {};
							const t = on.tracking || {};
							const state = stateOf(o);
							const unmatched = (o.lines || []).filter((l) => l.unmatched).length;
							const link = shopifyAdminUrl(o);
							return (
								<article key={o.id} className="panel" data-order={o.id} data-state={state} style={{ padding: 14 }}>
									<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
										<b>{o.platformOrderId || o.orderNumber}</b>
										<span className="muted">{o.orderNumber}</span>
										<span className="badge" data-state-badge={state}>{stateLabel(o)}</span>
										{unmatched > 0 && (
											<span className="badge" title="No item or stock item has the SKU of these items, so their stock is not reduced">
												{unmatched} not matched
											</span>
										)}
										<span style={{ marginLeft: "auto" }}>{money(orderTotal(o))}</span>
									</div>
									<div className="customer-meta" style={{ marginTop: 6 }}>
										{on.customer?.name || "Customer"} {on.customer?.phone ? "· " + on.customer.phone : ""}
										{on.delivery?.address ? <><br />Deliver to: {on.delivery.address}</> : null}
										{on.note ? <><br />Note: {on.note}</> : null}
										{state === "declined" && on.declineReason ? <><br />Declined: {declineReasonOf(on.declineReason).label}{on.declineNote ? " · " + on.declineNote : ""}</> : null}
										{hasTracking(t) ? <><br />Tracking: {[t.company, t.number].filter(Boolean).join(" ")}</> : null}
									</div>
									<ul className="plan-bullets" style={{ marginTop: 6 }}>
										{(o.lines || []).map((l) => (
											<li key={l.key}>
												{l.qty} x {l.name}
												{l.unmatched ? " (not matched)" : ""}
											</li>
										))}
									</ul>
									<div className="tools" style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
										{canAccept(o) && (
											<button type="button" className="btn gold" id={"accept-" + o.id} disabled={busy} onClick={() => run(() => svc.onlineOrders.accept(o.id))}>
												Accept
											</button>
										)}
										{canFulfill(o) && (
											<button type="button" className="btn gold" id={"fulfill-" + o.id} disabled={busy} onClick={() => setFulfilling({ order: o, fulfil: true })}>
												Fulfill
											</button>
										)}
										{canDecline(o) && (
											<button type="button" className="btn danger" id={"decline-" + o.id} disabled={busy} onClick={() => setDeclining(o)}>
												Decline
											</button>
										)}
										{canPack(o) && (
											<button type="button" className="btn out" disabled={busy} onClick={() => run(() => svc.onlineOrders.printPacking(o.id))}>
												{on.packingPrintedAt ? "Print packing label again" : "Print packing label"}
											</button>
										)}
										{canTrack(o) && (
											<button type="button" className="btn out" disabled={busy} onClick={() => setFulfilling({ order: o, fulfil: false })}>
												{hasTracking(t) ? "Edit tracking" : "Add tracking"}
											</button>
										)}
										{on.customer?.phone && (
											<button type="button" className="btn out" onClick={() => whatsapp(o)}>
												WhatsApp customer
											</button>
										)}
										{link && (
											<a className="btn out" href={link} target="_blank" rel="noreferrer">
												Open in Shopify
											</a>
										)}
									</div>
									<div style={{ marginTop: 8 }}>
										<ShopifyStatus order={o} busy={busy} onRetry={(id) => run(() => svc.onlineOrders.retryShopify(id))} />
									</div>
								</article>
							);
						})}
					</div>
				) : (
					<div className="empty" id="online-orders-empty">
						{orders.length ? "No orders in this view." : "No online orders yet. Orders from your online store will appear here as soon as the store is connected."}
					</div>
				)}
			</Panel>
			<DeclineOrderModal
				order={declining}
				busy={busy}
				onClose={() => setDeclining(null)}
				onDecline={(form) =>
					run(async () => {
						await svc.onlineOrders.decline(declining.id, form);
						setDeclining(null);
					})
				}
			/>
			<FulfillOrderModal
				order={fulfilling?.order}
				fulfil={!!fulfilling?.fulfil}
				busy={busy}
				onClose={() => setFulfilling(null)}
				onSave={(form) =>
					run(async () => {
						await (fulfilling.fulfil ? svc.onlineOrders.fulfill(fulfilling.order.id, form) : svc.onlineOrders.tracking(fulfilling.order.id, form));
						setFulfilling(null);
					})
				}
			/>
		</section>
	);
}
