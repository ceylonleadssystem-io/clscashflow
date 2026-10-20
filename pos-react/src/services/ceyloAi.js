/**
 * Ask Ceylo: sends a question, the last few chat turns and Ceylo's check results (titles and plain sentences only) to the
 * `ceylo-ask` Netlify function, which answers with Claude. Never sends PINs, keys or customer data.
 */
import { isAppwrite } from "../config/env";

const URL = "/.netlify/functions/ceylo-ask";

/** Only what the answer needs from each check. */
export const checksForAi = (results) => results.filter((r) => r.status !== "skip").map(({ area, title, status, text }) => ({ area, title, status, text }));

export async function askCeylo({ question, history, checks, role, view }) {
	if (!isAppwrite()) throw new Error("Ceylo AI answers need the cloud version of the POS.");
	if (!navigator.onLine) throw new Error("You're offline. Ceylo can answer once the connection is back.");
	const { getAppwriteCompat } = await import("./appwrite/appwriteCompat");
	const user = getAppwriteCompat().auth().currentUser;
	if (!user) throw new Error("Please sign in again.");
	const res = await fetch(URL, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await user.getIdToken()) },
		body: JSON.stringify({ question, history, checks, role, view }),
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw new Error(json.error || "Ceylo could not answer right now.");
	return json.answer;
}
