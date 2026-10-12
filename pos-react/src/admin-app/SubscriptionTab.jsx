/**
 * Account detail > Subscription: assign a plan (a standard plan or one of the Founders plans) to this business. The constraints are
 * copied onto the account; the POS enforces them (users, locations, excluded features). "No plan limits" removes the assignment.
 */
import { useEffect, useMemo, useState } from "react";
import { PLANS } from "../config/plans";
import { normalizeSubscription, standardSubscription, subscriptionOf, usageOf } from "../config/subscription";
import { adminApi } from "./adminApi";
import { offLabels } from "./FeatureChecklist";

const limit = (n, noun) => (n == null ? "unlimited" : n + " " + noun + (n === 1 ? "" : "s"));

export function SubscriptionTab({ settings, workspace, save, saving }) {
	const current = subscriptionOf(settings);
	const [founders, setFounders] = useState([]);
	useEffect(() => {
		adminApi({ action: "getFounders" }).then((r) => setFounders(r.founders || [])).catch(() => {});
	}, []);
	const initial = !current ? "none" : PLANS.some((p) => p.id === current.planId) ? current.planId : "f:" + current.planId;
	const [choice, setChoice] = useState(initial);

	const candidate = useMemo(() => {
		if (choice === "none") return null;
		if (choice.startsWith("f:")) {
			const t = founders.find((x) => "f:" + x.id === choice);
			if (t) return normalizeSubscription({ ...t, planId: t.id, name: t.name });
			return current && "f:" + current.planId === choice ? current : null; // template not loaded (or removed): keep what the account has
		}
		return standardSubscription(choice);
	}, [choice, founders, current]);
	const usage = usageOf(candidate, workspace?.users || [], workspace?.locations || []);
	const over = [];
	if (candidate?.maxUsers != null && usage.users > candidate.maxUsers) over.push(`${usage.users} users are active but this plan allows ${candidate.maxUsers}`);
	if (candidate?.maxLocations != null && usage.locations > candidate.maxLocations) over.push(`${usage.locations} locations are active but this plan allows ${candidate.maxLocations}`);
	const dirty = JSON.stringify(candidate && { ...candidate, assignedAt: undefined }) !== JSON.stringify(current && { ...current, assignedAt: undefined });
	const apply = () => {
		const standard = PLANS.some((p) => p.id === choice);
		return save(
			{ subscription: candidate, ...(standard ? { plan: { ...(settings.plan || {}), tier: choice } } : {}) },
			candidate ? "Subscription: " + candidate.name : "Subscription limits removed",
		);
	};
	const off = candidate ? offLabels(candidate.featuresOff) : [];
	return (
		<div className="panel" id="account-subscription">
			<div className="panel-head">
				<div>
					<div className="panel-title">Subscription</div>
					<div className="muted">The plan this business is on. The POS follows it; accounts without a plan have no limits.</div>
				</div>
				<span className="badge">{current ? current.name : "No limits"}</span>
			</div>
			<div className="modal-body">
				<div className="field" style={{ maxWidth: 420 }}>
					<label htmlFor="sub-plan">Plan</label>
					<select className="input" id="sub-plan" value={choice} onChange={(e) => setChoice(e.target.value)}>
						<option value="none">No plan limits (not managed)</option>
						<optgroup label="Standard plans">
							{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
						</optgroup>
						{(founders.length > 0 || choice.startsWith("f:")) && (
							<optgroup label="Founders">
								{founders.map((f) => <option key={f.id} value={"f:" + f.id}>{f.name}</option>)}
								{choice.startsWith("f:") && !founders.some((f) => "f:" + f.id === choice) && <option value={choice}>{current?.name || "Founders"} (current)</option>}
							</optgroup>
						)}
					</select>
				</div>
				{candidate ? (
					<dl className="admin-dl" style={{ marginTop: 14 }}>
						<dt>Users</dt><dd>{usage.users} active of {limit(candidate.maxUsers, "user")}</dd>
						<dt>Locations</dt><dd>{usage.locations} active of {limit(candidate.maxLocations, "location")}</dd>
						<dt>Switched off</dt><dd>{off.length ? off.join(", ") : "Nothing"}</dd>
						{candidate.custom.map((c) => (
							<span key={c.label} style={{ display: "contents" }}><dt>{c.label}</dt><dd>{c.value}</dd></span>
						))}
					</dl>
				) : (
					<p className="muted" style={{ marginTop: 14 }}>No limits: any number of users and locations, and the feature switches on the Features tab apply as they are.</p>
				)}
				{over.length > 0 && <div className="print-note" style={{ marginTop: 10 }}>Over the limit: {over.join("; ")}. Existing users and locations stay, but no more can be added or re-activated until the business is back under the limit.</div>}
				<div style={{ marginTop: 14 }}>
					<button className="btn gold" type="button" disabled={!dirty || saving} onClick={apply}>Save subscription</button>
				</div>
			</div>
		</div>
	);
}
