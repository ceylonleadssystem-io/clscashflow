/**
 * Settings layout: a grouped sidebar (a dropdown on narrow screens), the open page, and a sticky bar at the bottom that appears while
 * there are unsaved changes. The same shell hosts the System Options pages and the older settings tabs.
 */
import { useUi } from "../../../store/UiProvider";

export function SaveBar({ count, onDiscard, onSave, saving, disabled }) {
	if (!count) return null;
	return (
		<div className="sk-savebar" role="region" aria-label="Unsaved changes">
			<span>
				<strong>{count}</strong> unsaved change{count === 1 ? "" : "s"}
			</span>
			<span className="sk-savebar-actions">
				<button type="button" className="btn out" onClick={onDiscard} disabled={saving}>
					Discard
				</button>
				<button type="button" className="btn gold" onClick={onSave} disabled={saving || disabled}>
					{saving ? "Saving…" : "Save"}
				</button>
			</span>
		</div>
	);
}

/** groups: [{ title, items: [{ key, label }] }]; `guard()` returns true when leaving the current page is fine (no unsaved changes). */
export function SettingsShell({ groups, current, onSelect, guard, children, bottom }) {
	const ui = useUi();
	const go = async (key) => {
		if (key === current) return;
		if (guard && !guard() && !(await ui.confirm("You have unsaved changes. Leave without saving?"))) return;
		onSelect(key);
	};
	const all = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
	return (
		<div className="sk-shell">
			<nav className="sk-side" aria-label="Settings sections">
				{groups.map((g) => (
					<div key={g.title} className="sk-side-group">
						<div className="sk-side-title">{g.title}</div>
						{g.items.map((i) => (
							<button key={i.key} type="button" data-settings-page={i.key} className={current === i.key ? "active" : ""} aria-current={current === i.key ? "page" : undefined} onClick={() => go(i.key)}>
								{i.label}
							</button>
						))}
					</div>
				))}
			</nav>
			<div className="sk-side-select">
				<label htmlFor="sk-page-select" className="sr-only">
					Settings section
				</label>
				<select id="sk-page-select" className="input" value={current} onChange={(e) => go(e.target.value)}>
					{groups.map((g) => (
						<optgroup key={g.title} label={g.title}>
							{g.items.map((i) => (
								<option key={i.key} value={i.key}>
									{i.label}
								</option>
							))}
						</optgroup>
					))}
				</select>
			</div>
			<div className="sk-main">
				<div className="sk-main-body" data-page={current} data-group={all.find((i) => i.key === current)?.group}>
					{children}
				</div>
				{bottom}
			</div>
		</div>
	);
}
