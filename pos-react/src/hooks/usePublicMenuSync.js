/**
 * Keeps the public QR menu in step with the POS: when the menu of a location whose QR link is on changes (items, prices, categories,
 * location limits), the latest menu is sent a few seconds later. Nothing is sent while no link is on, or when nothing changed.
 */
import { useEffect, useRef } from "react";
import { buildMenuSnapshot, enabledKeys } from "../domain/publicMenu";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

const DELAY_MS = 5000;

export function usePublicMenuSync() {
	const { products, categories, subcategories, settings, locations } = useData();
	const { svc } = usePos();
	const last = useRef({});
	const timer = useRef(null);
	useEffect(() => {
		const keys = enabledKeys(settings);
		const next = {};
		let changed = false;
		for (const k of keys) {
			next[k] = JSON.stringify(buildMenuSnapshot({ products, categories, subcategories, settings, locations }, k));
			if (last.current[k] !== undefined && last.current[k] !== next[k]) changed = true; // a link seen for the first time only sets the starting point
		}
		last.current = next;
		if (!changed) return undefined;
		clearTimeout(timer.current);
		timer.current = setTimeout(() => svc.publicMenu.refresh(), DELAY_MS);
		return undefined;
	}, [products, categories, subcategories, settings, locations, svc]);
	useEffect(() => () => clearTimeout(timer.current), []);
}
