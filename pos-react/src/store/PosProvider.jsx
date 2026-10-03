/**
 * Register session: who is signed in by PIN, active location, current screen and navigation, access control,
 * kiosk/layout flags and body classes, theme, background data maintenance, and the bound action services (svc).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { locationStore } from "./locationStore";
import { STORAGE, UI_THEMES } from "../config/constants";
import { ROLE_VIEWS, VIEW_TITLES } from "../config/roles";
import { INDUSTRY_TYPES, KITCHEN_TYPES, RETIRED_MODIFIER_NAMES } from "../config/presets";
import { VIEW_FEATURE } from "../config/features";
import { T } from "../db/tables";
import { migrateOrderNumbers } from "../domain/orders";
import { ensureProductInventory } from "../domain/inventory";
import { makeCtx, markDeleted } from "../services/pos/common";
import { bindServices } from "../services/pos";
import { userLocationIds, activeLocations } from "../services/pos/locations";
import { mainLocation } from "../services/sync/account";
import { SUPPORT_USER, supportModeActive } from "../services/support";
import { useData, useDataRef, useRepositories, useStore } from "./DataProvider";
import { useFeatures } from "./FeatureProvider";
import { useSession } from "./SessionProvider";
import { resolveWelcome } from "../config/welcome";
import { useUi } from "./UiProvider";
import { createLogger } from "../utils/logger";

const log = createLogger("staff");

/**
 * Register session: who is signed in with a PIN, at which location, which
 * screen is open, kiosk/menu layout flags, and the bound action services.
 */
const PosContext = createContext(null);

const getOrCreate = (storage, key, make) => {
	let v = storage.getItem(key);
	if (!v) {
		v = make();
		storage.setItem(key, v);
	}
	return v;
};

