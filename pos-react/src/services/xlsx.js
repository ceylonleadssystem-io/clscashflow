import { env } from "../config/env";

/** Lazy-loads SheetJS from the CDN (same integration as the legacy page). */
let pending = null;
export function loadXlsx() {
	if (typeof window !== "undefined" && window.XLSX) return Promise.resolve(window.XLSX);
	if (pending) return pending;
	pending = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = env.xlsxCdn;
		script.async = true;
		script.onload = () => resolve(window.XLSX);
		script.onerror = () => {
			pending = null;
			reject(new Error("Excel reader could not load. Check the internet connection and try again."));
		};
		document.head.appendChild(script);
	});
	return pending;
}
