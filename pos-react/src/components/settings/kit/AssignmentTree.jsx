/**
 * Checkbox tree for assigning items: groups (categories), optionally with subgroups (subcategories), each with its items. Ticking a group
 * or subgroup ticks every item under it; a partly ticked one shows a grey dash. `groups` is
 * [{ key, name, items: [{ id, name, note }], subgroups?: [{ key, name, items }] }]; `selected` is a Set of item ids.
 */
import { useEffect, useRef, useState } from "react";

function GroupBox({ checked, some, onChange, label }) {
	const ref = useRef(null);
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = some && !checked;
	}, [some, checked]);
	return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />;
}

const byTerm = (items, term) => (term ? items.filter((i) => i.name.toLowerCase().includes(term)) : items);

export function AssignmentTree({ groups, selected, onChange, searchLabel = "Search items" }) {
	const [q, setQ] = useState("");
	const term = q.trim().toLowerCase();
	const shown = groups
		.map((g) => ({ ...g, items: byTerm(g.items, term), subgroups: (g.subgroups || []).map((sg) => ({ ...sg, items: byTerm(sg.items, term) })).filter((sg) => sg.items.length) }))
		.filter((g) => g.items.length || g.subgroups.length);
	const toggle = (ids, on) => {
		const next = new Set(selected);
		ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
		onChange(next);
	};
	const itemList = (items) => (
		<ul>
			{items.map((i) => (
				<li key={i.id}>
					<label>
						<input type="checkbox" checked={selected.has(i.id)} onChange={(e) => toggle([i.id], e.target.checked)} />
						<span>{i.name}</span>
						{i.note && <span className="muted">{i.note}</span>}
					</label>
				</li>
			))}
		</ul>
	);
	const branch = (node, ids, className, children) => {
		const count = ids.filter((id) => selected.has(id)).length;
		return (
			<details key={node.key} className={className} open={!!term || count > 0}>
				<summary>
					<GroupBox checked={count === ids.length} some={count > 0} label={"Select all in " + node.name} onChange={(on) => toggle(ids, on)} />
					<span>{node.name}</span>
					<span className="muted">
						{count}/{ids.length}
					</span>
				</summary>
				{children}
			</details>
		);
	};
	return (
		<div className="sk-tree">
			<input className="input" type="search" placeholder={searchLabel} aria-label={searchLabel} value={q} onChange={(e) => setQ(e.target.value)} />
			{!shown.length && <p className="muted">{groups.length ? "No items match." : "There are no items yet."}</p>}
			{shown.map((g) => {
				const ids = [...g.items, ...g.subgroups.flatMap((sg) => sg.items)].map((i) => i.id);
				return branch(
					g,
					ids,
					"sk-tree-group",
					<>
						{itemList(g.items)}
						{g.subgroups.map((sg) =>
							branch(
								sg,
								sg.items.map((i) => i.id),
								"sk-tree-group sk-tree-sub",
								itemList(sg.items),
							),
						)}
					</>,
				);
			})}
		</div>
	);
}
