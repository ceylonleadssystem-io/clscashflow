/**
 * Per-user text size and thickness. Preferences are stored on this device under the signed-in staff
 * user and applied app-wide through the --ui-fs and --ui-fw CSS variables.
 */
import { useEffect, useState } from "react";
import { usePos } from "../store/PosProvider";

// Per-user text size / thickness. Stored on this device under the signed-in staff user and applied
// to the whole app through the --ui-fs / --ui-fw CSS variables (see the styles).
export const FONT_SIZES = [
	{ id: "small", label: "Small", scale: 0.9 },
	{ id: "default", label: "Default", scale: 1 },
	{ id: "large", label: "Large", scale: 1.15 },
	{ id: "xlarge", label: "Extra large", scale: 1.3 },
];
export const FONT_WEIGHTS = [
	{ id: "light", label: "Light", shift: -100 },
	{ id: "normal", label: "Normal", shift: 0 },
	{ id: "medium", label: "Medium", shift: 100 },
	{ id: "bold", label: "Bold", shift: 200 },
];
const DEFAULTS = { size: "default", weight: "normal" };
const key = (userId) => "pos.display." + userId;

function read(userId) {
	try {
		return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(key(userId)) || "{}") };
	} catch {
		return DEFAULTS;
	}
}

function apply(prefs) {
	const root = document.documentElement.style;
	root.setProperty("--ui-fs", String((FONT_SIZES.find((s) => s.id === prefs.size) || FONT_SIZES[1]).scale));
	root.setProperty("--ui-fw", String((FONT_WEIGHTS.find((w) => w.id === prefs.weight) || FONT_WEIGHTS[1]).shift));
}

/** Mount once (Shell): applies the signed-in user's preferences, resetting to defaults when nobody is signed in. */
export function useApplyDisplayPrefs() {
	const { currentUser } = usePos();
	const id = currentUser?.id;
	useEffect(() => {
		apply(id ? read(id) : DEFAULTS);
	}, [id]);
}

/** For the settings panel: [prefs, update]. */
export function useDisplayPrefs() {
	const { currentUser } = usePos();
	const id = currentUser?.id;
	const [prefs, setPrefs] = useState(() => (id ? read(id) : DEFAULTS));
	useEffect(() => setPrefs(id ? read(id) : DEFAULTS), [id]);
	const update = (patch) => {
		if (!id) return;
		const next = { ...read(id), ...patch };
		try {
			localStorage.setItem(key(id), JSON.stringify(next));
		} catch {
			// storage blocked: preference applies for this session only
		}
		setPrefs(next);
		apply(next);
	};
	return [prefs, update];
}
