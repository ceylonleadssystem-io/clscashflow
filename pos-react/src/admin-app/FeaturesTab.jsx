import { useMemo, useState } from "react";
import { FEATURES, FEATURE_GROUPS, FEATURE_MAP, defaultFeatureFlags, dependentsOf, resolveFeatures } from "../config/features";
import { Switch } from "../components/ui";
import { FEATURE_PRESETS, FEATURE_PRESET_MAP, presetFlags } from "../config/featurePresets";

export function FeaturesTab({ settings, locations, save, saving, ui }) {
	const [scope, setScope] = useState("business");
	const [base, setBase] = useState({ ...defaultFeatureFlags(), ...(settings.features || {}) });
	const [byLoc, setByLoc] = useState(() => JSON.parse(JSON.stringify(settings.locationFeatures || {})));
	const [q, setQ] = useState("");
	const [group, setGroup] = useState("all");
	const [category, setCategory] = useState(settings.businessCategory || "");
	const [peek, setPeek] = useState("");
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
	const toggleCategory = async (p, on) => {
		if (!on) return setCategory("");
		const next = presetFlags(p, FEATURES);
		const lost = FEATURES.filter((f) => base[f.id] && !next[f.id]);
		if (lost.length && !(await ui.confirm(`Applying “${p.label}” turns off ${lost.length} feature${lost.length > 1 ? "s" : ""} that ${lost.length > 1 ? "are" : "is"} currently on: ${lost.map((f) => f.label).join(", ")}. Continue?`))) return;
		setBase(next);
		setCategory(p.id);
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
	const dirty = JSON.stringify(base) !== JSON.stringify({ ...defaultFeatureFlags(), ...(settings.features || {}) }) || JSON.stringify(byLoc) !== JSON.stringify(settings.locationFeatures || {}) || category !== (settings.businessCategory || "");
	const needle = q.trim().toLowerCase();
	const visible = FEATURES.filter((f) => (group === "all" || f.group === group) && (!needle || (f.label + f.description + f.id).toLowerCase().includes(needle)));
	const shownPreset = FEATURE_PRESET_MAP[peek || category];
	const shownOff = shownPreset ? FEATURES.filter((f) => !presetFlags(shownPreset, FEATURES)[f.id]) : [];
	const locName = locations.find((l) => l.id === scope)?.name;

	return (
		<div>
			{isBusiness && (
				<section className="panel admin-presets" aria-label="Business category preset">
					<div className="panel-head">
						<div>
							<div className="panel-title">Business category preset</div>
							<div className="muted">Turn on one category to apply its feature set (only one at a time). Press “Save features” to store it.</div>
						</div>
					</div>
					<div className="modal-body admin-presets-body">
						<div className="admin-presets-list" role="group" aria-label="Business categories">
							{FEATURE_PRESETS.map((p) => (
								<div className={"admin-feature" + (category === p.id ? " is-on" : "")} key={p.id} onMouseEnter={() => setPeek(p.id)} onMouseLeave={() => setPeek("")} onFocus={() => setPeek(p.id)} onBlur={() => setPeek("")}>
									<div className="admin-feature-copy">
										<strong>
											<span aria-hidden="true">{p.icon}</span> {p.label}
										</strong>
									</div>
									<Switch checked={category === p.id} onChange={(v) => toggleCategory(p, v)} label={p.label} />
								</div>
							))}
						</div>
						<aside className="admin-presets-types" aria-live="polite">
							{shownPreset ? (
								<>
									<h3>
										<span aria-hidden="true">{shownPreset.icon}</span> {shownPreset.label}
									</h3>
									<ul>
										{shownPreset.types.map((t) => (
											<li key={t}>{t}</li>
										))}
									</ul>
									<small>
										Switches off {shownOff.length} feature{shownOff.length === 1 ? "" : "s"}
										{shownOff.length ? ": " + shownOff.slice(0, 6).map((f) => f.label).join(", ") + (shownOff.length > 6 ? " and " + (shownOff.length - 6) + " more" : "") : ""}.
									</small>
								</>
							) : (
								<p className="muted">Hover or select a category to see the business types it covers.</p>
							)}
						</aside>
					</div>
				</section>
			)}
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
							setCategory(settings.businessCategory || "");
						}}
					>
						Discard
					</button>
					<button className="btn gold" disabled={!dirty || saving} onClick={() => save({ features: base, locationFeatures: byLoc, businessCategory: category }, "Feature switches updated")}>
						Save features
					</button>
				</div>
			</footer>
		</div>
	);
}
