/**
 * Settings > Menu Admin: Sales Categories and Availability. Both save a draft; the publish bar at the bottom puts every draft on the
 * POS at once (see domain/menuAdmin.js).
 */
import { useEffect, useMemo, useState } from "react";
import { AssignmentTree } from "../../components/settings/kit/AssignmentTree";
import { DetailDrawer, EmptyState, SortableList, StatusBadge } from "../../components/settings/kit/entities";
import { ConditionalGroup, NumberRow, PageHeader, SectionCard, SelectRow, SettingRow, TextAreaRow, TextRow, ToggleRow } from "../../components/settings/kit/rows";
import { categoryKey, productCategories, visibleProductCategories } from "../../domain/catalog";
import { DEFAULT_GRACE, cleanCategorySetting } from "../../domain/deleteApproval";
import { UNCATEGORIZED, cleanGroupEdit, draftNewItems, subcategoryError, workingSubcategories, effectiveCategory, draftList, groupEditError, itemEditError, remainingNames, withItemEdit, workingCategories, workingGroups } from "../../domain/catalogDraft";
import { WEEKDAYS, DEFAULT_PREFIXES, cleanGlobalModifier, cleanItemSetting, cleanLimit, cleanMenu, cleanPrefixes, globalModifierError, limitError, cleanSalesCategory, hasDraft, hoursSummary, menuError, overlappingMenus, salesCategoryError, workingOf } from "../../domain/menuAdmin";
import { money } from "../../domain/format";
import { cleanTax, cleanTaxRules, previewTax, round2, taxError } from "../../domain/taxes";
import { kitchenStations } from "../../domain/kitchenStations";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { PublishBar } from "../../components/settings/kit/PublishBar";
import { CatalogueEditor, ModifierGroupEditor } from "./MovedPages";
import { usePos } from "../../store/PosProvider";

const newMenu = () => ({ id: "", name: "", status: "active", hours: [{ days: [1, 2, 3, 4, 5], start: "07:00", end: "11:00" }], categories: [] });
const DraftBadge = ({ show }) => (show ? <span className="sk-badge">Draft changes</span> : null);

export function SalesCategories() {
	const { settings, products } = useData();
	const { svc } = usePos();
	const [edit, setEdit] = useState(null);
	const [touched, setTouched] = useState(false);
	const list = workingOf(settings, "salesCategories");
	const ownerOf = useMemo(() => new Map(list.flatMap((c) => c.itemIds.map((i) => [i, c]))), [list]);
	const groups = useMemo(() => {
		const by = new Map();
		for (const p of products) {
			const k = p.category || "Uncategorised";
			if (!by.has(k)) by.set(k, []);
			by.get(k).push({ id: String(p.id), name: p.name, note: ownerOf.get(String(p.id)) && ownerOf.get(String(p.id)).id !== edit?.id ? "in " + ownerOf.get(String(p.id)).name : "" });
		}
		return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, items]) => ({ key: name, name, items: items.sort((a, b) => a.name.localeCompare(b.name)) }));
	}, [products, ownerOf, edit?.id]);
	const clean = edit ? cleanSalesCategory({ ...edit, id: edit.id || "new" }) : null;
	const error = clean ? salesCategoryError(clean, list.filter((c) => c.id !== edit.id)) : "";
	const close = () => (setEdit(null), setTouched(false));
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveMenuEntity("salesCategories", edit)) close();
	};
	return (
		<>
			<PageHeader
				title="Sales categories"
				description="Reporting groups for Reports, Menu, Sales Category. They are separate from the categories customers see on the register."
				actions={
					<>
						<DraftBadge show={hasDraft(settings, "salesCategories")} />
						<button type="button" className="btn gold" id="add-sales-category" onClick={() => setEdit({ id: "", name: "", status: "active", itemIds: [] })}>
							Add sales category
						</button>
					</>
				}
			/>
			<SectionCard>
				{!list.length ? (
					<EmptyState
						title="No sales categories yet"
						action={
							<button type="button" className="btn out" onClick={() => svc.settings.addStandardSalesCategories()}>
								Add the standard five
							</button>
						}
					>
						Reports group sales by the display category until you publish sales categories. The standard set is Food, Beverage, Alcohol, Retail and Other.
					</EmptyState>
				) : (
					<SortableList
						items={list}
						label="Sales category"
						onReorder={(ids) => svc.settings.reorderMenuEntities("salesCategories", ids)}
						render={(c) => (
							<div className="sk-list-line" data-sales-category={c.id}>
								<strong>{c.name}</strong>
								<span className="muted">
									{c.itemIds.length} item{c.itemIds.length === 1 ? "" : "s"}
								</span>
								<StatusBadge status={c.status} />
								<span className="sk-list-actions">
									<button type="button" className="btn out" onClick={() => setEdit({ ...c })}>
										Edit
									</button>
									<button type="button" className="btn danger" onClick={() => svc.settings.deleteMenuEntity("salesCategories", c.id)}>
										Remove
									</button>
								</span>
							</div>
						)}
					/>
				)}
			</SectionCard>
			{list.length > 0 && products.some((p) => !ownerOf.has(String(p.id))) && (
				<p className="muted">
					{products.filter((p) => !ownerOf.has(String(p.id))).length} item{products.filter((p) => !ownerOf.has(String(p.id))).length === 1 ? " has" : "s have"} no sales category and appear as Unassigned in the report.
				</p>
			)}
			<DetailDrawer
				open={!!edit}
				wide
				title={edit?.id ? "Edit sales category" : "Add sales category"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-sales-category" onClick={save}>
							Save draft
						</button>
					</>
				}
			>
				{edit && (
					<>
						<TextRow id="sc-name" label="Name" help="For example Food or Beverage." value={edit.name} max={40} autoFocus onChange={(name) => setEdit((x) => ({ ...x, name }))} error={touched ? error : ""} />
						<ToggleRow id="sc-active" label="Active" help="Inactive categories are kept for reports but cannot be chosen. A category must be empty to be made inactive." value={edit.status === "active"} onChange={(on) => setEdit((x) => ({ ...x, status: on ? "active" : "inactive" }))} />
						<SettingRow label="Items" help="Each item has one sales category. Ticking an item here moves it out of its current one." wide>
							<AssignmentTree groups={groups} selected={new Set(edit.itemIds)} onChange={(set) => setEdit((x) => ({ ...x, itemIds: [...set] }))} />
						</SettingRow>
					</>
				)}
			</DetailDrawer>
		</>
	);
}

