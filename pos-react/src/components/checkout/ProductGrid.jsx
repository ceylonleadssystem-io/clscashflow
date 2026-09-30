import { useMemo } from "react";
import { money } from "../../domain/format";
import { availableProductStock } from "../../domain/inventory";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { useCheckout } from "../../store/CheckoutProvider";
import { usePos } from "../../store/PosProvider";

/** Sellable product tiles for the active category / search. */
export function ProductGrid({ products }) {
	const data = useData();
	const { addProduct } = useCheckout();
	const { locationId } = usePos();
	const stockGuard = useFeature("checkout.stockGuard") && useFeature("inventory.productStock");
	const stock = useMemo(() => {
		if (!stockGuard) return {};
		const out = {};
		products.forEach((p) => {
			const a = availableProductStock(p, data.inventory, locationId);
			if (Number.isFinite(a)) out[p.id] = a;
		});
		return out;
	}, [products, data.inventory, locationId, stockGuard]);

	return (
		<div className="products" id="product-grid">
			{products.map((p) => {
				const available = stock[p.id];
				const limited = available !== undefined;
				return (
					<button
						type="button"
						key={p.id}
						className={"product" + (limited && available <= 0 ? " out-of-stock" : "")}
						disabled={limited && available <= 0}
						aria-disabled={limited ? String(available <= 0) : undefined}
						data-stock={limited ? String(available) : undefined}
						onClick={() => addProduct(p.id)}
					>
						{p.image ? (
							<img
								className="product-img"
								src={p.image}
								alt=""
								style={{
									objectFit: p.imageFit || "cover",
									objectPosition: `${p.imagePositionX ?? 50}% ${p.imagePositionY ?? 50}%`,
								}}
							/>
						) : (
							<div className="product-placeholder">◇</div>
						)}
						<span className="product-copy">
							<span>
								<strong>{p.name}</strong>
								<br />
								<small className="muted">
									{p.category} · {p.code}
								</small>
							</span>
							<span className="price">{money(p.price)}</span>
							{limited && <small className="muted stock-available">{available > 0 ? available + " in stock" : "Out of stock"}</small>}
						</span>
					</button>
				);
			})}
			{!products.length && <div className="empty">No products found in this category.</div>}
		</div>
	);
}
