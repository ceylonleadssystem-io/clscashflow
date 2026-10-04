import { describe, it, expect } from "vitest";
import { resolveDark, applyDark, storedDark } from "../utils/theme";

describe("dark mode helper", () => {
	globalThis.document.documentElement = { dataset: {} };
	it("prefers the saved setting, falls back to localStorage mirror", () => {
		expect(resolveDark(true, "0")).toBe(true);
		expect(resolveDark(false, "1")).toBe(false);
		expect(resolveDark(undefined, "1")).toBe(true);
		expect(resolveDark(undefined, null)).toBe(false);
	});
	it("applies the attribute and persists the mirror", () => {
		applyDark(true);
		expect(document.documentElement.dataset.theme).toBe("dark");
		expect(storedDark()).toBe("1");
		applyDark(false);
		expect(document.documentElement.dataset.theme).toBeUndefined();
		expect(storedDark()).toBe("0");
	});
});
