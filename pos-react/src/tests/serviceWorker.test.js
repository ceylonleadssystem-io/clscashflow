import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// public/sw.js is a plain script: load it with a stand-in for the worker scope and read its pure helpers
const code = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const handlers = {};
const worker = new Function("self", "caches", "location", code + "\nreturn { strategyFor, pageKey, CACHE };")({ addEventListener: (n, f) => (handlers[n] = f) }, {}, { origin: "https://pos.test" });
const { strategyFor, pageKey, CACHE } = worker;

const req = (url, init = {}) => ({ method: "GET", mode: "no-cors", ...init, url });
const pick = (url, init) => strategyFor(new URL(url), req(url, init), "https://pos.test");

describe("service worker strategies", () => {
	it("never touches API calls, writes or other sites", () => {
		expect(pick("https://pos.test/.netlify/functions/appwrite-docs")).toBe("skip");
		expect(pick("https://pos.test/posv2/assets/x.png", { method: "POST" })).toBe("skip");
		expect(pick("https://fonts.googleapis.com/css2?family=DM+Sans")).toBe("skip");
		expect(pick("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js")).toBe("revalidate");
	});
	it("caches hashed build files for good and refreshes everything else in the background", () => {
		expect(pick("https://pos.test/posv2/assets/index-6bGuUAP8.css")).toBe("hashed");
		expect(pick("https://pos.test/posv2/assets/main-5Q2_DutA.js")).toBe("hashed");
		expect(pick("https://pos.test/posv2/manifest.webmanifest")).toBe("revalidate");
		expect(pick("https://pos.test/assets/platform.js")).toBe("revalidate");
		expect(pick("https://pos.test/posv2/assets/icons/ceylonry-192.png")).toBe("revalidate");
	});
	it("treats page loads as network-first and keeps the admin page out of the POS page slot", () => {
		expect(pick("https://pos.test/posv2/", { mode: "navigate" })).toBe("page");
		expect(pageKey(new URL("https://pos.test/posv2/"))).toBe("./index.html");
		expect(pageKey(new URL("https://pos.test/posv2/admin"))).toBe("/posv2/admin");
		expect(pageKey(new URL("https://pos.test/posv2/admin/"))).toBe("/posv2/admin/");
	});
	it("uses a new cache name so the previous cache-first copies are dropped", () => {
		expect(CACHE).toBe("ceylonry-pos-react-v2");
		expect(typeof handlers.activate).toBe("function");
	});
});

describe("iOS install guide", () => {
	it("lists the Add to Home Screen steps and stays hidden until opened", async () => {
		const { createElement } = await import("react");
		const { renderToStaticMarkup } = await import("react-dom/server");
		const { IosInstallGuide } = await import("../components/layout/IosInstallGuide");
		expect(renderToStaticMarkup(createElement(IosInstallGuide, { open: false, onClose() {} }))).toBe("");
		const html = renderToStaticMarkup(createElement(IosInstallGuide, { open: true, onClose() {} }));
		expect(html).toContain("Add to Home Screen");
		expect(html).toContain("Share");
		expect(html).toContain('role="dialog"');
	});
});
