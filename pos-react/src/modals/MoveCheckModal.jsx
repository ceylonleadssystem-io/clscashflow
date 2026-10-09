/**
 * Move / merge dialog for an open check: move it to a free table, or merge it into another table's check or
 * into any other open order.
 */
import { money } from "../domain/format";
import { orderTotal } from "../domain/orders";
import { layoutFor, locationOrders, moveTargets, normalizeTable, tableReference } from "../domain/tables";
import { Modal, ModalBody } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";

/** Pick where an open check goes: a free table (move) or another check (merge). */
export function MoveCheckModal({ order, onClose }) {
	const data = useData();
	const ui = useUi();
	const { svc, locationId } = usePos();
	if (!order) return null;
	const tables = layoutFor(data.settings, locationId).map(normalizeTable);
	const targets = moveTargets(order, tables, locationOrders(data.openOrders, locationId));
	const label = (o) => o.orderReference || o.orderNumber;

	const choose = async (t) => {
		if (!t.into) {
			await svc.sales.transferOpenOrder(order.id, tableReference(t.table));
		} else {
			const ok = await ui.confirm("Merge " + label(order) + " into " + label(t.into) + "? Items are combined and " + label(order) + " is closed.");
			if (!ok) return;
			await svc.sales.mergeOpenOrders(order.id, t.into.id);
		}
		onClose();
	};

	return (
		<Modal id="move-check-modal" open title={"Move or merge " + label(order)} subtitle={"Check total " + money(orderTotal(order))} onClose={onClose} boxStyle={{ width: "min(560px,100%)" }}>
			<ModalBody>
				<div style={{ display: "grid", gap: 8 }}>
					{targets.map((t) => (
						<button key={t.into?.id || t.table.id} className="btn out" style={{ textAlign: "left" }} onClick={() => choose(t)}>
							<strong>{t.kind === "table" ? "Table " + t.table.number : label(t.into)}</strong>
							{" · "}
							{t.into ? "Merge into this check (" + money(orderTotal(t.into)) + ")" : "Move here (free)"}
						</button>
					))}
					{!targets.length && <div className="muted">No other tables or open checks to move to.</div>}
				</div>
			</ModalBody>
		</Modal>
	);
}