export function PosProvider({ children }) {
	const store = useStore();
	const repos = useRepositories();
	const data = useData();
	const dataRef = useDataRef();
	const { enabled } = useFeatures();
	const { workspace } = useSession();
	const ui = useUi();
	const support = useMemo(() => supportModeActive(), []);

	const [currentUserId, setCurrentUserId] = useState(() => sessionStorage.getItem(STORAGE.userSession) || "");
	const locationId = useSyncExternalStore(locationStore.subscribe, locationStore.get);
	const [view, setView] = useState("dashboard");
	const [layout, setLayout] = useState({ full: false, sidebarCollapsed: false, kiosk: false, mobileCartOpen: false });
	const [checkoutMode, setCheckoutModeState] = useState(() => localStorage.getItem(STORAGE.checkoutMode) || "");
	const [chooserOpen, setChooserOpen] = useState(false);
	const [setupOpen, setSetupOpen] = useState(false);
	const [shiftStart, setShiftStart] = useState(null);
	const [welcomeUser, setWelcomeUser] = useState(null); // { id, name, firstTime }

	const sessionId = useMemo(() => getOrCreate(sessionStorage, STORAGE.sessionId, () => "session-" + Date.now().toString(36)), []);
	const deviceId = useMemo(
		() => getOrCreate(localStorage, STORAGE.deviceId, () => "device-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)),
		[],
	);

	const settings = data.settings;
	const kitchen = KITCHEN_TYPES.includes(settings.businessType);
	const hasOpenOrders = data.openOrders.some((o) => o.status === "open");

	const currentUser = useMemo(() => {
		if (support) return SUPPORT_USER;
		return data.users.find((u) => u.id === currentUserId && u.active !== false) || null;
	}, [support, data.users, currentUserId]);

	// ------------------------------------------------------------- access ---
	const canView = useCallback(
		(v) => {
			if (!currentUser) return false;
			if (!(ROLE_VIEWS[currentUser.role] || []).includes(v)) return false;
			// the Order Queue belongs to kitchen presets, but saved orders of any preset stay reachable
			if (v === "orders" && !kitchen && !hasOpenOrders) return false;
			if (v === "industry" && !INDUSTRY_TYPES.includes(settings.businessType)) return false;
			if (v === "checkout" && locationId === "all") return false;
			const flag = VIEW_FEATURE[v];
			return flag ? !!enabled[flag] : true;
		},
		[currentUser, kitchen, hasOpenOrders, settings.businessType, enabled, locationId],
	);

	const firstView = useCallback(
		(user) => (ROLE_VIEWS[user.role] || ["staff"]).find((v) => canView2(user, v)) || "settings",
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[enabled, kitchen, settings.businessType],
	);
	function canView2(user, v) {
		if (v === "orders" && !kitchen && !hasOpenOrders) return false;
		if (v === "industry" && !INDUSTRY_TYPES.includes(settings.businessType)) return false;
		const flag = VIEW_FEATURE[v];
		return flag ? !!enabled[flag] : true;
	}

	// ----------------------------------------------------------- services ---
	const sessionRef = useRef({});
	sessionRef.current = {
		userId: currentUser?.id || "",
		user: currentUser,
		locationId,
		sessionId,
		deviceId,
		businessId: data.meta.accountUid || workspace?.dbName || "",
	};
	const featuresRef = useRef(enabled);
	featuresRef.current = enabled;

	const guardedStore = useMemo(() => {
		if (!support || !store) return store;
		return new Proxy(store, {
			get(target, prop) {
				if (prop === "write")
					return async (fn) => {
						ui.notice("Disabled during read-only support access.");
						return null;
					};
				const v = target[prop];
				return typeof v === "function" ? v.bind(target) : v;
			},
		});
	}, [support, store, ui]);

	const ctx = useMemo(
		() =>
			makeCtx({
				store: guardedStore,
				getData: () => dataRef.current,
				getSession: () => sessionRef.current,
				getFeatures: () => featuresRef.current,
				ui,
				repos,
			}),
		[guardedStore, dataRef, ui, repos],
	);
	const svc = useMemo(() => bindServices(ctx), [ctx]);

	// --------------------------------------------------------- navigation ---
	const go = useCallback(
		(v, force = false) => {
			if (!force && !canView(v)) {
				if (v === "checkout" && locationId === "all") ui.notice("Choose a real location before starting checkout.");
				else ui.notice("Your access role does not allow this section.");
				return;
			}
			setView(v);
			setLayout((l) => ({ ...l, mobileCartOpen: false }));
			if (window.matchMedia("(max-width:1100px)").matches) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
		},
		[canView, locationId, ui],
	);

	const setLocationId = useCallback((id) => locationStore.set(id || ""), []);

	// ------------------------------------------------------- staff login ----
	const staffLogin = useCallback(
		async ({ userId, pin, location }) => {
			const d = dataRef.current;
			const user = d.users.find((u) => u.id === userId && u.active !== false);
			const multi = enabled["business.locations"];
			const allowed = userLocationIds(user, d);
			let chosen = location;
			if (!multi || activeLocations(d).length === 1) chosen = allowed[0] || activeLocations(d)[0]?.id || "";
			if (!chosen) return "Select your POS location before signing in.";
			if (user && !allowed.includes(chosen) && multi) {
				log.warn("staff login rejected: location not permitted", { userId: user.id, locationId: chosen });
				return "You are not authorized for that location.";
			}
			if (!user || user.pin !== pin) {
				log.warn("staff login failed: incorrect user or PIN", { userId });
				return "Incorrect user or PIN.";
			}
			log.info("staff login", { userId: user.id, role: user.role, locationId: chosen });
			sessionStorage.setItem(STORAGE.userSession, user.id);
			setCurrentUserId(user.id);
			setLocationId(chosen);
			sessionRef.current = { ...sessionRef.current, userId: user.id, user, locationId: chosen };
			if (multi) svc.locations.auditLogin(chosen);
			const first = (ROLE_VIEWS[user.role] || ["staff"]).find((v) => canView2(user, v)) || "settings";
			setView(first);
			if (user.role === "owner" && !d.settings.onboardingComplete && !d.settings.onboardingDismissed && enabled["settings.posSetupWizard"])
				setTimeout(() => setSetupOpen(true), 250);
			if (enabled["staff.shiftPrompt"]) setTimeout(() => setShiftStart(user), 80);
			const welcome = resolveWelcome(d.settings);
			if (welcome.enabled && user.welcomeSeenVersion !== welcome.version) setWelcomeUser({ id: user.id, name: user.name, firstTime: true });
			return "";
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[dataRef, enabled, svc, setLocationId, kitchen, settings.businessType],
	);

	const staffLogout = useCallback(() => {
		log.info("staff logout");
		sessionStorage.removeItem(STORAGE.userSession);
		locationStore.set("");
		setCurrentUserId("");
		setShiftStart(null);
	}, []);

	// ---------------------------------------------------------- layout ------
	const setCheckoutMode = useCallback((mode, remember) => {
		log.info("checkout mode changed", { mode, remembered: !!remember });
		if (remember) localStorage.setItem(STORAGE.checkoutMode, mode);
		else localStorage.removeItem(STORAGE.checkoutMode);
		setCheckoutModeState(mode);
		setChooserOpen(false);
		setLayout((l) => ({
			...l,
			full: mode === "mobile" ? true : l.full,
			sidebarCollapsed: mode === "mobile" ? true : l.sidebarCollapsed,
			mobileCartOpen: false,
		}));
		setView("checkout");
		window.dispatchEvent(new Event("resize"));
	}, []);

	// first launch: choose mobile/POS layout unless remembered
	useEffect(() => {
		if (!enabled["checkout.modeChooser"]) return;
		const remembered = localStorage.getItem(STORAGE.checkoutMode);
		if (remembered === "mobile" || remembered === "pos") setCheckoutMode(remembered, true);
		else setChooserOpen(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled["checkout.modeChooser"]]);

	// body classes the legacy stylesheet relies on
	useEffect(() => {
		const b = document.body.classList;
		b.toggle("full", layout.full);
		b.toggle("sidebar-collapsed", layout.sidebarCollapsed);
		b.toggle("touch-kiosk-active", layout.kiosk);
		b.toggle("mobile-checkout", checkoutMode === "mobile");
		b.toggle("mobile-cart-open", layout.mobileCartOpen);
		b.toggle("support-readonly", support);
	}, [layout, checkoutMode, support]);

	// theme
	const theme = settings.uiTheme || localStorage.getItem(STORAGE.uiTheme) || "ceylonry";
	useEffect(() => {
		const id = UI_THEMES.some((t) => t.id === theme) ? theme : "ceylonry";
		document.documentElement.dataset.posTheme = id;
		localStorage.setItem(STORAGE.uiTheme, id);
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.content = UI_THEMES.find((t) => t.id === id).color;
	}, [theme]);

	// ---------------------------------------------------- data maintenance --
	const maintained = useRef("");
	useEffect(() => {
		if (!data.ready || !store || support) return;
		(async () => {
			const d = dataRef.current;
			const key = [d.locations.length, d.products.length, d.modifiers.length, d.sales.length, d.openOrders.length, d.meta.orderSequenceVersion].join("|");
			if (maintained.current === key) return;
			maintained.current = key;
			await store.write(async (tx) => {
				// 1. a workspace always has at least one location
				if (!d.locations.length) tx.put(T.locations, mainLocation({ address: d.settings.address || "", email: d.settings.email || "" }));
				const firstLocation = d.locations[0]?.id || "loc-main";
				d.users.forEach((u) => {
					if (u.locationAccess !== "all" && !Array.isArray(u.locationIds))
						tx.put(T.users, { ...u, locationAccess: u.role === "owner" ? "all" : "selected", locationIds: u.role === "owner" ? [] : [firstLocation] });
				});
				// 2. sequential ORD-#### numbers
				const m = migrateOrderNumbers(d.sales, d.openOrders, d.meta);
				if (m.changed) {
					d.sales.forEach((s, i) => m.sales[i] !== s && tx.putSale(m.sales[i]));
					d.openOrders.forEach((o, i) => m.openOrders[i] !== o && tx.put(T.openOrders, m.openOrders[i]));
					tx.setMeta("nextOrderSequence", m.nextOrderSequence);
					tx.setMeta("orderSequenceVersion", 2);
				}
				// 3. retired default modifier groups that nothing uses
				const linked = new Set(d.products.flatMap((p) => p.modifierIds || []));
				for (const mod of d.modifiers)
					if (RETIRED_MODIFIER_NAMES.includes(String(mod.name || "").trim().toLowerCase()) && !linked.has(mod.id)) {
						await markDeleted(tx, "modifiers", mod.id);
						tx.remove(T.modifierGroups, mod.id);
					}
				// 4. sellable-product stock rows
				if (enabled["inventory.productStock"]) {
					const locs = d.locations.length ? d.locations : [mainLocation()];
					const res = ensureProductInventory(d.products, d.inventory, locs);
					if (res.changed) {
						const before = new Map(d.inventory.map((i) => [i.id, JSON.stringify(i)]));
						res.inventory.forEach((i) => before.get(i.id) !== JSON.stringify(i) && tx.put(T.inventoryItems, i));
					}
				}
			});
		})();
	}, [data.ready, data.locations.length, data.products, data.modifiers.length, data.sales.length, data.openOrders.length, store, support, dataRef, enabled]);

	// optional bundled catalogue photos (window.CLS_AZURE_SWIM_IMAGES) fill empty product images
	useEffect(() => {
		if (!data.ready || support || !currentUser) return;
		const images = window.CLS_AZURE_SWIM_IMAGES;
		if (images) svc.catalog.applyBundledCatalogueImages(images);
	}, [data.ready, data.products.length, currentUser, support, svc]);

	// keep the location valid (a removed/inactive location ends the session there)
	useEffect(() => {
		if (!data.ready || !currentUser || locationId === "all") return;
		const active = activeLocations(data);
		if (locationId && !active.some((l) => l.id === locationId) && active.length) setLocationId(active[0].id);
	}, [data, currentUser, locationId, setLocationId]);

	// if the current view became unavailable (flag switched off), fall back
	useEffect(() => {
		if (currentUser && !canView(view)) {
			const fallback = firstView(currentUser);
			if (fallback !== view && canView(fallback)) setView(fallback);
		}
	}, [currentUser, canView, view, firstView]);

	const value = useMemo(
		() => ({
			currentUser,
			role: currentUser?.role || "",
			locationId,
			setLocationId,
			view,
			go,
			setView,
			canView,
			title: VIEW_TITLES[view] || ["", ""],
			staffLogin,
			staffLogout,
			layout,
			setLayout,
			checkoutMode,
			setCheckoutMode,
			chooserOpen,
			setChooserOpen,
			setupOpen,
			setSetupOpen,
			shiftStart,
			setShiftStart,
			welcomeUser,
			setWelcomeUser,
			kitchen,
			support,
			svc,
			ctx,
			sessionId,
			deviceId,
		}),
		[currentUser, locationId, setLocationId, view, go, canView, staffLogin, staffLogout, layout, checkoutMode, setCheckoutMode, chooserOpen, setupOpen, shiftStart, welcomeUser, kitchen, support, svc, ctx, sessionId, deviceId],
	);
	return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export const usePos = () => useContext(PosContext);
export const useServices = () => useContext(PosContext).svc;
export const useCurrentUser = () => useContext(PosContext).currentUser;
