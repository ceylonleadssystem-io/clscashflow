/**
 * Settings > Menu Admin: Sales Categories and Availability. Both save a draft; the publish bar at the bottom puts every draft on the
 * POS at once (see domain/menuAdmin.js).
 */
import { useMemo, useState } from "react";
import { AssignmentTree } from "../../components/settings/kit/AssignmentTree";
import { DetailDrawer, EmptyState, SortableList, StatusBadge } from "../../components/settings/kit/entities";
import { PageHeader, SectionCard, SettingRow, TextRow, ToggleRow } from "../../components/settings/kit/rows";
import { categoryKey, visibleProductCategories } from "../../domain/catalog";
import { WEEKDAYS, cleanMenu, cleanSalesCategory, hasDraft, hoursSummary, menuError, overlappingMenus, salesCategoryError, workingOf } from "../../domain/menuAdmin";
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

export const MENU_ADMIN_COMPONENTS = { salesCategories: SalesCategories, availability: Availability };
