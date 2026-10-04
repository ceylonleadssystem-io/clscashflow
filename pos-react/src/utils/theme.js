/** Dark-mode choice: stored in settings.darkMode (cloud) and mirrored in localStorage so it applies before first paint. */
export const DARK_KEY = "ceylonry-pos-dark-mode";

/** Settings value wins when it is a boolean; otherwise fall back to the localStorage mirror ("1"/"0"). */
export const resolveDark = (setting, stored) => (typeof setting === "boolean" ? setting : stored === "1");

export function applyDark(on) {
	const root = document.documentElement;
	if (on) root.dataset.theme = "dark";
	else delete root.dataset.theme;
	try {
		localStorage.setItem(DARK_KEY, on ? "1" : "0");
	} catch {
		/* storage blocked: attribute still applies for this session */
	}
}

export function storedDark() {
	try {
		return localStorage.getItem(DARK_KEY);
	} catch {
		return null;
	}
}
