/**
 * The feature board on its own address: the administrator sign-in of the admin portal, then the board.
 * The server refuses support-only accounts.
 */
import { useCallback, useState } from "react";
import { AdminFeedbackBar } from "../admin-app/AdminFeedbackBar";
import { AdminLogin } from "../admin-app/AdminLogin";
import { restoreAdmin, signInAdmin, signOutAdmin } from "../admin-app/adminSignIn";
import { createLogger } from "../utils/logger";
import { KanbanBoard } from "./KanbanBoard";

const log = createLogger("admin");

export function KanbanApp() {
	const [user, setUser] = useState(restoreAdmin);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	const signOut = useCallback((message = "") => {
		signOutAdmin();
		setUser(null);
		setError(message);
	}, []);

	const signIn = async (email, password) => {
		setBusy(true);
		setError("");
		try {
			setUser(await signInAdmin(email, password));
		} catch (e) {
			log.warn("admin sign-in failed", e);
			setError(e.message);
		} finally {
			setBusy(false);
		}
	};

	if (!user) return <AdminLogin onSignIn={signIn} error={error} busy={busy} homeLink={false} />;
	return (
		<div className="admin-app">
			<AdminFeedbackBar />
			<header className="admin-top">
				<div>
					<div className="admin-brand">
						Ceylonry<span>Labs</span>
					</div>
					<div className="muted">Signed in as {user.email}</div>
				</div>
				<div className="admin-top-actions">
					<button type="button" className="btn out" onClick={() => signOut()}>
						Sign out
					</button>
				</div>
			</header>
			<KanbanBoard onExpired={signOut} />
		</div>
	);
}
