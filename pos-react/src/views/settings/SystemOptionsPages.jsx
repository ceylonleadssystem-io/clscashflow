/**
 * System Options pages (Settings > System Options): Overview with presets, Order Entry, Receipts, Sign In and Clock In / Out.
 * Each page is only SectionCards of typed rows (components/settings/kit/rows.jsx) bound to its values in SystemOptionsContext.
 */
import { useMemo, useState } from "react";
import { ORDER_CHANNELS } from "../../config/constants";
import { hasCapability } from "../../config/capabilities";
import { ConditionalGroup, DayTimeRow, DurationRow, NumberRow, PageHeader, SectionCard, SelectRow, TextAreaRow, TextRow, TimeRow, ToggleRow } from "../../components/settings/kit/rows";
import { AuditTrailDrawer, DetailDrawer, EmptyState, SortableList, StatusBadge } from "../../components/settings/kit/entities";
import { publishedOf } from "../../domain/menuAdmin";
import { MAIN_FLOOR, floorLayout, floorsFor } from "../../domain/tables";
import { MAX_NAME, nameError, reorder as reorderList, thirdPartyList, usedNames } from "../../domain/thirdPartyPayments";
import { usePos } from "../../store/PosProvider";
import { useSystemOptions, useSystemOptionsDraft } from "../../components/settings/kit/SystemOptionsContext";
import { LANDING_VIEWS, PRESETS, SYSTEM_PAGES, presetChanges, resolveOptions } from "../../domain/systemOptions";
import { useData } from "../../store/DataProvider";

