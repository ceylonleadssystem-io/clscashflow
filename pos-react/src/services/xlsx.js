/**
 * Lazy loader for the SheetJS (XLSX) library from the CDN, used by catalogue and stock imports.
 */
import { env } from "../config/env";
import { createLogger } from "../utils/logger";

const log = createLogger("xlsx");

/** Lazy-loads SheetJS from the CDN (same integration as the legacy page). */
let pending = null;
export function loadXlsx() {
	if (typeof window !== "undefined" && window.XLSX) return Promise.resolve(window.XLSX);
	if (pending) return pending;
	pending = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = env.xlsxCdn;
		script.async = true;
		script.onload = () => {
			log.info("SheetJS loaded");
			resolve(window.XLSX);
		};
		script.onerror = () => {
			pending = null;
			// Offline (or CDN blocked): imports/exports need the network the first time only.
			log.warn("SheetJS failed to load from CDN", { src: env.xlsxCdn });
			reject(new Error("Excel reader could not load. Check the internet connection and try again."));
		};
		document.head.appendChild(script);
	});
	return pending;
}
