import { beforeEach, describe, expect, it } from "vitest";
import { createHarness } from "./harness";
import { copyPrinters, deviceNameError, devicesOf, normalizePrinter, printerError, printersOf, receiptPlan, receiptPrinterId, stationsWithoutPrinter, ticketPlan } from "../domain/devices";

const usb = { vendorId: 1046, productId: 20497, serialNumber: "A1", productName: "Azure" };
const kitchen = (o) => normalizePrinter({ id: "k1", deviceId: "d1", role: "kitchen", name: "Pass", stationId: "st-k", connection: { kind: "usb", usb }, ...o });
const stations = [{ id: "st-k", name: "Kitchen", type: "printer" }, { id: "st-b", name: "Bar", type: "printer" }];

describe("devices", () => {
	const settings = { posDevices: [{ id: "d1", name: "Front", locationId: "L1" }, { id: "d2", name: "Patio", kind: "orderpad", locationId: "L2" }, { id: "d3", name: "Old" }, { id: "", name: "x" }] };
	it("lists the devices of a location, plus devices saved without one", () => {
		expect(devicesOf(settings, "L1").map((d) => d.id)).toEqual(["d1", "d3"]);
		expect(devicesOf(settings, "all")).toHaveLength(3);
		expect(devicesOf(settings, "L2")[0]).toMatchObject({ id: "d2", kind: "orderpad" });
		expect(devicesOf({})).toEqual([]);
	});
	it("needs a unique name", () => {
		expect(deviceNameError(settings, { id: "d1", name: "  " })).toMatch(/Enter/);
		expect(deviceNameError(settings, { id: "d2", name: "front" })).toMatch(/already/);
		expect(deviceNameError(settings, { id: "d1", name: "Front" })).toBe("");
	});
});

describe("printers", () => {
	it("always gives a device its Receipt printer first, with the default connection", () => {
		const list = printersOf({}, "d1");
		expect(list).toHaveLength(1);
		expect(list[0]).toMatchObject({ id: receiptPrinterId("d1"), role: "receipt", name: "Receipt printer", connection: { kind: "default" }, receiptCopies: 1, printFromThisDevice: true });
		const saved = { devicePrinters: [{ id: "k1", deviceId: "d1", role: "kitchen", name: "Bar", stationId: "st-b" }, { id: "x", deviceId: "d2", role: "kitchen", name: "Other" }] };
		expect(printersOf(saved, "d1").map((p) => p.name)).toEqual(["Receipt printer", "Bar"]);
	});
	it("keeps values inside their limits", () => {
		expect(normalizePrinter({ id: "r", deviceId: "d", role: "receipt", receiptCopies: 9 }).receiptCopies).toBe(1);
		expect(normalizePrinter({ id: "r", deviceId: "d", role: "receipt", receiptCopies: 3 }).receiptCopies).toBe(3);
		expect(normalizePrinter({ id: "k", deviceId: "d", role: "kitchen", connection: { kind: "default" } }).connection.kind).toBe("none");
		expect(normalizePrinter({ id: "k", deviceId: "d", role: "kitchen", receiptCopies: 4, backupPrinterId: "b" })).toMatchObject({ receiptCopies: 1, backupPrinterId: "b" });
		expect(normalizePrinter({ id: "r", deviceId: "d", role: "receipt", backupPrinterId: "b" }).backupPrinterId).toBe("");
	});
	it("validates a printer", () => {
		expect(printerError(kitchen({ stationId: "" }), [], stations)).toMatch(/station/);
		expect(printerError(kitchen({ stationId: "gone" }), [], stations)).toMatch(/no longer exists/);
		expect(printerError(kitchen({ connection: { kind: "usb" } }), [], stations)).toMatch(/Connect/);
		expect(printerError(kitchen({}), [], stations)).toBe("");
		expect(printerError({ ...normalizePrinter({ id: "r", deviceId: "d", role: "receipt" }), receiptCopies: 6 }, [], stations)).toMatch(/1 to 5/);
	});
	it("does not let a printer back itself up, or form a backup loop", () => {
		const a = kitchen({ id: "a", name: "A", backupPrinterId: "b" });
		const b = kitchen({ id: "b", name: "B", backupPrinterId: "c" });
		const c = kitchen({ id: "c", name: "C" });
		expect(printerError(kitchen({ id: "a", name: "A", backupPrinterId: "a" }), [b, c], stations)).toMatch(/itself/);
		expect(printerError(kitchen({ id: "a", name: "A", duplicateToPrinterId: "a" }), [b, c], stations)).toMatch(/itself/);
		expect(printerError(kitchen({ id: "a", name: "A", backupPrinterId: "zzz" }), [b, c], stations)).toMatch(/another printer of this device/);
		expect(printerError({ ...c, backupPrinterId: "a" }, [a, b], stations)).toMatch(/loop/);
		expect(printerError(a, [b, c], stations)).toBe("");
	});
	it("copies a setup to another device without the USB connections", () => {
		const list = [
			normalizePrinter({ id: receiptPrinterId("d1"), deviceId: "d1", role: "receipt", receiptCopies: 2, connection: { kind: "usb", usb } }),
			kitchen({ id: "k1", backupPrinterId: "k2" }),
			kitchen({ id: "k2", name: "Spare", connection: { kind: "system" } }),
		];
		let n = 0;
		const copy = copyPrinters(list, "d2", () => "new" + ++n);
		expect(copy.every((p) => p.deviceId === "d2")).toBe(true);
		expect(copy[0]).toMatchObject({ id: receiptPrinterId("d2"), receiptCopies: 2, connection: { kind: "default" } });
		expect(copy[1].connection.kind).toBe("none");
		expect(copy[2].connection.kind).toBe("system");
		expect(copy[1].backupPrinterId).toBe(copy[2].id); // the link points at the copy
	});
});

