import { describe, expect, it } from "vitest";
import { explainUsbError } from "../services/printing/usb";

const denied = Object.assign(new Error("Failed to execute 'open' on 'USBDevice': Access denied."), { name: "SecurityError" });

describe("USB printer errors explained", () => {
	it("tells a Windows user what to do about Access denied", () => {
		const e = explainUsbError(denied, "USB label printer", true);
		expect(e.usbKind).toBe("denied");
		expect(e.message).toMatch(/Windows is already using this USB label printer/);
		expect(e.message).toMatch(/Zadig/);
		expect(e.message).toMatch(/WinUSB/);
		expect(e.message).toMatch(/browser print option/);
		expect(e.cause).toBe(denied);
	});
	it("gives other systems the shorter advice", () => {
		const e = explainUsbError(denied, "kitchen printer", false);
		expect(e.usbKind).toBe("denied");
		expect(e.message).not.toMatch(/Zadig/);
		expect(e.message).toMatch(/already using this kitchen printer/);
	});
	it("recognises a printer held by another program or tab", () => {
		const busy = explainUsbError(Object.assign(new Error("Unable to claim interface."), { name: "NetworkError" }), "USB receipt printer", true);
		expect(busy.usbKind).toBe("busy");
		expect(busy.message).toMatch(/Another program or browser tab/);
	});
	it("leaves every other error alone", () => {
		const other = new Error("The printer stopped accepting data.");
		expect(explainUsbError(other, "USB label printer", true)).toBe(other);
		const cancelled = Object.assign(new Error("No device selected."), { name: "NotFoundError" });
		expect(explainUsbError(cancelled, "USB label printer", true)).toBe(cancelled);
	});
});
