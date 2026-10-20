/**
 * Ask Ceylo: sends a question, the last few chat turns and Ceylo's check results (titles and plain sentences only) to the
 * `ceylo-ask` Netlify function, which answers with Claude (or the business's own AI key). Never sends PINs or customer data;
 * the business's own key goes only to `ceylo-ai-key`, which stores it encrypted and never returns it.
 */
import { isAppwrite } from "../config/env";

const URL = "/.netlify/functions/ceylo-ask";

/** Only what the answer needs from each check. */
export const checksForAi = (results) => results.filter((r) => r.status !== "skip").map(({ area, title, status, text }) => ({ area, title, status, text }));

async function post(url, body, fallback) {
	if (!isAppwrite()) throw new Error("Ceylo AI needs the cloud version of the POS.");
	if (!navigator.onLine) throw new Error("You're offline. Try again once the connection is back.");
	const { getAppwriteCompat } = await import("./appwrite/appwriteCompat");
	const user = getAppwriteCompat().auth().currentUser;
	if (!user) throw new Error("Please sign in again.");
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await user.getIdToken()) },
		body: JSON.stringify(body),
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw new Error(json.error || fallback);
	return json;
}

export const askCeylo = async ({ question, history, checks, role, view }) => (await post(URL, { question, history, checks, role, view }, "Ceylo could not answer right now.")).answer;

/** The business's own AI key: `status`, `save` ({ provider, key, model }) or `remove`. The key itself is never returned. */
export const aiKey = (action, fields = {}) => post("/.netlify/functions/ceylo-ai-key", { action, ...fields }, "Could not update the AI key right now.");