const LABELS = {
	"orderEntry.defaultOrderType": "Default order type",
	"signIn.defaultView": "Screen after signing in",
	"orderEntry.showPrices": "Show prices on menu item buttons",
	"orderEntry.defaultMenu": "Default menu",
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
			<SectionCard title="Menu">
				<SelectRow
					id="oe-default-menu"
					label="Default menu"
					help="The menu the register shows when none of your menus runs at this time of day. Menus and their hours are set in Menu Admin, Availability."
					value={values.defaultMenu}
					onChange={(v) => set("defaultMenu", v)}
					options={[{ value: "", label: "All items" }, ...publishedOf(settings, "availabilityMenus").filter((m) => m.status === "active").map((m) => ({ value: m.id, label: m.name }))]}
					overridden={overridden("defaultMenu")}
					onReset={() => reset("defaultMenu")}
				/>
			</SectionCard>
			<SectionCard title="Modifiers">
				<ToggleRow id="oe-global-modifiers" label="Enable global modifiers" help="Lets staff add extras such as No onion or Extra sauce to any item from the order. The extras are set up in Menu Admin, Modifiers." value={values.globalModifiers} onChange={(v) => set("globalModifiers", v)} />
			</SectionCard>
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

export function Payroll() {
	const { values: v, set, errors: e } = useSystemOptions("payroll");
	const [history, setHistory] = useState(false);
	const mult = (id, key, label, help) => <NumberRow id={id} label={label} help={help} value={v[key]} onChange={(x) => set(key, x)} min={1} max={3} step={0.1} suffix="x pay" error={e[key]} />;
	return (
		<>
			<PageHeader
				title="Payroll"
				description="The pay week and overtime rules used for hours and labor cost in Reports."
				note="These rules apply to the whole business. Wages come from each person's job, so hours are shown even before wages are set."
				actions={
					<button type="button" className="btn out" id="payroll-history" onClick={() => setHistory(true)}>
						History
					</button>
				}
			/>
			<SectionCard title="Pay week">
				<DayTimeRow id="pr-week" label="Payroll week starts" help="Weekly overtime is counted from this moment each week." day={v.weekDay} time={v.weekTime} onChange={({ day, time }) => (set("weekDay", day), set("weekTime", time))} error={e.weekTime || e.weekDay} />
			</SectionCard>
			<SectionCard title="Breaks">
				<ToggleRow id="pr-breaks" label="Paid breaks" help="Breaks are paid up to the length below; any time beyond it is taken off the worked hours." value={v.paidBreaksOn} onChange={(x) => set("paidBreaksOn", x)} />
				<ConditionalGroup show={v.paidBreaksOn}>
					<NumberRow id="pr-break-min" label="Paid break length" value={v.paidBreakMin} onChange={(x) => set("paidBreakMin", x)} min={1} max={120} suffix="minutes" error={e.paidBreakMin} />
				</ConditionalGroup>
			</SectionCard>
			<SectionCard title="Weekly overtime">
				<ToggleRow id="pr-weekly" label="Weekly overtime" help="Hours beyond the weekly limit are paid at the overtime rate." value={v.weeklyOn} onChange={(x) => set("weeklyOn", x)} />
				<ConditionalGroup show={v.weeklyOn}>
					<NumberRow id="pr-weekly-after" label="After" value={v.weeklyAfter} onChange={(x) => set("weeklyAfter", x)} min={1} max={168} suffix="hours a week" error={e.weeklyAfter} />
					{mult("pr-weekly-mult", "weeklyMult", "Pay rate")}
				</ConditionalGroup>
			</SectionCard>
			<SectionCard title="Daily overtime">
				<ToggleRow id="pr-daily" label="Daily overtime" help="Long days are paid at higher rates in two steps." value={v.dailyOn} onChange={(x) => set("dailyOn", x)} />
				<ConditionalGroup show={v.dailyOn}>
					<NumberRow id="pr-d1-after" label="Tier 1 starts after" value={v.d1After} onChange={(x) => set("d1After", x)} min={1} max={23} suffix="hours a day" error={e.d1After} />
					{mult("pr-d1-mult", "d1Mult", "Tier 1 pay rate")}
					<NumberRow id="pr-d2-after" label="Tier 2 starts after" value={v.d2After} onChange={(x) => set("d2After", x)} min={1} max={24} suffix="hours a day" error={e.d2After} />
					{mult("pr-d2-mult", "d2Mult", "Tier 2 pay rate")}
				</ConditionalGroup>
			</SectionCard>
			<SectionCard title="7th consecutive day">
				<ToggleRow id="pr-seventh" label="Overtime on the 7th day in a row" help="The first 8 hours on the 7th day use tier 1 and the rest tier 2." value={v.seventhOn} onChange={(x) => set("seventhOn", x)} />
				<ConditionalGroup show={v.seventhOn}>
					{mult("pr-s1-mult", "s1Mult", "Tier 1 pay rate")}
					{mult("pr-s2-mult", "s2Mult", "Tier 2 pay rate")}
				</ConditionalGroup>
			</SectionCard>
			<SectionCard title="Carryover">
				<ToggleRow id="pr-carry" label="Count daily overtime toward weekly overtime" help="Off: only regular hours count toward the weekly limit." value={v.carryover} onChange={(x) => set("carryover", x)} />
			</SectionCard>
			<AuditTrailDrawer open={history} onClose={() => setHistory(false)} title="Payroll history" match="payroll." />
		</>
	);
}

export function ThirdPartyPayments() {
	const { settings, sales } = useData();
	const { svc } = usePos();
	const list = thirdPartyList(settings);
	const used = useMemo(() => usedNames(sales), [sales]);
	const [edit, setEdit] = useState(null); // { id?, name, active }
	const error = edit ? nameError(edit.name, list.filter((t) => t.id !== edit.id)) : "";
	const [touched, setTouched] = useState(false);
	const close = () => (setEdit(null), setTouched(false));
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveThirdPartyPayment(edit)) close();
	};
	return (
		<>
			<PageHeader
				title="3rd Party Payments"
				description="Extra ways to take payment, such as delivery apps, bank transfer or a corporate account."
				note="They appear on the payment screen after the standard methods, in this order, and in reports by name."
				actions={
					<button type="button" className="btn gold" id="add-third-party" onClick={() => setEdit({ name: "", active: true })}>
						Add payment type
					</button>
				}
			/>
			<SectionCard>
				{list.length ? (
					<SortableList
						items={list}
						label="Payment type"
						onReorder={(ids) => svc.settings.reorderThirdPartyPayments(reorderList(list, ids))}
						render={(t) => (
							<div className="sk-list-line" data-third-party={t.id}>
								<strong>{t.name}</strong>
								<StatusBadge status={t.active === false ? "inactive" : "active"} />
								{used.has(t.name) && <span className="muted">Used on past sales</span>}
								<span className="sk-list-actions">
									<button type="button" className="btn out" onClick={() => setEdit({ id: t.id, name: t.name, active: t.active !== false })}>
										Edit
									</button>
									{!used.has(t.name) && (
										<button type="button" className="btn danger" onClick={() => svc.settings.deleteThirdPartyPayment(t.id)}>
											Delete
										</button>
									)}
								</span>
							</div>
						)}
					/>
				) : (
					<EmptyState title="No 3rd party payment types yet" action={<button type="button" className="btn gold" onClick={() => setEdit({ name: "", active: true })}>Add payment type</button>}>
						Add the delivery apps and other payment types you accept. Use their full names, for example PickMe Food.
					</EmptyState>
				)}
			</SectionCard>
			<DetailDrawer
				open={!!edit}
				title={edit?.id ? "Edit payment type" : "Add payment type"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-third-party" onClick={save}>
							Save
						</button>
					</>
				}
			>
				{edit && (
					<>
						<TextRow id="tp-name" label="Name" help="Shown to staff and on reports. Use the full name." value={edit.name} max={MAX_NAME + 5} autoFocus onChange={(name) => setEdit((x) => ({ ...x, name }))} error={touched ? error : ""} />
						<ToggleRow id="tp-active" label="Active" help="Switched off types are hidden at checkout but stay in reports." value={edit.active} onChange={(active) => setEdit((x) => ({ ...x, active }))} />
					</>
				)}
			</DetailDrawer>
		</>
	);
}

