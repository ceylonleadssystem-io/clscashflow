/**
 * Checkout product tiles for the active category or search, with images, prices and live stock
 * levels (out-of-stock items are disabled when the stock guard is on).
 */
import { useMemo } from "react";
import { money } from "../../domain/format";
import { availableProductStock, recipeShortfall } from "../../domain/inventory";
import { resolveOptions } from "../../domain/systemOptions";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { useCheckout } from "../../store/CheckoutProvider";
import { usePos } from "../../store/PosProvider";

/** Sellable product tiles for the active category / search. */
export function ProductGrid({ products }) {
	const data = useData();
	const { addProduct, cart } = useCheckout();
	const { locationId } = usePos();
	// Settings > System Options > Order Entry: prices on the buttons
	const showPrices = resolveOptions(data.settings, "orderEntry", locationId).showPrices;
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

	// items whose ingredients cannot cover one more of them (with what this order already uses) cannot be tapped
	const recipes = useFeature("inventory.recipes");
	const short = useMemo(() => {
		if (!recipes) return {};
		const out = {};
		products.forEach((p) => {
			const s = recipeShortfall(p, cart, data.products, data.inventory, 1);
			if (s) out[p.id] = s.i.name;
		});
		return out;
	}, [recipes, products, cart, data.products, data.inventory]);

	return (
		<div className="products" id="product-grid">
			{products.map((p) => {
				const available = stock[p.id];
				const limited = available !== undefined;
				const noIngredient = short[p.id];
				return (
					<button
						type="button"
						key={p.id}
						className={"product" + ((limited && available <= 0) || noIngredient ? " out-of-stock" : "")}
						disabled={(limited && available <= 0) || !!noIngredient}
						aria-disabled={limited || noIngredient ? String((limited && available <= 0) || !!noIngredient) : undefined}
						title={noIngredient ? "Not enough " + noIngredient : undefined}
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
							{showPrices && <span className="price">{money(p.price)}</span>}
							{noIngredient ? (
								<small className="muted stock-available">Not enough {noIngredient}</small>
							) : (
								limited && <small className="muted stock-available">{available > 0 ? available + " in stock" : "Out of stock"}</small>
							)}
						</span>
					</button>
				);
			})}
			{!products.length && <div className="empty">No products found in this category.</div>}
		</div>
	);
}
