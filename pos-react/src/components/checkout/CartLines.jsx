/**
 * Checkout cart list: the order lines with images, modifiers, quantity +/- buttons and an
 * "Edit modifiers" link. Scrolls to the newest line when one is added.
 */
import { useEffect, useRef } from "react";
import { money } from "../../domain/format";
import { useCheckout } from "../../store/CheckoutProvider";

/** Order lines with quantity controls. Scrolls to the newest line. */
export function CartLines() {
	const { cart, changeLineQty, setPicker } = useCheckout();
	const ref = useRef(null);
	const last = useRef(0);
	useEffect(() => {
		if (cart.length > last.current) requestAnimationFrame(() => ref.current && (ref.current.scrollTop = ref.current.scrollHeight));
		last.current = cart.length;
	}, [cart.length]);
	return (
		<div className="cart-list" id="cart-list" ref={ref}>
			{cart.map((line) => (
				<div className="line" key={line.key}>
					{line.image ? <img className="cart-line-image" src={line.image} alt="" /> : <span className="cart-line-placeholder" aria-hidden="true">◇</span>}
					<div className="cart-line-copy">
						<strong>{line.name}</strong>
						{(line.modifiers || []).length > 0 && (
							<>
								<div className="line-modifiers">
									{line.modifiers.map((m, i) => (
										<span key={i}>
											{m.groupName + ": " + m.optionName + (m.price ? " (+" + money(m.price) + ")" : "")}
											{i < line.modifiers.length - 1 && <br />}
										</span>
									))}
								</div>
								<button className="line-edit" onClick={() => setPicker({ productId: line.productId, lineKey: line.key })}>
									Edit modifiers
								</button>
							</>
						)}
						<div className="muted">{money(line.price * line.qty)}</div>
					</div>
					<div className="qty">
						<button onClick={() => changeLineQty(line.key, -1)}>-</button>
						{line.qty}
						<button onClick={() => changeLineQty(line.key, 1)}>+</button>
					</div>
				</div>
			))}
			{!cart.length && <div className="empty">Select a product to begin.</div>}
		</div>
	);
}
