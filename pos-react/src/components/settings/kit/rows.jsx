/**
 * Shared Settings building blocks: PageHeader, SectionCard, the typed setting rows (toggle, select, number, duration, time, text area),
 * ConditionalGroup and Tooltip. Every Settings page is made from these so spacing, labels, help text and focus look the same.
 */
import { useId } from "react";

export function PageHeader({ title, description, actions, note }) {
	return (
		<header className="sk-page-head">
			<div>
				<h2>{title}</h2>
				{description && <p className="muted">{description}</p>}
				{note && <p className="sk-scope-note">{note}</p>}
			</div>
			{actions && <div className="sk-page-actions">{actions}</div>}
		</header>
	);
}

export function SectionCard({ title, description, children, id }) {
	return (
		<section className="sk-card" id={id}>
			{title && (
				<div className="sk-card-head">
					<h3>{title}</h3>
					{description && <p className="muted">{description}</p>}
				</div>
			)}
			<div className="sk-card-body">{children}</div>
		</section>
	);
}

/** "?" help that opens on hover, focus or tap (a native title is not reachable by keyboard or touch). */
export function Tooltip({ text }) {
	const id = useId();
	return (
		<span className="sk-tip">
			<button type="button" className="sk-tip-btn" aria-describedby={id} aria-label="More information">
				?
			</button>
			<span role="tooltip" id={id} className="sk-tip-text">
				{text}
			</span>
		</span>
	);
}

/** Label, help line and the control; `overridden` shows "Overridden for this location" with a Reset link. */
export function SettingRow({ label, help, tip, htmlFor, children, overridden, onReset, error, wide }) {
	return (
		<div className={"sk-row" + (wide ? " sk-wide" : "")}>
			<div className="sk-row-text">
				<label htmlFor={htmlFor}>
					{label}
					{tip && <Tooltip text={tip} />}
				</label>
				{help && <p className="muted">{help}</p>}
				{overridden && (
					<p className="sk-override">
						Overridden for this location ·{" "}
						<button type="button" className="sk-link" onClick={onReset}>
							Reset
						</button>
					</p>
				)}
				{error && (
					<p className="sk-error" role="alert">
						{error}
					</p>
				)}
			</div>
			<div className="sk-row-control">{children}</div>
		</div>
	);
}

export function ToggleRow({ id, value, onChange, disabled, ...row }) {
	return (
		<SettingRow htmlFor={id} {...row}>
			<label className="sk-switch">
				<input id={id} type="checkbox" role="switch" checked={!!value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
				<span aria-hidden="true" />
			</label>
		</SettingRow>
	);
}

export function SelectRow({ id, value, onChange, options, disabled, ...row }) {
	return (
		<SettingRow htmlFor={id} {...row}>
			<select id={id} className="input" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</SettingRow>
	);
}

export function NumberRow({ id, value, onChange, min, max, step = 1, suffix, disabled, ...row }) {
	return (
		<SettingRow htmlFor={id} {...row}>
			<span className="sk-inline">
				<input id={id} className="input" type="number" inputMode="numeric" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
				{suffix && <span className="muted">{suffix}</span>}
			</span>
		</SettingRow>
	);
}

/** Hours and minutes side by side. */
export function DurationRow({ id, hours, minutes, onChange, disabled, ...row }) {
	return (
		<SettingRow htmlFor={id + "-h"} {...row}>
			<span className="sk-inline">
				<input id={id + "-h"} className="input" type="number" inputMode="numeric" min="0" max="99" aria-label="Hours" value={hours} disabled={disabled} onChange={(e) => onChange({ hours: e.target.value === "" ? "" : Number(e.target.value), minutes })} />
				<span className="muted">hrs</span>
				<input id={id + "-m"} className="input" type="number" inputMode="numeric" min="0" max="59" aria-label="Minutes" value={minutes} disabled={disabled} onChange={(e) => onChange({ hours, minutes: e.target.value === "" ? "" : Number(e.target.value) })} />
				<span className="muted">mins</span>
			</span>
		</SettingRow>
	);
}

export function TimeRow({ id, value, onChange, disabled, ...row }) {
	return (
		<SettingRow htmlFor={id} {...row}>
			<input id={id} className="input" type="time" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
		</SettingRow>
	);
}

/** Multi-line text with a live character counter. */
export function TextAreaRow({ id, value, onChange, max, rows = 3, disabled, ...row }) {
	return (
		<SettingRow htmlFor={id} wide {...row}>
			<textarea id={id} className="input" rows={rows} value={value} maxLength={max ? max + 50 : undefined} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
			{max && (
				<span className={"sk-count" + (value.length > max ? " over" : "")} aria-live="polite">
					{value.length} / {max}
				</span>
			)}
		</SettingRow>
	);
}

/** Rows that only matter while their parent switch is on, indented under it. */
export function ConditionalGroup({ show, children }) {
	return show ? <div className="sk-conditional">{children}</div> : null;
}

export function TextRow({ id, value, onChange, max, placeholder, disabled, autoFocus, ...row }) {
	return (
		<SettingRow htmlFor={id} {...row}>
			<input id={id} className="input" type="text" value={value} maxLength={max} placeholder={placeholder} disabled={disabled} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} />
		</SettingRow>
	);
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** A weekday and a time of day side by side. */
export function DayTimeRow({ id, day, time, onChange, disabled, ...row }) {
	return (
		<SettingRow htmlFor={id + "-d"} {...row}>
			<span className="sk-inline">
				<select id={id + "-d"} className="input" aria-label="Day" value={day} disabled={disabled} onChange={(e) => onChange({ day: Number(e.target.value), time })}>
					{DAYS.map((d, i) => (
						<option key={d} value={i}>
							{d}
						</option>
					))}
				</select>
				<input id={id + "-t"} className="input" type="time" aria-label="Time" value={time} disabled={disabled} onChange={(e) => onChange({ day, time: e.target.value })} />
			</span>
		</SettingRow>
	);
}
