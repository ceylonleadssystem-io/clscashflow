/**
 * What the support agent draws on this screen during a live session: a pointer, a highlighter, an arrow, a pen, a spotlight and short notes.
 * Everything is drawn on one canvas above the POS that cannot be clicked, so the POS keeps working underneath. Drawings fade after a few seconds;
 * the spotlight and notes stay until the agent clears them. Positions arrive as shares of the screen and are already cleaned (domain/supportProtocol.js).
 */
import { useEffect, useRef } from "react";
import { onAnnotation, useSupport } from "../../services/supportLive";
import { applyAnnotation, draw, pruneScene } from "./drawScene";

export function SupportOverlay() {
	const s = useSupport();
	const canvas = useRef(null);
	const live = s.status === "live";
	useEffect(() => {
		if (!live) return undefined;
		const scene = { items: [], pointer: null, spot: null };
		const el = canvas.current;
		const ctx = el.getContext("2d");
		let raf = 0;
		const size = () => {
			const ratio = window.devicePixelRatio || 1;
			el.width = Math.round(window.innerWidth * ratio);
			el.height = Math.round(window.innerHeight * ratio);
			ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		};
		const frame = () => {
			draw(ctx, window.innerWidth, window.innerHeight, scene, Date.now());
			pruneScene(scene);
			raf = scene.items.length || scene.pointer || scene.spot ? requestAnimationFrame(frame) : 0;
		};
		const wake = () => !raf && (raf = requestAnimationFrame(frame));
		size();
		window.addEventListener("resize", size);
		const off = onAnnotation((a) => {
			applyAnnotation(scene, a);
			wake();
			if (!raf) draw(ctx, window.innerWidth, window.innerHeight, scene, Date.now());
		});
		return () => {
			off();
			window.removeEventListener("resize", size);
			cancelAnimationFrame(raf);
			ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
		};
	}, [live]);
	if (!live) return null;
	return <canvas ref={canvas} className="support-overlay support-block" data-support-block aria-hidden="true" />;
}
