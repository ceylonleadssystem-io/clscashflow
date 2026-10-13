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
