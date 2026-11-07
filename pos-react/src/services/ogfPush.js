/** Calls the Sales push function (netlify/functions/ogf-push.js) as the signed-in business. */
import { env } from "../config/env";

/** Returns the function's answer as an object; an error answer carries `ok: false` and a message. */
export async function ogfCall(auth, body) {
	const user = auth && auth.currentUser;
	if (!user) return { ok: false, message: "Sign in to the business account first." };
	try {
		const res = await fetch(env.ogfPushUrl, {
			method: "POST",
			cache: "no-store",
			headers: { Authorization: "Bearer " + (await user.getIdToken()), "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok && !json.message && !json.error) return { ok: false, message: "The sales push could not be reached (" + res.status + ")." };
		return { ...json, ok: res.ok && json.ok !== false, message: json.message || json.error || "" };
	} catch (e) {
		return { ok: false, message: "No connection: " + (e.message || "try again when you are online.") };
	}
}