describe("printing plans", () => {
	it("prints receipts as before until the device has a setup", () => {
		expect(receiptPlan({}, "d1")).toMatchObject({ kind: "default", copies: 1, print: true });
		const s = { devicePrinters: [{ id: "r", deviceId: "d1", role: "receipt", receiptCopies: 3, printFromThisDevice: false, connection: { kind: "usb", usb } }] };
		expect(receiptPlan(s, "d1")).toMatchObject({ kind: "usb", copies: 3, print: false, usb: { vendorId: 1046 } });
		expect(receiptPlan(s, "d2").kind).toBe("default");
	});
	it("sends a ticket to this device's printer for the station, and to the station's own printer when there is none", () => {
		const station = { id: "st-k", name: "Kitchen", type: "printer", printer: { kind: "system" } };
		expect(ticketPlan({}, "d1", station)).toBeNull();
		const s = { devicePrinters: [kitchen({ backupPrinterId: "k2", duplicateToPrinterId: "k3" }), kitchen({ id: "k2", name: "Spare", stationId: "st-b", connection: { kind: "system" } }), kitchen({ id: "k3", name: "Expo", stationId: "st-b", connection: { kind: "system" } })] };
		const plan = ticketPlan(s, "d1", station);
		expect(plan.print).toBe(true);
		expect(plan.primary).toMatchObject({ id: "st-k", name: "Kitchen", printer: { kind: "usb" } });
		expect(plan.backup.printer.kind).toBe("system");
		expect(plan.duplicate).toMatchObject({ printer: { kind: "system" } });
		expect(ticketPlan(s, "d2", station)).toBeNull(); // another device has no printer of its own
		expect(ticketPlan({ devicePrinters: [kitchen({ printFromThisDevice: false })] }, "d1", station).print).toBe(false);
	});
	it("lists printer stations that nothing prints for", () => {
		const list = [{ id: "st-k", name: "Kitchen", type: "printer", printer: { kind: "none" } }, { id: "st-b", name: "Bar", type: "printer", printer: { kind: "usb" } }, { id: "kds", name: "Screen", type: "kds" }];
		expect(stationsWithoutPrinter({}, list).map((s) => s.name)).toEqual(["Kitchen"]);
		expect(stationsWithoutPrinter({ devicePrinters: [kitchen({})] }, list)).toEqual([]);
		expect(stationsWithoutPrinter({ devicePrinters: [kitchen({ connection: { kind: "none" } })] }, list).map((s) => s.name)).toEqual(["Kitchen"]);
	});
});

