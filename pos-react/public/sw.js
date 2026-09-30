/* Offline app shell for the React POS: network-first for the page, cache-first for hashed assets. */
const CACHE = "ceylonry-pos-react-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./assets/favicon.png", "./assets/icons/ceylonry-192.png", "./assets/icons/ceylonry-512.png"];

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => {})));
	self.skipWaiting();
});
self.addEventListener("activate", (event) => {
	event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
	self.clients.claim();
});
self.addEventListener("fetch", (event) => {
	const req = event.request;
	if (req.method !== "GET") return;
	const url = new URL(req.url);
	if (url.pathname.startsWith("/.netlify/")) return; // never cache API calls
	const sameOrigin = url.origin === location.origin;
	const cdn = url.href.startsWith("https://cdn.jsdelivr.net/npm/xlsx@");
	if (!sameOrigin && !cdn) return;
	const isPage = req.mode === "navigate";
	event.respondWith(
		isPage
			? fetch(req)
					.then((res) => {
						const copy = res.clone();
						caches.open(CACHE).then((c) => c.put("./index.html", copy));
						return res;
					})
					.catch(() => caches.match("./index.html"))
			: caches.match(req).then(
					(hit) =>
						hit ||
						fetch(req).then((res) => {
							if (res && res.ok) {
								const copy = res.clone();
								caches.open(CACHE).then((c) => c.put(req, copy));
							}
							return res;
						}),
				),
	);
});