export function Availability() {
	const { settings, categories, products, subcategories } = useData();
	const { svc } = usePos();
	const [edit, setEdit] = useState(null);
	const [touched, setTouched] = useState(false);
	const list = workingOf(settings, "availabilityMenus");
	const names = useMemo(() => visibleProductCategories(categories, products, subcategories, settings.userCategories || []).sort((a, b) => a.localeCompare(b)), [categories, products, subcategories, settings.userCategories]);
	const known = new Set(names.map(categoryKey));
	const clean = edit ? cleanMenu({ ...edit, id: edit.id || "new" }) : null;
	const error = clean ? menuError(clean, list.filter((m) => m.id !== edit.id)) : "";
	const overlap = clean && !error ? overlappingMenus(clean, list.filter((m) => m.id !== edit.id)) : [];
	const close = () => (setEdit(null), setTouched(false));
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveMenuEntity("availabilityMenus", edit)) close();
	};
	const setRow = (i, next) => setEdit((x) => ({ ...x, hours: x.hours.map((h, j) => (j === i ? { ...h, ...(typeof next === "function" ? next(h) : next) } : h)) }));
	const toggleDay = (i, d) => setRow(i, (h) => ({ days: h.days.includes(d) ? h.days.filter((x) => x !== d) : [...h.days, d] }));
	return (
		<>
			<PageHeader
				title="Availability"
				description="Menus that decide which categories the register shows at different times, such as Breakfast, Lunch and Dinner."
				note="The register follows every active menu whose hours apply right now. When none apply it shows the default menu from Order Entry, or all items."
				actions={
					<>
						<DraftBadge show={hasDraft(settings, "availabilityMenus")} />
						<button type="button" className="btn gold" id="add-menu" onClick={() => setEdit(newMenu())}>
							Add menu
						</button>
					</>
				}
			/>
			<SectionCard>
				{!list.length ? (
					<EmptyState title="No menus yet">Until you publish a menu the register shows every category all day.</EmptyState>
				) : (
					<SortableList
						items={list}
						label="Menu"
						onReorder={(ids) => svc.settings.reorderMenuEntities("availabilityMenus", ids)}
						render={(m) => (
							<div className="sk-list-line" data-menu={m.id}>
								<strong>{m.name}</strong>
								<span className="muted">
									{hoursSummary(m.hours)} · {m.categories.filter((c) => known.has(categoryKey(c))).length} categor{m.categories.length === 1 ? "y" : "ies"}
								</span>
								<StatusBadge status={m.status} />
								<span className="sk-list-actions">
									<button type="button" className="btn out" onClick={() => setEdit(cleanMenu(m))}>
										Edit
									</button>
									<button type="button" className="btn danger" onClick={() => svc.settings.deleteMenuEntity("availabilityMenus", m.id)}>
										Remove
									</button>
								</span>
							</div>
						)}
					/>
				)}
			</SectionCard>
			<DetailDrawer
				open={!!edit}
				wide
				title={edit?.id ? "Edit menu" : "Add menu"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-menu" onClick={save}>
							Save draft
						</button>
					</>
				}
			>
				{edit && (
					<>
						<TextRow id="mn-name" label="Name" help="For example Breakfast, Lunch or Happy hour." value={edit.name} max={40} autoFocus onChange={(name) => setEdit((x) => ({ ...x, name }))} error={touched && !edit.name.trim() ? "Enter a name." : ""} />
						<ToggleRow id="mn-active" label="Active" help="An inactive menu is kept but the register ignores it." value={edit.status === "active"} onChange={(on) => setEdit((x) => ({ ...x, status: on ? "active" : "inactive" }))} />
						<SettingRow label="Hours" help="Days and times this menu runs. An end time earlier than the start runs past midnight." wide error={touched && error && !error.startsWith("Enter a name") ? error : ""}>
							<div className="sk-schedule">
								{edit.hours.map((h, i) => (
									<div key={i} className="sk-schedule-row">
										<div className="sk-days" role="group" aria-label={"Days of row " + (i + 1)}>
											{WEEKDAYS.map((d) => (
												<button key={d.value} type="button" className={"sk-day" + (h.days.includes(d.value) ? " on" : "")} aria-pressed={h.days.includes(d.value)} onClick={() => toggleDay(i, d.value)}>
													{d.label}
												</button>
											))}
										</div>
										<div className="sk-inline">
											<input className="input" type="time" aria-label="Start time" value={h.start} onChange={(e) => setRow(i, { start: e.target.value })} />
											<span className="muted">to</span>
											<input className="input" type="time" aria-label="End time" value={h.end} onChange={(e) => setRow(i, { end: e.target.value })} />
											{edit.hours.length > 1 && (
												<button type="button" className="btn out" aria-label="Remove these hours" onClick={() => setEdit((x) => ({ ...x, hours: x.hours.filter((_, j) => j !== i) }))}>
													Remove
												</button>
											)}
										</div>
									</div>
								))}
								<button type="button" className="btn out" onClick={() => setEdit((x) => ({ ...x, hours: [...x.hours, { days: [1, 2, 3, 4, 5], start: "11:00", end: "15:00" }] }))}>
									Add hours
								</button>
								{overlap.length > 0 && <p className="muted">These hours overlap {overlap.map((m) => m.name).join(", ")}. At those times the register shows the categories of both menus.</p>}
							</div>
						</SettingRow>
						<SettingRow label="Categories" help="The categories the register shows while this menu runs." wide>
							<div className="sk-checks">
								{names.map((n) => (
									<label key={n}>
										<input type="checkbox" checked={edit.categories.some((c) => categoryKey(c) === categoryKey(n))} onChange={(e) => setEdit((x) => ({ ...x, categories: e.target.checked ? [...x.categories, n] : x.categories.filter((c) => categoryKey(c) !== categoryKey(n)) }))} />
										<span>{n}</span>
									</label>
								))}
								{!names.length && <p className="muted">There are no categories yet. Add items first.</p>}
							</div>
						</SettingRow>
					</>
				)}
			</DetailDrawer>
		</>
	);
}

