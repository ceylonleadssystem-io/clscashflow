/** Label printing: the size/gap sent to the printer must follow the configured stock (mismatch = blank labels). */
import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_STOCK, resolveLabelStock, tsplSetup } from "../services/printing/labelPrinter";

describe("label stock", () => {
	it("defaults to 30 x 25 mm with a 3 mm gap", () => {
		expect(resolveLabelStock(undefined)).toEqual(DEFAULT_LABEL_STOCK);
		expect(resolveLabelStock({})).toEqual({ width: 30, height: 25, gap: 3 });
	});
	it("keeps valid values and rejects out-of-range ones", () => {
		expect(resolveLabelStock({ width: 40, height: 30, gap: 2 })).toEqual({ width: 40, height: 30, gap: 2 });
		expect(resolveLabelStock({ width: 0, height: "x", gap: 99 })).toEqual(DEFAULT_LABEL_STOCK);
	});
	it("puts the configured size and gap into the TSPL setup", () => {
		const setup = tsplSetup(40, 30, 2);
		expect(setup).toContain("SIZE 40 mm,30 mm\r\n");
		expect(setup).toContain("GAP 2 mm,0\r\n");
		expect(setup.endsWith("BACKFEED 0\r\n")).toBe(true);
	});
});
