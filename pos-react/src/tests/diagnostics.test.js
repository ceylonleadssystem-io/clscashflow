import { describe, expect, it, vi } from "vitest";
import { checkIn } from "../services/diagnostics.service";

const res = (body, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body });

describe("diagnostics checkIn", () => {
	it("stays idle when nothing is requested", async () => {
		const f = vi.fn().mockResolvedValue(res({ ok: true, requested: false }));
		expect(await checkIn(async () => "t", f, () => "LOG")).toBe("idle");
		expect(f).toHaveBeenCalledTimes(1);
	});
	it("uploads the log when requested", async () => {
		const f = vi.fn().mockResolvedValueOnce(res({ ok: true, requested: true })).mockResolvedValueOnce(res({ ok: true }));
		expect(await checkIn(async () => "t", f, () => "LOG")).toBe("uploaded");
		expect(JSON.parse(f.mock.calls[1][1].body)).toEqual({ action: "upload", text: "LOG" });
	});
	it("skips without a token and never throws", async () => {
		expect(await checkIn(async () => "", vi.fn(), () => "")).toBe("skipped");
		expect(await checkIn(async () => "t", vi.fn().mockRejectedValue(new Error("x")), () => "")).toBe("error");
	});
});