export function Taxes() {
	const { settings, categories, products, subcategories } = useData();
	const { svc } = usePos();
	const [edit, setEdit] = useState(null);
	const [touched, setTouched] = useState(false);
	const list = workingOf(settings, "taxes");
	const saved = useMemo(() => cleanTaxRules(workingOf(settings, "taxRules")[0] || {}), [settings]);
	const [rules, setRules] = useState(saved);
	useEffect(() => setRules(saved), [saved]);
	const rulesDirty = JSON.stringify(rules) !== JSON.stringify(saved);
	const names = useMemo(() => visibleProductCategories(categories, products, subcategories, settings.userCategories || []).sort((a, b) => a.localeCompare(b)), [categories, products, subcategories, settings.userCategories]);
	const taxOptions = [{ value: "", label: "None" }, ...list.filter((t) => t.status === "active").map((t) => ({ value: t.id, label: t.name }))];
	const clean = edit ? cleanTax({ ...edit, id: edit.id || "new" }) : null;
	const error = clean ? taxError(clean, list.filter((t) => t.id !== edit.id)) : "";
	const preview = clean && !error ? previewTax(clean, list) : null;
	const close = () => (setEdit(null), setTouched(false));
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveMenuEntity("taxes", edit)) close();
	};
	const summary = (t) => (t.isGroup ? "Group: " + t.memberTaxIds.map((id) => list.find((x) => x.id === id)?.name || "?").join(" + ") : t.rate + "%");
	const setCat = (name, field, v) => setRules((r) => ({ ...r, categoryTaxes: { ...r.categoryTaxes, [categoryKey(name)]: { ...(r.categoryTaxes[categoryKey(name)] || { tax: "", takeaway: "" }), [field]: v } } }));
	return (
		<>
			<PageHeader
				title="Taxes"
				description="Tax is added on top of item prices when an order is paid. Nothing is added until you publish at least one active tax."
				note="Rate changes apply to new orders only. Past sales keep the tax they were charged."
				actions={
					<>
						<DraftBadge show={hasDraft(settings, "taxes") || hasDraft(settings, "taxRules")} />
						<button type="button" className="btn gold" id="add-tax" onClick={() => setEdit({ id: "", name: "", isGroup: false, rate: "", memberTaxIds: [], status: "active" })}>
							Add tax
						</button>
					</>
				}
			/>
			<SectionCard title="General taxes">
				{!list.length ? (
					<EmptyState title="No taxes yet">Add your current rates, for example VAT. There are no preset rates.</EmptyState>
				) : (
					<SortableList
						items={list}
						label="Tax"
						onReorder={(ids) => svc.settings.reorderMenuEntities("taxes", ids)}
						render={(t) => (
							<div className="sk-list-line" data-tax={t.id}>
								<strong>{t.name}</strong>
								<span className="muted">{summary(t)}</span>
								<StatusBadge status={t.status} />
								<span className="sk-list-actions">
									<button type="button" className="btn out" onClick={() => setEdit(cleanTax(t))}>
										Edit
									</button>
									<button type="button" className="btn danger" onClick={() => svc.settings.deleteMenuEntity("taxes", t.id)}>
										Remove
									</button>
								</span>
							</div>
						)}
					/>
				)}
			</SectionCard>
			<SectionCard title="Special tax treatments" description="Apply to the whole business.">
				<SelectRow id="tx-default" label="Default tax" help="Used for every item whose category has no tax of its own." value={rules.defaultTaxId} options={taxOptions} onChange={(v) => setRules((r) => ({ ...r, defaultTaxId: v }))} />
				<ToggleRow id="tx-takeaway" label="Takeaway tax" help="When on, each category can have a separate tax for takeaway orders." value={rules.takeawayOn} onChange={(v) => setRules((r) => ({ ...r, takeawayOn: v }))} />
				<ToggleRow id="tx-service" label="Tax on service charge" help="Charge tax on the service charge too (only if a service charge is switched on in Settings)." value={rules.serviceTaxOn} onChange={(v) => setRules((r) => ({ ...r, serviceTaxOn: v }))} />
				{rules.serviceTaxOn && <SelectRow id="tx-service-tax" label="Service charge tax" value={rules.serviceTaxId} options={taxOptions} onChange={(v) => setRules((r) => ({ ...r, serviceTaxId: v }))} />}
			</SectionCard>
			<SectionCard title="Tax by category" description="An item takes its category's tax. Categories left on None use the default tax.">
				{!names.length ? <p className="muted">There are no categories yet.</p> : names.map((n) => {
					const c = rules.categoryTaxes[categoryKey(n)] || { tax: "", takeaway: "" };
					return (
						<div key={n} className="sk-cat-tax" data-cat-tax={n}>
							<SelectRow id={"tx-cat-" + categoryKey(n)} label={n} value={c.tax} options={taxOptions} onChange={(v) => setCat(n, "tax", v)} />
							{rules.takeawayOn && <SelectRow id={"tx-cat-take-" + categoryKey(n)} label={n + " takeaway"} value={c.takeaway} options={taxOptions} onChange={(v) => setCat(n, "takeaway", v)} />}
						</div>
					);
				})}
				<div className="sk-list-line" style={{ padding: "12px 0 4px" }}>
					<button type="button" className="btn gold" id="save-tax-rules" disabled={!rulesDirty} onClick={() => svc.settings.saveMenuEntity("taxRules", rules)}>
						Save draft
					</button>
					<button type="button" className="btn out" disabled={!rulesDirty} onClick={() => setRules(saved)}>
						Discard
					</button>
				</div>
			</SectionCard>
			<DetailDrawer
				open={!!edit}
				wide
				title={edit?.id ? "Edit tax" : "Add tax"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-tax" onClick={save}>
							Save draft
						</button>
					</>
				}
			>
				{edit && (
					<>
						<TextRow id="tx-name" label="Name" help="For example VAT or Service levy." value={edit.name} max={40} autoFocus onChange={(name) => setEdit((x) => ({ ...x, name }))} error={touched && error.startsWith("Enter a name") ? error : ""} />
						<ToggleRow id="tx-group" label="This is a tax group" help="A group applies several taxes to the same amount and shows each one on the receipt." value={edit.isGroup} onChange={(isGroup) => setEdit((x) => ({ ...x, isGroup }))} />
						{edit.isGroup ? (
							<SettingRow label="Taxes in this group" help="Only single taxes that already exist." wide error={touched && error.startsWith("Choose") ? error : ""}>
								<div className="sk-checks">
									{list.filter((t) => !t.isGroup && t.id !== edit.id).map((t) => (
										<label key={t.id}>
											<input type="checkbox" checked={edit.memberTaxIds.includes(t.id)} onChange={(e) => setEdit((x) => ({ ...x, memberTaxIds: e.target.checked ? [...x.memberTaxIds, t.id] : x.memberTaxIds.filter((i) => i !== t.id) }))} />
											<span>
												{t.name} ({t.rate}%)
											</span>
										</label>
									))}
									{!list.some((t) => !t.isGroup && t.id !== edit.id) && <p className="muted">Add single taxes first.</p>}
								</div>
							</SettingRow>
						) : (
							<NumberRow id="tx-rate" label="Rate" help="A percentage, up to 3 decimals." value={edit.rate} min={0} max={100} step={0.001} suffix="%" onChange={(rate) => setEdit((x) => ({ ...x, rate }))} error={touched && error.startsWith("Enter a rate") ? error : ""} />
						)}
						<ToggleRow id="tx-active" label="Active" help="An inactive tax is kept but not charged." value={edit.status === "active"} onChange={(on) => setEdit((x) => ({ ...x, status: on ? "active" : "inactive" }))} />
						{touched && error && !/^(Enter a (name|rate)|Choose)/.test(error) && <p className="sk-error" role="alert">{error}</p>}
						{preview && (
							<p className="sk-tax-preview" aria-live="polite">
								{money(preview.amount)} → tax {money(preview.tax)} → total {money(preview.total)}
							</p>
						)}
					</>
				)}
			</DetailDrawer>
		</>
	);
}


