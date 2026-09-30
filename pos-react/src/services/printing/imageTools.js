/** Canvas helpers: image compression, logo cropping, raster conversion for ESC/POS / TSPL. */

export const readFileAsDataUrl = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ""));
		reader.onerror = () => reject(new Error("The selected file could not be read."));
		reader.readAsDataURL(file);
	});

const loadImage = (src) =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("The selected image could not be read."));
		img.src = src;
	});

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

/** Crops transparent / white margins, scales to <=800px and returns a PNG data URL. */
export async function fitBusinessLogo(file, max = 800) {
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
	return out.toDataURL("image/png");
}

/** Removes solid dark bars that scanners mistake for QR borders. */
export function whitenSolidQrBackground(canvas) {
	const ctx = canvas.getContext("2d");
	const { width, height } = canvas;
	const imageData = ctx.getImageData(0, 0, width, height);
	const px = imageData.data;
	const rows = [];
	const cols = [];
	const luma = (o) => 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2];
	for (let y = 0; y < height; y++) {
		let dark = 0;
		for (let x = 0; x < width; x++) {
			const o = (y * width + x) * 4;
			if (px[o + 3] > 40 && luma(o) < 115) dark++;
		}
		if (dark > width * 0.55) rows.push(y);
	}
	for (let x = 0; x < width; x++) {
		let dark = 0;
		for (let y = 0; y < height; y++) {
			const o = (y * width + x) * 4;
			if (px[o + 3] > 40 && luma(o) < 115) dark++;
		}
		if (dark > height * 0.55) cols.push(x);
	}
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

/** Crops the light QR artwork out of its backdrop and returns a clean 640px PNG. */
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
		const size = 640;
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
