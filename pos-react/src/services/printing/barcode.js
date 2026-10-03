/**
 * Barcode helpers for product labels: Code 39 and Code 128 encoders, cleaning/generating codes, an SVG
 * Code 39 for previews and browser print, and a canvas drawer for bitmap label printing.
 */
import { esc } from "../../domain/format";

/** Code 39 + Code 128 encoders used for product barcode labels. */

export const CODE39 = {
	0: "nnnwwnwnn", 1: "wnnwnnnnw", 2: "nnwwnnnnw", 3: "wnwwnnnnn", 4: "nnnwwnnnw",
	5: "wnnwwnnnn", 6: "nnwwwnnnn", 7: "nnnwnnwnw", 8: "wnnwnnwnn", 9: "nnwwnnwnn",
	A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn",
	F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
	K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn",
	P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
	U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn",
	Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", $: "nwnwnwnnn",
	"/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn",
};

export const CODE128 = [
	"212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
	"221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
	"221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
	"212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
	"231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
	"231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
	"314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
	"112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
	"111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
	"214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
	"114131","311141","411131","211412","211214","211232","2331112",
];

export const cleanBarcode = (value) =>
	String(value || "")
		.toUpperCase()
		.replace(/[^0-9A-Z. $/+%-]/g, "-")
		.slice(0, 32);

/** Random, collision-free "AS-########" code (used when a product has none). */
export function uniqueBarcode(existingCodes = []) {
	let code;
	do {
		const bytes = new Uint32Array(1);
		crypto.getRandomValues(bytes);
		code = "AS-" + String(bytes[0] % 100000000).padStart(8, "0");
	} while (existingCodes.includes(code));
	return code;
}

/** Code 39 as an SVG string (on-screen preview and browser print). */
export function barcodeSvg(value) {
	const code = "*" + cleanBarcode(value) + "*";
	let x = 8;
	const rects = [];
	for (let c = 0; c < code.length; c++) {
		const pattern = CODE39[code[c]] || CODE39["-"];
		for (let i = 0; i < pattern.length; i++) {
			const width = pattern[i] === "w" ? 6 : 2;
			if (i % 2 === 0) rects.push(`<rect x="${x}" y="4" width="${width}" height="96"/>`);
			x += width;
		}
		x += 3;
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 8} 106" role="img" aria-label="Barcode ${esc(
		value,
	)}"><g fill="#000">${rects.join("")}</g></svg>`;
}

export function code128Values(value) {
	const text = String(value || "").replace(/[^\x20-\x7e]/g, "-").slice(0, 32);
	const values = [104];
	let sum = 104;
	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i) - 32;
		values.push(code);
		sum += code * (i + 1);
	}
	values.push(sum % 103, 106);
	return values;
}

/** Draws a Code 128 barcode onto a canvas context (for bitmap label printing). */
export function drawCode128(ctx, value, x, y, width, height, darken) {
	const values = code128Values(value);
	const units = values.reduce(
		(total, item) => total + CODE128[item].split("").reduce((sum, d) => sum + Number(d), 0),
		0,
	);
	const scale = width / units;
	let cursor = x;
	ctx.fillStyle = "#000";
	values.forEach((item) => {
		const pattern = CODE128[item];
		for (let i = 0; i < pattern.length; i++) {
			const w = Number(pattern[i]) * scale;
			if (i % 2 === 0) {
				const drawX = Math.round(cursor);
				const drawW = Math.max(darken ? 2 : 1, Math.round(w) + (darken ? 1 : 0));
				ctx.fillRect(drawX, Math.round(y), drawW, Math.round(height));
			}
			cursor += w;
		}
	});
}
