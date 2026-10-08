/**
 * Canvas image helpers: compress product photos, crop and fit the business logo, clean the social QR
 * artwork, and convert images to monochrome ESC/POS raster blocks for the receipt printer.
 */
/** Canvas helpers: image compression, logo cropping, raster conversion for ESC/POS / TSPL. */

export const readFileAsDataUrl = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ""));
		reader.onerror = () => reject(new Error("The selected file could not be read."));
		reader.readAsDataURL(file);
	});

// Pictures kept in cloud storage are fetched once per session and read back from memory, so printing a receipt
// does not wait for the network (and the canvas stays readable: a blob is same-origin, a plain cross-site <img> is not).
const remoteBlobs = new Map();

const loadImage = async (src) => {
	let url = src;
	if (/^https?:\/\//i.test(src)) {
		if (!remoteBlobs.has(src)) {
			const res = await fetch(src, { mode: "cors" });
			if (!res.ok) throw new Error("The image could not be downloaded.");
			remoteBlobs.set(src, await res.blob());
		}
		url = URL.createObjectURL(remoteBlobs.get(src));
	}
	try {
		return await new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error("The selected image could not be read."));
			img.src = url;
		});
	} finally {
		if (url !== src) URL.revokeObjectURL(url);
	}
};

/** Product photo -> JPEG max 700px (stored in the local database). */
export async function compressProductImage(file, max = 700, quality = 0.78) {
	const img = await loadImage(await readFileAsDataUrl(file));
	const c = document.createElement("canvas");
	const scale = Math.min(1, max / Math.max(img.width, img.height));
	c.width = Math.round(img.width * scale);
	c.height = Math.round(img.height * scale);
	c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
	return c.toDataURL("image/jpeg", quality);
}

/** Crops transparent / white margins, scales to <=512px and returns a WebP data URL (PNG when WebP is not available). */
export async function fitBusinessLogo(file, max = 512) {
	const img = await loadImage(await readFileAsDataUrl(file));
	const source = document.createElement("canvas");
	const ctx = source.getContext("2d", { willReadFrequently: true });
	source.width = img.naturalWidth;
	source.height = img.naturalHeight;
	ctx.drawImage(img, 0, 0);
	const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
	let minX = source.width;
	let minY = source.height;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < source.height; y += 2)
		for (let x = 0; x < source.width; x += 2) {
			const n = (y * source.width + x) * 4;
			const a = pixels[n + 3];
			const brightness = Math.min(pixels[n], pixels[n + 1], pixels[n + 2]);
			if (a > 18 && brightness < 246) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	if (maxX < 0) {
		minX = 0;
		minY = 0;
		maxX = source.width - 1;
		maxY = source.height - 1;
	}
	const cropW = maxX - minX + 1;
	const cropH = maxY - minY + 1;
	const pad = Math.round(Math.max(cropW, cropH) * 0.04);
	const sx = Math.max(0, minX - pad);
	const sy = Math.max(0, minY - pad);
	const sw = Math.min(source.width - sx, cropW + pad * 2);
	const sh = Math.min(source.height - sy, cropH + pad * 2);
	const out = document.createElement("canvas");
	const scale = Math.min(1, max / Math.max(sw, sh));
	out.width = Math.max(1, Math.round(sw * scale));
	out.height = Math.max(1, Math.round(sh * scale));
	out.getContext("2d").drawImage(source, sx, sy, sw, sh, 0, 0, out.width, out.height);
	const webp = out.toDataURL("image/webp", 0.85); // browsers that cannot encode WebP answer with a PNG instead
	return webp.startsWith("data:image/webp") ? webp : out.toDataURL("image/png");
}

/**
 * Rows/columns of solid dark pixels that are a frame around the QR rather than part of it: nearly fully dark (>= 90%)
 * and inside the outer 10% of the image. A real QR code never has a row or column that dark, and its dense inner rows
 * (often > 55% dark) must be left alone, otherwise white bars cut through the printed code.
 */
export function solidBarLines(px, width, height) {
	const dark = (o) => px[o + 3] > 40 && 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2] < 115;
	const edgeY = Math.ceil(height * 0.1);
	const edgeX = Math.ceil(width * 0.1);
	const rows = [];
	const cols = [];
	for (let y = 0; y < height; y++) {
		if (y >= edgeY && y < height - edgeY) continue;
		let n = 0;
		for (let x = 0; x < width; x++) if (dark((y * width + x) * 4)) n++;
		if (n >= width * 0.9) rows.push(y);
	}
	for (let x = 0; x < width; x++) {
		if (x >= edgeX && x < width - edgeX) continue;
		let n = 0;
		for (let y = 0; y < height; y++) if (dark((y * width + x) * 4)) n++;
		if (n >= height * 0.9) cols.push(x);
	}
	return { rows, cols };
}

