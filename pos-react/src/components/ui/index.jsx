/**
 * Shared UI building blocks: Modal, Panel, Field, Kpi card, NumberInput (with thousands separators) and Switch.
 */
import { useState } from "react";
import { groupedValue } from "../../domain/format";

export function Modal({ id, open, title, subtitle, onClose, children, footer, className = "", boxClassName = "", boxStyle, closable = true }) {
	if (!open) return null;
	return (
		<div
			className={"modal open " + className}
			id={id}
			role="dialog"
			aria-modal="true"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget && closable) onClose?.();
			}}
		>
			<div className={"modal-box " + boxClassName} style={boxStyle}>
				<div className="panel-head">
					<div>
						<div className="panel-title">{title}</div>
						{subtitle && <div className="muted">{subtitle}</div>}
					</div>
					{closable && onClose && (
						<button className="btn out" type="button" onClick={onClose} aria-label="Close">
							×
						</button>
					)}
				</div>
				{children}
				{footer && <div className="modal-foot">{footer}</div>}
			</div>
		</div>
	);
}

export const ModalBody = ({ children, ...rest }) => (
	<div className="modal-body" {...rest}>
		{children}
	</div>
);

export function Panel({ title, subtitle, actions, children, style, id, className = "" }) {
	return (
		<div className={"panel " + className} style={style} id={id}>
			{(title || actions) && (
				<div className="panel-head">
					<div>
						{title && <div className="panel-title">{title}</div>}
						{subtitle && <div className="muted">{subtitle}</div>}
					</div>
					{actions}
				</div>
			)}
			{children}
		</div>
	);
}

export function Field({ label, children, full, style, id }) {
	return (
		<div className={"field" + (full ? " full" : "")} style={style}>
			{label && <label htmlFor={id}>{label}</label>}
			{children}
		</div>
	);
}

export const Kpi = ({ label, value, note, tone, style }) => (
	<div className="card">
		<div className="label">{label}</div>
		<div className={"value" + (tone ? " " + tone : "")} style={style}>
			{value}
		</div>
		{note && <div className="muted">{note}</div>}
	</div>
);

export const Empty = ({ children }) => <div className="empty">{children}</div>;

/**
 * Text input that shows thousands separators ("1,234.50") while keeping the
 * raw number accessible through onChange(rawString).
 */
export function NumberInput({ value, onChange, className = "input", grouped = true, ...rest }) {
	const [focused, setFocused] = useState(false);
	const shown = focused || !grouped ? String(value ?? "").replace(/,/g, "") : value === "" || value == null ? "" : groupedValue(value);
	return (
		<input
			{...rest}
			className={className}
			type="text"
			inputMode="decimal"
			autoComplete="off"
			value={shown}
			onFocus={(e) => {
				setFocused(true);
				rest.onFocus?.(e);
			}}
			onBlur={(e) => {
				setFocused(false);
				rest.onBlur?.(e);
			}}
			onChange={(e) => onChange(grouped ? groupedValue(e.target.value).replace(/,/g, "") : e.target.value)}
		/>
	);
}

/** Toggle switch used by the Admin Dashboard. */
export function Switch({ checked, onChange, disabled, label }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			className={"switch" + (checked ? " on" : "")}
			onClick={() => onChange(!checked)}
		>
			<span />
		</button>
	);
}
