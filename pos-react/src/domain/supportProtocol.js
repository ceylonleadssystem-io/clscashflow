/**
 * Live support (pure): what the client's POS and the agent's admin portal send each other over the direct connection.
 * Large messages (a first copy of the page can be megabytes) are cut into small frames and put back together; what the agent draws is cleaned
 * on the client before it is shown, so an agent can only ever put a pointer, a stroke, a spotlight or a short note on the screen.
 */
export const FRAME = 12000; // characters per frame: well under every browser's data channel limit
export const TOOLS = ["highlighter", "arrow", "pen"];
export const COLORS = ["#ff4d0a", "#ffd400", "#22c55e", "#3b82f6", "#ef4444"];
const MAX_POINTS = 400;
const MAX_NOTE = 120;

const num = (v) => (Number.isFinite(+v) ? +v : 0);
/** A position on the client's screen as a share of its width or height (0 to 1). */
export const unit = (v) => Math.min(1, Math.max(0, num(v)));

let counter = 0;
/** Cuts a message into frames (strings) ready to send. */
export function toFrames(message, size = FRAME) {
	const data = JSON.stringify(message);
	const id = Date.now().toString(36) + "-" + (counter++).toString(36);
	const total = Math.max(1, Math.ceil(data.length / size));
	return Array.from({ length: total }, (_, i) => JSON.stringify({ m: id, i, n: total, d: data.slice(i * size, (i + 1) * size) }));
}

/** Puts frames back together: `push(frame)` returns the whole message when its last frame arrives, otherwise null. Half-finished messages are dropped after a while. */
export function frameReader(maxPending = 20) {
	const pending = new Map();
	return {
		push(frame) {
			let f;
			try {
				f = JSON.parse(frame);
			} catch {
				return null;
			}
			if (!f || typeof f.m !== "string" || !Number.isInteger(f.i) || !Number.isInteger(f.n) || f.n < 1 || f.n > 5000 || f.i < 0 || f.i >= f.n || typeof f.d !== "string") return null;
			const p = pending.get(f.m) || { parts: new Array(f.n), got: 0 };
			if (p.parts.length !== f.n) return null;
			if (p.parts[f.i] === undefined) {
				p.parts[f.i] = f.d;
				p.got += 1;
			}
			pending.set(f.m, p);
			if (pending.size > maxPending) pending.delete(pending.keys().next().value);
			if (p.got < f.n) return null;
			pending.delete(f.m);
			try {
				return JSON.parse(p.parts.join(""));
			} catch {
				return null;
			}
		},
	};
}

/**
 * What the agent may put on the client's screen. Returns a clean message, or null when it is not one of these. Positions are shares of the
 * screen (0 to 1), colours come from a short list, strokes and notes are limited in size.
 */
export function cleanAnnotation(m) {
	if (!m || typeof m !== "object") return null;
	const color = COLORS.includes(m.color) ? m.color : COLORS[0];
	const id = String(m.id || "").slice(0, 24);
	switch (m.k) {
		case "pointer":
			return { k: "pointer", x: unit(m.x), y: unit(m.y), on: m.on !== false };
		case "spot":
			return { k: "spot", x: unit(m.x), y: unit(m.y), r: Math.min(0.5, Math.max(0.03, num(m.r) || 0.12)) };
		case "stroke": {
			if (!TOOLS.includes(m.tool) || !Array.isArray(m.points)) return null;
			const points = m.points.slice(0, MAX_POINTS).filter((p) => Array.isArray(p) && p.length >= 2).map((p) => [unit(p[0]), unit(p[1])]);
			return points.length >= 2 ? { k: "stroke", id, tool: m.tool, color, points } : null;
		}
		case "note": {
			const text = String(m.text || "").trim().slice(0, MAX_NOTE);
			return text ? { k: "note", id, x: unit(m.x), y: unit(m.y), text, color } : null;
		}
		case "clear":
			return { k: "clear" };
		default:
			return null;
	}
}
