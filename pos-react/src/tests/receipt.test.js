/** Receipt layout: one set of lines drives both the thermal printout and the HTML receipt. */
import { describe, expect, it } from "vitest";
import { receiptHtml, receiptLayout, receiptText } from "../services/printing/documents";

const sale = { receipt: "TEST RECEIPT", createdAt: "2026-09-23T09:34:00Z", payment: "Cash", total: 350, lines: [{ name: "Test Item", qty: 1, price: 350, modifiers: [] }] };
const settings = {
	business: "Azure Swim",
	receiptFooter: "Thank you for shopping with Azure Swim\nExchanges available with invoice as no refunds.",
	receiptSocials: { instagram: "@AZURE_SWIM_SRI_LANKA" },
	receiptSocialQr: "data:image/png;base64,AAAA",
};
const ctx = { settings, location: { name: "Hiriketiya" } };

describe("receipt layout", () => {
	it("follows the printed example: header, rules, items, total, centred footer and socials", () => {
		const { main } = receiptLayout(sale, ctx);
		const texts = main.map((l) => l.text);
		expect(texts[0]).toBe("Azure Swim");
		expect(texts[1]).toBe("Hiriketiya");
		expect(texts[2]).toBe("-".repeat(48));
		expect(texts[3]).toMatch(/^TEST RECEIPT {2}\d\d\/\d\d\/\d{4}, \d\d:\d\d$/);
		expect(texts).toContain("1 x Test Item".padEnd(32) + "350.00".padStart(16));
		expect(texts).toContain("TOTAL".padEnd(28) + "LKR 350.00".padStart(20));
		expect(texts).toContain("Paid by Cash");
		const centred = main.filter((l) => l.align === "center").map((l) => l.text);
		expect(centred).toEqual(["Thank you for shopping with Azure Swim", "Exchanges available with invoice as no refunds.", "Instagram: @AZURE_SWIM_SRI_LANKA"]);
		expect(main.filter((l) => l.align === "left").every((l) => l.text.length <= 48)).toBe(true);
	});
	it("puts the QR caption under the QR and Powered by Ceylonry POS last", () => {
		const { caption, powered } = receiptLayout(sale, ctx);
		expect(caption.map((l) => l.text)).toEqual(["@AZURE_SWIM_SRI_LANKA"]);
		expect(powered.map((l) => l.text)).toEqual(["Powered by Ceylonry POS"]);
		const text = receiptText(sale, ctx).trimEnd().split("\n");
		expect(text.at(-1)).toBe("Powered by Ceylonry POS");
		expect(text.at(-2)).toBe("@AZURE_SWIM_SRI_LANKA");
		const html = receiptHtml(sale, ctx);
		expect(html.indexOf("social-qr")).toBeLessThan(html.indexOf("@AZURE_SWIM_SRI_LANKA"));
		expect(html.lastIndexOf("Powered by Ceylonry POS")).toBeGreaterThan(html.indexOf("@AZURE_SWIM_SRI_LANKA"));
		expect(html.trimEnd().endsWith("</html>")).toBe(true);
	});
	it("has no caption without a QR, and still ends with Powered by", () => {
		const noQr = { ...ctx, settings: { ...settings, receiptSocialQr: "" } };
		expect(receiptLayout(sale, noQr).caption).toEqual([]);
		expect(receiptText(sale, noQr).trimEnd().split("\n").at(-1)).toBe("Powered by Ceylonry POS");
	});
	it("shows cash received and change only when a tendered amount was recorded", () => {
		expect(receiptText(sale, ctx)).not.toContain("Cash received");
		const tendered = receiptText({ ...sale, cashTendered: 500, changeGiven: 150 }, ctx);
		expect(tendered).toContain("Cash received".padEnd(28) + "LKR 500.00".padStart(20));
		expect(tendered).toContain("Change".padEnd(28) + "LKR 150.00".padStart(20));
	});
	it("wraps a long item name instead of cutting it, and keeps description and modifiers", () => {
		const long = { ...sale, lines: [{ name: "Extra long swimsuit name that does not fit on one line", description: "Cotton", qty: 2, price: 100, modifiers: [{ groupName: "Size", optionName: "M" }] }] };
		const texts = receiptLayout(long, ctx).main.map((l) => l.text);
		const i = texts.findIndex((t) => t.startsWith("2 x Extra long"));
		expect(texts[i].endsWith("200.00")).toBe(true);
		expect(texts[i + 1].trim().length).toBeGreaterThan(0); // the rest of the name
		expect(texts).toContain("  Cotton");
		expect(texts).toContain("  Size: M");
	});
});
