import { describe, expect, it } from "vitest";
import { addressForType, addressOfPage, posRedirect, POS_URLS } from "../domain/posRoute";

const chosen = (businessType) => ({ businessType, businessTypeLocked: true });
const MAIN = { hostname: "ceylonrylabs.io", pathname: "/posv2/" };
const AUTO = { hostname: "automobile.ceylonrylabs.io", pathname: "/" };
const OGF = { hostname: "ogf.ceylonrylabs.io", pathname: "/" };

describe("which POS address a business belongs on", () => {
	it("sends Automobile and Restaurant (OGF) to their own addresses and every other chosen type to the main POS", () => {
		expect(addressForType(chosen("automobile"))).toBe("automobile");
		expect(addressForType(chosen("ogf"))).toBe("ogf");
		for (const t of ["restaurant", "cafe", "retail", "hardware", "grocery", "salon", "pharmacy", "services", "other"]) expect(addressForType(chosen(t))).toBe("main");
	});
	it("decides nothing while the business has not chosen its type", () => {
		expect(addressForType({})).toBe("");
		expect(addressForType({ businessType: "other", onboardingComplete: false })).toBe("");
		expect(addressForType({ businessType: "restaurant", onboardingComplete: true })).toBe("main");
	});
	it("knows the live POS addresses and nothing else", () => {
		expect(addressOfPage(AUTO)).toBe("automobile");
		expect(addressOfPage(OGF)).toBe("ogf");
		expect(addressOfPage({ hostname: "ceylonrylabs.io", pathname: "/Automobile" })).toBe("automobile");
		expect(addressOfPage({ hostname: "www.ceylonrylabs.io", pathname: "/automobile/" })).toBe("automobile");
		expect(addressOfPage(MAIN)).toBe("main");
		for (const page of [{ hostname: "localhost", pathname: "/posv2/" }, { hostname: "admin.ceylonrylabs.io", pathname: "/" }, { hostname: "deploy-preview-1--x.netlify.app", pathname: "/posv2/" }, { hostname: "ceylonrylabs.io", pathname: "/cashflow/" }]) expect(addressOfPage(page)).toBe("");
	});
	it("moves a business only when it is on the wrong live address", () => {
		expect(posRedirect(chosen("automobile"), MAIN)).toBe(POS_URLS.automobile);
		expect(posRedirect(chosen("restaurant"), AUTO)).toBe(POS_URLS.main);
		expect(posRedirect(chosen("ogf"), MAIN)).toBe(POS_URLS.ogf);
		expect(posRedirect(chosen("ogf"), AUTO)).toBe(POS_URLS.ogf);
		expect(posRedirect(chosen("ogf"), OGF)).toBe("");
		expect(posRedirect(chosen("restaurant"), OGF)).toBe(POS_URLS.main);
		expect(posRedirect(chosen("automobile"), OGF)).toBe(POS_URLS.automobile);
		expect(posRedirect(chosen("automobile"), AUTO)).toBe("");
		expect(posRedirect(chosen("restaurant"), MAIN)).toBe("");
		expect(posRedirect(chosen("automobile"), { hostname: "ceylonrylabs.io", pathname: "/Automobile" })).toBe("");
		expect(posRedirect(chosen("restaurant"), { hostname: "ceylonrylabs.io", pathname: "/Automobile" })).toBe(POS_URLS.main);
	});
	it("never redirects on local development, previews or the admin address", () => {
		expect(posRedirect(chosen("automobile"), { hostname: "localhost", pathname: "/posv2/" })).toBe("");
		expect(posRedirect(chosen("restaurant"), { hostname: "admin.ceylonrylabs.io", pathname: "/posv2/" })).toBe("");
		expect(posRedirect({}, AUTO)).toBe("");
	});
});
