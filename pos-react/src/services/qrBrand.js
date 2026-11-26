/**
 * The branded QR menu code: the Ceylonry Labs mark in the centre and a frame with "ceylonrylabs" in small letters on all four sides.
 * The code uses the highest error correction (it can lose about 30% and still scan), so the logo, which covers about 5%, is safe.
 */
import QRCode from "qrcode";
import mark from "../assets/ceylonry-labs-mark.png";

export const BRAND_WORD = "ceylonrylabs";

/** Pixel layout of the picture: frame band, white quiet area with the code, centre badge. All sizes follow from `size`. */
export function qrLayout(size = 1000) {
	const band = Math.round(size * 0.055); // the frame that holds the small words
	const inner = size - band * 2;
	const badge = Math.round(inner * 0.22);
	return { size, band, inner, badge, badgeAt: Math.round((size - badge) / 2) };
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
	const { band, inner, badge, badgeAt } = qrLayout(size);
	const code = document.createElement("canvas");
	await QRCode.toCanvas(code, url, { width: inner, margin: 4, errorCorrectionLevel: "H", color: { dark: "#181512", light: "#ffffff" } });
	const logo = await load(mark);

	const c = document.createElement("canvas");
	c.width = c.height = size;
	const g = c.getContext("2d");
	g.fillStyle = "#ffffff";
	g.fillRect(0, 0, size, size);
	g.drawImage(code, band, band, inner, inner);

	// frame: two thin lines with the word repeated between them on all four sides
	const line = Math.max(2, Math.round(size * 0.004));
	g.strokeStyle = "#e9651b";
	g.lineWidth = line;
	for (const at of [line / 2, band - line / 2]) g.strokeRect(at, at, size - at * 2, size - at * 2);
	g.fillStyle = "#181512";
	g.font = `600 ${Math.round(band * 0.42)}px system-ui, -apple-system, Arial, sans-serif`;
	g.textAlign = "center";
	g.textBaseline = "middle";
	const gap = "  •  ";
	const room = size - band * 2;
	const times = Math.max(1, Math.floor(room / g.measureText(BRAND_WORD + gap).width));
	const text = Array(times).fill(BRAND_WORD).join(gap);
	for (let side = 0; side < 4; side++) {
		g.save();
		g.translate(size / 2, size / 2);
		const upright = side === 2; // the bottom edge reads the right way up
		g.rotate(upright ? 0 : (Math.PI / 2) * side);
		g.fillText(text, 0, (upright ? 1 : -1) * (size / 2 - band / 2), room);
		g.restore();
	}

	// centre badge: white rounded square with the mark inside
	g.fillStyle = "#ffffff";
	g.beginPath();
	if (g.roundRect) g.roundRect(badgeAt, badgeAt, badge, badge, badge * 0.18);
	else g.rect(badgeAt, badgeAt, badge, badge);
	g.fill();
	const fit = (badge * 0.78) / Math.max(logo.width, logo.height);
	const w = logo.width * fit;
	const h = logo.height * fit;
	g.drawImage(logo, (size - w) / 2, (size - h) / 2, w, h);
	return c.toDataURL("image/png");
}
