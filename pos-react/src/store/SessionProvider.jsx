import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { env } from "../config/env";
import { DEFAULT_OWNER_PIN, STORAGE } from "../config/constants";
import { createDatabase, databaseNameFor } from "../db/database";
import { PosStore } from "../db/PosStore";
import { friendlyAuthError, getAuthService } from "../services/auth.service";
import { CloudSyncService } from "../services/cloud.service";
import { accessAllowed, billingWarning, posAccessProfile } from "../services/billing";
import {
	loadCatalogueImages,
	loadPlatformScript,
	patchReceiptSubmission,
	renderPaywall,
	sendOnboardingEmails,
	setPlatformProfile,
} from "../services/platform.service";
import { payloadToSnapshot } from "../services/sync/payload";
import { freshAccountDb, normalizeAccountDb } from "../services/sync/account";
import { T } from "../db/tables";

/**
 * Business-account session: authentication, workspace (per-account
 * WatermelonDB), cloud sync, subscription gate.
 *
 *  phase: booting -> signed-out -> activating -> ready   (or "error")
 */
const SessionContext = createContext(null);

const readJson = (key) => {
	try {
		return JSON.parse(localStorage.getItem(key) || "null");
	} catch {
		return null;
	}
};

export function SessionProvider({ children }) {
	const auth = useMemo(() => getAuthService(), []);
	const [phase, setPhase] = useState("booting");
	const [authError, setAuthError] = useState("");
	const [workspace, setWorkspace] = useState(null);
	const [cloudStatus, setCloudStatus] = useState({ message: "Connecting to cloud…", state: "syncing" });
	const [billing, setBilling] = useState({ profile: null, allowed: true, warning: "" });
	const [restoredNotice, setRestoredNotice] = useState(false);
	const activating = useRef("");
	const cloudRef = useRef(null);

	const reset = useCallback((message = "") => {
		cloudRef.current?.stop();
		cloudRef.current = null;
		activating.current = "";
		setWorkspace(null);
		setPhase("signed-out");
		setAuthError(message);
		sessionStorage.removeItem(STORAGE.businessAuth);
		sessionStorage.removeItem(STORAGE.userSession);
	}, []);

	const activate = useCallback(
		async (user) => {
			if (!user || activating.current === user.uid) return;
			activating.current = user.uid;
			setPhase("activating");
			try {
				if (auth.kind === "appwrite") {
					const fb = auth.firebase();
					const cloud = new CloudSyncService({ firebase: fb, onStatus: setCloudStatus });
					cloudRef.current = cloud;
					const ctx = await cloud.resolveWorkspace(user);
					const dbName = databaseNameFor(ctx.workspaceUid);
					const store = new PosStore(createDatabase(dbName));
					const previousUid = sessionStorage.getItem(STORAGE.businessUid) || "";
					if (previousUid !== ctx.workspaceUid) sessionStorage.removeItem(STORAGE.userSession);
					sessionStorage.setItem(STORAGE.businessUid, ctx.workspaceUid);
					const profile = posAccessProfile(ctx.profile, user);
					setPlatformProfile(profile);
					const { restoredCatalogue } = await cloud.attach(store, ctx, {
						dbName,
						legacyPayloads: [readJson(STORAGE.KEY + "-" + ctx.workspaceUid), readJson(STORAGE.KEY)],
					});
					if (restoredCatalogue) setRestoredNotice(true);
					sessionStorage.setItem(STORAGE.businessAuth, "1");
					const allowed = accessAllowed(profile);
					setBilling({ profile, allowed, warning: billingWarning(profile) });
					cloud.start();
					loadPlatformScript().then(() => patchReceiptSubmission(fb));
					sendOnboardingEmails(user, ctx.profile);
					if (!allowed) {
						try {
							await ctx.userRef.set(
								{
									posSubscriptionStatus: "payment-required",
									posAccountPaused: true,
									posPaymentReminderStatus: "due",
									posPaymentReminderAt: new Date().toISOString(),
								},
								{ merge: true },
							);
						} catch {
							/* non-fatal */
						}
						renderPaywall(profile);
					}
					setWorkspace({ store, dbName, ctx, cloud, workspaceUid: ctx.workspaceUid, user, profile });
				} else {
					// local provider: one database on this device, no cloud
					const dbName = databaseNameFor("");
					const store = new PosStore(createDatabase(dbName));
					await seedLocalWorkspace(store, user);
					sessionStorage.setItem(STORAGE.businessAuth, "1");
					setBilling({ profile: null, allowed: true, warning: "" });
					setWorkspace({ store, dbName, ctx: { workspaceUid: "local", workspaceUser: user }, cloud: null, workspaceUid: "local", user, profile: {} });
				}
				loadCatalogueImages();
				setPhase("ready");
				setAuthError("");
			} catch (e) {
				console.error("POS account could not be activated", e);
				activating.current = "";
				setAuthError(e?.message || "Could not load the POS account.");
				setPhase("signed-out");
			}
		},
		[auth],
	);

	useEffect(() => {
		const unsub = auth.onChange((user) => {
			const approved = sessionStorage.getItem(STORAGE.loginUid) || "";
			if (user && (auth.kind === "local" || approved === user.uid)) {
				activate(user);
				return;
			}
			cloudRef.current?.stop();
			activating.current = "";
			setWorkspace(null);
			setPhase("signed-out");
			sessionStorage.removeItem(STORAGE.businessAuth);
			sessionStorage.removeItem(STORAGE.userSession);
			if (user) setAuthError("Sign in to this POS with the business account you want to use.");
			else if (approved)
				setAuthError("Your login session expired. Sign in again to resume cloud sync. Changes on this device are preserved.");
		});
		return () => unsub?.();
	}, [auth, activate]);

	// Administrators can disable/enable an account (non-payment) at any time: re-check the profile
	useEffect(() => {
		if (phase !== "ready" || !workspace?.cloud) return undefined;
		const check = async () => {
			if (!navigator.onLine) return;
			try {
				const ctx = await workspace.cloud.resolveWorkspace(workspace.user);
				const profile = posAccessProfile(ctx.profile, workspace.user);
				const allowed = accessAllowed(profile);
				setPlatformProfile(profile);
				setBilling((b) => {
					if (b.allowed === allowed && b.profile?.subscriptionStatus === profile.subscriptionStatus) return b;
					return { profile, allowed, warning: billingWarning(profile) };
				});
				if (!allowed) renderPaywall(profile);
				else {
					document.getElementById("cls-paywall")?.remove();
					document.body.classList.remove("cls-trial-ended");
				}
			} catch {
				/* offline or transient: keep the current state */
			}
		};
		const id = setInterval(check, 60000);
		return () => clearInterval(id);
	}, [phase, workspace]);

	const signIn = useCallback(
		async (email, password) => {
			setAuthError("Signing in securely…");
			try {
				sessionStorage.removeItem(STORAGE.loginUid);
				const user = await auth.signIn(email, password);
				sessionStorage.setItem(STORAGE.loginUid, user.uid);
				setAuthError("");
				if (email === env.developerEmail) {
					window.location.href = env.supportPortalUrl;
					return;
				}
				await activate(user);
			} catch (e) {
				sessionStorage.removeItem(STORAGE.loginUid);
				setAuthError(auth.kind === "appwrite" ? friendlyAuthError(e) : e.message);
			}
		},
		[auth, activate],
	);

	const register = useCallback(
		async (email, password) => {
			try {
				const user = await auth.register(email, password);
				sessionStorage.setItem(STORAGE.loginUid, user.uid);
				await activate(user);
			} catch (e) {
				setAuthError(e.message);
			}
		},
		[auth, activate],
	);

	const signOut = useCallback(async () => {
		cloudRef.current?.stop();
		sessionStorage.removeItem(STORAGE.loginUid);
		try {
			await auth.signOut();
		} catch (e) {
			console.warn("Cloud sign-out will finish when the connection returns", e);
		}
		reset("");
	}, [auth, reset]);

	const resetPassword = useCallback(
		async (email) => {
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthError("Enter your business email first.");
			try {
				setAuthError("Sending password reset link…");
				await auth.resetPassword(email);
				setAuthError("Password reset link sent. Check your email, set a new password, then return here to sign in.");
			} catch (e) {
				setAuthError(e?.message || "Could not send the password reset link.");
			}
		},
		[auth],
	);

	const value = useMemo(
		() => ({
			phase,
			authKind: auth.kind,
			auth,
			authError,
			setAuthError,
			workspace,
			cloudStatus,
			billing,
			restoredNotice,
			signIn,
			register,
			signOut,
			resetPassword,
			retrySync: () => cloudRef.current?.retry(),
			syncNow: () => cloudRef.current?.syncNow?.(),
		}),
		[phase, auth, authError, workspace, cloudStatus, billing, restoredNotice, signIn, register, signOut, resetPassword],
	);
	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);