export function CategoriesAdmin() {
	const { settings, categories, products, subcategories } = useData();
	const { svc, go, canView } = usePos();
	const [edit, setEdit] = useState(null); // { row, name, description, deleteApprovalOn, graceSeconds }
	const [removing, setRemoving] = useState(null); // { row, moveTo }
	const subsOn = useFeature("catalogue.subcategories");
	const [touched, setTouched] = useState(false);
	const live = useMemo(() => visibleProductCategories(categories, products, subcategories, settings.userCategories || []).sort((a, b) => a.localeCompare(b)), [categories, products, subcategories, settings.userCategories]);
	const edits = draftList(settings, "categoryEdits");
	const rows = useMemo(() => workingCategories(live, edits), [live, edits]);
	const rules = useMemo(() => new Map(workingOf(settings, "categorySettings").map((c) => [c.id, c])), [settings]);
	const taxes = workingOf(settings, "taxes");
	const taxRules = cleanTaxRules(workingOf(settings, "taxRules")[0] || {});
	const count = (r) => products.filter((p) => categoryKey(p.category) === categoryKey(r.original || r.name)).length;
	const taxOf = (r) => taxes.find((t) => t.id === (taxRules.categoryTaxes[categoryKey(r.original || r.name)]?.tax || taxRules.defaultTaxId))?.name || "None";
	const others = (r) => rows.filter((x) => x !== r);
	const nameClash = edit && rows.some((x) => x.key !== edit.row.key && x.state !== "removed" && categoryKey(x.name) === categoryKey(edit.name));
	const error = edit ? (!edit.name.trim() ? "Enter a name." : nameClash ? "There is already a category called " + edit.name.trim() + "." : "") : "";
	const close = () => (setEdit(null), setTouched(false));
	const open = (r) => {
		const c = rules.get(categoryKey(r.original || r.name));
		const subs = r.original ? workingSubcategories(subcategories, draftList(settings, "subcategoryEdits"), categoryKey(r.original)).filter((s) => s.state !== "removed").map((s) => ({ id: s.id, name: s.name })) : [];
		setEdit({ row: r, subs, name: r.name, description: c?.description || "", deleteApprovalOn: !!c?.deleteApprovalOn, graceSeconds: c ? c.graceSeconds : DEFAULT_GRACE });
	};
	const save = async () => {
		setTouched(true);
		if (error) return;
		const r = edit.row;
		if (!(await svc.settings.saveMenuEntity("categoryEdits", { id: r.state === "added" ? r.key : undefined, original: r.original, name: edit.name }))) return;
		if (r.original && (subsOn || edit.subs.length || draftList(settings, "subcategoryEdits").some((x) => x.group === categoryKey(r.original)))) {
			if (!(await svc.settings.saveMenuEntity("subcategoryEdits", { group: categoryKey(r.original), parent: edit.name.trim(), wanted: edit.subs }))) return;
		}
		if (r.original) await svc.settings.saveMenuEntity("categorySettings", { name: r.original, description: edit.description, deleteApprovalOn: edit.deleteApprovalOn, graceSeconds: edit.graceSeconds });
		close();
	};
	const undo = (r) => svc.settings.revertMenuEdit("categoryEdits", r.original ? categoryKey(r.original) : r.key);
	const stateBadge = (r) => ({ added: "New", renamed: "Renamed from " + r.original, removed: "Will be removed" })[r.state];
	return (
		<>
			<PageHeader
				title="Categories"
				description="The groups customers see on the register. Add, rename and remove them here as drafts; a description and the approval rule for removing sent items are saved with them."
				actions={
					<>
						<DraftBadge show={edits.length > 0 || hasDraft(settings, "categorySettings")} />
						{canView("products") && (
							<button type="button" className="btn out" onClick={() => go("products")}>
								Open Products & Services
							</button>
						)}
						<button type="button" className="btn gold" id="add-category" onClick={() => setEdit({ row: { state: "added", key: "", original: "", name: "" }, name: "", description: "", deleteApprovalOn: false, graceSeconds: DEFAULT_GRACE })}>
							Add category
						</button>
					</>
				}
			/>
			<SectionCard>
				{!rows.length ? (
					<EmptyState title="No categories yet">Add one, or create items in Products & Services.</EmptyState>
				) : (
					<ul className="sk-list">
						{rows.map((r) => {
							const c = rules.get(categoryKey(r.original || r.name));
							return (
								<li key={r.key + r.name} className="sk-list-row" data-category={r.name} style={r.state === "removed" ? { opacity: 0.6 } : undefined}>
									<div className="sk-list-main">
										<div className="sk-list-line">
											<strong>{r.name}</strong>
											{stateBadge(r) && <span className="sk-badge">{stateBadge(r)}</span>}
											<span className="muted">
												{count(r)} item{count(r) === 1 ? "" : "s"} · Tax: {taxOf(r)}
												{c?.deleteApprovalOn ? ` · Manager approval to remove sent items after ${c.graceSeconds}s` : ""}
											</span>
										</div>
										{c?.description && <p className="muted" style={{ margin: "2px 0 0" }}>{c.description}</p>}
									</div>
									<span className="sk-list-actions">
										{r.state === "removed" ? (
											<button type="button" className="btn out" onClick={() => undo(r)}>
												Undo
											</button>
										) : (
											<>
												<button type="button" className="btn out" onClick={() => open(r)}>
													Edit
												</button>
												<button type="button" className="btn danger" onClick={() => (r.state === "added" ? undo(r) : setRemoving({ row: r, moveTo: "" }))}>
													Remove
												</button>
											</>
										)}
									</span>
								</li>
							);
						})}
					</ul>
				)}
			</SectionCard>
			<DetailDrawer
				open={!!edit}
				wide
				title={edit?.row.state === "added" && !edit.row.key ? "Add category" : "Edit category"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-category" onClick={save}>
							Save draft
						</button>
					</>
				}
			>
				{edit && (
					<>
						<TextRow id="cat-name" label="Name" help="Renaming moves all of its items to the new name when you publish." value={edit.name} max={60} autoFocus onChange={(name) => setEdit((x) => ({ ...x, name }))} error={touched ? error : ""} />
						{edit.row.original ? (
							<>
								<TextAreaRow id="cat-desc" label="Description" help="Shown with the category online (Online is not built yet)." value={edit.description} max={300} onChange={(description) => setEdit((x) => ({ ...x, description }))} />
								<ToggleRow id="cat-approval" label="Manager approval to remove sent items" help="Once an order has been sent to the kitchen, taking items of this category off it needs a manager's PIN after the grace period. People allowed to remove sent items without a manager are not asked." value={edit.deleteApprovalOn} onChange={(on) => setEdit((x) => ({ ...x, deleteApprovalOn: on }))} />
								<ConditionalGroup show={edit.deleteApprovalOn}>
									<NumberRow id="cat-grace" label="Grace period" help="Seconds after sending during which an item can still be taken off freely." value={edit.graceSeconds} min={0} max={3600} suffix="seconds" onChange={(graceSeconds) => setEdit((x) => ({ ...x, graceSeconds }))} />
								</ConditionalGroup>
								{(subsOn || edit.subs.length > 0) && (
									<SettingRow label="Subcategories" help="A second row of buttons on the register under this category." wide error={subcategoryError(edit.subs)}>
										<div className="sk-options">
											{edit.subs.map((s, i) => (
												<div key={s.id || "n" + i} className="sk-option-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
													<input className="input" aria-label={"Subcategory " + (i + 1)} maxLength={60} value={s.name} onChange={(e) => setEdit((x) => ({ ...x, subs: x.subs.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)) }))} />
													<button type="button" className="btn out" aria-label={"Remove subcategory " + (i + 1)} onClick={() => setEdit((x) => ({ ...x, subs: x.subs.filter((_, j) => j !== i) }))}>
														Remove
													</button>
												</div>
											))}
											<button type="button" className="btn out" id="add-subcategory" onClick={() => setEdit((x) => ({ ...x, subs: [...x.subs, { id: "", name: "" }] }))}>
												Add subcategory
											</button>
										</div>
									</SettingRow>
								)}
								<SettingRow label="Tax" help="Set in Taxes, Tax by category." wide>
									<span>{taxOf(edit.row)}</span>
								</SettingRow>
							</>
						) : (
							<p className="muted">Add a description and the approval rule once this category is published.</p>
						)}
					</>
				)}
			</DetailDrawer>
			<DetailDrawer
				open={!!removing}
				wide
				title={removing ? "Remove " + removing.row.name : ""}
				onClose={() => setRemoving(null)}
				footer={
					<>
						<button type="button" className="btn out" onClick={() => setRemoving(null)}>
							Cancel
						</button>
						<button
							type="button"
							className="btn danger"
							id="confirm-remove-category"
							onClick={async () => {
								if (await svc.settings.saveMenuEntity("categoryEdits", { original: removing.row.original, name: removing.row.original, removed: true, moveTo: removing.moveTo })) setRemoving(null);
							}}
						>
							Remove on publish
						</button>
					</>
				}
			>
				{removing && (
					<>
						<p>
							{count(removing.row) ? `${count(removing.row)} item${count(removing.row) === 1 ? "" : "s"} in ${removing.row.name} must go somewhere. ` : ""}Nothing changes on the register until you publish.
						</p>
						{count(removing.row) > 0 && (
							<SelectRow id="cat-move" label="Move its items to" value={removing.moveTo} options={[{ value: "", label: UNCATEGORIZED }, ...remainingNames(others(removing.row)).filter((n) => n && categoryKey(n) !== categoryKey(removing.row.name)).map((n) => ({ value: n, label: n }))]} onChange={(moveTo) => setRemoving((x) => ({ ...x, moveTo }))} />
						)}
					</>
				)}
			</DetailDrawer>
		</>
	);
}

