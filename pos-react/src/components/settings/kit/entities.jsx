/**
 * Shared Settings pieces for list-and-drawer pages (3rd Party Payments, Zones...): DetailDrawer, SortableList (drag handle plus keyboard
 * up / down), StatusBadge, EmptyState and AuditTrailDrawer.
 */
import { useEffect, useRef, useState } from "react";
import { useData } from "../../../store/DataProvider";

/** Right-hand panel. Escape or the backdrop closes it; focus moves to it on open and returns afterwards. */
export function DetailDrawer({ open, title, subtitle, onClose, children, footer }) {
	const ref = useRef(null);
	useEffect(() => {
		if (!open) return undefined;
		const before = document.activeElement;
		ref.current?.focus();
		const esc = (e) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", esc);
		return () => {
			document.removeEventListener("keydown", esc);
			before?.focus?.();
		};
	}, [open, onClose]);
	if (!open) return null;
	return (
		<div className="sk-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
			<aside className="sk-drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
				<header>
					<div>
						<h3>{title}</h3>
						{subtitle && <p className="muted">{subtitle}</p>}
					</div>
					<button type="button" className="btn out" aria-label="Close" onClick={onClose}>
						×
					</button>
				</header>
				<div className="sk-drawer-body">{children}</div>
				{footer && <footer>{footer}</footer>}
			</aside>
		</div>
	);
}

export function StatusBadge({ status }) {
	const label = { active: "Active", inactive: "Inactive", online: "Online", offline: "Offline", draft: "Draft", archived: "Archived" }[status] || status;
	return <span className={"sk-badge sk-badge-" + status}>{label}</span>;
}

export function EmptyState({ title, children, action }) {
	return (
		<div className="sk-empty">
			<strong>{title}</strong>
			{children && <p className="muted">{children}</p>}
			{action}
		</div>
	);
}

/**
 * Rows the user can reorder by dragging the handle or with the up / down buttons (also reachable by keyboard).
 * `items` need an id; `render(item)` draws a row's content; `onReorder(ids)` gets the new order; `fixed(item)` pins a row (cannot move).
 */
export function SortableList({ items, render, onReorder, fixed = () => false, label = "Reorder" }) {
	const [drag, setDrag] = useState("");
	const ids = items.map((i) => i.id);
	const moveTo = (id, to) => {
		const from = ids.indexOf(id);
		if (from < 0 || to < 0 || to >= ids.length || from === to || fixed(items[to]) || fixed(items[from])) return;
		const next = [...ids];
		next.splice(to, 0, next.splice(from, 1)[0]);
		onReorder(next);
	};
	return (
		<ul className="sk-list">
			{items.map((item, i) => (
				<li
					key={item.id}
					className={"sk-list-row" + (drag === item.id ? " dragging" : "")}
					draggable={!fixed(item)}
					onDragStart={() => !fixed(item) && setDrag(item.id)}
					onDragOver={(e) => drag && e.preventDefault()}
					onDrop={() => {
						if (drag) moveTo(drag, i);
						setDrag("");
					}}
					onDragEnd={() => setDrag("")}
				>
					<span className="sk-handle" aria-hidden="true" title={fixed(item) ? "This row stays first" : "Drag to reorder"}>
						{fixed(item) ? "" : "≡"}
					</span>
					<div className="sk-list-main">{render(item)}</div>
					{!fixed(item) && (
						<span className="sk-list-move">
							<button type="button" className="btn out" aria-label={`${label}: move up`} disabled={i === 0 || fixed(items[i - 1])} onClick={() => moveTo(item.id, i - 1)}>
								↑
							</button>
							<button type="button" className="btn out" aria-label={`${label}: move down`} disabled={i === items.length - 1} onClick={() => moveTo(item.id, i + 1)}>
								↓
							</button>
						</span>
					)}
				</li>
			))}
		</ul>
	);
}

/** Read-only history of System Options changes whose text starts with / contains `match` (for example "payroll."). */
export function AuditTrailDrawer({ open, onClose, title = "History", match = "", actions = ["system-options-saved"] }) {
	const { locationAudit = [], users } = useData();
	const rows = locationAudit.filter((a) => actions.includes(a.action) && (!match || String(a.details).includes(match))).slice(0, 100);
	return (
		<DetailDrawer open={open} title={title} subtitle="Who changed what, newest first." onClose={onClose}>
			{rows.length ? (
				<ul className="sk-history">
					{rows.map((a) => (
						<li key={a.id}>
							<strong>{users.find((u) => u.id === a.userId)?.name || "Someone"}</strong> <span className="muted">{new Date(a.at).toLocaleString()}</span>
							<div>
								{String(a.details)
									.split("; ")
									.filter((d) => !match || d.includes(match))
									.map((d, i) => (
										<div key={i}>{d}</div>
									))}
							</div>
						</li>
					))}
				</ul>
			) : (
				<EmptyState title="No changes yet">Changes appear here after the first save.</EmptyState>
			)}
		</DetailDrawer>
	);
}
