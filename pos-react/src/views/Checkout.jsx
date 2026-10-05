/**
 * Sales register page: product catalogue (search, categories, product grid) on the left and the current order
 * (lines and totals, with Quick Pay / Pay Now buttons that open the payment popups) on the right.
 */
import { useMemo, useState } from "react";
import { money } from "../domain/format";
import { formatOrderNumber, nextSequence } from "../domain/orders";
import { customerName } from "../domain/names";
import { visibleProductCategories } from "../domain/catalog";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { CategoryRail } from "../components/checkout/CategoryRail";
import { ProductGrid } from "../components/checkout/ProductGrid";
import { CartLines } from "../components/checkout/CartLines";
import { PayPopup } from "../components/checkout/PayPopup";
import { CustomerSection, DiscountSection } from "../components/checkout/CheckoutFields";
import { Modal, ModalBody } from "../components/ui";

// Stroke icons (24px grid) for the order tool boxes.
const TOOL_ICONS = {
	discount: <><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></>,
	split: <><path d="M12 3v6M12 9 5 15M12 9l7 6" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /></>,
	customer: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
	void: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" /></>,
};
const ToolBox = ({ icon, label, onClick, danger, disabled, id }) => (
	<button type="button" id={id} className={"order-tool" + (danger ? " danger" : "")} onClick={onClick} disabled={disabled}>
		<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			{TOOL_ICONS[icon]}
		</svg>
		<span>{label}</span>
	</button>
);