export function Zones() {
	const data = useData();
	const { settings, locations, openOrders } = data;
	const { svc, locationId, go, canView } = usePos();
	const active = locations.filter((l) => l.active !== false);
	// a business with one location has no location to choose
	const loc = locationId && locationId !== "all" ? locationId : active.length === 1 ? active[0].id : "";
	const [edit, setEdit] = useState(null);
	const [touched, setTouched] = useState(false);
	const zones = loc ? floorsFor(settings, loc) : [];
	const clash = edit && zones.some((z) => z.id !== edit.id && z.name.toLowerCase() === edit.name.trim().toLowerCase());
	const error = !edit ? "" : !edit.name.trim() ? "Enter a name." : clash ? "There is already a zone with this name." : "";
	const close = () => (setEdit(null), setTouched(false));
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveZone(loc, edit)) close();
	};
	const count = (z) => floorLayout(settings, loc, z.id).length;
	const openChecks = (z) => {
		const refs = new Set(floorLayout(settings, loc, z.id).map((t) => "Table " + t.number));
		return openOrders.filter((o) => o.status === "open" && refs.has(o.orderReference)).length;
	};
	return (
		<>
			<PageHeader
				title="Zones"
				description="Large areas of a location, such as the dining room, patio or bar. Each zone holds its own tables."
				note={loc ? `Zones of ${locations.find((l) => l.id === loc)?.name || "this location"}. Tables are placed in the Table Layout page.` : "Choose a location in the top bar to see its zones."}
				actions={
					loc && (
						<>
							{canView("tables") && (
								<button type="button" className="btn out" onClick={() => go("tables")}>
									Edit tables
								</button>
							)}
							<button type="button" className="btn gold" id="add-zone" onClick={() => setEdit({ name: "" })}>
								Add zone
							</button>
						</>
					)
				}
			/>
			<SectionCard>
				{!loc ? (
					<EmptyState title="No location chosen">Zones belong to a location. Pick one in the top bar.</EmptyState>
				) : (
					<SortableList
						items={zones}
						label="Zone"
						fixed={(z) => z.id === MAIN_FLOOR}
						onReorder={(ids) => svc.settings.reorderZones(loc, ids)}
						render={(z) => (
							<div className="sk-list-line" data-zone={z.id}>
								<strong>{z.name}</strong>
								<span className="muted">
									{count(z)} table{count(z) === 1 ? "" : "s"}
									{z.id === MAIN_FLOOR ? " · Main zone" : ""}
								</span>
								<span className="sk-list-actions">
									<button type="button" className="btn out" onClick={() => setEdit({ id: z.id, name: z.name })}>
										Rename
									</button>
									{z.id !== MAIN_FLOOR && (
										<button type="button" className="btn danger" disabled={false} title={openChecks(z) ? "Has open checks" : ""} onClick={() => svc.settings.deleteZone(loc, z.id)}>
											Delete
										</button>
									)}
								</span>
							</div>
						)}
					/>
				)}
			</SectionCard>
			<DetailDrawer
				open={!!edit}
				title={edit?.id ? "Rename zone" : "Add zone"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-zone" onClick={save}>
							Save
						</button>
					</>
				}
			>
				{edit && <TextRow id="zone-name" label="Name" help="For example Dining room, Patio or Bar." value={edit.name} max={40} autoFocus onChange={(name) => setEdit((x) => ({ ...x, name }))} error={touched ? error : ""} />}
			</DetailDrawer>
		</>
	);
}

export const PAGE_COMPONENTS = { orderEntry: OrderEntry, receipts: Receipts, signIn: SignIn, clock: ClockInOut, payroll: Payroll, thirdParty: ThirdPartyPayments, zones: Zones };
