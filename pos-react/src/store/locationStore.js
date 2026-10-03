/**
 * Tiny external store holding the active POS location of this browser tab, shared by the feature switches and
 * the POS session without a provider cycle.
 */
import { STORAGE } from "../config/constants";

/**
 * Active POS location of this browser tab (sessionStorage) as a tiny external
 * store, so the feature switches (which can differ per location) and the POS
 * session read the same value without a provider cycle.
 */
const listeners = new Set();
export const locationStore = {
	get: () => sessionStorage.getItem(STORAGE.location) || "",
	set(id) {
		if (id) sessionStorage.setItem(STORAGE.location, id);
		else sessionStorage.removeItem(STORAGE.location);
		listeners.forEach((fn) => fn());
	},
	subscribe(fn) {
		listeners.add(fn);
		return () => listeners.delete(fn);
	},
};
