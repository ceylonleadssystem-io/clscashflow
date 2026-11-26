/**
 * Entry point of the feature board page (index.html here, served at kanban.ceylonrylabs.io).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KanbanApp } from "./KanbanApp";
import "../styles/index.css";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<ErrorBoundary>
			<KanbanApp />
		</ErrorBoundary>
	</StrictMode>,
);
