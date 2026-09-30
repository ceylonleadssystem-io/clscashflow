import { useCallback, useEffect } from "react";
import { usePos } from "../store/PosProvider";

const ua = typeof navigator !== "undefined" ? navigator : { userAgent: "", platform: "", maxTouchPoints: 0 };
const appleTouch = /iPad|iPhone|iPod/.test(ua.userAgent) || (ua.platform === "MacIntel" && ua.maxTouchPoints > 1);
const touchKiosk = typeof matchMedia !== "undefined" && (matchMedia("(pointer:coarse)").matches || ua.maxTouchPoints > 0);
const standalone = typeof matchMedia !== "undefined" && (matchMedia("(display-mode:standalone)").matches || ua.standalone === true);

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

/**
 * Full screen / kiosk behaviour (final legacy logic):
 *  - iPad/iPhone: viewport-locked kiosk (native fullscreen would steal swipe gestures)
 *  - Android / other touch: kiosk classes + Fullscreen API
 *  - desktop: Fullscreen API + body.full, menu collapsed while full
 */
export function useFullscreen() {
	const { layout, setLayout } = usePos();

	const toggle = useCallback(async () => {
		const entering = !layout.full && !fsElement();
		if (appleTouch) {
			setLayout((l) => ({ ...l, full: entering, sidebarCollapsed: entering, kiosk: entering, mobileCartOpen: false }));
			return;
		}
		if (entering) {
			setLayout((l) => ({ ...l, full: true, sidebarCollapsed: true, kiosk: touchKiosk }));
			try {
				const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
				if (req) await req.call(document.documentElement);
			} catch {
				/* the kiosk layout still applies */
			}
		} else {
			setLayout((l) => ({ ...l, full: false, sidebarCollapsed: false, kiosk: false, mobileCartOpen: false }));
			try {
				if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen();
				else if (document.webkitExitFullscreen && document.webkitFullscreenElement) document.webkitExitFullscreen();
			} catch {
				/* ignore */
			}
		}
	}, [layout.full, setLayout]);

	useEffect(() => {
		if (standalone) setLayout((l) => ({ ...l, full: true, sidebarCollapsed: true, kiosk: true }));
		const onChange = () => {
			if (!fsElement() && !touchKiosk) setLayout((l) => ({ ...l, full: false, sidebarCollapsed: false }));
		};
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, [setLayout]);

	return { full: layout.full, toggle };
}
