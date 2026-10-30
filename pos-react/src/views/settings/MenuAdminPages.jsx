/**
 * Settings > Menu Admin: Sales Categories and Availability. Both save a draft; the publish bar at the bottom puts every draft on the
 * POS at once (see domain/menuAdmin.js).
 */
import { useEffect, useMemo, useState } from "react";
import { AssignmentTree } from "../../components/settings/kit/AssignmentTree";
import { DetailDrawer, EmptyState, SortableList, StatusBadge } from "../../components/settings/kit/entities";
import { NumberRow, PageHeader, SectionCard, SelectRow, SettingRow, TextRow, ToggleRow } from "../../components/settings/kit/rows";
import { categoryKey, visibleProductCategories } from "../../domain/catalog";
import { WEEKDAYS, cleanItemSetting, cleanMenu, cleanSalesCategory, hasDraft, hoursSummary, menuError, overlappingMenus, salesCategoryError, workingOf } from "../../domain/menuAdmin";
import { money } from "../../domain/format";
import { cleanTax, cleanTaxRules, previewTax, round2, taxError } from "../../domain/taxes";
import { useData } from "../../store/DataProvider";
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

export function Items() {
	const { settings, products } = useData();
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
	const open = (p) => setEdit({ product: p, ...cleanItemSetting({ ...(overrides.get(String(p.id)) || {}), id: String(p.id) }) });
	const close = () => setEdit(null);
	const save = async () => {
		if (await svc.settings.saveMenuEntity("itemSettings", edit)) close();
	};
	const name = (n) => (n.length > 24 ? n.slice(0, 24) + "…" : n);
	return (
		<>
			<PageHeader
				title="Items"
				description="Per-item tax and the names used on kitchen tickets and receipts. Name, price, stock and photos are edited in Products & Services."
				actions={
					<>
						<DraftBadge show={hasDraft(settings, "itemSettings")} />
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
				title={edit?.product.name || "Item"}
				subtitle={edit ? edit.product.category + " · " + money(edit.product.price) : ""}
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
						<SelectRow id="it-tax" label="Tax" help="Leave on the category tax to follow Taxes, Tax by category." value={edit.taxId} options={[{ value: "", label: "Follow the category" }, ...options]} onChange={(taxId) => setEdit((x) => ({ ...x, taxId }))} />
						{rules.takeawayOn && <SelectRow id="it-take" label="Takeaway tax" help="Used on takeaway orders. Blank uses the tax above." value={edit.takeawayTaxId} options={[{ value: "", label: "Same as the tax above" }, ...options]} onChange={(takeawayTaxId) => setEdit((x) => ({ ...x, takeawayTaxId }))} />}
						{withTax && (
							<SettingRow label="Price with tax" help="Worked out from the tax above. Read only." wide>
								<strong>{money(round2(withTax.total))}</strong>
							</SettingRow>
						)}
						<TextRow id="it-prep" label="Prep ticket name" help="The name on kitchen tickets and the kitchen screen. Blank uses the item name." value={edit.prepTicketName} max={60} onChange={(prepTicketName) => setEdit((x) => ({ ...x, prepTicketName }))} />
						<TextRow id="it-receipt" label="Receipt name" help="The name on receipts. Blank uses the item name." value={edit.receiptName} max={60} onChange={(receiptName) => setEdit((x) => ({ ...x, receiptName }))} />
					</>
				)}
			</DetailDrawer>
		</>
	);
}

export const MENU_ADMIN_COMPONENTS = { salesCategories: SalesCategories, availability: Availability, taxes: Taxes, items: Items };
