import { beforeEach, describe, expect, it, vi } from "vitest";

// a stand-in for the helper library: records what the POS asks of it
const calls = [];
const fake = {
	active: false,
	failConnect: null,
	failPrint: null,
	printers: ["Microsoft Print to PDF", "Xprinter XP-365B"],
	websocket: {
		isActive: () => fake.active,
		connect: async (o) => {
			calls.push(["connect", o]);
			if (fake.failConnect) throw fake.failConnect;
			fake.active = true;
		},
	},
	printers_: null,
	configs: { create: (name) => ({ name }) },
	print: async (config, data) => {
		calls.push(["print", config.name, data]);
		if (fake.failPrint) throw fake.failPrint;
	},
};
fake.printers = { find: async () => fake.printersList };
fake.printersList = ["Microsoft Print to PDF", "Xprinter XP-365B"];
vi.mock("qz-tray", () => ({ default: fake }));

const { connectHelper, helperPrinters, sendRaw, helperError } = await import("../services/printing/printBridge");
const { labelPrinter } = await import("../services/printing/labelPrinter");

beforeEach(() => {
	calls.length = 0;
	fake.active = false;
	fake.failConnect = null;
	fake.failPrint = null;
	fake.printersList = ["Microsoft Print to PDF", "Xprinter XP-365B"];
	labelPrinter.bridge = "";
	labelPrinter.device = null;
	labelPrinter.onRemember = null;
});

describe("print helper connection", () => {
	it("connects once and reuses the connection", async () => {
		await connectHelper();
		await connectHelper();
		expect(calls.filter((c) => c[0] === "connect")).toHaveLength(1);
	});
	it("lists the Windows printers, sorted, whether the helper returns one name or several", async () => {
		expect(await helperPrinters()).toEqual(["Microsoft Print to PDF", "Xprinter XP-365B"]);
		fake.printersList = "Xprinter XP-365B";
		expect(await helperPrinters()).toEqual(["Xprinter XP-365B"]);
		fake.printersList = [];
		expect(await helperPrinters()).toEqual([]);
	});
	it("sends the commands unchanged as a raw base64 job to the named printer", async () => {
		const bytes = new Uint8Array([83, 73, 90, 69, 32, 51, 48, 13, 10, 0, 255, 128]);
		await sendRaw("Xprinter XP-365B", bytes);
		const [, name, data] = calls.find((c) => c[0] === "print");
		expect(name).toBe("Xprinter XP-365B");
		expect(data).toEqual([{ type: "raw", format: "command", flavor: "base64", data: btoa(String.fromCharCode(...bytes)) }]);
	});
	it("sends a large job (a label with a bitmap) without breaking it", async () => {
		const bytes = new Uint8Array(100000).map((_, i) => i % 256);
		await sendRaw("Xprinter XP-365B", bytes);
		const sent = atob(calls.find((c) => c[0] === "print")[2][0].data);
		expect(sent.length).toBe(100000);
		expect(sent.charCodeAt(99999)).toBe(99999 % 256);
	});
	it("explains a helper that is not running, a request that was refused and a printer that is missing", async () => {
		fake.failConnect = new Error("Unable to establish connection with QZ");
		await expect(connectHelper()).rejects.toThrow(/not running on this computer.*qz\.io\/download/);
		fake.failConnect = null;
		fake.failPrint = new Error("Request blocked: untrusted website");
		await expect(sendRaw("X", new Uint8Array([1]))).rejects.toThrow(/Click Allow/);
		fake.failPrint = new Error("Cannot find printer 'X': not found");
		await expect(sendRaw("X", new Uint8Array([1]))).rejects.toThrow(/cannot find that printer/);
		expect(helperError(new Error("boom")).message).toMatch(/could not print: boom/);
	});
});

describe("label printer through the print helper", () => {
	it("remembers the chosen Windows printer like a USB printer and shows its name as connected", () => {
		const remembered = [];
		labelPrinter.onRemember = (v) => remembered.push(v);
		expect(labelPrinter.connectHelper("  Xprinter XP-365B ")).toBe(true);
		expect(remembered).toEqual([{ bridge: "Xprinter XP-365B", productName: "Xprinter XP-365B" }]);
		expect(labelPrinter.connected).toBe(true);
		expect(labelPrinter.deviceName).toBe("Xprinter XP-365B");
		expect(labelPrinter.connectHelper("   ")).toBe(false);
	});
	it("comes back from the saved setting without any USB permission", async () => {
		expect(await labelPrinter.restore({ bridge: "Xprinter XP-365B" })).toBe(true);
		expect(labelPrinter.connected).toBe(true);
		expect(labelPrinter.status.message).toMatch(/print helper/);
	});
	it("sends calibration through the helper to the chosen printer", async () => {
		labelPrinter.connectHelper("Xprinter XP-365B");
		await labelPrinter.calibrate({ bridge: "Xprinter XP-365B" }, { width: 38, height: 25, gap: 3 });
		const job = calls.find((c) => c[0] === "print");
		expect(job[1]).toBe("Xprinter XP-365B");
		const text = atob(job[2][0].data);
		expect(text).toMatch(/SIZE 38 mm,25 mm/);
		expect(text).toMatch(/GAPDETECT/);
	});
	it("an error from the helper reaches the person in plain words", async () => {
		labelPrinter.connectHelper("Xprinter XP-365B");
		fake.failConnect = new Error("Unable to establish connection with QZ");
		await expect(labelPrinter.calibrate({}, { width: 38, height: 25, gap: 3 })).rejects.toThrow(/print helper/);
	});
});

describe("Connect via Print Helper window", () => {
	it("is hidden until opened, then says what it is doing and blocks Use this printer until a printer is listed", async () => {
		const { createElement } = await import("react");
		const { renderToStaticMarkup } = await import("react-dom/server");
		const { PrintHelperPicker } = await import("../components/settings/PrintHelperPicker");
		const props = { current: "", onClose() {}, onPick() {} };
		expect(renderToStaticMarkup(createElement(PrintHelperPicker, { ...props, open: false }))).toBe("");
		const html = renderToStaticMarkup(createElement(PrintHelperPicker, { ...props, open: true }));
		expect(html).toContain("Connect via Print Helper");
		expect(html).toContain("Looking for the print helper");
		expect(html).toMatch(/id="print-helper-use"[^>]*disabled/);
		expect(html).toContain('role="dialog"');
	});
});
