/**
 * Shop (admin portal): the POS hardware Ceylonry supplies. Each category opens a quote email; prices are agreed on request.
 */
import { SHOP_CATEGORIES, SHOP_EMAIL, quoteLink } from "../config/shop";
import { useData } from "../store/DataProvider";

export function Shop() {
	const { settings } = useData();
	const business = settings.business || "";
	return (
		<section className="view active" id="view-shop">
			<div className="dashboard-toolbar">
				<div>
					<div className="panel-title">Shop</div>
					<div className="muted">One stop to buy hardware for your POS. Choose a category to ask Ceylonry for a quote.</div>
				</div>
				<a className="btn gold" id="shop-quote-all" href={quoteLink({ business })}>
					Request a quote
				</a>
			</div>
			<div className="reports-hub" id="shop-grid">
				{SHOP_CATEGORIES.map((c) => (
					<a key={c.key} className="report-box" data-shop={c.key} href={quoteLink({ business, category: c.title })}>
						<span className="report-box-icon" aria-hidden="true">{c.icon}</span>
						<strong>{c.title}</strong>
						<span className="muted">{c.blurb}</span>
						<small>{c.works}</small>
					</a>
				))}
			</div>
			<div className="report-note">Prices, delivery and availability are confirmed by Ceylonry after your request. You can also write to {SHOP_EMAIL}.</div>
		</section>
	);
}
