/**
 * System Options pages (Settings > System Options): Overview with presets, Order Entry, Receipts, Sign In and Clock In / Out.
 * Each page is only SectionCards of typed rows (components/settings/kit/rows.jsx) bound to its values in SystemOptionsContext.
 */
import { useState } from "react";
import { ORDER_CHANNELS } from "../../config/constants";
import { hasCapability } from "../../config/capabilities";
import { ConditionalGroup, DurationRow, PageHeader, SectionCard, SelectRow, TextAreaRow, TimeRow, ToggleRow } from "../../components/settings/kit/rows";
import { useSystemOptions, useSystemOptionsDraft } from "../../components/settings/kit/SystemOptionsContext";
import { LANDING_VIEWS, PRESETS, SYSTEM_PAGES, presetChanges, resolveOptions } from "../../domain/systemOptions";
import { useData } from "../../store/DataProvider";

const LABELS = {
	"orderEntry.defaultOrderType": "Default order type",
	"signIn.defaultView": "Screen after signing in",
	"orderEntry.showPrices": "Show prices on menu item buttons",
};
const viewLabel = (v) => LANDING_VIEWS.find((x) => x.value === v)?.label || v;
const show = (key, v) => (key === "defaultView" ? viewLabel(v) : typeof v === "boolean" ? (v ? "On" : "Off") : String(v));

/** Says who a page's values apply to: everyone, or the location chosen in the top bar. */
function ScopeNote({ footer }) {
	const { locationId } = useSystemOptionsDraft();
	const data = useData();
	if (!locationId || locationId === "all") return <>{data.locations.filter((l) => l.active !== false).length > 1 ? "Applies to all locations. To set a value for one location only, choose it in the top bar." : "Applies to this business."}</>;
	const name = data.locations.find((l) => l.id === locationId)?.name || "this location";
	return <>Editing {name}. Changes here apply to this location only; other locations keep the organization value.{footer ? " The footer message is the same for every location." : ""}</>;
}

export function Overview({ onOpen }) {
	const ctx = useSystemOptionsDraft();
	const [picked, setPicked] = useState("");
	const preset = PRESETS.find((p) => p.key === picked);
	const current = Object.fromEntries(["orderEntry", "signIn"].map((p) => [p, resolveOptions(ctx.effectiveSettings, p, ctx.locationId)]));
	const rows = preset ? presetChanges(preset, current) : [];
	return (
		<>
			<PageHeader title="System Options" description="Settings that change how the POS behaves at this location." note="Changes sync to every POS terminal after you save." />
			<div className="sk-grid" id="system-pages">
				{SYSTEM_PAGES.filter((p) => p.key !== "overview").map((p) => (
					<button key={p.key} type="button" className="sk-tile" data-open={p.key} onClick={() => onOpen(p.key)}>
						<strong>{p.title}</strong>
						<span className="muted">{p.description}</span>
						<span className="sk-link">Open</span>
					</button>
				))}
			</div>
			<SectionCard title="Recommended settings" description="Start from a ready-made set, check what changes, then save. Nothing is applied until you save.">
				<div className="sk-presets">
					{PRESETS.map((p) => (
						<button key={p.key} type="button" className={"sk-tile" + (picked === p.key ? " active" : "")} data-preset={p.key} aria-pressed={picked === p.key} onClick={() => setPicked(picked === p.key ? "" : p.key)}>
							<strong>{p.title}</strong>
							<span className="muted">{p.description}</span>
						</button>
					))}
				</div>
				{preset && (
					<div className="sk-preview" id="preset-preview">
						{rows.length ? (
							<>
								<table>
									<thead>
										<tr>
											<th>Setting</th>
											<th>Now</th>
											<th>{preset.title}</th>
										</tr>
									</thead>
									<tbody>
										{rows.map((r) => (
											<tr key={r.page + r.key}>
												<td>{LABELS[r.page + "." + r.key] || r.key}</td>
												<td>{show(r.key, r.before)}</td>
												<td>
													<strong>{show(r.key, r.after)}</strong>
												</td>
											</tr>
										))}
									</tbody>
								</table>
								<button
									type="button"
									className="btn gold"
									id="apply-preset"
									onClick={() => {
										ctx.preset(preset.values);
										setPicked("");
									}}
								>
									Apply as unsaved changes
								</button>
							</>
						) : (
							<p className="muted">Everything in {preset.title} is already set.</p>
						)}
					</div>
				)}
			</SectionCard>
		</>
	);
}

