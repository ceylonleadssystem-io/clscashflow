/**
 * Moves a signed-in business to the POS address that matches its business type without a second sign-in: the server gives this signed-in
 * user a one-time token that expires in a minute, and the other address signs in with it (the token travels in the URL fragment, which is
 * never sent to a server). If the token cannot be had, the business is still sent there and signs in again.
 */
import { env } from "../config/env";
import { createLogger } from "../utils/logger";

const log = createLogger("handoff");

export async function handOff(user, url) {
	let hash = "";
	try {
		const res = await fetch(env.handoffUrl, { method: "POST", cache: "no-store", headers: { Authorization: "Bearer " + (await user.getIdToken()) } });
		const json = await res.json().catch(() => ({}));
		if (res.ok && json.ok) hash = "#cls-access=" + encodeURIComponent(json.userId) + "." + encodeURIComponent(json.secret);
		else log.warn("handoff token refused", null, { status: res.status });
	} catch (e) {
		log.warn("handoff token unavailable; the business will sign in again", e);
	}
	log.info("moving to the POS address of this business type", { target: url, token: !!hash });
	location.replace(url + hash);
}
