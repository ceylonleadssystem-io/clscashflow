/**
 * "Install app" support: Chrome / Edge / Android hand the page an install prompt (beforeinstallprompt) that is kept until
 * the user presses Install; Safari on iPhone / iPad has no prompt, so there the Install button opens the Add to Home Screen guide.
 */
import { useSyncExternalStore } from "react";

const nav = typeof navigator !== "undefined" ? navigator : { userAgent: "", platform: "", maxTouchPoints: 0 };
export const isAppleTouch = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);

/** True when the app already runs as an installed app (home screen icon / desktop app window). */
export const isInstalled = () =>
	typeof matchMedia !== "undefined" && (["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"].some((m) => matchMedia(`(display-mode:${m})`).matches) || nav.standalone === true);

let deferred = null; // the browser's install prompt, once it offers one
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());
if (typeof window !== "undefined") {
	window.addEventListener("beforeinstallprompt", (e) => {
		e.preventDefault(); // keep it for our own Install button
		deferred = e;
		notify();
	});
	window.addEventListener("appinstalled", () => {
		deferred = null;
		notify();
	});
}

const subscribe = (fn) => {
	listeners.add(fn);
	return () => listeners.delete(fn);
};
const snapshot = () => (deferred ? "prompt" : "none");

/** { canInstall, install() }: install() shows the browser prompt, or returns "guide" when the iOS steps should be shown. */
export function useInstall() {
	const state = useSyncExternalStore(subscribe, snapshot, () => "none");
	const installed = isInstalled();
	const canInstall = !installed && (state === "prompt" || isAppleTouch);
	const install = async () => {
		if (deferred) {
			const prompt = deferred;
			deferred = null;
			notify();
			prompt.prompt();
			await prompt.userChoice.catch(() => null);
			return "prompted";
		}
		return isAppleTouch ? "guide" : "none";
	};
	return { canInstall, install };
}
