/**
 * The category keys the register shows right now, from the published Availability menus (null = every category). Re-checked every
 * 30 seconds, so a menu switches at the minute its hours start or end without a restart.
 */
import { useEffect, useMemo, useState } from "react";
import { allowedCategoryKeys, menusInEffect, publishedOf } from "../domain/menuAdmin";
import { resolveOptions } from "../domain/systemOptions";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

export function useAllowedCategories() {
	const { settings } = useData();
	const { locationId } = usePos();
	const [tick, setTick] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setTick((n) => n + 1), 30000);
		return () => clearInterval(id);
	}, []);
	const menus = publishedOf(settings, "availabilityMenus");
	const defaultMenu = resolveOptions(settings, "orderEntry", locationId).defaultMenu;
	const key = useMemo(() => {
		const inEffect = menusInEffect(menus, defaultMenu, new Date());
		const keys = allowedCategoryKeys(inEffect);
		return keys ? [...keys].sort().join("|") : null;
	}, [menus, defaultMenu, tick]); // eslint-disable-line react-hooks/exhaustive-deps
	return useMemo(() => (key === null ? null : new Set(key ? key.split("|") : [])), [key]);
}
