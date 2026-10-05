/**
 * Checkout category chips: a horizontally scrolling rail with previous/next buttons, wheel and
 * arrow-key support, keeping the active chip in view.
 */
import { useEffect, useRef, useState } from "react";

/** Horizontally scrolling category chips with previous/next buttons. */
export function CategoryRail({ categories, active, onSelect, id = "categories", label = "Product categories", prev = "Previous categories", next = "Next categories", className = "" }) {
	const ref = useRef(null);
	const [edges, setEdges] = useState({ start: true, end: true });
	const update = () => {
		const el = ref.current;
		if (!el) return;
		const max = Math.max(0, el.scrollWidth - el.clientWidth);
		setEdges({ start: el.scrollLeft < 3, end: el.scrollLeft > max - 3 });
	};
	useEffect(() => {
		update();
		const el = ref.current;
		if (!el) return undefined;
		const ro = window.ResizeObserver ? new ResizeObserver(update) : null;
		ro?.observe(el);
		const active = el.querySelector(".chip.active");
		active?.scrollIntoView({ block: "nearest", inline: "nearest" });
		return () => ro?.disconnect();
	}, [categories, active]);

	const scroll = (dir) => {
		const el = ref.current;
		el.scrollBy({ left: dir * Math.max(180, Math.round(el.clientWidth * 0.72)), behavior: "smooth" });
	};
	const onWheel = (e) => {
		if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		ref.current.scrollLeft += e.deltaY;
	};
	const onKeyDown = (e) => {
		if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
		const chips = Array.from(ref.current.querySelectorAll(".chip"));
		const current = chips.indexOf(document.activeElement);
		const step = e.key === "ArrowRight" ? 1 : -1;
		const i = Math.min(chips.length - 1, Math.max(0, (current < 0 ? 0 : current) + step));
		if (chips[i]) {
			e.preventDefault();
			chips[i].focus();
			chips[i].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
		}
	};
	return (
		<div className={"category-rail " + className} aria-label={label}>
			<button type="button" className="category-scroll btn out" aria-label={prev} disabled={edges.start} onClick={() => scroll(-1)}>
				&#8249;
			</button>
			<div className="cats" id={id} ref={ref} onScroll={update} onWheel={onWheel} onKeyDown={onKeyDown}>
				{categories.map((name) => (
					<button type="button" key={name} className={"chip " + (name === active ? "active" : "")} data-category={name} onClick={() => onSelect(name)}>
						{name}
					</button>
				))}
			</div>
			<button type="button" className="category-scroll btn out" aria-label={next} disabled={edges.end} onClick={() => scroll(1)}>
				&#8250;
			</button>
		</div>
	);
}
