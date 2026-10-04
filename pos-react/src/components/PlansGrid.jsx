/**
 * Pricing sheet component: the four plan cards, the additional-features offer, plan highlights and the
 * conditions note, all driven by config/plans.
 */
import { ADDITIONAL_FEATURES, PLANS, PLAN_CONDITIONS, PLAN_CONTACT, PLAN_HIGHLIGHTS } from "../config/plans";

const fmt = (n) => n.toLocaleString("en-US");

/** Pricing sheet: four plans, additional-features offer, highlights, contact options and conditions. */
export function PlansGrid({ currentPlan, businessName = "" }) {
	const note = "Hello Ceylonry Labs, I would like to talk about my Ceylonry POS plan" + (businessName ? " for " + businessName : "") + ".";
	return (
		<div className="plans">
			<div className="plans-grid">
				{PLANS.map((p) => (
					<article key={p.id} className={"plan-card" + (p.popular ? " popular" : "") + (currentPlan === p.id ? " current" : "")}>
						{p.popular && <span className="plan-ribbon">MOST POPULAR</span>}
						<div className="plan-icon" aria-hidden="true">
							{p.icon}
						</div>
						<h3>{p.name}</h3>
						<p className="plan-tag">{p.tagline}</p>
						<div className="plan-price">
							<small>LKR</small>
							<strong>{fmt(p.price)}</strong>
							<span>{p.term}</span>
						</div>
						<ul>
							{p.features.map((f) => (
								<li key={f}>
									<i aria-hidden="true">✓</i>
									{f}
								</li>
							))}
							{(p.excluded || []).map((f) => (
								<li key={f} className="off">
									<i aria-hidden="true">×</i>
									{f}
								</li>
							))}
						</ul>
						{currentPlan === p.id && <span className="plan-current-tag">Your plan</span>}
					</article>
				))}
			</div>
			<div className="plans-extra">
				<div>
					<span className="plan-icon" aria-hidden="true">
						⚙
					</span>
					<div>
						<small>ADDITIONAL FEATURES</small>
						<h3>Customise your POS with additional features</h3>
						<p>
							Get up to {ADDITIONAL_FEATURES.freeCount} additional features <strong>free</strong> with any plan. Need more? Additional features can be added at{" "}
							<b>LKR {fmt(ADDITIONAL_FEATURES.pricePerFeature)} per feature.</b>
						</p>
					</div>
				</div>
				<div className="plans-extra-tiles">
					<div>
						<span aria-hidden="true">🎁</span> Up to {ADDITIONAL_FEATURES.freeCount} additional features <strong>FREE</strong>
					</div>
					<div>
						<span aria-hidden="true">⚙</span> Additional features <strong>LKR {fmt(ADDITIONAL_FEATURES.pricePerFeature)}</strong> per feature
					</div>
				</div>
			</div>
			<div className="plans-highlights">
				{PLAN_HIGHLIGHTS.map((h) => (
					<div key={h.title}>
						<span aria-hidden="true">{h.icon}</span>
						<div>
							<strong>{h.title}</strong>
							<small>{h.text}</small>
						</div>
					</div>
				))}
			</div>
			<div className="plans-contact">
				<div>
					<strong>Questions about a plan, or want to change yours?</strong>
					<small>Contact us and we will help you choose.</small>
				</div>
				<div className="plans-contact-actions">
					<a className="btn gold" href={"https://wa.me/" + PLAN_CONTACT.whatsapp + "?text=" + encodeURIComponent(note)} target="_blank" rel="noreferrer">
						Contact us on WhatsApp
					</a>
					<a className="btn out" href={"mailto:" + PLAN_CONTACT.email + "?subject=" + encodeURIComponent("Ceylonry POS plans") + "&body=" + encodeURIComponent(note)}>
						Email us
					</a>
				</div>
			</div>
			<p className="plans-conditions">
				<strong>Conditions Applied:</strong> {PLAN_CONDITIONS}
			</p>
		</div>
	);
}
