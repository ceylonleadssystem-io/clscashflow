import { describe, it, expect, beforeEach } from "vitest";
import { kdsLink } from "../KDS/link";
import { kitchenStations, stationPrinter } from "../domain/kitchenStations";
import { kotEscPos } from "../services/printing/documents";

describe("several Kitchen Displays", () => {
	beforeEach(() => {
		["pos.kds.pairs", "pos.kds.pairId", "pos.kds.outbox", "pos.kds.outbox.a", "pos.kds.outbox.b"].forEach((k) => localStorage.removeItem(k));
		kdsLink.sync([]);
	});
	it("gives the pairing made before stations to the first Kitchen Display station only", () => {
		localStorage.setItem("pos.kds.pairId", "old-pair");
		localStorage.setItem("pos.kds.outbox", JSON.stringify([{ at: Date.now(), ticket: { id: "t0" } }]));
		kdsLink.sync(["a", "b"]);
		expect(kdsLink.station("a").state().paired).toBe(true);
		expect(kdsLink.station("b").state().paired).toBe(false);
		expect(kdsLink.station("a").pending()).toBe(1);
		expect(localStorage.getItem("pos.kds.pairId")).toBeNull();
		expect(kdsLink.state()).toMatchObject({ paired: true, connected: false, pairedCount: 1 });
	});
	it("keeps each station's tickets in its own outbox", () => {
		kdsLink.sync(["a", "b"]);
		kdsLink.send({ id: "t1" }, "a");
		kdsLink.send({ id: "t2" }, "b");
		kdsLink.send({ id: "t3" }, "b");
		expect([kdsLink.station("a").pending(), kdsLink.station("b").pending()]).toEqual([1, 2]);
	});
});

describe("station printers", () => {
	it("keeps a known printer kind and the chosen USB device, and drops anything else", () => {
		expect(stationPrinter({ printer: { kind: "usb", usb: { vendorId: 1046, productId: 20497, serialNumber: "X1", extra: 1 } } })).toEqual({ kind: "usb", usb: { vendorId: 1046, productId: 20497, serialNumber: "X1", productName: "USB printer" } });
		expect(stationPrinter({ printer: { kind: "fax" } })).toEqual({ kind: "none" });
		expect(kitchenStations({ kitchenStations: [{ id: "k", name: "Kds", type: "kds", printer: { kind: "system" } }] })).toEqual([{ id: "k", name: "Kds", type: "kds" }]);
	});
	it("prints a kitchen ticket as ESC/POS text with the station, items, modifiers and a cut", () => {
		const bytes = kotEscPos({ station: "Bar", orderNumber: "ORD-1", reference: "T4", lines: [{ qty: 2, name: "Mojito", modifiers: [{ groupName: "Ice", optionName: "Less" }] }, { isDiscount: true, qty: 1, name: "Disc" }] });
		const text = new TextDecoder().decode(bytes);
		expect(text).toContain("KITCHEN ORDER");
		expect(text).toContain("Bar");
		expect(text).toContain("2 x Mojito");
		expect(text).toContain("Ice: Less");
		expect(text).not.toContain("Disc");
		expect([...bytes.slice(-4)]).toEqual([29, 86, 66, 0]);
	});
});

describe("sending an order to several stations", () => {
	it("makes one ticket per station and queues each KDS ticket for its own screen", async () => {
		const { createHarness } = await import("./harness");
		["pos.kds.pairs", "pos.kds.outbox.k1", "pos.kds.outbox.k2"].forEach((k) => localStorage.removeItem(k));
		const h = await createHarness({
			features: { "checkout.kds": true },
			settings: {
				businessType: "restaurant",
				kitchenStations: [
					{ id: "k1", name: "Hot line", type: "kds" },
					{ id: "k2", name: "Cold line", type: "kds" },
					{ id: "p1", name: "Bar", type: "printer", printer: { kind: "none" } },
				],
			},
		});
		const burger = { id: "b", name: "Burger", stationIds: ["k1", "p1"] };
		const salad = { id: "s", name: "Salad", stationIds: ["k2"] };
		await h.store.write((tx) => [burger, salad].forEach((p) => tx.put("products", p)));
		await h.refresh();
		const order = { id: "o1", orderNumber: "ORD-9", lines: [{ productId: "b", name: "Burger", qty: 1 }, { productId: "s", name: "Salad", qty: 2 }, { productId: "x", name: "Water", qty: 1 }] };
		await h.svc.printing.sendToKitchen(order);
		const tickets = h.data().kitchenTickets;
		const by = (st) => tickets.find((t) => t.station === st)?.lines.map((l) => l.name);
		expect(by("Hot line")).toEqual(["Burger", "Water"]);
		expect(by("Cold line")).toEqual(["Salad"]);
		expect(by("Bar")).toEqual(["Burger"]);
		expect([kdsLink.station("k1").pending(), kdsLink.station("k2").pending()]).toEqual([1, 1]);
	});
});