/** Pure black or white pixels (no greys): a QR needs nothing else and the PNG shrinks to a few KB. */
function binarize(canvas) {
	const ctx = canvas.getContext("2d");
	const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const px = img.data;
	for (let o = 0; o < px.length; o += 4) {
		const v = px[o + 3] > 40 && 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2] < 140 ? 0 : 255;
		px[o] = px[o + 1] = px[o + 2] = v;
		px[o + 3] = 255;
	}
	ctx.putImageData(img, 0, 0);
}

/** Removes solid dark frame bars that scanners mistake for QR borders (see solidBarLines). */
export function whitenSolidQrBackground(canvas) {
	const ctx = canvas.getContext("2d");
	const { width, height } = canvas;
	const imageData = ctx.getImageData(0, 0, width, height);
	const px = imageData.data;
	const { rows, cols } = solidBarLines(px, width, height);
	const white = (o) => {
		px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 255;
	};
	rows.forEach((row) => {
		for (let x = 0; x < width; x++) white((row * width + x) * 4);
	});
	cols.forEach((col) => {
		for (let y = 0; y < height; y++) white((y * width + col) * 4);
	});
	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

/** Crops the light QR artwork out of its backdrop and returns a clean 384px black-and-white PNG (a few KB). */
export async function cleanReceiptQrImage(source) {
	try {
		const image = await loadImage(source);
		const scan = document.createElement("canvas");
		scan.width = image.width;
		scan.height = image.height;
		const sctx = scan.getContext("2d");
		sctx.drawImage(image, 0, 0);
		const pixels = sctx.getImageData(0, 0, scan.width, scan.height).data;
		let minX = scan.width;
		let minY = scan.height;
		let maxX = 0;
		let maxY = 0;
		let found = false;
		for (let y = 0; y < scan.height; y++)
			for (let x = 0; x < scan.width; x++) {
				const o = (y * scan.width + x) * 4;
				const l = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2];
				if (pixels[o + 3] > 40 && l > 185) {
					found = true;
					minX = Math.min(minX, x);
					minY = Math.min(minY, y);
					maxX = Math.max(maxX, x);
					maxY = Math.max(maxY, y);
				}
			}
		if (!found) return source;
		const cropX = Math.max(0, minX);
		const cropY = Math.max(0, minY);
		const cropW = Math.min(scan.width - cropX, maxX - minX + 1);
		const cropH = Math.min(scan.height - cropY, maxY - minY + 1);
		const size = 384;
		const out = document.createElement("canvas");
		out.width = size;
		out.height = size;
		const ctx = out.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, size, size);
		const scale = Math.min(size / cropW, size / cropH);
		const dw = Math.round(cropW * scale);
		const dh = Math.round(cropH * scale);
		ctx.drawImage(image, cropX, cropY, cropW, cropH, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh);
		whitenSolidQrBackground(out);
		binarize(out);
		return out.toDataURL("image/png");
	} catch (error) {
		console.warn("Receipt QR background cleanup failed:", error);
		return source;
	}
}

/**
 * Renders an image into a monochrome ESC/POS `GS v 0` raster block.
 * `square` fits into size x size on white; `threshold` decides black pixels.
 */
export async function escPosRaster(src, { size = 240, threshold = 160, leadingFeed = false, qr = false } = {}) {
	if (!src) return new Uint8Array(0);
	try {
		let canvas;
		const image = await loadImage(src);
		canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, size, size);
		const scale = Math.min(size / image.width, size / image.height);
		const dw = Math.max(1, Math.round(image.width * scale));
		const dh = Math.max(1, Math.round(image.height * scale));
		ctx.drawImage(image, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh);
		if (qr) whitenSolidQrBackground(canvas);
		const pixels = ctx.getImageData(0, 0, size, size).data;
		const rowBytes = Math.ceil(size / 8);
		const raster = new Uint8Array(rowBytes * size);
		for (let y = 0; y < size; y++)
			for (let x = 0; x < size; x++) {
				const o = (y * size + x) * 4;
				const l = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2];
				if (pixels[o + 3] > 40 && l < threshold) raster[y * rowBytes + (x >> 3)] |= 128 >> (x & 7);
			}
		const header = new Uint8Array([
			...(leadingFeed ? [10] : [27, 64]),
			27, 97, 1, 29, 118, 48, 0, rowBytes & 255, rowBytes >> 8, size & 255, size >> 8,
		]);
		const footer = new Uint8Array([10, 27, 97, 0]);
		const out = new Uint8Array(header.length + raster.length + footer.length);
		out.set(header);
		out.set(raster, header.length);
		out.set(footer, header.length + raster.length);
		return out;
	} catch (error) {
		console.warn("Image could not be rasterised:", error);
		return new Uint8Array(0);
	}
}
