/**
 * POS health (pure): turns the readings the Health page collects into plain ratings and a list of things that need attention.
 */
export const rateLatency = (ms) => (ms == null ? "unknown" : ms < 400 ? "good" : ms < 1200 ? "fair" : "slow");

export function formatBytes(n) {
	if (!Number.isFinite(n) || n < 0) return "—";
	const units = ["B", "KB", "MB", "GB"];
	let i = 0;
	let v = n;
	while (v >= 1024 && i < units.length - 1) (v /= 1024), i++;
	return (v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)) + " " + units[i];
}

/**
 * The things worth looking at, from the readings:
 * { online, latencyMs, sync: { state }, cloud (true when there is a cloud account), storage: { usage, quota }, battery: { level, charging },
 *   printers: [{ name, expected, connected }], kds: { paired, connected, pending }, failedTickets, openRegisters }
 */
export function healthIssues(r = {}) {
	const out = [];
	if (r.online === false) out.push("This device is offline. Sales are saved on the device and sync when the connection returns.");
	else if (rateLatency(r.latencyMs) === "slow") out.push("The connection to the server is slow (" + Math.round(r.latencyMs) + " ms).");
	if (r.cloud && (r.sync?.state === "retry" || r.sync?.state === "offline") && r.online !== false) out.push("The last cloud sync failed. It retries on its own; tap the sync icon to retry now.");
	if (r.storage?.quota && r.storage.usage / r.storage.quota > 0.8) out.push("Storage on this device is over 80% full.");
	if (r.battery && r.battery.level < 0.2 && !r.battery.charging) out.push("The battery is below 20% and not charging.");
	for (const p of r.printers || []) if (p.expected && !p.connected) out.push(p.name + " is set up but not connected.");
	if (r.kds?.paired && !r.kds.connected) out.push("A paired kitchen screen is not connected.");
	if (r.kds?.pending > 0) out.push(r.kds.pending + " kitchen ticket" + (r.kds.pending === 1 ? " is" : "s are") + " waiting to reach a kitchen screen.");
	if (r.failedTickets > 0) out.push(r.failedTickets + " kitchen ticket" + (r.failedTickets === 1 ? "" : "s") + " could not print and " + (r.failedTickets === 1 ? "is" : "are") + " waiting in the Order Queue.");
	return out;
}
