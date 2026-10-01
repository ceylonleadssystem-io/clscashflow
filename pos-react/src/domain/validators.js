/** Input validation helpers (return an error message, or "" when valid). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailError(value, { required = false } = {}) {
	const v = String(value || "").trim();
	if (!v) return required ? "Enter an email address." : "";
	return EMAIL_RE.test(v) ? "" : "Enter a valid email, e.g. name@example.com.";
}

/** Phone: optional +, 7–15 digits; spaces, dashes and brackets allowed. */
export function phoneError(value, { required = false } = {}) {
	const v = String(value || "").trim();
	if (!v) return required ? "Enter a phone number." : "";
	if (!/^\+?[\d\s\-()]+$/.test(v)) return "Use digits only (spaces, - and + are fine).";
	const digits = v.replace(/\D/g, "");
	if (digits.length < 7) return "Phone number is too short (at least 7 digits).";
	if (digits.length > 15) return "Phone number is too long (max 15 digits).";
	return "";
}

export const requiredError = (value, label = "This field") => (String(value || "").trim() ? "" : `${label} is required.`);

/** Strips everything a phone field cannot contain while typing. */
export const cleanPhoneInput = (value) => String(value || "").replace(/[^\d+\s\-()]/g, "");
