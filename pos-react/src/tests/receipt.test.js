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
		expect(texts[2]).toBe("-".repeat(46));
		expect(texts[3]).toMatch(/^TEST RECEIPT {2}\d\d\/\d\d\/\d{4}, \d\d:\d\d$/);
		expect(texts).toContain("1 x Test Item".padEnd(30) + "350.00".padStart(16));
		expect(texts).toContain("TOTAL".padEnd(26) + "LKR 350.00".padStart(20));
		expect(texts).toContain("Paid by Cash");
		const centred = main.filter((l) => l.align === "center").map((l) => l.text);
		expect(centred[0]).toBe("Thank you for shopping with Azure Swim");
		const second = centred.slice(1, -1);
		expect(second.join(" ")).toBe("Exchanges available with invoice as no refunds."); // wraps inside 46 columns
		expect(second.length).toBe(2);
		expect(Math.abs(second[0].length - second[1].length)).toBeLessThan(10); // balanced, no lone last word
		expect(centred.at(-1)).toBe("Instagram: @AZURE_SWIM_SRI_LANKA");
		expect(centred.every((t) => t.length <= 46)).toBe(true);
		expect(main.filter((l) => l.align === "left").every((l) => l.text.length <= 46)).toBe(true);
	});
	it("has no handle under the QR: the Instagram line stays above it and Powered by Ceylonry POS is last", () => {
		const { main, powered } = receiptLayout(sale, ctx);
		expect(main.map((l) => l.text)).toContain("Instagram: @AZURE_SWIM_SRI_LANKA");
		expect(powered.map((l) => l.text)).toEqual(["Powered by Ceylonry POS"]);
		const text = receiptText(sale, ctx).trimEnd().split("\n");
		expect(text.at(-1)).toBe("Powered by Ceylonry POS");
		expect(text.at(-2)).toBe("Instagram: @AZURE_SWIM_SRI_LANKA");
		const html = receiptHtml(sale, ctx);
		expect(html.match(/@AZURE_SWIM_SRI_LANKA/g)).toHaveLength(1);
		expect(html.indexOf("Instagram: @AZURE")).toBeLessThan(html.indexOf('class="social-qr"'));
		expect(html.indexOf('class="social-qr"')).toBeLessThan(html.lastIndexOf("Powered by Ceylonry POS"));
		expect(html).toContain("padding:0 1ch");
	});
	it("still ends with Powered by when there is no QR", () => {
		const noQr = { ...ctx, settings: { ...settings, receiptSocialQr: "" } };
		expect(receiptText(sale, noQr).trimEnd().split("\n").at(-1)).toBe("Powered by Ceylonry POS");
	});
	it("shows cash received and change only when a tendered amount was recorded", () => {
		expect(receiptText(sale, ctx)).not.toContain("Cash received");
		const tendered = receiptText({ ...sale, cashTendered: 500, changeGiven: 150 }, ctx);
		expect(tendered).toContain("Cash received".padEnd(26) + "LKR 500.00".padStart(20));
		expect(tendered).toContain("Change".padEnd(26) + "LKR 150.00".padStart(20));
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

describe("report PDF document", () => {
	it("builds an escaped A4 document with KPIs, aligned tables and empty-section notes", async () => {
		const { reportHtml } = await import("../services/printing/reportDocument");
		const html = reportHtml({
			title: "POS Report 2026-10-01 to 2026-10-08",
			business: "Cafe <b>",
			kpis: [{ label: "Revenue", value: "LKR 1,500.00" }],
			sections: [
				{ title: "Sales by Item", head: ["Item", "Units"], rows: [["Tea & Co", 2], ["Cake", 10]] },
				{ title: "Staff Hours", head: ["Staff", "Hours"], rows: [], empty: "No staff hours in this period." },
			],
		});
		expect(html).toContain("<title>POS Report 2026-10-01 to 2026-10-08</title>");
		expect(html).toContain("@page{size:A4");
		expect(html).toContain("Cafe &lt;b&gt;");
		expect(html).toContain("Tea &amp; Co");
		expect(html).toContain('<th class="n">Units</th>'); // numeric column right-aligned
		expect(html).toContain("<th>Item</th>");
		expect(html).toContain("No staff hours in this period.");
		expect(html).not.toContain("<script");
	});
});

describe("report PDF download", () => {
	const report = {
		title: "POS Report",
		business: "Cafe — Main",
		kpis: [{ label: "Revenue", value: "LKR 1,500.00" }],
		sections: [
			{ title: "Sales by Item", head: ["Item", "Units", "Revenue"], rows: Array.from({ length: 80 }, (_, i) => ["Item " + i, i, "LKR " + i * 10 + ".00"]) },
			{ title: "Staff Hours", head: ["Staff", "Hours"], rows: [], empty: "No staff hours." },
		],
	};
	it("draws a real multi-page PDF", async () => {
		Object.assign(globalThis.window, { atob: globalThis.atob, btoa: globalThis.btoa }); // the test setup's window stub lacks what jsPDF reads at load time
		const { buildReportPdf } = await import("../services/printing/reportPdf");
		const { jsPDF } = await import("jspdf");
		const { default: autoTable } = await import("jspdf-autotable");
		const doc = buildReportPdf(new jsPDF({ unit: "mm", format: "a4" }), autoTable, report);
		const bytes = new Uint8Array(doc.output("arraybuffer"));
		expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");
		expect(doc.getNumberOfPages()).toBeGreaterThan(1);
	});
	it("only claims PDF support for text the built-in font can draw", async () => {
		const { pdfSupportsText } = await import("../services/printing/reportPdf");
		expect(pdfSupportsText(report)).toBe(true); // the dash is replaced by a plain one
		expect(pdfSupportsText({ ...report, sections: [{ title: "Items", head: ["Item"], rows: [["කෝපි"]] }] })).toBe(false);
	});
});
