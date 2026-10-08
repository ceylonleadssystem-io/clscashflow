/**
 * Cloud storage for POS images (product photos, business logo, receipt QR). Images are uploaded to an Appwrite
 * Storage bucket through the Netlify function `appwrite-files`; the product / setting keeps only the file URL, so the
 * business data that every device syncs stays small. Every failure path returns the original data-URL instead, so an
 * image is never lost: offline, local test mode, or a storage error all fall back to the old behaviour.
 */
import { env, isAppwrite } from "../config/env";
import { createLogger } from "../utils/logger";

const log = createLogger("images");

export const isDataImage = (v) => /^data:image\/(jpeg|png|webp);base64,/.test(String(v || ""));

async function authHeaders() {
	const { getAppwriteCompat } = await import("./appwrite/appwriteCompat");
	const user = getAppwriteCompat().auth().currentUser;
	if (!user) return null;
	return { "Content-Type": "application/json", Authorization: "Bearer " + (await user.getIdToken()) };
}

async function call(body) {
	const headers = await authHeaders();
	if (!headers) return null; // not signed in to the cloud: keep the image on this device
	const res = await fetch(env.imagesFunctionUrl, { method: "POST", headers, body: JSON.stringify(body) });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.ok === false) throw new Error(json.error || "Image storage failed (" + res.status + ")");
	return json;
}

let onUploadFailed = null;
/** Lets the app show why an image stayed on this device (set once by the session provider). */
export const setUploadFailureHandler = (fn) => {
	onUploadFailed = fn;
};

/** Uploads a data-URL image and returns its file URL; returns the input unchanged when it is not a data-URL or cannot be uploaded. */
export async function storeImage(image, kind = "product") {
	if (!isDataImage(image) || !isAppwrite() || (typeof navigator !== "undefined" && navigator.onLine === false)) return image;
	try {
		const json = await call({ action: "upload", kind, data: image });
		return json?.url || image;
	} catch (e) {
		log.warn("image kept on this device (upload failed)", e);
		onUploadFailed?.(e.message);
		return image;
	}
}
