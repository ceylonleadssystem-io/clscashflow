/**
 * Modifier groups page: list, add, edit and delete groups (keeping the current order consistent after a delete).
 */
import { useState } from "react";
import { money } from "../domain/format";
import { Panel } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { usePos } from "../store/PosProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { ModifierModal } from "../modals/ModifierModal";

/** Modifier groups (sizes, flavours, add-ons, extra charges). */
export function Modifiers() {
	const data = useData();
	const { svc } = usePos();
	const { setCart } = useCheckout();
	const presets = useFeature("modifiers.commonPresets");
	const [editing, setEditing] = useState(null); // null | "" | id

	const remove = async (id) => {
		const deleted = await svc.catalog.deleteModifier(id);
		if (!deleted) return;
		// keep the current order consistent (legacy behaviour)
		setCart((cart) =>
			cart.map((line) => {
				const modifiers = (line.modifiers || []).filter((s) => s.groupId !== id);
				const price = (+line.basePrice || +line.price || 0) + modifiers.reduce((t, s) => t + (+s.price || 0), 0);
				return { ...line, modifiers, price, key: line.productId + "|" + modifiers.map((s) => s.groupId + ":" + s.optionName).sort().join("|") };
			}),
		);
	};

	return (
		<section className="view active" id="view-modifiers">
			<Panel
				title="Modifier Groups"
				subtitle="Sizes, flavours, add-ons and extra charges"
				actions={
					<div className="tools">
						{presets && (
							<button className="btn out" onClick={() => svc.catalog.addCommonModifiers()}>
								Add Common Modifiers
							</button>
						)}
						<button className="btn" onClick={() => setEditing("")}>
							+ Add Modifier Group
						</button>
					</div>
				}
			>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Group</th>
								<th>Selection</th>
								<th>Options</th>
								<th>Used By</th>
								<th></th>
							</tr>
						</thead>
						<tbody id="modifier-table">
							{data.modifiers.map((m) => (
								<tr key={m.id}>
									<td>
										<strong>{m.name}</strong>
									</td>
									<td>
										{m.mode === "multiple" ? "Multiple" : "One option"} · {m.required === false ? "Optional" : "Required"}
									</td>
									<td>{m.options.map((o) => o.name + (o.price ? " (+" + money(o.price) + ")" : "")).join(", ")}</td>
									<td>{data.products.filter((p) => (p.modifierIds || []).includes(m.id)).length} items</td>
									<td>
										<div className="table-actions">
											<button className="btn out" onClick={() => setEditing(m.id)}>
												Edit
											</button>
											<button className="btn danger" onClick={() => remove(m.id)}>
												Delete
											</button>
										</div>
									</td>
								</tr>
							))}
							{!data.modifiers.length && (
								<tr>
									<td colSpan="5">No modifier groups yet. Choose “Add Common Modifiers” for a ready-made set, or create your own.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Panel>
			<ModifierModal id={editing} open={editing !== null} onClose={() => setEditing(null)} />
		</section>
	);
}
