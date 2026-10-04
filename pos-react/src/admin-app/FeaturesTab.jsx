import { useMemo, useState } from "react";
import { FEATURES, FEATURE_GROUPS, FEATURE_MAP, defaultFeatureFlags, dependentsOf, resolveFeatures } from "../config/features";
import { Switch } from "../components/ui";

export function FeaturesTab({ settings, locations, save, saving, ui }) {
	const [scope, setScope] = useState("business");
	const [base, setBase] = useState({ ...defaultFeatureFlags(), ...(settings.features || {}) });
	const [byLoc, setByLoc] = useState(() => JSON.parse(JSON.stringify(settings.locationFeatures || {})));
	const [q, setQ] = useState("");
	const [group, setGroup] = useState("all");
	const isBusiness = scope === "business";
	const override = isBusiness ? {} : byLoc[scope] || {};
	const effective = useMemo(() => resolveFeatures({ ...base, ...override }), [base, override]);
	const setBaseFlag = async (f, on) => {
		if (f.core) return;
		if (!on) {
			const deps = dependentsOf(f.id).filter((id) => base[id] && !FEATURE_MAP[id].core);
			if (deps.length && !(await ui.confirm(`Turning off “${f.label}” also disables: ${deps.map((id) => FEATURE_MAP[id].label).join(", ")}. Continue?`))) return;
		}
		setBase((b) => ({ ...b, [f.id]: on }));
	};
	const setLocFlag = (id, value) =>
		setByLoc((m) => {
			const cur = { ...(m[scope] || {}) };
			if (value === "inherit") delete cur[id];
			else cur[id] = value === "on";
			const next = { ...m, [scope]: cur };
			if (!Object.keys(cur).length) delete next[scope];
			return next;
		});
	const dirty = JSON.stringify(base) !== JSON.stringify({ ...defaultFeatureFlags(), ...(settings.features || {}) }) || JSON.stringify(byLoc) !== JSON.stringify(settings.locationFeatures || {});
	const needle = q.trim().toLowerCase();
	const visible = FEATURES.filter((f) => (group === "all" || f.group === group) && (!needle || (f.label + f.description + f.id).toLowerCase().includes(needle)));
	const locName = locations.find((l) => l.id === scope)?.name;

	return (
		<div>
			<section className="admin-toolbar">
				<select className="input" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Scope">
					<option value="business">All locations (business default)</option>
					{locations.map((l) => (
						<option key={l.id} value={l.id}>
							Location: {l.name}
						</option>
					))}
				</select>
				<input className="input" placeholder="Search features…" value={q} onChange={(e) => setQ(e.target.value)} />
				<select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
					<option value="all">All groups</option>
					{FEATURE_GROUPS.map((g) => (
						<option key={g.id} value={g.id}>
							{g.label}
						</option>
					))}
				</select>
				{isBusiness && (
					<div className="admin-bulk">
						<button className="btn out" onClick={() => setBase(defaultFeatureFlags())}>Reset defaults</button>
					</div>
				)}
			</section>
			{!isBusiness && (
				<div className="print-note" style={{ marginBottom: 12 }}>
					Overrides for <strong>{locName}</strong> only. “Inherit” follows the business default; On/Off forces the feature for this location.
				</div>
			)}
			{FEATURE_GROUPS.filter((g) => visible.some((f) => f.group === g.id)).map((g) => (
				<section className="admin-group" key={g.id}>
					<div className="admin-group-head">
						<h2>
							<span aria-hidden="true">{g.icon}</span> {g.label}
						</h2>
					</div>
					<div className="admin-grid">
						{visible
							.filter((f) => f.group === g.id)
							.map((f) => {
								const on = effective.enabled[f.id];
								const blocked = effective.blockedBy[f.id];
								const ov = override[f.id];
								return (
									<div className={"admin-feature" + (on ? " is-on" : "")} key={f.id}>
										<div className="admin-feature-copy">
											<strong>
												{f.label}
												{f.core && <span className="badge">Required</span>}
												{!isBusiness && ov !== undefined && <span className="badge admin-dirty">Override</span>}
											</strong>
											<span>{f.description}</span>
											{blocked && base[f.id] !== false && <small className="admin-warning">Inactive: needs {blocked.map((id) => FEATURE_MAP[id].label).join(", ")}</small>}
											<code>{f.id}</code>
										</div>
										{isBusiness ? (
											<Switch checked={!!base[f.id]} onChange={(v) => setBaseFlag(f, v)} disabled={f.core} label={f.label} />
										) : (
											<div className="tri" role="group" aria-label={f.label}>
												{["inherit", "on", "off"].map((v) => (
													<button key={v} type="button" disabled={f.core} className={(ov === undefined ? "inherit" : ov ? "on" : "off") === v ? "sel " + v : ""} onClick={() => setLocFlag(f.id, v)}>
														{v === "inherit" ? "Inherit" : v === "on" ? "On" : "Off"}
													</button>
												))}
											</div>
										)}
									</div>
								);
							})}
					</div>
				</section>
			))}
			<footer className="admin-savebar">
				<span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
				<div>
					<button
						className="btn out"
						disabled={!dirty}
						onClick={() => {
							setBase({ ...defaultFeatureFlags(), ...(settings.features || {}) });
							setByLoc(JSON.parse(JSON.stringify(settings.locationFeatures || {})));
						}}
					>
						Discard
					</button>
					<button className="btn gold" disabled={!dirty || saving} onClick={() => save({ features: base, locationFeatures: byLoc }, "Feature switches updated")}>
						Save features
					</button>
				</div>
			</footer>
		</div>
	);
}
