/**
 * The branded QR menu code: a card with curved corners, the Ceylonry Labs mark in the centre and "ceylonrylabs" in small letters
 * wrapping all the way around the code.
 * The code uses the highest error correction (it can lose about 30% and still scan), so the logo, which covers about 5%, is safe.
 */
import QRCode from "qrcode";
import mark from "../assets/ceylonry-labs-mark.png";

export const BRAND_WORD = "ceylonrylabs";

/** Pixel layout of the picture: text band, white quiet area with the code, curved corners, centre badge. All sizes follow from `size`. */
export function qrLayout(size = 1000) {
	const band = Math.round(size * 0.055); // the frame that holds the small words
	const inner = size - band * 2;
	const badge = Math.round(inner * 0.22);
	return { size, band, inner, badge, badgeAt: Math.round((size - badge) / 2), corner: Math.round(size * 0.12) };
}

/**
 * The point `t` pixels clockwise along a rounded square that sits `inset` pixels inside a `size` picture and has corner radius `r`,
 * starting where the top edge begins. Returns { x, y, angle } (angle = direction of travel) and the full length of the path.
 */
export function framePoint(t, size, inset, r) {
	const straight = size - inset * 2 - r * 2;
	const arc = (Math.PI / 2) * r;
	const length = (straight + arc) * 4;
	let at = ((t % length) + length) % length;
	const side = Math.floor(at / (straight + arc));
	at -= side * (straight + arc);
	// worked out for the top edge and its right-hand corner, then turned a quarter turn per side around the centre
	const half = size / 2;
	const edge = half - inset;
	const turn = at > straight ? (at - straight) / r : 0;
	const x = turn ? edge - r + r * Math.sin(turn) : -edge + r + at;
	const y = turn ? -edge + r - r * Math.cos(turn) : -edge;
	const q = (Math.PI / 2) * side;
	return { x: half + x * Math.cos(q) - y * Math.sin(q), y: half + x * Math.sin(q) + y * Math.cos(q), angle: q + turn, length };
}

const load = (src) =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("The logo could not be loaded."));
		img.src = src;
	});

/** A PNG data URL of the branded code that opens `url`. */
export async function brandedQr(url, size = 1000) {
	const { band, inner, badge, badgeAt, corner } = qrLayout(size);
	const code = document.createElement("canvas");
	await QRCode.toCanvas(code, url, { width: inner, margin: 4, errorCorrectionLevel: "H", color: { dark: "#181512", light: "#ffffff" } });
	const logo = await load(mark);

	const c = document.createElement("canvas");
	c.width = c.height = size;
	const g = c.getContext("2d");
	const roundedBox = (x, y, side, r) => {
		g.beginPath();
		if (g.roundRect) g.roundRect(x, y, side, side, r);
		else g.rect(x, y, side, side);
		g.fill();
	};
	g.fillStyle = "#ffffff";
	roundedBox(0, 0, size, corner); // outside the curve stays transparent
	g.drawImage(code, band, band, inner, inner);

	// the word repeats clockwise around the card, letter by letter, spaced so the last one meets the first
	g.fillStyle = "#181512";
	g.font = `600 ${Math.round(band * 0.42)}px system-ui, -apple-system, Arial, sans-serif`;
	g.textAlign = "center";
	g.textBaseline = "middle";
	const inset = band / 2;
	const radius = corner - inset;
	const { length } = framePoint(0, size, inset, radius);
	const unit = BRAND_WORD + "  •  ";
	const widths = [...unit].map((ch) => g.measureText(ch).width);
	const unitWidth = widths.reduce((a, w) => a + w, 0);
	const times = Math.max(1, Math.floor(length / unitWidth));
	const stretch = length / (times * unitWidth);
	let t = 0;
	for (let i = 0; i < times; i++) {
		[...unit].forEach((ch, n) => {
			const step = widths[n] * stretch;
			const p = framePoint(t + step / 2, size, inset, radius);
			g.save();
			g.translate(p.x, p.y);
			g.rotate(p.angle);
			g.fillText(ch, 0, 0);
			g.restore();
			t += step;
		});
	}

	// centre badge: white rounded square with the mark inside
	g.fillStyle = "#ffffff";
	roundedBox(badgeAt, badgeAt, badge, badge * 0.18);
	const fit = (badge * 0.78) / Math.max(logo.width, logo.height);
	const w = logo.width * fit;
	const h = logo.height * fit;
	g.drawImage(logo, (size - w) / 2, (size - h) / 2, w, h);
	return c.toDataURL("image/png");
}