export function Items() {
	const { settings, products: liveProducts, categories: categoriesLive, modifiers, subcategories } = useData();
	const kdsOn = useFeature("checkout.kds");
	const products = useMemo(() => [...liveProducts.map((p) => withItemEdit(p, draftList(settings, "itemEdits"))), ...draftNewItems(draftList(settings, "itemEdits"))], [liveProducts, settings]);
	const { svc, go, canView } = usePos();
	const [q, setQ] = useState("");
	const [edit, setEdit] = useState(null);
	const overrides = useMemo(() => new Map(workingOf(settings, "itemSettings").map((i) => [i.id, i])), [settings]);
	const taxes = workingOf(settings, "taxes");
	const rules = cleanTaxRules(workingOf(settings, "taxRules")[0] || {});
	const salesOf = useMemo(() => new Map(workingOf(settings, "salesCategories").flatMap((c) => c.itemIds.map((i) => [i, c.name]))), [settings]);
	const taxName = (id) => (id === "none" ? "No tax" : taxes.find((t) => t.id === id)?.name || "");
	// the tax an item gets today (its own, else its category's, else the default) for the list
	const effective = (p) => {
		const o = overrides.get(String(p.id));
		const c = rules.categoryTaxes[categoryKey(p.category)];
		return taxName(o?.taxId || c?.tax || rules.defaultTaxId) || "None";
	};
	const groups = useMemo(() => {
		const term = q.trim().toLowerCase();
		const by = new Map();
		for (const p of products) {
			if (term && !(p.name + " " + (p.code || "")).toLowerCase().includes(term)) continue;
			const k = p.category || "Uncategorised";
			if (!by.has(k)) by.set(k, []);
			by.get(k).push(p);
		}
		return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	}, [products, q]);
	const options = [{ value: "none", label: "No tax" }, ...taxes.filter((t) => t.status === "active").map((t) => ({ value: t.id, label: t.name }))];
	const tax = edit ? taxes.find((t) => t.id === (edit.taxId || rules.categoryTaxes[categoryKey(edit.product.category)]?.tax || rules.defaultTaxId)) : null;
	const withTax = tax && tax.status === "active" ? previewTax(tax, taxes, +edit.product.price || 0) : null;
	const itemEdits = draftList(settings, "itemEdits");
	const catRows = workingCategories(useMemo(() => productCategories(categoriesLive, liveProducts).sort((a, b) => a.localeCompare(b)), [categoriesLive, liveProducts]), draftList(settings, "categoryEdits"));
	const catNames = remainingNames(catRows);
	const stationList = kitchenStations(settings, kdsOn);
	const groupList = workingGroups(modifiers, draftList(settings, "groupEdits")).filter((g) => g.state !== "removed");
	const subNames = (cat) => {
		const row = catRows.find((r) => r.name === cat);
		return workingSubcategories(subcategories, draftList(settings, "subcategoryEdits"), categoryKey(row?.original || cat)).filter((s) => s.state !== "removed").map((s) => s.name);
	};
	const open = (p) => {
		const w = withItemEdit(p, itemEdits);
		const base = { name: w.name, price: String(w.price), cost: String(w.cost), category: effectiveCategory(catRows, w.category), subcategory: w.subcategory || "", code: w.code || "", description: w.description || "", stationIds: (w.stationIds || []).map(String), modifierIds: (w.modifierIds || []).map(String) };
		setEdit({ product: w, isNew: !!p.isDraft, ...cleanItemSetting({ ...(overrides.get(String(p.id)) || {}), id: String(p.id) }), details: base });
	};
	const addNew = () => setEdit({ product: { id: "", name: "", price: 0, category: "" }, isNew: true, ...cleanItemSetting({ id: "" }), id: "", details: { name: "", price: "", cost: "", category: catNames[0] || "", subcategory: "", code: "", description: "", stationIds: [], modifierIds: [] } });
	const close = () => setEdit(null);
	const save = async () => {
		const ok = await svc.settings.saveMenuEntity("itemEdits", { id: edit.id, isNew: edit.isNew, ...edit.details });
		// tax and names can be set once the item exists on the register (a new item is created on Publish)
		if (ok && (edit.isNew || (await svc.settings.saveMenuEntity("itemSettings", edit)))) close();
	};
	const toggleIn = (k, id) => setEdit((x) => ({ ...x, details: { ...x.details, [k]: x.details[k].includes(id) ? x.details[k].filter((i) => i !== id) : [...x.details[k], id] } }));
	const setDetail = (k) => (v) => setEdit((x) => ({ ...x, details: { ...x.details, [k]: v } }));
	const name = (n) => (n.length > 24 ? n.slice(0, 24) + "…" : n);
	return (
		<>
			<PageHeader
				title="Items"
				description="Add items and edit their details, stations, modifier groups, own tax and the names used on kitchen tickets and receipts. Photos and stock counts are edited in Products & Services."
				actions={
					<>
						<DraftBadge show={hasDraft(settings, "itemSettings") || itemEdits.length > 0} />
						<button type="button" className="btn gold" id="add-item" onClick={addNew}>
							Add item
						</button>
						{canView("products") && (
							<button type="button" className="btn out" onClick={() => go("products")}>
								Open Products & Services
							</button>
						)}
					</>
				}
			/>
			<SectionCard>
				<input className="input" type="search" placeholder="Search items" aria-label="Search items" value={q} onChange={(e) => setQ(e.target.value)} />
				{!products.length && <EmptyState title="No items yet">Add items in Products & Services first.</EmptyState>}
				{products.length > 0 && !groups.length && <p className="muted">No items match.</p>}
				{groups.map(([cat, list]) => (
					<details key={cat} className="sk-tree-group" open={!!q}>
						<summary>
							<span>{cat}</span>
							<span className="muted">{list.length}</span>
						</summary>
						<ul className="sk-item-list">
							{list.map((p) => {
								const o = overrides.get(String(p.id));
								return (
									<li key={p.id} data-item={p.id}>
										<span className="sk-item-name">
											<strong>{name(p.name)}</strong>
											{o && <span className="sk-badge">Customised</span>}
											{p.isDraft ? <span className="sk-badge">New</span> : itemEdits.some((e) => e.id === String(p.id)) && <span className="sk-badge">Edited</span>}
										</span>
										<span className="muted">
											{money(p.price)} · Tax: {effective(p)} · {salesOf.get(String(p.id)) || "No sales category"}
										</span>
										<button type="button" className="btn out" onClick={() => open(p)}>
											Edit
										</button>
									</li>
								);
							})}
						</ul>
					</details>
				))}
			</SectionCard>
			<DetailDrawer
				open={!!edit}
				wide
				title={edit?.id ? edit.details.name || "Item" : "Add item"}
				subtitle={edit?.id ? edit.details.category + " · " + money(+edit.details.price || 0) : "Created on the register when you publish"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-item" onClick={save}>
							Save draft
						</button>
					</>
				}
			>
				{edit && (
					<>
						<SectionCard title="Details" description="Applied to the live item when you publish. Photos and stock counts are edited in Products & Services.">
							<TextRow id="it-name" label="Name" value={edit.details.name} max={80} onChange={setDetail("name")} />
							<NumberRow id="it-price" label="Selling price" value={edit.details.price} min={0} step={0.01} onChange={(v) => setDetail("price")(v === "" ? "" : String(v))} />
							<NumberRow id="it-cost" label="Cost price" value={edit.details.cost} min={0} step={0.01} onChange={(v) => setDetail("cost")(v === "" ? "" : String(v))} />
							<SelectRow id="it-category" label="Category" value={edit.details.category} options={catNames.map((n) => ({ value: n, label: n }))} onChange={setDetail("category")} />
							<SelectRow id="it-sub" label="Subcategory" value={edit.details.subcategory} options={[{ value: "", label: "None" }, ...subNames(edit.details.category).map((n) => ({ value: n, label: n }))]} onChange={setDetail("subcategory")} />
							<TextRow id="it-code" label="Item code" help="Used for barcode and lookup." value={edit.details.code} max={40} onChange={setDetail("code")} />
							<TextAreaRow id="it-desc" label="Description" value={edit.details.description} max={200} onChange={setDetail("description")} />
						</SectionCard>
						<SectionCard title="Kitchen and modifiers">
							<SettingRow label="Stations" help="Where this item's kitchen tickets go. With none chosen it goes to the first station." wide>
								<div className="sk-checks">
									{stationList.map((s) => (
										<label key={s.id}>
											<input type="checkbox" checked={edit.details.stationIds.includes(s.id)} onChange={() => toggleIn("stationIds", s.id)} />
											<span>{s.name}</span>
										</label>
									))}
									{!stationList.length && <p className="muted">No stations yet. Add them on the Stations page.</p>}
								</div>
							</SettingRow>
							<SettingRow label="Modifier groups" help="Groups staff pick from when adding this item." wide>
								<div className="sk-checks">
									{groupList.map((g) => (
										<label key={g.id}>
											<input type="checkbox" checked={edit.details.modifierIds.includes(g.id)} onChange={() => toggleIn("modifierIds", g.id)} />
											<span>{g.name}</span>
										</label>
									))}
									{!groupList.length && <p className="muted">No modifier groups yet.</p>}
								</div>
							</SettingRow>
						</SectionCard>
						{edit.isNew ? <p className="muted">Tax and the kitchen and receipt names can be set once the item has been published.</p> : (<>
						<SelectRow id="it-tax" label="Tax" help="Leave on the category tax to follow Taxes, Tax by category." value={edit.taxId} options={[{ value: "", label: "Follow the category" }, ...options]} onChange={(taxId) => setEdit((x) => ({ ...x, taxId }))} />
						{rules.takeawayOn && <SelectRow id="it-take" label="Takeaway tax" help="Used on takeaway orders. Blank uses the tax above." value={edit.takeawayTaxId} options={[{ value: "", label: "Same as the tax above" }, ...options]} onChange={(takeawayTaxId) => setEdit((x) => ({ ...x, takeawayTaxId }))} />}
						{withTax && (
							<SettingRow label="Price with tax" help="Worked out from the tax above. Read only." wide>
								<strong>{money(round2(withTax.total))}</strong>
							</SettingRow>
						)}
						<TextRow id="it-prep" label="Prep ticket name" help="The name on kitchen tickets and the kitchen screen. Blank uses the item name." value={edit.prepTicketName} max={60} onChange={(prepTicketName) => setEdit((x) => ({ ...x, prepTicketName }))} />
						<TextRow id="it-receipt" label="Receipt name" help="The name on receipts. Blank uses the item name." value={edit.receiptName} max={60} onChange={(receiptName) => setEdit((x) => ({ ...x, receiptName }))} />
						</>)}
					</>
				)}
			</DetailDrawer>
		</>
	);
}

