/**
 * Administrator sign-in shared by the admin portal and the feature board page.
 */
import { env } from "../config/env";
import { adminSession } from "./adminSession";
import { localAdminSession } from "./localAdmin";

/** The administrator already signed in on this tab, or null. */
export function restoreAdmin() {
	if (env.authProvider === "local") return localAdminSession.get() ? { email: "dev admin" } : null;
	const s = adminSession.get();
	return s ? { email: s.email, role: s.role || "admin" } : null;
}

/** Signs in and returns { email, role }; throws with a message that can be shown. */
export async function signInAdmin(email, password) {
	if (env.authProvider === "local") {
		localAdminSession.signIn(email, password);
		return { email };
	}
	// Credentials are checked server-side against the separate admin database.
	const res = await fetch(env.adminLoginUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || !json.ok) throw new Error(json.error || "Sign-in failed (" + res.status + ").");
	adminSession.set({ token: json.token, expiresAt: json.expiresAt, email: json.email, name: json.name, role: json.role || "admin" });
	return { email: json.email, role: json.role || "admin" };
}

export function signOutAdmin() {
	localAdminSession.signOut();
	adminSession.clear();
}
