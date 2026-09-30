import { useMemo } from "react";
import { money } from "../domain/format";
import { visibleProductCategories } from "../domain/catalog";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { useModals } from "../store/ModalsProvider";
import { usePos } from "../store/PosProvider";
import { CategoryRail } from "../components/checkout/CategoryRail";
import { ProductGrid } from "../components/checkout/ProductGrid";
import { CartLines } from "../components/checkout/CartLines";
import { CheckoutFields } from "../components/checkout/CheckoutFields";

/** Sales register: catalogue on the left, current order on the right. */
export function Checkout() {
	const data = useData();
	const c = useCheckout();
	const { kitchen } = usePos();
	const { openProduct } = useModals();
	const openOrders = useFeature("checkout.openOrders");
	const kitchenTickets = useFeature("checkout.kitchenTickets");
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
	const rate = +settings.serviceChargeRate || 0;

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
							<button className="btn danger" onClick={c.voidOrder}>
								Void Order
							</button>
						</div>
					</div>
					<CartLines />
					<div className="cart-foot">
						<CheckoutFields />
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
						<button className="btn gold" id="complete-btn" style={{ width: "100%", marginTop: 10 }} onClick={c.completeSale} disabled={!c.cart.length || c.busy}>
							Complete Sale
						</button>
					</div>
				</aside>
			</div>
		</section>
	);
}