export function ModifiersAdmin() {
	const { settings, modifiers, products } = useData();
	const { svc, go, canView } = usePos();
	const [tab, setTab] = useState("groups");
	const [group, setGroup] = useState(null); // a modifier group being added or edited as a draft
	const [groupTouched, setGroupTouched] = useState(false);
	const groupEdits = draftList(settings, "groupEdits");
	const groupRows = useMemo(() => workingGroups(modifiers, groupEdits), [modifiers, groupEdits]);
	const groupError = group ? groupEditError(cleanGroupEdit({ ...group, id: group.id || "new" }), groupRows.filter((g) => g.state !== "removed" && g.id !== group.id)) : "";
	const saveGroup = async () => {
		setGroupTouched(true);
		if (groupError) return;
		if (await svc.settings.saveMenuEntity("groupEdits", group)) (setGroup(null), setGroupTouched(false));
	};
	const setOption = (i, next) => setGroup((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? { ...o, ...next } : o)) }));
	const [limit, setLimit] = useState(null);
	const [edit, setEdit] = useState(null);
	const [touched, setTouched] = useState(false);
	const limits = useMemo(() => new Map(workingOf(settings, "modifierLimits").map((l) => [l.id, l])), [settings]);
	const globals = workingOf(settings, "globalModifiers");
	const savedPrefixes = useMemo(() => (workingOf(settings, "modifierPrefixes")[0]?.prefixes?.length ? workingOf(settings, "modifierPrefixes")[0].prefixes : DEFAULT_PREFIXES), [settings]);
	const [prefixes, setPrefixes] = useState(savedPrefixes);
	const [newPrefix, setNewPrefix] = useState("");
	useEffect(() => setPrefixes(savedPrefixes), [savedPrefixes]);
	const prefixDirty = JSON.stringify(prefixes) !== JSON.stringify(savedPrefixes);
	const assigned = (g) => products.filter((p) => (p.modifierIds || []).includes(g.id)).length;
	const rule = (g) => {
		const l = limits.get(g.id);
		if (g.mode !== "multiple") return "Choose one";
		return l ? "Choose " + [l.min && "at least " + l.min, l.max && "up to " + l.max].filter(Boolean).join(", ") : "Choose any";
	};
	const clean = edit ? cleanGlobalModifier({ ...edit, id: edit.id || "new" }) : null;
	const error = clean ? globalModifierError(clean, globals.filter((m) => m.id !== edit.id)) : "";
	const close = () => (setEdit(null), setTouched(false));
	const save = async () => {
		setTouched(true);
		if (error) return;
		if (await svc.settings.saveMenuEntity("globalModifiers", edit)) close();
	};
	const addPrefix = () => {
		const v = newPrefix.trim();
		if (v && !prefixes.some((x) => x.toLowerCase() === v.toLowerCase())) setPrefixes([...prefixes, v.slice(0, 12)]);
		setNewPrefix("");
	};
	const limitErr = limit ? limitError(cleanLimit(limit), modifiers.find((m) => m.id === limit.id)) : "";
	return (
		<>
			<PageHeader
				title="Modifiers"
				description="Selection limits for modifier groups, and global modifiers staff can add to any item."
				actions={
					<>
						<DraftBadge show={hasDraft(settings, "modifierLimits") || hasDraft(settings, "globalModifiers") || hasDraft(settings, "modifierPrefixes")} />
						{tab === "groups" && (
							<button type="button" className="btn gold" id="add-group" onClick={() => setGroup({ id: "", name: "", mode: "single", required: true, options: [{ name: "", price: 0 }] })}>
								Add modifier group
							</button>
						)}
						{tab === "global" && (
							<button type="button" className="btn gold" id="add-global" onClick={() => setEdit({ id: "", name: "", price: "", status: "active" })}>
								Add global modifier
							</button>
						)}
					</>
				}
			/>
			<div className="sk-tabs" role="tablist">
				{[["groups", "Modifier groups"], ["global", "Global modifiers"]].map(([k, label]) => (
					<button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
						{label}
					</button>
				))}
			</div>
			{tab === "groups" ? (
				<SectionCard description="Groups are created and assigned to items in the Modifier Groups and Products screens. Here you set how many options staff must or may pick.">
					{canView("modifiers") && (
						<p>
							<button type="button" className="sk-link" onClick={() => go("modifiers")}>
								Open Modifier Groups
							</button>
						</p>
					)}
					{!groupRows.length ? (
						<EmptyState title="No modifier groups yet">Add a group, for example Size or Toppings.</EmptyState>
					) : (
						<ul className="sk-list">
							{groupRows.map((g) => (
								<li key={g.id} className="sk-list-row" data-group={g.id}>
									<div className="sk-list-main">
										<div className="sk-list-line">
											<strong>{g.name}</strong>
											{g.state !== "live" && <span className="sk-badge">{{ added: "New", edited: "Edited", removed: "Will be removed" }[g.state]}</span>}
											<span className="muted">
												{g.options.length} option{g.options.length === 1 ? "" : "s"} · {g.required === false ? "Optional" : "Required"} · {rule(g)} · {assigned(g)} item{assigned(g) === 1 ? "" : "s"}
											</span>
										</div>
									</div>
									<span className="sk-list-actions">
										{g.state === "removed" ? (
											<button type="button" className="btn out" onClick={() => svc.settings.revertMenuEdit("groupEdits", g.id)}>
												Undo
											</button>
										) : (
											<>
												<button type="button" className="btn out" onClick={() => setGroup({ id: g.id, name: g.name, mode: g.mode, required: g.required !== false, options: g.options.map((o) => ({ name: o.name, price: +o.price || 0 })) })}>
													Edit
												</button>
												<button type="button" className="btn danger" onClick={() => (g.state === "added" ? svc.settings.revertMenuEdit("groupEdits", g.id) : svc.settings.saveMenuEntity("groupEdits", { id: g.id, removed: true }))}>
													Remove
												</button>
											</>
										)}
										<button type="button" className="btn out" disabled={g.mode !== "multiple" || g.state === "added" || g.state === "removed"} title={g.mode !== "multiple" ? "Limits apply to groups where several options can be chosen" : ""} onClick={() => setLimit({ id: g.id, min: limits.get(g.id)?.min || 0, max: limits.get(g.id)?.max || 0 })}>
											Limits
										</button>
									</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			) : (
				<>
					<SectionCard title="Global modifiers" description="Extras available on every item when Enable global modifiers is on in Order Entry. Staff add them as an instruction plus an option, for example No onion or Extra sauce.">
						{!globals.length ? (
							<EmptyState title="No global modifiers yet">Add options such as onion, sauce or ice.</EmptyState>
						) : (
							<SortableList
								items={globals}
								label="Global modifier"
								onReorder={(ids) => svc.settings.reorderMenuEntities("globalModifiers", ids)}
								render={(m) => (
									<div className="sk-list-line" data-global={m.id}>
										<strong>{m.name}</strong>
										<span className="muted">{m.price ? "+" + money(m.price) : "No charge"}</span>
										<StatusBadge status={m.status} />
										<span className="sk-list-actions">
											<button type="button" className="btn out" onClick={() => setEdit(cleanGlobalModifier(m))}>
												Edit
											</button>
											<button type="button" className="btn danger" onClick={() => svc.settings.deleteMenuEntity("globalModifiers", m.id)}>
												Remove
											</button>
										</span>
									</div>
								)}
							/>
						)}
					</SectionCard>
					<SectionCard title="Instruction prefixes" description="The words staff put in front of a global modifier.">
						<div className="sk-chips">
							{prefixes.map((x) => (
								<span key={x} className="sk-chip">
									{x}
									<button type="button" aria-label={"Remove " + x} onClick={() => setPrefixes(prefixes.filter((y) => y !== x))}>
										×
									</button>
								</span>
							))}
						</div>
						<div className="sk-inline" style={{ padding: "8px 0" }}>
							<input className="input" aria-label="New prefix" placeholder="New prefix" maxLength={12} value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPrefix())} />
							<button type="button" className="btn out" onClick={addPrefix} disabled={!newPrefix.trim()}>
								Add
							</button>
						</div>
						<div className="sk-list-line" style={{ padding: "4px 0" }}>
							<button type="button" className="btn gold" id="save-prefixes" disabled={!prefixDirty} onClick={() => svc.settings.saveMenuEntity("modifierPrefixes", cleanPrefixes({ prefixes }))}>
								Save draft
							</button>
							<button type="button" className="btn out" disabled={!prefixDirty} onClick={() => setPrefixes(savedPrefixes)}>
								Discard
							</button>
						</div>
					</SectionCard>
				</>
			)}
			<DetailDrawer
				open={!!group}
				wide
				title={group?.id ? "Edit modifier group" : "Add modifier group"}
				subtitle="Applied to the live group when you publish. Assign groups to items in Products & Services."
				onClose={() => (setGroup(null), setGroupTouched(false))}
				footer={
					<>
						<button type="button" className="btn out" onClick={() => (setGroup(null), setGroupTouched(false))}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-group" onClick={saveGroup}>
							Save draft
						</button>
					</>
				}
			>
				{group && (
					<>
						<TextRow id="mg-name" label="Name" help="For example Size or Toppings." value={group.name} max={40} autoFocus onChange={(name) => setGroup((x) => ({ ...x, name }))} error={groupTouched && groupError.startsWith("Enter") ? groupError : groupTouched && groupError.startsWith("There is") ? groupError : ""} />
						<SelectRow id="mg-mode" label="Choices" value={group.mode} options={[{ value: "single", label: "Choose one" }, { value: "multiple", label: "Choose several" }]} onChange={(mode) => setGroup((x) => ({ ...x, mode }))} />
						<ToggleRow id="mg-required" label="Required" help="Staff must choose before the item is added." value={group.required} onChange={(required) => setGroup((x) => ({ ...x, required }))} />
						<SettingRow label="Options" help="The name and extra price of each choice." wide error={groupTouched && /option|Add at least/.test(groupError) ? groupError : ""}>
							<div className="sk-options">
								{group.options.map((o, i) => (
									<div key={i} className="sk-option-row">
										<input className="input" aria-label={"Option " + (i + 1) + " name"} placeholder="Name" maxLength={40} value={o.name} onChange={(e) => setOption(i, { name: e.target.value })} />
										<input className="input" aria-label={"Option " + (i + 1) + " extra price"} type="number" inputMode="decimal" min="0" step="0.01" placeholder="Extra price" value={o.price} onChange={(e) => setOption(i, { price: e.target.value === "" ? "" : Number(e.target.value) })} />
										<button type="button" className="btn out" aria-label={"Remove option " + (i + 1)} disabled={group.options.length < 2} onClick={() => setGroup((x) => ({ ...x, options: x.options.filter((_, j) => j !== i) }))}>
											Remove
										</button>
									</div>
								))}
								<button type="button" className="btn out" onClick={() => setGroup((x) => ({ ...x, options: [...x.options, { name: "", price: 0 }] }))}>
									Add option
								</button>
							</div>
						</SettingRow>
					</>
				)}
			</DetailDrawer>
			<DetailDrawer
				open={!!limit}
				wide
				title={limit ? modifiers.find((m) => m.id === limit.id)?.name || "Group" : ""}
				subtitle="Selection limits"
				onClose={() => setLimit(null)}
				footer={
					<>
						<button type="button" className="btn out" onClick={() => setLimit(null)}>
							Cancel
						</button>
						<button
							type="button"
							className="btn gold"
							id="save-limit"
							onClick={async () => {
								if (await svc.settings.saveMenuEntity("modifierLimits", limit)) setLimit(null);
							}}
						>
							Save draft
						</button>
					</>
				}
			>
				{limit && (
					<>
						<NumberRow id="ml-min" label="Minimum choices" help="Staff must pick at least this many (0 = no minimum)." value={limit.min} min={0} max={20} onChange={(min) => setLimit((x) => ({ ...x, min }))} />
						<NumberRow id="ml-max" label="Maximum choices" help="Staff can pick up to this many (0 = no limit)." value={limit.max} min={0} max={20} onChange={(max) => setLimit((x) => ({ ...x, max }))} />
						{limitErr && <p className="sk-error" role="alert">{limitErr}</p>}
					</>
				)}
			</DetailDrawer>
			<DetailDrawer
				open={!!edit}
				wide
				title={edit?.id ? "Edit global modifier" : "Add global modifier"}
				onClose={close}
				footer={
					<>
						<button type="button" className="btn out" onClick={close}>
							Cancel
						</button>
						<button type="button" className="btn gold" id="save-global" onClick={save}>
							Save draft
						</button>
					</>
				}
			>
				{edit && (
					<>
						<TextRow id="gm-name" label="Name" help="For example Onion, Sauce or Ice." value={edit.name} max={40} autoFocus onChange={(name) => setEdit((x) => ({ ...x, name }))} error={touched ? error : ""} />
						<NumberRow id="gm-price" label="Extra charge" help="Added to the price each time it is used. Leave 0 for no charge." value={edit.price} min={0} step={0.01} onChange={(price) => setEdit((x) => ({ ...x, price }))} />
						<ToggleRow id="gm-active" label="Active" help="An inactive modifier is kept but not offered." value={edit.status === "active"} onChange={(on) => setEdit((x) => ({ ...x, status: on ? "active" : "inactive" }))} />
					</>
				)}
			</DetailDrawer>
		</>
	);
}

/** A page with two views: the Menu Admin drafts, and the full live editor that Products & Services and Modifiers used to be. */
function TwoViews({ first, second, a, b, note }) {
	const [tab, setTab] = useState("a");
	return (
		<>
			<div className="sk-tabs" role="tablist">
				{[["a", first], ["b", second]].map(([k, label]) => (
					<button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
						{label}
					</button>
				))}
			</div>
			{tab === "b" && <p className="muted">{note}</p>}
			{tab === "a" ? a : b}
		</>
	);
}
export const ItemsPage = () => (
	<TwoViews first="Items" second="Catalogue tools" a={<Items />} b={<CatalogueEditor />} note="The full item list and editor: photos, stock counts, barcodes and labels, import and export, delete. Changes here save straight away and are not drafts." />
);
export const ModifiersPage = () => (
	<TwoViews first="Limits and global modifiers" second="Group editor" a={<ModifiersAdmin />} b={<ModifierGroupEditor />} note="The full modifier group editor. Changes here save straight away and are not drafts." />
);

export const MENU_ADMIN_COMPONENTS = { categories: CategoriesAdmin, modifiers: ModifiersPage, salesCategories: SalesCategories, availability: Availability, taxes: Taxes, items: ItemsPage };

/** The Menu Admin pages for the account admin portal (/admin): one page at a time with the same publish bar as in Settings. */
export function MenuAdminPortal({ page }) {
	const Page = MENU_ADMIN_COMPONENTS[page] || MENU_ADMIN_COMPONENTS.items;
	return (
		<section className="view active sk-main" id="view-menu-admin">
			<div className="sk-main-body">
				<Page />
			</div>
			<PublishBar />
		</section>
	);
}
