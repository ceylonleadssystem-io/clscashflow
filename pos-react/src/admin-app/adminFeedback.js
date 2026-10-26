/**
 * Admin portal feedback: a small shared store that tells the page when a change is being saved (loading bar) and what
 * succeeded (message shown top left). adminApi() drives it for every request that changes something.
 */
import { useSyncExternalStore } from "react";

let state = { busy: 0, message: null };
const listeners = new Set();
let timer = 0;
const emit = (next) => {
	state = { ...state, ...next };
	listeners.forEach((l) => l());
};

export const adminFeedback = {
	begin: () => emit({ busy: state.busy + 1 }),
	end: () => emit({ busy: Math.max(0, state.busy - 1) }),
	success(text) {
		clearTimeout(timer);
		emit({ message: { id: Date.now(), text } });
		timer = setTimeout(() => emit({ message: null }), 5000);
	},
	dismiss() {
		clearTimeout(timer);
		emit({ message: null });
	},
};

const subscribe = (l) => (listeners.add(l), () => listeners.delete(l));
export const useAdminFeedback = () => useSyncExternalStore(subscribe, () => state);

/** Actions that only read data: no loading bar and no success message. */
export const READ_ACTIONS = new Set(["list", "get", "listInvoices", "getFounders", "previewDeleteAccount", "getReceipt"]);

/** The text of the success message for a finished change. */
export function successText(body) {
	switch (body?.action) {
		case "saveSettings":
			return body.summary ? "Saved: " + body.summary : "Settings saved";
		case "saveFounders":
			return "Founders plans saved";
		case "setAccess":
			return body.paused ? "Account disabled" : "Account enabled";
		case "setAccountStatus":
			return "Account status updated";
		case "setSubscriptionType":
			return "Subscription type updated";
		case "saveInvoice":
			return "Invoice saved";
		case "saveCatalog":
			return "Menu imported";
		case "saveConfig":
			return "Changes sent to the client";
		case "deleteAccount":
			return "Account deleted";
		default:
			return "Saved";
	}
}
