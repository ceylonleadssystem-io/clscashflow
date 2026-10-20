/** Lets another screen (Ceylo's fix buttons) open Settings on a given tab, whether or not Settings is already showing. */
let requested = "";
const listeners = new Set();

export function openSettingsTab(tab) {
	if (listeners.size) listeners.forEach((l) => l(tab)); // Settings is open: switch now
	else requested = tab; // Settings reads it when it opens
}

/** The tab asked for (Settings reads it when it opens). */
export const requestedSettingsTab = () => requested;

/** Settings calls this once it has shown the tab, so the next visit starts normally. Returns the unsubscribe. */
export function onSettingsTab(fn) {
	requested = "";
	listeners.add(fn);
	return () => listeners.delete(fn);
}
