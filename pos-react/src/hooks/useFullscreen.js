/**
 * Full screen / kiosk behaviour: iPad viewport-locked kiosk, Android/touch kiosk plus the Fullscreen API,
 * and desktop fullscreen; the navigation bar stays visible while full.
 */
import { useCallback, useEffect } from "react";
import { usePos } from "../store/PosProvider";
import { createLogger } from "../utils/logger";

const log = createLogger("fullscreen");

const ua = typeof navigator !== "undefined" ? navigator : { userAgent: "", platform: "", maxTouchPoints: 0 };
const appleTouch = /iPad|iPhone|iPod/.test(ua.userAgent) || (ua.platform === "MacIntel" && ua.maxTouchPoints > 1);
const touchKiosk = typeof matchMedia !== "undefined" && (matchMedia("(pointer:coarse)").matches || ua.maxTouchPoints > 0);
const standalone = typeof matchMedia !== "undefined" && (matchMedia("(display-mode:standalone)").matches || ua.standalone === true);

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

/**
 * Full screen / kiosk behaviour (final legacy logic):
 *  - iPad/iPhone: viewport-locked kiosk (native fullscreen would steal swipe gestures)
 *  - Android / other touch: kiosk classes + Fullscreen API
 *  - desktop: Fullscreen API + body.full (the navigation bar stays visible, as in normal mode)
 */
export function useFullscreen() {
	const { layout, setLayout } = usePos();

	const toggle = useCallback(async () => {
		const entering = !layout.full && !fsElement();
		if (appleTouch) {
			setLayout((l) => ({ ...l, full: entering, kiosk: entering, mobileCartOpen: false }));
			return;
		}
		if (entering) {
			setLayout((l) => ({ ...l, full: true, kiosk: touchKiosk }));
			try {
				const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
				if (req) await req.call(document.documentElement);
			} catch (error) {
				log.warn("fullscreen request rejected; using kiosk layout only", error);
				/* the kiosk layout still applies */
			}
		} else {
			setLayout((l) => ({ ...l, full: false, kiosk: false, mobileCartOpen: false }));
			try {
				if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen();
				else if (document.webkitExitFullscreen && document.webkitFullscreenElement) document.webkitExitFullscreen();
			} catch (error) {
				log.warn("exit fullscreen failed", error);
				/* ignore */
			}
		}
	}, [layout.full, setLayout]);

	useEffect(() => {
		if (standalone) setLayout((l) => ({ ...l, full: true, kiosk: true }));
		const onChange = () => {
			if (!fsElement() && !touchKiosk) setLayout((l) => ({ ...l, full: false }));
		};
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, [setLayout]);

	return { full: layout.full, toggle };
}
