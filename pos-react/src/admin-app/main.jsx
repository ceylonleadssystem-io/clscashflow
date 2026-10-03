/**
 * Entry point of the admin portal (admin.html): mounts AdminApp with the error boundary and UI provider.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UiProvider } from "../store/UiProvider";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AdminApp } from "./AdminApp";
import "../styles/index.css";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ErrorBoundary>
			<UiProvider>
				<AdminApp />
			</UiProvider>
		</ErrorBoundary>
	</StrictMode>,
);
