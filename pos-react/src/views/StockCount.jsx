import { useMemo, useState } from "react";
import { locationStock } from "../domain/inventory";
import { NumberInput } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

/** Phone-friendly stock count page (opened from the QR code). */
export function StockCount() {
	const data = useData();
	const { svc, locationId, currentUser } = usePos();
	const [q, setQ] = useState("");
	const [counts, setCounts] = useState({});
	const [saved, setSaved] = useState({});
	const items = useMemo(() => {
		const s = q.trim().toLowerCase();
		return data.inventory.filter((i) => !s || (i.name + " " + (i.sku || "")).toLowerCase().includes(s)).slice(0, 40);
	}, [data.inventory, q]);
	const loc = locationId === "all" ? "" : locationId;
	const save = async (item) => {
		if (await svc.inventory.adjustStock(item.id, String(counts[item.id] ?? "").replace(/,/g, ""), "Stock count correction", "Phone count")) {
			setSaved((x) => ({ ...x, [item.id]: true }));
			setCounts((c) => ({ ...c, [item.id]: "" }));
		}
	};
	return (
		<div className="count-page">
			<header>
				<strong>Stock count</strong>
				<span>{currentUser?.name}</span>
				<a className="btn out" href="#/">
					Open POS
				</a>
			</header>
			<input className="input" placeholder="Search item or SKU…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
			<div className="count-list">
				{items.map((i) => (
					<div className="count-row" key={i.id}>
						<div>
							<strong>{i.name}</strong>
							<small>
								{i.sku || "—"} · now {locationStock(i, loc)} {i.unit}
								{saved[i.id] ? " · ✓ saved" : ""}
							</small>
						</div>
						<NumberInput value={counts[i.id] ?? ""} onChange={(v) => setCounts((c) => ({ ...c, [i.id]: v }))} placeholder="Counted" />
						<button className="btn gold" disabled={(counts[i.id] ?? "") === ""} onClick={() => save(i)}>
							Save
						</button>
					</div>
				))}
				{!items.length && <div className="empty">No matching stock items.</div>}
			</div>
		</div>
	);
}