describe("Device Manager services", () => {
	let h;
	beforeEach(async () => (h = await createHarness()));
	const kitchenForm = (o) => ({ deviceId: "dev1", role: "kitchen", name: "Pass", stationId: "st1", connection: { kind: "none" }, ...o });
	const setup = async () => {
		await h.svc.settings.patchSettings({ kitchenStations: [{ id: "st1", name: "Kitchen", type: "printer", printer: { kind: "none" } }] });
		await h.svc.settings.registerDevice();
	};

	it("registers the device once", async () => {
		expect(await h.svc.settings.registerDevice()).toBe(true);
		expect(await h.svc.settings.registerDevice()).toBe(false);
		expect(devicesOf(h.data().settings)).toMatchObject([{ id: "dev1", name: "Register 1" }]);
	});
	it("saves, edits and deletes a kitchen printer, with an audit entry", async () => {
		await setup();
		expect(await h.svc.settings.saveDevicePrinter(kitchenForm({ stationId: "" }))).toBeUndefined();
		expect(h.lastAlert()).toMatch(/station/);
		expect(await h.svc.settings.saveDevicePrinter(kitchenForm({}))).toBe(true);
		const [, k] = printersOf(h.data().settings, "dev1");
		expect(k).toMatchObject({ name: "Kitchen", stationId: "st1" }); // named after its station
		expect(await h.svc.settings.saveDevicePrinter({ ...k, connection: { kind: "system" } })).toBe(true);
		expect(printersOf(h.data().settings, "dev1")).toHaveLength(2);
		expect(h.data().locationAudit.some((a) => a.action === "device-printer-saved" && /Kitchen/.test(a.details))).toBe(true);
		h.answers.confirm = true;
		expect(await h.svc.settings.deleteDevicePrinter(k.id)).toBe(true);
		expect(printersOf(h.data().settings, "dev1")).toHaveLength(1);
	});
	it("saves the receipt printer under a fixed id and resets it", async () => {
		await h.svc.settings.registerDevice();
		expect(await h.svc.settings.saveDevicePrinter({ deviceId: "dev1", role: "receipt", receiptCopies: 2, connection: { kind: "system" } })).toBe(true);
		expect(receiptPlan(h.data().settings, "dev1")).toMatchObject({ kind: "system", copies: 2 });
		expect(await h.svc.settings.saveDevicePrinter({ deviceId: "dev1", role: "receipt", receiptCopies: 9 })).toBeUndefined();
		h.answers.confirm = true;
		await h.svc.settings.deleteDevicePrinter(receiptPrinterId("dev1"));
		expect(receiptPlan(h.data().settings, "dev1").kind).toBe("default");
	});
	it("will not remove the device in use, and clears links to a deleted printer", async () => {
		await setup();
		await h.svc.settings.deleteDevice("dev1");
		expect(h.lastAlert()).toMatch(/device you are using/);
		await h.svc.settings.saveDevicePrinter(kitchenForm({ connection: { kind: "system" } }));
		const spare = printersOf(h.data().settings, "dev1")[1];
		await h.svc.settings.saveDevicePrinter(kitchenForm({ backupPrinterId: spare.id }));
		h.answers.confirm = true;
		await h.svc.settings.deleteDevicePrinter(spare.id);
		expect(printersOf(h.data().settings, "dev1")[1].backupPrinterId).toBe("");
	});
	it("a log-only receipt printer records the receipt but prints nothing", async () => {
		await h.svc.settings.registerDevice();
		await h.svc.settings.saveDevicePrinter({ deviceId: "dev1", role: "receipt", printFromThisDevice: false });
		expect(await h.svc.printing.printReceipt({ id: "s", receipt: "R-1" })).toBe(false);
		expect(h.messages.notices.at(-1)).toMatch(/log only/);
	});
	it("a log-only kitchen printer keeps the ticket without printing it", async () => {
		await setup();
		await h.svc.settings.saveDevicePrinter(kitchenForm({ printFromThisDevice: false }));
		await h.svc.printing.sendToKitchen({ id: "o1", orderNumber: "7", lines: [{ productId: "p1", name: "Tea", qty: 1 }] });
		expect(h.data().kitchenTickets.at(-1)).toMatchObject({ orderNumber: "7", status: "logged", stationId: "st1" });
	});
	it("copies one device's printers to another, asking before replacing", async () => {
		await setup();
		await h.svc.settings.patchSettings({ posDevices: [...h.data().settings.posDevices, { id: "dev2", name: "Patio", kind: "orderpad" }] });
		await h.svc.settings.saveDevicePrinter(kitchenForm({ connection: { kind: "system" } }));
		expect(await h.svc.settings.copyDevicePrinters("dev1", "dev2")).toBe(true);
		expect(printersOf(h.data().settings, "dev2").map((p) => [p.name, p.connection.kind])).toEqual([["Receipt printer", "default"], ["Kitchen", "system"]]);
		h.answers.confirm = false;
		expect(await h.svc.settings.copyDevicePrinters("dev1", "dev2")).toBe(false); // dev2 already has printers: not replaced without a yes
		expect(await h.svc.settings.copyDevicePrinters("dev1", "dev1")).toBe(false);
	});
});
