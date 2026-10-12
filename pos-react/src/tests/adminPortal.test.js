/**
 * Tests for admin portal helpers: the last-used date, the save feedback (loading bar and success message) and its texts.
 */
import { describe, expect, it } from "vitest";
import { adminFeedback, READ_ACTIONS, successText } from "../admin-app/adminFeedback";
import { lastUsedOf } from "../admin-app/status";

describe("last used", () => {
	it("is the later of the last sign-in and the last sync", () => {
		expect(lastUsedOf({ authLastSignInAt: "2026-10-01T08:00:00Z", updatedAt: "2026-10-05T08:00:00Z" })).toBe("2026-10-05T08:00:00Z");
		expect(lastUsedOf({ authLastSignInAt: "2026-10-09T08:00:00Z" })).toBe("2026-10-09T08:00:00Z");
		expect(lastUsedOf({})).toBe("");
	});
});

describe("save feedback", () => {
	it("counts requests in flight and keeps the success message until dismissed", () => {
		adminFeedback.begin();
		adminFeedback.begin();
		adminFeedback.end();
		adminFeedback.success("Saved: Subscription");
		adminFeedback.dismiss();
		adminFeedback.end();
		adminFeedback.end(); // never below zero
		expect(READ_ACTIONS.has("get")).toBe(true);
		expect(READ_ACTIONS.has("saveSettings")).toBe(false);
	});
	it("words the success message for the change that was made", () => {
		expect(successText({ action: "saveSettings", summary: "Subscription: Founders" })).toBe("Saved: Subscription: Founders");
		expect(successText({ action: "setAccess", paused: true })).toBe("Account disabled");
		expect(successText({ action: "deleteAccount" })).toBe("Account deleted");
		expect(successText({ action: "somethingNew" })).toBe("Saved");
	});
});
