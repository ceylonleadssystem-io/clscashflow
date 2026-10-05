/**
 * Tables page: the restaurant floor plan. Staff tap a table to open its check (or start one); owners press Edit to
 * add, drag, resize, reshape, activate/deactivate and delete tables. The layout is saved in settings.tableLayout.
 */
import { useMemo, useRef, useState } from "react";
import { money } from "../domain/format";
import { orderTotal } from "../domain/orders";
import { GRID, TABLE_SHAPES, normalizeTable, nextTableNumber, tableNumberError, tableReference, tableStatus } from "../domain/tables";
import { OWNER_ROLES } from "../config/roles";
import { newId } from "../services/pos/common";
import { useData } from "../store/DataProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";
import { Modal, ModalBody, Panel } from "../components/ui";
import { MoveCheckModal } from "../modals/MoveCheckModal";
import { useFeature } from "../store/FeatureProvider";

const SHAPE_LABEL = { square: "Square", round: "Round", rect: "Rectangle" };

/** Restaurant floor plan with an owner-only layout editor. */
export function Tables() {
	const data = useData();
	const ui = useUi();
	const { currentUser, svc } = usePos();
	const { loadOpenOrder, splitOpenOrder, newOpenOrder, setOrderReference, setOrderChannel } = useCheckout();
	const canSplit = useFeature("checkout.splitBill");
	const [action, setAction] = useState(null); // busy table tapped: its open order
	const [moving, setMoving] = useState(null); // open order being moved / merged
	const saved = useMemo(() => (data.settings.tableLayout || []).map(normalizeTable), [data.settings.tableLayout]);
	const [draft, setDraft] = useState(null); // null = not editing
	const [selectedId, setSelectedId] = useState("");
	const [error, setError] = useState("");
	const floorRef = useRef(null);
	const editing = !!draft;
	const tables = draft || saved;
	const selected = tables.find((t) => t.id === selectedId) || null;
	const canEdit = OWNER_ROLES.includes(currentUser?.role);
	const dirty = editing && JSON.stringify(draft) !== JSON.stringify(saved);

	const update = (id, patch) => setDraft((d) => d.map((t) => (t.id === id ? normalizeTable({ ...t, ...patch }) : t)));

	const addTable = () => {
		const t = normalizeTable({ id: newId("tbl"), number: nextTableNumber(draft), seats: 4, shape: "square", x: 20, y: 20, w: 100 });
		setDraft([...draft, t]);
		setSelectedId(t.id);
	};

	const save = async () => {
		const bad = draft.map((t) => tableNumberError(draft, t)).find(Boolean);
		if (bad) return void setError(bad);
		setError("");
		await svc.settings.patchSettings({ tableLayout: draft });
		ui.notice("Table layout saved.");
	};

	const done = async () => {
		if (dirty && !(await ui.confirm("Leave without saving your table changes?"))) return;
		setDraft(null);
		setSelectedId("");
		setError("");
	};

	const remove = async () => {
		if (!(await ui.confirm("Delete table " + selected.number + "?"))) return;
		setDraft(draft.filter((t) => t.id !== selected.id));
		setSelectedId("");
	};

	// Drag (mode "move") or resize from the bottom-right handle (mode "size"); pointer capture keeps it smooth.
	const startDrag = (e, t, mode) => {
		if (!editing) return;
		e.stopPropagation();
		setSelectedId(t.id);
		const scale = GRID.w / floorRef.current.getBoundingClientRect().width;
		const from = { x: e.clientX, y: e.clientY, t };
		const move = (ev) => {
			const dx = (ev.clientX - from.x) * scale;
			const dy = (ev.clientY - from.y) * scale;
			update(t.id, mode === "move" ? { x: from.t.x + dx, y: from.t.y + dy } : { w: from.t.w + dx, h: from.t.h + dy });
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};

	const openTable = (t) => {
		const { open } = tableStatus(t, data.openOrders);
		if (open) return setAction({ table: t, order: open });
		newOpenOrder();
		setOrderReference(tableReference(t));
		setOrderChannel("Dine-in");
	};

	return (
		<section className="view active" id="view-tables">
			<Panel
				title="Table Layout"
				subtitle={editing ? "Drag to move, use the corner arrow to resize, click a table to edit it" : "Tap a free table to start its check, or a busy table to open, split, move or merge it"}
				actions={
					editing ? (
						<div className="tools">
							<button className="btn out" id="table-add" onClick={addTable}>+ Add Table</button>
							<button className="btn gold" id="table-save" onClick={save} disabled={!dirty}>Save</button>
							<button className="btn" id="table-done" onClick={done}>Done Editing</button>
						</div>
					) : (
						canEdit && (
							<button className="btn out" id="table-edit" onClick={() => setDraft(saved)}>Edit</button>
						)
					)
				}
			>
				{error && <div className="login-error">{error}</div>}
				<div className="floor-wrap">
					<div
						className={"floor" + (editing ? " editing" : "")}
						ref={floorRef}
						style={{ aspectRatio: GRID.w + " / " + GRID.h }}
						onPointerDown={() => setSelectedId("")}
					>
						{tables.map((t) => {
							const { open } = tableStatus(t, data.openOrders);
							const cls = ["floor-table", t.shape, !t.active && "inactive", open && "busy", t.id === selectedId && "selected"];
							return (
								<div
									key={t.id}
									className={cls.filter(Boolean).join(" ")}
									data-table={t.number}
									style={{ left: (t.x / GRID.w) * 100 + "%", top: (t.y / GRID.h) * 100 + "%", width: (t.w / GRID.w) * 100 + "%", height: (t.h / GRID.h) * 100 + "%" }}
									onPointerDown={(e) => startDrag(e, t, "move")}
									onClick={() => (editing ? setSelectedId(t.id) : t.active && openTable(t))}
								>
									<strong>{t.number}</strong>
									<span>{t.active ? t.seats + " seats" : "Not for seating"}</span>
									{!editing && open && <span className="floor-total">{money(orderTotal(open))}</span>}
									{editing && <i className="floor-resize" onPointerDown={(e) => startDrag(e, t, "size")} title="Resize" />}
								</div>
							);
						})}
						{!tables.length && <div className="floor-empty">{canEdit ? "No tables yet. Press Edit, then Add Table." : "No tables yet. Ask the owner to set up the layout."}</div>}
					</div>
				</div>
				{action && (
					<Modal id="table-action-modal" open title={"Table " + action.table.number} subtitle={"Check total " + money(orderTotal(action.order))} onClose={() => setAction(null)}>
						<ModalBody>
							<div style={{ display: "grid", gap: 8 }}>
								<button className="btn gold" onClick={() => { loadOpenOrder(action.order.id); setAction(null); }}>Open / Pay</button>
								{canSplit && <button className="btn out" onClick={() => { splitOpenOrder(action.order.id); setAction(null); }}>Split bill</button>}
								<button className="btn out" onClick={() => { setMoving(action.order); setAction(null); }}>Move or merge check</button>
							</div>
						</ModalBody>
					</Modal>
				)}
				<MoveCheckModal order={moving} onClose={() => setMoving(null)} />
				{editing && selected && (
					<div className="floor-form" id="table-form">
						<div className="field">
							<label>Table number</label>
							<input className="input" id="table-number" value={selected.number} maxLength={12} onChange={(e) => update(selected.id, { number: e.target.value })} />
						</div>
						<div className="field">
							<label>Number of seats</label>
							<input className="input" id="table-seats" type="number" min="1" max="40" value={selected.seats} onChange={(e) => update(selected.id, { seats: e.target.value })} />
						</div>
						<div className="field">
							<label>Shape</label>
							<select className="input" id="table-shape" value={selected.shape} onChange={(e) => update(selected.id, { shape: e.target.value })}>
								{TABLE_SHAPES.map((s) => <option key={s} value={s}>{SHAPE_LABEL[s]}</option>)}
							</select>
						</div>
						<div className="field">
							<label>Status</label>
							<select className="input" id="table-active" value={selected.active ? "1" : "0"} onChange={(e) => update(selected.id, { active: e.target.value === "1" })}>
								<option value="1">Active (seating)</option>
								<option value="0">Inactive (bar, podium, landmark)</option>
							</select>
						</div>
						<button className="btn danger" id="table-delete" onClick={remove}>Delete</button>
					</div>
				)}
			</Panel>
		</section>
	);
}
