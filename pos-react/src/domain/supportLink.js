/**
 * Live support (pure): how the connection behaves on a poor network: which page events can be skipped when the link is busy, how long to keep
 * trying to reconnect, and how the connection quality is described to the people using it.
 */

// rrweb incremental sources that only show movement: mouse moves (1), touch moves (6) and drags (12). Skipping some of them on a slow link
// loses nothing that matters, because the next one replaces it; every other event (page changes, clicks, typing, scrolling) is always sent.
const MOVEMENT = [1, 6, 12];
/** Whether this page event may be skipped when the link is busy. */
export const droppable = (event) => event?.type === 3 && MOVEMENT.includes(event?.data?.source);

export const RECONNECT_MS = 2 * 60 * 1000; // after a drop, keep trying to reconnect for this long
export const GIVE_UP = "Could not reconnect. Start a new session.";
/** Seconds to wait before reconnect attempt number `attempt` (0, 1, 2...): 1, 2, 4, 8, then 10. */
export const reconnectDelay = (attempt) => Math.min(10, 2 ** Math.max(0, attempt));
/** Whether reconnecting should still be tried, `startedAt` being when the connection dropped. */
export const keepTrying = (startedAt, now = Date.now()) => now - startedAt < RECONNECT_MS;

/** A line describing the connection: "Direct, 40 ms", "Through the relay, 180 ms", "Slow ..." above 500 ms. */
export function linkLabel(link) {
	if (!link) return "";
	const way = link.relay ? "Through the relay" : "Direct";
	const ms = Number.isFinite(link.rtt) && link.rtt >= 0 ? Math.round(link.rtt) : null;
	if (ms === null) return way;
	return `${ms > 500 ? "Slow: " : ""}${way}, ${ms} ms`;
}
