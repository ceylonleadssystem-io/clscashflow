/**
 * Live support, the client's own record: what support opened or did on this POS during a live session goes in the location's audit log
 * (Settings > audit), next to the sessions the administration portal records.
 */
import { audit } from "./common";

export async function logSupportAction(ctx, action, detail) {
	const s = ctx.session();
	await ctx.store.write((tx) => audit(tx, s, action, detail, s.locationId === "all" ? "" : s.locationId));
}
