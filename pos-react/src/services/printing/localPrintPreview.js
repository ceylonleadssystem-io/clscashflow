/**
 * Local test environment only (dev server + VITE_AUTH_PROVIDER=local): instead of sending a job to the browser print
 * dialog or a USB printer, show what would be printed in an on-screen preview with a "Save as PDF" button. Receipts,
 * kitchen tickets, Android-print labels, USB receipts and USB labels (the real TSPL bitmap, so it shows exactly what
 * the printer would draw) all end up here. Never active in a production build or in the automated tests.
 */
import { env } from "../../config/env";

export const localPrintPreview = () =>
	import.meta.env.DEV && import.meta.env.MODE !== "test" && env.authProvider === "local" && typeof document?.createElement === "function";

const CSS = `.local-print-preview{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;background:rgba(20,20,20,.72);font-family:Arial,sans-serif}
.local-print-preview header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:#171512;color:#fff}
.local-print-preview header strong{flex:1 1 220px}
.local-print-preview header small{opacity:.7;flex:1 1 100%}
.local-print-preview button{padding:8px 14px;border:0;border-radius:8px;font-weight:700;cursor:pointer}
.local-print-preview .lpp-pdf{background:#ff5a00;color:#fff}
.local-print-preview .lpp-close{background:#fff;color:#171512}
.local-print-preview iframe{flex:1;border:0;background:#e9e6df;width:100%}`;

/** Shows `html` (a complete print document) in the preview overlay. Returns true. */
export function showPrintPreview({ title, html }) {
	document.querySelectorAll(".local-print-preview").forEach((n) => n.remove());
	if (!document.getElementById("local-print-preview-css")) {
		const style = document.createElement("style");
		style.id = "local-print-preview-css";
		style.textContent = CSS;
		document.head.append(style);
	}
	const box = document.createElement("div");
	box.className = "local-print-preview";
	box.setAttribute("role", "dialog");
	box.setAttribute("aria-label", title);
	const head = document.createElement("header");
	const strong = document.createElement("strong");
	strong.textContent = "Print preview · " + title;
	const pdf = document.createElement("button");
	pdf.className = "lpp-pdf";
	pdf.textContent = "Save as PDF";
	const close = document.createElement("button");
	close.className = "lpp-close";
	close.textContent = "Close";
	const note = document.createElement("small");
	note.textContent = "Local test mode: nothing was sent to a printer. Save as PDF opens the browser print dialog; choose “Save as PDF” as the destination.";
	head.append(strong, pdf, close, note);
	const frame = document.createElement("iframe");
	frame.title = title;
	frame.srcdoc = String(html).replace("onload=()=>print()", "");
	box.append(head, frame);
	pdf.onclick = () => frame.contentWindow?.print();
	close.onclick = () => box.remove();
	document.body.append(box);
	return true;
}

/** The BITMAP of a TSPL job as a PNG data URL ("" when the bytes contain no bitmap). */
export function tsplBytesToDataUrl(bytes) {
	const text = new TextDecoder("latin1").decode(bytes);
	const m = text.match(/BITMAP 0,0,(\d+),(\d+),0,/);
	if (!m) return "";
	const rowBytes = +m[1];
	const height = +m[2];
	const start = m.index + m[0].length;
	const canvas = document.createElement("canvas");
	canvas.width = rowBytes * 8;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	const img = ctx.createImageData(canvas.width, height);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < canvas.width; x++) {
			const white = (bytes[start + y * rowBytes + (x >> 3)] & (128 >> (x & 7))) !== 0; // a set bit is a WHITE dot
			const o = (y * canvas.width + x) * 4;
			img.data[o] = img.data[o + 1] = img.data[o + 2] = white ? 255 : 0;
			img.data[o + 3] = 255;
		}
	ctx.putImageData(img, 0, 0);
	return canvas.toDataURL("image/png");
}

// Labels sent within a couple of seconds of each other (one job per size) are shown together in one preview.
let batch = { at: 0, w: 0, h: 0, pages: "", count: 0, name: "" };

/** Shows a TSPL label job: one page per label (up to 50 per job) at the real label size. */
export function showLabelPreview({ title, bytes, size, copies = 1 }) {
	const [w, h] = [Number(size[0]) || 30, Number(size[1]) || 25];
	const src = tsplBytesToDataUrl(bytes);
	const n = Math.max(1, Math.min(50, Number(copies) || 1));
	const now = Date.now();
	const same = now - batch.at < 2500 && batch.w === w && batch.h === h && document.querySelector(".local-print-preview");
	const page = `<section><img src="${src}" alt="Label preview"></section>`.repeat(n);
	batch = { at: now, w, h, pages: (same ? batch.pages : "") + page, count: (same ? batch.count : 0) + n, name: same ? batch.name : title };
	const html = `<!doctype html><html><head><style>@page{size:${w}mm ${h}mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9e6df;display:flex;flex-wrap:wrap;gap:12px;padding:16px;justify-content:center}section{width:${w}mm;height:${h}mm;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.35);page-break-after:always}img{width:100%;height:100%;display:block;image-rendering:pixelated}@media screen{section{zoom:2.2}}@media print{body{display:block;padding:0;background:#fff}section{box-shadow:none}}</style></head><body>${batch.pages}</body></html>`;
	return showPrintPreview({ title: `${batch.name} · ${w} × ${h} mm · ${batch.count} label${batch.count === 1 ? "" : "s"}`, html });
}
