/**
 * Admin portal > Subscription management: the constraints of every plan (users, locations, features) and the Founders plans,
 * constraint sets the administrator defines for founding customers. Standard plans follow the pricing sheet and are read-only;
 * a plan is assigned to a business from that business's Subscription tab, and the POS then follows it.
 */
import { useEffect, useState } from "react";
import { PLANS } from "../config/plans";
import { STANDARD_LIMITS, standardSubscription } from "../config/subscription";
import { useUi } from "../store/UiProvider";
import { adminApi } from "./adminApi";
import { FeatureChecklist, offLabels } from "./FeatureChecklist";

const limitText = (n, noun) => (n == null ? "Unlimited " + noun + "s" : "Up to " + n + " " + noun + (n === 1 ? "" : "s"));
export const blankFounders = () => ({ id: "founders-" + Date.now().toString(36), name: "Founders", price: 0, notes: "", maxUsers: null, maxLocations: null, featuresOff: [], custom: [] });

function StandardPlans() {
	return (
		<section className="plan-cards" aria-label="Standard plans">
			{PLANS.map((p) => {
				const sub = standardSubscription(p.id);
				const off = offLabels(sub.featuresOff);
				return (
					<article className="panel plan-card" key={p.id}>
						<div className="panel-head">
							<div>
								<div className="panel-title"><span aria-hidden="true">{p.icon}</span> {p.name}</div>
								<div className="muted">LKR {p.price.toLocaleString()} {p.term}</div>
							</div>
						</div>
						<div className="modal-body">
							<dl className="admin-dl">
								<dt>Users</dt><dd>{limitText(STANDARD_LIMITS[p.id].users, "user")}</dd>
								<dt>Locations</dt><dd>{limitText(STANDARD_LIMITS[p.id].locations, "location")}</dd>
							</dl>
							<ul className="plan-bullets">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
							{off.length > 0 && (
								<details>
									<summary className="muted">Switched off by this plan ({off.length})</summary>
									<ul className="plan-bullets">{off.map((l) => <li key={l}>✕ {l}</li>)}</ul>
								</details>
							)}
						</div>
					</article>
				);
			})}
		</section>
	);
}

function FoundersEditor({ plan, onChange, onRemove }) {
	const set = (patch) => onChange({ ...plan, ...patch });
	const num = (v) => (v === "" ? null : Math.max(1, Math.floor(Number(v)) || 1));
	return (
		<article className="panel founders-plan">
			<div className="panel-head">
				<div className="panel-title">{plan.name || "Founders"}</div>
				<button className="btn danger" type="button" onClick={onRemove}>Remove</button>
			</div>
			<div className="modal-body">
				<div className="form-grid">
					<div className="field"><label>Name</label><input className="input" value={plan.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} /></div>
					<div className="field"><label>Price (LKR / month, optional)</label><input className="input" inputMode="numeric" value={plan.price || ""} onChange={(e) => set({ price: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></div>
					<div className="field"><label>Maximum active users (blank = unlimited)</label><input className="input" inputMode="numeric" value={plan.maxUsers ?? ""} onChange={(e) => set({ maxUsers: num(e.target.value.replace(/\D/g, "")) })} /></div>
					<div className="field"><label>Maximum active locations (blank = unlimited)</label><input className="input" inputMode="numeric" value={plan.maxLocations ?? ""} onChange={(e) => set({ maxLocations: num(e.target.value.replace(/\D/g, "")) })} /></div>
					<div className="field full"><label>Notes (internal)</label><input className="input" value={plan.notes} maxLength={400} onChange={(e) => set({ notes: e.target.value })} /></div>
				</div>
				<h4 style={{ margin: "14px 0 6px" }}>Features included</h4>
				<FeatureChecklist off={plan.featuresOff} onChange={(featuresOff) => set({ featuresOff })} />
				<h4 style={{ margin: "14px 0 6px" }}>Other constraints</h4>
				<p className="muted">Anything not covered above, for example “Free hardware: 1 printer” or “Support: WhatsApp only”. These are recorded on the account and shown to the business under Settings &gt; Plan.</p>
				{plan.custom.map((c, i) => (
					<div className="form-grid" key={i} style={{ marginBottom: 6 }}>
						<input className="input" aria-label="Constraint" placeholder="Constraint" value={c.label} maxLength={80} onChange={(e) => set({ custom: plan.custom.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
						<div style={{ display: "flex", gap: 6 }}>
							<input className="input" aria-label="Value" placeholder="Value" value={c.value} maxLength={160} onChange={(e) => set({ custom: plan.custom.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
							<button className="btn out" type="button" aria-label="Remove constraint" onClick={() => set({ custom: plan.custom.filter((_, j) => j !== i) })}>✕</button>
						</div>
					</div>
				))}
				<button className="btn out" type="button" onClick={() => set({ custom: [...plan.custom, { label: "", value: "" }] })}>+ Add constraint</button>
			</div>
		</article>
	);
}

export function SubscriptionManagement() {
	const ui = useUi();
	const [founders, setFounders] = useState(null);
	const [saved, setSaved] = useState("[]");
	const [saving, setSaving] = useState(false);
	useEffect(() => {
		adminApi({ action: "getFounders" })
			.then((r) => {
				setFounders(r.founders || []);
				setSaved(JSON.stringify(r.founders || []));
			})
			.catch((e) => ui.alert(e.message));
	}, [ui]);
	const dirty = founders && JSON.stringify(founders) !== saved;
	const save = async () => {
		setSaving(true);
		try {
			const r = await adminApi({ action: "saveFounders", founders });
			setFounders(r.founders);
			setSaved(JSON.stringify(r.founders));
			ui.notice("Founders plans saved. Assign one to a business from its Subscription tab.");
		} catch (e) {
			await ui.alert(e.message);
		} finally {
			setSaving(false);
		}
	};
	return (
		<div id="subscription-management">
			<h2 style={{ margin: "4px 0 4px" }}>Subscription management</h2>
			<p className="muted">The constraints that apply to each plan. The POS enforces the plan assigned to a business: users and locations beyond the limit are refused and excluded features are switched off.</p>
			<StandardPlans />
			<h3 style={{ margin: "22px 0 4px" }}>Founders</h3>
			<p className="muted">Define the constraints for founding customers. Everything the standard plans do not cover can be set here.</p>
			{founders === null ? <p className="muted">Loading…</p> : founders.map((p, i) => (
				<FoundersEditor key={p.id} plan={p} onChange={(next) => setFounders(founders.map((x, j) => (j === i ? next : x)))} onRemove={async () => { if (await ui.confirm(`Remove “${p.name}”? Businesses already assigned to it keep their current constraints.`)) setFounders(founders.filter((_, j) => j !== i)); }} />
			))}
			{founders && (
				<footer className="admin-savebar">
					<span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
					<div>
						<button className="btn out" type="button" onClick={() => setFounders([...founders, blankFounders()])}>+ Add founders plan</button>
						<button className="btn gold" type="button" disabled={!dirty || saving} onClick={save}>Save founders plans</button>
					</div>
				</footer>
			)}
		</div>
	);
}
