/**
 * Live support: lets a support session open POS screens and write to the audit log. The agent can only ask for a screen the signed-in person
 * is allowed to see; the client still has to say yes (components/support/SupportBanner.jsx).
 */
import { useEffect } from "react";
import { NAV_ITEMS } from "../config/roles";
import { registerSupportBridge } from "../services/supportLive";
import { openSettingsTab } from "../store/settingsTab";
import { usePos } from "../store/PosProvider";

const name = (view) => NAV_ITEMS.find((i) => i.view === view)?.label.slice(2) || (view === "settings" ? "Settings" : view);

export function useSupportBridge() {
	const { go, canView, svc } = usePos();
	useEffect(
		() =>
			registerSupportBridge({
				canGo: (view) => canView(view),
				describe: (view, page) => name(view) + (page ? " > " + page : ""),
				go: (view, page) => {
					if (view === "settings" && page) openSettingsTab("page:" + page);
					go(view);
				},
				audit: (action, detail) => svc.support.log(action, detail).catch(() => {}),
			}),
		[go, canView, svc],
	);
}
