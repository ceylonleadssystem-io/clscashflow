/**
 * Live support: drawing of what the agent puts on the client's screen (pointer, highlighter, pen, arrow, spotlight, notes). The client's screen and
 * the agent's own view use the same code, so both show the same thing. A "scene" is { items, pointer, spot }; positions are shares of the screen.
 */
export const FADE_AFTER = 8000;
export const FADE_FOR = 2000;

function arrow(ctx, pts, w, h) {
	const [x1, y1] = [pts[0][0] * w, pts[0][1] * h];
	const [x2, y2] = [pts[pts.length - 1][0] * w, pts[pts.length - 1][1] * h];
	const a = Math.atan2(y2 - y1, x2 - x1);
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(x2, y2);
	ctx.lineTo(x2 - 22 * Math.cos(a - 0.4), y2 - 22 * Math.sin(a - 0.4));
	ctx.moveTo(x2, y2);
	ctx.lineTo(x2 - 22 * Math.cos(a + 0.4), y2 - 22 * Math.sin(a + 0.4));
	ctx.stroke();
}

export function draw(ctx, w, h, scene, now) {
	ctx.clearRect(0, 0, w, h);
	if (scene.spot) {
		const { x, y, r } = scene.spot;
		ctx.save();
		ctx.fillStyle = "rgba(0,0,0,0.55)";
		ctx.beginPath();
		ctx.rect(0, 0, w, h);
		ctx.arc(x * w, y * h, r * Math.min(w, h), 0, Math.PI * 2, true);
		ctx.fill("evenodd");
		ctx.restore();
	}
	for (const it of scene.items) {
		const age = now - it.t;
		const alpha = it.k === "stroke" ? Math.max(0, Math.min(1, 1 - (age - FADE_AFTER) / FADE_FOR)) : 1;
		if (alpha <= 0) continue;
		ctx.save();
		ctx.globalAlpha = alpha * (it.tool === "highlighter" ? 0.35 : 1);
		ctx.strokeStyle = it.color;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		if (it.k === "stroke") {
			ctx.lineWidth = it.tool === "highlighter" ? 24 : 4;
			if (it.tool === "arrow") arrow(ctx, it.points, w, h);
			else {
				ctx.beginPath();
				it.points.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
				ctx.stroke();
			}
		} else if (it.k === "note") {
			ctx.font = "600 16px system-ui, sans-serif";
			const pad = 10;
			const tw = ctx.measureText(it.text).width;
			const x = Math.min(w - tw - pad * 2 - 4, it.x * w);
			const y = Math.min(h - 40, it.y * h);
			ctx.fillStyle = "#1f1c18";
			ctx.beginPath();
			ctx.roundRect(x, y, tw + pad * 2, 34, 8);
			ctx.fill();
			ctx.strokeStyle = it.color;
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.fillStyle = "#fff";
			ctx.fillText(it.text, x + pad, y + 22);
		}
		ctx.restore();
	}
	if (scene.pointer) {
		const { x, y } = scene.pointer;
		ctx.save();
		ctx.fillStyle = "rgba(255,77,10,0.9)";
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(x * w, y * h, 11, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
}


/** Puts one (clean) annotation into the scene. */
export function applyAnnotation(scene, a, now = Date.now()) {
	if (a.k === "pointer") scene.pointer = a.on ? a : null;
	else if (a.k === "spot") scene.spot = a;
	else if (a.k === "clear") (scene.items = []), (scene.spot = null);
	else scene.items.push({ ...a, t: now });
}

/** Drops strokes that have faded out. */
export const pruneScene = (scene, now = Date.now()) => {
	scene.items = scene.items.filter((it) => it.k !== "stroke" || now - it.t < FADE_AFTER + FADE_FOR);
};
