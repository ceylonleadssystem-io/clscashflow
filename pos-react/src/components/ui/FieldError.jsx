/**
 * Small inline validation message shown under an input.
 */
/** Inline validation message under an input. */
export const FieldError = ({ message }) =>
	message ? (
		<div className="field-error" role="alert">
			{message}
		</div>
	) : null;
