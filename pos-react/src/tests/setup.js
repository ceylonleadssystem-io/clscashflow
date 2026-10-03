/**
 * Minimal browser globals (localStorage, sessionStorage, navigator, window, document) so the service tests run in Node.
 */
/** Minimal browser globals for service tests that run in Node. */
const store = new Map();
globalThis.localStorage = {
	getItem: (k) => (store.has(k) ? store.get(k) : null),
	setItem: (k, v) => void store.set(k, String(v)),
	removeItem: (k) => void store.delete(k),
	clear: () => store.clear(),
};
globalThis.sessionStorage = globalThis.localStorage;
Object.defineProperty(globalThis, "navigator", { value: { onLine: true, userAgent: "node" }, configurable: true });
globalThis.window = { addEventListener() {}, removeEventListener() {}, CLS_AZURE_SWIM_IMAGES: undefined };
globalThis.document = { addEventListener() {}, removeEventListener() {}, hidden: false };
