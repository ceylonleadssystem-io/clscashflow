/* Offline app shell for the React POS.
 *  - the page itself: network first, so a deploy shows up at once; the last copy opens when offline
 *  - hashed build files (/assets/name-1a2b3c4d.js|css): cache first, they never change
 *  - every other same-origin file (manifest, icons, platform.js, templates): stale while revalidate - served from the cache
 *    immediately and refreshed in the background, so a change reaches users on their next visit instead of never */
const CACHE = "ceylonry-pos-react-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./assets/favicon.png", "./assets/icons/ceylonry-192.png", "./assets/icons/ceylonry-512.png"];

// Vite file names end in an 8 character content hash
const isHashed = (pathname) => /-[A-Za-z0-9_-]{8}\.(?:js|css)$/.test(pathname);

/** Which strategy a request gets: "skip" | "page" | "hashed" | "revalidate". Pure, so it can be tested. */
function strategyFor(url, req, origin) {
	if (req.method !== "GET") return "skip";
	if (url.pathname.startsWith("/.netlify/")) return "skip"; // never cache API calls
	const cdn = url.href.startsWith("https://cdn.jsdelivr.net/npm/xlsx@");
	if (url.origin !== origin && !cdn) return "skip";
	if (req.mode === "navigate") return "page";
	return isHashed(url.pathname) ? "hashed" : "revalidate";
}

// the admin portal is a different page: it must never be stored as the POS page
const pageKey = (url) => (/\/admin(?:\.html)?\/?$/.test(url.pathname) ? url.pathname : "./index.html");

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => {})));
	self.skipWaiting();
});
self.addEventListener("activate", (event) => {
	event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
	self.clients.claim();
});

const store = (key, res) => {
	if (res && res.ok) {
		const copy = res.clone();
		caches.open(CACHE).then((c) => c.put(key, copy));
	}
	return res;
};

self.addEventListener("fetch", (event) => {
	const req = event.request;
	const url = new URL(req.url);
	const strategy = strategyFor(url, req, location.origin);
	if (strategy === "skip") return;
	if (strategy === "page") {
		const key = pageKey(url);
		event.respondWith(
			fetch(req)
				.then((res) => store(key, res))
				.catch(() => caches.match(key).then((hit) => hit || caches.match("./index.html"))),
		);
	} else if (strategy === "hashed") {
		event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => store(req, res))));
	} else {
		event.respondWith(
			caches.match(req).then((hit) => {
				const refresh = fetch(req).then((res) => store(req, res)).catch(() => hit);
				if (hit) {
					event.waitUntil(refresh);
					return hit;
				}
				return refresh;
			}),
		);
	}
});