/** Sales register: catalogue on the left, current order on the right. */
export function Checkout() {
	const data = useData();
	const c = useCheckout();
	const { kitchen, currentUser } = usePos();
	const { openProduct } = useModals();
	const openOrders = useFeature("checkout.openOrders");
	const kitchenTickets = useFeature("checkout.kitchenTickets");
	const discounts = useFeature("checkout.discounts");
	const splitBill = useFeature("checkout.splitBill");
	const customerLookup = useFeature("checkout.customerLookup");
	const [tool, setTool] = useState(null); // "discount" | "customer" | null
	const { settings } = data;
	const categories = useMemo(
		() => ["All", ...visibleProductCategories(data.categories, data.products, data.subcategories)].sort((a, b) => a.localeCompare(b)),
		[data.categories, data.products, data.subcategories],
	);
	const category = categories.includes(c.category) ? c.category : "All";
	const q = c.search.trim().toLowerCase();
	const products = useMemo(
		() =>
			data.products.filter(
				(p) => (category === "All" || p.category === category) && (!q || (String(p.name || "") + " " + String(p.code || "") + " " + String(p.category || "")).toLowerCase().includes(q)),
			),
		[data.products, category, q],
	);
	const t = c.totals;
	const [payMode, setPayMode] = useState(null); // "quick" | "full" | null
	const rate = +settings.serviceChargeRate || 0;
	// Order details: a saved order keeps its number (it becomes the receipt number on payment), a new one gets the next.
	const saved = data.openOrders.find((o) => o.id === c.openOrderId && o.status === "open");
	const orderNo = saved?.orderNumber || formatOrderNumber(nextSequence(data.meta, data.sales, data.openOrders));
	const ref = c.orderReference.trim();
	const isTable = /^table\b/i.test(ref);
	const info = [
		[isTable ? "Table" : "Reference", ref ? (isTable ? ref.replace(/^table\s*/i, "") : ref) : "—"],
		["Order no.", orderNo],
		["Receipt no.", orderNo],
		kitchen && ["Channel", c.orderChannel],
		["Served by", currentUser?.name || "—"],
		["Customer", c.customerId ? customerName(data.customers, c.customerId) : "Walk-in"],
		saved && ["Opened", new Date(saved.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
		saved && kitchen && ["Kitchen", saved.kitchenSentAt ? "Sent" : "Not sent"],
	].filter(Boolean);

	return (
		<section className="view active" id="view-checkout">
			<div className="layout">
				<div className="panel">
					<div className="panel-head">
						<div className="checkout-business-brand" id="checkout-business-brand">
							{settings.logo && <img className="checkout-business-logo" id="checkout-business-logo" alt={settings.business + " logo"} src={settings.logo} />}
							<div className="checkout-business-copy">
								<strong id="checkout-business-name">{settings.business || "My Business"}</strong>
								<span>New Sale</span>
							</div>
						</div>
						<div className="tools">
							<input className="input" id="product-search" placeholder="Search products" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
							<button className="btn out" onClick={() => openProduct("")}>
								+ Product
							</button>
						</div>
					</div>
					<CategoryRail categories={categories} active={category} onSelect={c.setCategory} />
					<ProductGrid products={products} />
				</div>
				<aside className="panel cart">
					<div className="panel-head">
						<div className="panel-title">Current Order</div>
						<div id="order-actions" className="tools">
							{openOrders && (
								<button className="btn out" id="save-order-btn" onClick={() => c.saveOrder(false)}>
									Save Order
								</button>
							)}
							{kitchen && kitchenTickets && (
								<button className="btn gold" id="send-kitchen-btn" onClick={() => c.saveOrder(true)}>
									Send to Kitchen
								</button>
							)}
						</div>
					</div>
					<dl className="order-info" id="order-info">
						{info.map(([k, v]) => (
							<div key={k}>
								<dt>{k}</dt>
								<dd>{v}</dd>
							</div>
						))}
					</dl>
					<CartLines />
					<div className="cart-foot">
						<div className="row">
							<span>Items</span>
							<span id="cart-count">{t.count}</span>
						</div>
						<div className="row subtotal-summary">
							<span>Subtotal</span>
							<span id="cart-subtotal">{money(t.subtotal)}</span>
						</div>
						<div className="row discount-summary" hidden={!t.discount}>
							<span>Discount</span>
							<span id="cart-discount">- {money(t.discount)}</span>
						</div>
						<div className="row service-charge-summary" hidden={!t.service}>
							<span id="cart-service-label">Service charge ({rate}%)</span>
							<span id="cart-service-charge">{money(t.service)}</span>
						</div>
						<div className="row grand">
							<span>Total</span>
							<span id="cart-total">{money(t.total)}</span>
						</div>
						<div className="order-tools" id="order-tools">
							{discounts && <ToolBox id="tool-discount" icon="discount" label="Discount" disabled={!c.cart.length} onClick={() => setTool("discount")} />}
							{splitBill && <ToolBox id="tool-split" icon="split" label="Split Order" disabled={!c.cart.length} onClick={() => c.setSplitOpen(true)} />}
							{customerLookup && <ToolBox id="tool-customer" icon="customer" label="Customer" onClick={() => setTool("customer")} />}
							<ToolBox id="tool-void" icon="void" label="Void Order" danger disabled={!c.cart.length} onClick={c.voidOrder} />
						</div>
						<div className="pay-actions">
							<button className="btn out" id="quick-pay-btn" type="button" onClick={() => setPayMode("quick")} disabled={!c.cart.length || c.busy}>
								Quick Pay
							</button>
							<button className="btn gold" id="pay-now-btn" type="button" onClick={() => setPayMode("full")} disabled={!c.cart.length || c.busy}>
								Pay Now<span className="complete-amount"> · {money(t.total)}</span>
							</button>
						</div>
					</div>
				</aside>
			</div>
			<Modal id="order-tool-modal" open={!!tool} title={tool === "discount" ? "Order Discount" : "Customer"} onClose={() => setTool(null)} footer={<button className="btn gold" onClick={() => setTool(null)}>Done</button>}>
				<ModalBody>{tool === "discount" ? <DiscountSection /> : <CustomerSection />}</ModalBody>
			</Modal>
			<PayPopup mode={payMode} onClose={() => setPayMode(null)} />
		</section>
	);
}
