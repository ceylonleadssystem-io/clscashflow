/** Formatting + small parsing helpers (ported from the legacy globals). */

export const money = (n) =>
	"LKR " +
	Number(n || 0).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

export const nowIso = () => new Date().toISOString();

/** YYYY-MM-DD in the *local* timezone (used by report ranges). */
export function localDateValue(d) {
	const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
	return x.toISOString().slice(0, 10);
}

/**
 * Business date of "now". The legacy POS stamped sales with the UTC date while
 * its reports filtered by local dates, so a sale made after local midnight
 * (e.g. 00:30 in Sri Lanka) landed on the previous day. The React port uses the
 * local calendar date consistently.
 */
export const today = () => localDateValue(new Date());

export const phoneKey = (value) => String(value || "").replace(/\D/g, "");

/** Sri Lankan local numbers (07x...) become 947x... for wa.me links. */
export function whatsappPhone(value) {
	let digits = phoneKey(value);
	if (digits.length === 10 && digits.startsWith("0")) digits = "94" + digits.slice(1);
	return digits;
}

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

/** Parses "1,234.50" style input; NaN when invalid. */
export function parseNumber(value) {
	const cleaned = String(value ?? "").replace(/,/g, "").trim();
	const n = Number(cleaned);
	return Number.isFinite(n) ? n : NaN;
}

/** Live "1,234.56" formatter used by grouped numeric inputs. */
export function groupedValue(value) {
	const text = String(value ?? "")
		.replace(/,/g, "")
		.replace(/[^0-9.-]/g, "");
	const parts = text.split(".");
	const whole = parts.shift() || "";
	const negative = whole.startsWith("-");
	let digits = whole.replace(/-/g, "");
	if (digits) digits = Number(digits).toLocaleString("en-US");
	return (negative ? "-" : "") + digits + (parts.length ? "." + parts.join("").slice(0, 2) : "");
}

export const uid = (prefix = "") => prefix + Date.now() + Math.floor(Math.random() * 1000);

export const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);

export function csvEscape(v) {
	return '"' + String(v ?? "").replace(/"/g, '""') + '"';
}

export function toCsv(rows) {
	return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

export function downloadBlob(blob, filename) {
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function downloadCsv(rows, filename) {
	downloadBlob(new Blob([toCsv(rows)], { type: "text/csv" }), filename);
}

/** Escape text for the standalone print HTML documents. */
export const esc = (s) =>
	String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const posMonthlyPrice = (users, base = 3500, included = 5, extra = 500) =>
	base + Math.max(0, Math.max(1, +users || 1) - included) * extra;
