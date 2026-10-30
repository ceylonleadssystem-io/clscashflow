/**
 * Checkbox tree for assigning items: groups (categories) with their items. Ticking a group ticks all of its items; a partly ticked group
 * shows the dash. `groups` is [{ key, name, items: [{ id, name, note }] }]; `selected` is a Set of item ids.
 */
import { useEffect, useRef, useState } from "react";

function GroupBox({ checked, some, onChange, label }) {
	const ref = useRef(null);
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = some && !checked;
	}, [some, checked]);
	return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />;
}

export function AssignmentTree({ groups, selected, onChange, searchLabel = "Search items" }) {
	const [q, setQ] = useState("");
	const term = q.trim().toLowerCase();
	const shown = groups.map((g) => ({ ...g, items: term ? g.items.filter((i) => i.name.toLowerCase().includes(term)) : g.items })).filter((g) => g.items.length);
	const toggle = (ids, on) => {
		const next = new Set(selected);
		ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
		onChange(next);
	};
	return (
		<div className="sk-tree">
			<input className="input" type="search" placeholder={searchLabel} aria-label={searchLabel} value={q} onChange={(e) => setQ(e.target.value)} />
			{!shown.length && <p className="muted">{groups.length ? "No items match." : "There are no items yet."}</p>}
			{shown.map((g) => {
				const ids = g.items.map((i) => i.id);
				const count = ids.filter((id) => selected.has(id)).length;
				return (
					<details key={g.key} className="sk-tree-group" open={!!term || count > 0}>
						<summary>
							<GroupBox checked={count === ids.length} some={count > 0} label={"Select all in " + g.name} onChange={(on) => toggle(ids, on)} />
							<span>{g.name}</span>
							<span className="muted">
								{count}/{ids.length}
							</span>
						</summary>
						<ul>
							{g.items.map((i) => (
								<li key={i.id}>
									<label>
										<input type="checkbox" checked={selected.has(i.id)} onChange={(e) => toggle([i.id], e.target.checked)} />
										<span>{i.name}</span>
										{i.note && <span className="muted">{i.note}</span>}
									</label>
								</li>
							))}
						</ul>
					</details>
				);
			})}
		</div>
	);
}