export function OrderEntry() {
	const { values, set, overridden, reset, errors } = useSystemOptions("orderEntry");
	const { settings } = useData();
	const kitchen = hasCapability(settings.businessType, "kitchen");
	return (
		<>
			<PageHeader title="Order Entry" description="How an order is started and how the menu looks while taking it." note={<ScopeNote />} />
			{kitchen && (
				<SectionCard title="Order type">
					<SelectRow
						id="oe-default-type"
						label="Default order type"
						help="New orders start with this type. Staff can still change it on the order."
						value={values.defaultOrderType}
						onChange={(v) => set("defaultOrderType", v)}
						options={ORDER_CHANNELS.map((c) => ({ value: c, label: c }))}
						overridden={overridden("defaultOrderType")}
						onReset={() => reset("defaultOrderType")}
						error={errors.defaultOrderType}
					/>
				</SectionCard>
			)}
			<SectionCard title="Display">
				<ToggleRow id="oe-show-prices" label="Show prices on menu item buttons" help="Turn off to keep prices off the buttons, for example when prices are on the menu board." value={values.showPrices} onChange={(v) => set("showPrices", v)} overridden={overridden("showPrices")} onReset={() => reset("showPrices")} />
			</SectionCard>
		</>
	);
}

export function Receipts() {
	const { values, set, errors } = useSystemOptions("receipts");
	return (
		<>
			<PageHeader title="Receipts" description="What customers see at the bottom of their receipt." note={<ScopeNote footer />} />
			<SectionCard title="Footer">
				<TextAreaRow id="rc-footer" label="Footer message" help="Printed at the bottom of every receipt. A location can set its own under Business Profile › Locations." value={values.footer} onChange={(v) => set("footer", v)} max={200} error={errors.footer} />
			</SectionCard>
		</>
	);
}

export function SignIn() {
	const { values, set, overridden, reset, errors } = useSystemOptions("signIn");
	const { settings } = useData();
	const kitchen = hasCapability(settings.businessType, "kitchen");
	const options = LANDING_VIEWS.filter((o) => kitchen || !["orders", "tables"].includes(o.value));
	return (
		<>
			<PageHeader title="Sign In" description="Where staff land after they sign in." note={<ScopeNote />} />
			<SectionCard title="After sign in">
				<SelectRow
					id="si-default-view"
					label="Screen after signing in"
					help="Staff who may not open the chosen screen go to the first page their role allows."
					value={values.defaultView}
					onChange={(v) => set("defaultView", v)}
					options={options}
					overridden={overridden("defaultView")}
					onReset={() => reset("defaultView")}
					error={errors.defaultView}
				/>
			</SectionCard>
		</>
	);
}

export function ClockInOut() {
	const { values, set, overridden, reset, errors } = useSystemOptions("clock");
	return (
		<>
			<PageHeader title="Clock In / Out" description="Clock people out automatically so no shift runs on by mistake." note={<ScopeNote />} />
			<SectionCard title="Automatic clock out" description="Their cash register closes with them, counted as exactly the expected cash, so count the drawer and check it in the End of Day report.">
				<ToggleRow id="ck-elapsed" label="Clock out after a maximum time" help="Clocks a person out once this much time has passed since they clocked in." value={values.autoElapsedOn} onChange={(v) => set("autoElapsedOn", v)} overridden={overridden("autoElapsedOn")} onReset={() => reset("autoElapsedOn")} />
				<ConditionalGroup show={values.autoElapsedOn}>
					<DurationRow id="ck-max" label="Maximum time clocked in" hours={values.maxHours} minutes={values.maxMinutes} onChange={({ hours, minutes }) => (set("maxHours", hours), set("maxMinutes", minutes))} error={errors.maxHours} />
				</ConditionalGroup>
				<ToggleRow id="ck-time" label="Clock out at a time every day" help="Clocks out everyone who is still clocked in, using this location's time." value={values.autoTimeOn} onChange={(v) => set("autoTimeOn", v)} overridden={overridden("autoTimeOn")} onReset={() => reset("autoTimeOn")} />
				<ConditionalGroup show={values.autoTimeOn}>
					<TimeRow id="ck-at" label="Clock-out time" value={values.autoTime} onChange={(v) => set("autoTime", v)} error={errors.autoTime} />
				</ConditionalGroup>
			</SectionCard>
		</>
	);
}

export const PAGE_COMPONENTS = { orderEntry: OrderEntry, receipts: Receipts, signIn: SignIn, clock: ClockInOut };
