/**
 * Entry point of the POS app: installs global logging, mounts <App/> into #root and registers the
 * service worker (production only) for offline use.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { servesPosAtRoot } from "./domain/posRoute";
import { installGlobalLogging } from "./utils/logger";

installGlobalLogging();

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

// Offline app shell (same idea as the legacy sw.js)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
	window.addEventListener("load", () => {
		// on the addresses whose root page is the POS (pos., automobile., ogf.) the worker must control the whole address, not just /posv2/
		const scope = servesPosAtRoot(location.hostname) ? "/" : undefined;
		navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js", { updateViaCache: "none", scope }).catch((e) => console.warn("POS offline support could not start.", e));
	});
}
