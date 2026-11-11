/**
 * Which locations (branches) sell something: "All locations", or a choice of branches. `value` is the list of chosen location ids, empty for all
 * locations; ticking every branch is the same as all locations and is saved as an empty list. At least one branch stays ticked.
 */
export function LocationChecks({ value, locations, onChange }) {
	const ids = locations.map((l) => String(l.id));
	const chosen = value.filter((id) => ids.includes(id));
	const all = chosen.length === 0 || chosen.length === ids.length;
	const toggle = (id) => {
		const base = all ? ids : chosen;
		const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
		if (!next.length) return;
		onChange(next.length === ids.length ? [] : next);
	};
	return (
		<div className="sk-checks">
			<label>
				<input type="checkbox" checked={all} onChange={(e) => onChange(e.target.checked ? [] : ids.slice(0, 1))} />
				<span>All locations</span>
			</label>
			{locations.map((l) => (
				<label key={l.id}>
					<input type="checkbox" checked={all || chosen.includes(String(l.id))} disabled={all} onChange={() => toggle(String(l.id))} />
					<span>{l.name}</span>
				</label>
			))}
		</div>
	);
}
