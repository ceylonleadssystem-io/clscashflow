/**
 * Settings > System Options > Service Charge, the rules card: when a new order starts with the service charge on (auto-apply, a minimum
 * order total, the order types that get it, a maximum charge). The on/off switch and the percentage are the card above. Rules are per location
 * with a business default, saved with the System Options save bar.
 */
import { ORDER_CHANNELS } from "../../config/constants";
import { NumberRow, SectionCard, ToggleRow } from "../../components/settings/kit/rows";
import { useSystemOptions } from "../../components/settings/kit/SystemOptionsContext";
import { usePos } from "../../store/PosProvider";
import { ScopeNote } from "./SystemOptionsPages";

export function ServiceChargeRules({ enabled }) {
	const { values, set, overridden, reset, errors } = useSystemOptions("serviceCharge");
	const { kitchen } = usePos();
	const ov = (k) => ({ overridden: overridden(k), onReset: () => reset(k) });
	const dim = !values.autoApply; // the other rules only matter when orders get the charge automatically
	const toggleType = (type, on) => set("orderTypes", ORDER_CHANNELS.filter((t) => (t === type ? on : values.orderTypes.includes(t))));
	return (
		<SectionCard title="When it is added" description="Which new orders start with the service charge. Staff can still switch it on or off for one order with the Service charge switch under Quick Pay and Pay Now.">
			<p className="sk-scope-note">
				<ScopeNote />
			</p>
			{!enabled && <p className="muted">Turn on the service charge above first. These rules apply once it is on.</p>}
			<ToggleRow id="sc-auto" label="Add it to every new order automatically" help="Off: orders start without a service charge and staff switch it on when it applies." value={values.autoApply} onChange={(v) => set("autoApply", v)} {...ov("autoApply")} />
			<ToggleRow id="sc-min-on" label="Only when the order total is above an amount" help="The items total before any discount is compared with this amount." value={values.minOn} disabled={dim} onChange={(v) => set("minOn", v)} {...ov("minOn")} />
			<NumberRow id="sc-min" label="Order total above" value={values.minTotal} min={0} step={100} suffix="LKR" disabled={dim || !values.minOn} onChange={(v) => set("minTotal", v)} error={errors.minTotal} {...ov("minTotal")} />
			{kitchen && (
				<>
					{ORDER_CHANNELS.map((type) => (
						<ToggleRow key={type} id={"sc-type-" + type} label={"Add it automatically to " + type + " orders"} value={values.orderTypes.includes(type)} disabled={dim} onChange={(v) => toggleType(type, v)} {...(type === ORDER_CHANNELS[0] ? ov("orderTypes") : {})} />
					))}
					{errors.orderTypes && (
						<p className="sk-error" role="alert">
							{errors.orderTypes}
						</p>
					)}
				</>
			)}
			<ToggleRow id="sc-max-on" label="Limit the service charge on one bill" help="A bill never carries more service charge than this amount, even if staff switch it on." value={values.maxOn} onChange={(v) => set("maxOn", v)} {...ov("maxOn")} />
			<NumberRow id="sc-max" label="Maximum service charge per bill" value={values.maxCharge} min={0} step={100} suffix="LKR" disabled={!values.maxOn} onChange={(v) => set("maxCharge", v)} error={errors.maxCharge} {...ov("maxCharge")} />
		</SectionCard>
	);
}