/** Local mode bootstrap: import the legacy localStorage blob or seed the defaults. */
async function seedLocalWorkspace(store, user) {
	const snap = await store.readSnapshot();
	if (snap.users.length || snap.products.length) return;
	const legacy = readJson(STORAGE.KEY);
	if (legacy && (legacy.users?.length || legacy.products?.length)) {
		await store.replaceAll(payloadToSnapshot(normalizeAccountDb(legacy, {}, { uid: "local", email: user.email })), { preserveTimestamps: false });
		return;
	}
	const fresh = freshAccountDb({ name: "Owner", bizName: "My Business" }, { uid: "local", email: user.email });
	const now = new Date().toISOString();
	fresh.products = [
		{ id: "p1", name: "Milk Tea", type: "Product", code: "DRK-001", category: "Drinks", cost: 110, price: 250, modifierIds: [], recipe: [] },
		{ id: "p2", name: "Iced Coffee", type: "Product", code: "DRK-002", category: "Drinks", cost: 240, price: 550, modifierIds: [], recipe: [] },
		{ id: "p3", name: "Chicken Sandwich", type: "Product", code: "FOD-001", category: "Food", cost: 430, price: 850, modifierIds: [], recipe: [] },
		{ id: "p4", name: "Delivery Fee", type: "Service", code: "SRV-001", category: "Services", cost: 150, price: 350, modifierIds: [], recipe: [] },
	];
	fresh.categories = ["Drinks", "Food", "Services"];
	fresh.users[0].pin = DEFAULT_OWNER_PIN;
	fresh.users[0].createdAt = now;
	await store.replaceAll(payloadToSnapshot(fresh), { preserveTimestamps: false });
	void T;
}
