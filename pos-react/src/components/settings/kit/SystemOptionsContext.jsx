/**
 * Draft state for the System Options pages. Edits are held here (nothing changes on the POS) until Save; Discard drops them.
 * Values shown on a page are the saved ones with the draft laid over them, resolved for the location chosen in the top bar
 * (the organization when "All locations" is chosen). Switching location drops the draft, because it was written for the other location.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { OPTION_PAGES, applyPatch, isOverridden, resolveOptions, validateOptions } from "../../../domain/systemOptions";
import { useData } from "../../../store/DataProvider";
import { usePos } from "../../../store/PosProvider";
import { useUi } from "../../../store/UiProvider";

const Ctx = createContext(null);

export function SystemOptionsProvider({ children }) {
	const { settings, locations } = useData();
	const { svc, locationId: posLocation } = usePos();
	// a business with one location has nothing to override: its settings are the organization's
	const locationId = locations.filter((l) => l.active !== false).length > 1 ? posLocation : "all";
	const ui = useUi();
	const [draft, setDraft] = useState({});
	const [saving, setSaving] = useState(false);
	const lastLocation = useRef(locationId);

	useEffect(() => {
		if (lastLocation.current !== locationId) {
			lastLocation.current = locationId;
			setDraft((d) => {
				if (Object.keys(d).length) ui.notice("Location changed, so unsaved changes were discarded.");
				return {};
			});
		}
	}, [locationId, ui]);

	const effectiveOptions = useMemo(() => applyPatch(settings.systemOptions, draft, locationId), [settings.systemOptions, draft, locationId]);
	const effectiveSettings = useMemo(() => ({ ...settings, systemOptions: effectiveOptions }), [settings, effectiveOptions]);

	const changes = useMemo(() => {
		const out = [];
		for (const page of OPTION_PAGES) {
			const before = resolveOptions(settings, page, locationId);
			const after = resolveOptions(effectiveSettings, page, locationId);
			for (const key of Object.keys(before)) if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) out.push({ page, key, before: before[key], after: after[key] });
		}
		return out;
	}, [settings, effectiveSettings, locationId]);

	const errors = useMemo(() => Object.fromEntries(OPTION_PAGES.map((p) => [p, validateOptions(p, resolveOptions(effectiveSettings, p, locationId))])), [effectiveSettings, locationId]);
	const hasErrors = Object.values(errors).some((e) => Object.keys(e).length);
	const dirty = changes.length > 0 || Object.keys(draft).length > 0;

	const set = useCallback((page, key, value) => setDraft((d) => ({ ...d, [page]: { ...(d[page] || {}), [key]: value } })), []);
	const reset = useCallback((page, key) => set(page, key, undefined), [set]);
	const discard = useCallback(() => setDraft({}), []);
	const save = useCallback(async () => {
		if (hasErrors) return void ui.notice("Fix the highlighted settings first.");
		setSaving(true);
		try {
			const footer = resolveOptions(effectiveSettings, "receipts", locationId).footer;
			const footerChanged = changes.some((c) => c.page === "receipts" && c.key === "footer");
			await svc.settings.saveSystemOptions({ systemOptions: effectiveOptions, receiptFooter: footerChanged ? footer : undefined, changes, locationId });
			setDraft({});
		} finally {
			setSaving(false);
		}
	}, [hasErrors, ui, effectiveSettings, effectiveOptions, changes, svc, locationId]);

	// closing or reloading the tab with unsaved changes
	useEffect(() => {
		if (!dirty) return undefined;
		const warn = (e) => e.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [dirty]);

	const value = useMemo(
		() => ({ settings, effectiveSettings, locationId, draft, changes, errors, dirty, saving, set, reset, discard, save, preset: (values) => Object.entries(values).forEach(([p, kv]) => Object.entries(kv).forEach(([k, v]) => set(p, k, v))) }),
		[settings, effectiveSettings, locationId, draft, changes, errors, dirty, saving, set, reset, discard, save],
	);
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Everything a page needs: its resolved values, setters, errors and the per-setting "overridden" state. */
export function useSystemOptions(page) {
	const c = useContext(Ctx);
	const values = resolveOptions(c.effectiveSettings, page, c.locationId);
	return {
		values,
		errors: c.errors[page] || {},
		set: (key, v) => c.set(page, key, v),
		overridden: (key) => isOverridden(c.effectiveSettings, page, key, c.locationId),
		reset: (key) => c.reset(page, key),
		locationId: c.locationId,
	};
}

export const useSystemOptionsDraft = () => useContext(Ctx);
