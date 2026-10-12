/**
 * Checklist of POS features grouped like the Features tab. `off` is the list of feature ids a plan excludes;
 * ticking a box means the feature is included, clearing it adds the id to `off`. Required (core) features cannot be cleared.
 */
import { FEATURES, FEATURE_GROUPS } from "../config/features";

export function FeatureChecklist({ off, onChange, readOnly = false }) {
	const isOff = new Set(off);
	const toggle = (id, included) => onChange(included ? off.filter((x) => x !== id) : [...off, id]);
	return (
		<div className="plan-features">
			{FEATURE_GROUPS.map((g) => {
				const items = FEATURES.filter((f) => f.group === g.id && !f.core);
				if (!items.length) return null;
				return (
					<details key={g.id} open={items.some((f) => isOff.has(f.id))}>
						<summary>
							<span aria-hidden="true">{g.icon}</span> {g.label} <span className="muted">({items.filter((f) => !isOff.has(f.id)).length}/{items.length} included)</span>
						</summary>
						<div className="plan-feature-list">
							{items.map((f) => (
								<label key={f.id} className={"plan-feature" + (isOff.has(f.id) ? " is-off" : "")} title={f.description}>
									<input type="checkbox" checked={!isOff.has(f.id)} disabled={readOnly} onChange={(e) => toggle(f.id, e.target.checked)} /> {f.label}
								</label>
							))}
						</div>
					</details>
				);
			})}
		</div>
	);
}

/** Labels of the features a plan excludes, for a short read-only summary. */
export const offLabels = (off) => off.map((id) => FEATURES.find((f) => f.id === id)?.label).filter(Boolean);
