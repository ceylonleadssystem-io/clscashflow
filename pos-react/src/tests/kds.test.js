import { describe, it, expect } from "vitest";
import { kdsStatus, kdsTickets, nextStatus, urgency } from "../KDS/kds";
import { kitchenDestination } from "../services/pos/printing";
import { resolveFeatures } from "../config/features";

describe("KDS", () => {
	it("is off by default and needs kitchen tickets", () => {
		expect(resolveFeatures({}).enabled["checkout.kds"]).toBe(false);
		expect(resolveFeatures({ "checkout.kds": true }).enabled["checkout.kds"]).toBe(true);
		expect(resolveFeatures({ "checkout.kds": true, "checkout.kitchenTickets": false }).enabled["checkout.kds"]).toBe(false);
	});
	it("routes prep tickets to the KDS only when enabled", () => {
		expect(kitchenDestination({ kotPrinter: "Bar" }, { "checkout.kds": true })).toBe("KDS");
		expect(kitchenDestination({ kotPrinter: "Bar" }, {})).toBe("Bar");
	});
	it("shows only open KDS tickets, oldest first, and walks the status flow", () => {
		const t = (id, destination, status, createdAt) => ({ id, destination, status, createdAt });
		const list = kdsTickets([t("b", "KDS", "new", "2"), t("a", "KDS", "ready", "1"), t("c", "KDS", "done", "0"), t("d", "Bar", "new", "0")], "");
		expect(list.map((x) => x.id)).toEqual(["a", "b"]);
		expect(kdsStatus({ status: "sent-to-kds" })).toBe("new");
		expect(nextStatus("new")).toBe("preparing");
		expect(urgency(20)).toBe("late");
	});
});

describe("KDS link", () => {
	it("has no STUN/TURN servers so only local-network candidates exist", async () => {
		const { LAN_RTC } = await import("../KDS/net");
		expect(LAN_RTC.iceServers).toEqual([]);
	});
});

describe("Items ready for the waiter", () => {
	const t = { id: "k1", orderId: "o1", orderNumber: "12", station: "Kitchen", destination: "KDS", status: "preparing", createdAt: "1", lines: [{ name: "Burger", qty: 2 }, { name: "Service", isServiceCharge: true }, { name: "Fries", qty: 1 }] };
	it("alerts only for items that just became ready", async () => {
		const { readyAlert, orderProgress, readyToCollect } = await import("../domain/kitchenReady");
		expect(readyAlert(t, [0])).toBe("12 · Kitchen ready to collect: 2 × Burger");
		expect(readyAlert({ ...t, readyLines: [0] }, [0])).toBe("");
		expect(orderProgress([{ ...t, readyLines: [0] }], "o1")).toMatchObject([{ station: "Kitchen", ready: 1, total: 2 }]);
		expect(readyToCollect([{ ...t, readyLines: [0, 2], servedLines: [0] }])[0].items.map((x) => x.index)).toEqual([2]);
	});
	it("tracks each station separately", async () => {
		const { orderProgress } = await import("../domain/kitchenReady");
		const bar = { ...t, id: "k2", station: "Bar", lines: [{ name: "Beer", qty: 1 }], readyLines: [0] };
		expect(orderProgress([t, bar], "o1").map((p) => [p.station, p.ready, p.total])).toEqual([["Kitchen", 0, 2], ["Bar", 1, 1]]);
	});
	it("treats a ready ticket without a list as all ready", async () => {
		const { readyIndexes } = await import("../KDS/kds");
		expect(readyIndexes({ ...t, status: "ready" })).toEqual([0, 2]);
	});
});
