/**
 * Entry point of the Kitchen Display page (kds.html, served at /KDS).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KdsApp } from "./KdsApp";
import { KdsGate } from "./KdsGate";
import "../styles/index.css";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ErrorBoundary>
			<KdsGate>
				<KdsApp />
			</KdsGate>
		</ErrorBoundary>
	</StrictMode>,
);
