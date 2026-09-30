import { env } from "../config/env";
import { STORAGE } from "../config/constants";
import { getFirebaseCompat, installGlobalFirebase } from "./appwrite/firebaseCompat";

/**
 * Authentication abstraction. Components never import Appwrite - they use one
 * of two providers behind the same interface:
 *
 *   AppwriteAuthProvider  production; business account in Appwrite
 *   LocalAuthProvider     offline / development; owner e-mail + SHA-256 password
 *                         hash stored on this device (the legacy local gate)
 *
 * Interface:
 *   kind                 "appwrite" | "local"
 *   onChange(cb)         subscribe to auth-state changes -> unsubscribe fn
 *   signIn(email, pw)    -> user { uid, email, displayName, getIdToken }
 *   signOut()
 *   resetPassword(email)
 *   hasAccount()         (local provider) whether an owner login exists
 *   register(email, pw)  (local provider) create the owner login
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function passwordHash(value) {
	const bytes = new TextEncoder().encode(value);
	const hash = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export function friendlyAuthError(error) {
	const message = String(error?.message || error || "").toLowerCase();
	if (message.includes("rate limit") || message.includes("too many") || message.includes("429"))
		return "Appwrite is temporarily rate limiting sign-ins because there were too many attempts. Wait a minute, then try once with the correct password.";
	if (message.includes("invalid") || message.includes("credential") || message.includes("password"))
		return "Incorrect POS email or password.";
	return error?.message || "Could not sign in. Check the connection and try again.";
}

class AppwriteAuthProvider {
	kind = "appwrite";
	constructor() {
		installGlobalFirebase();
		this.fb = getFirebaseCompat();
	}
	get currentUser() {
		return this.fb.auth().currentUser;
	}
	onChange(cb) {
		return this.fb.auth().onAuthStateChanged(cb);
	}
	async signIn(email, password) {
		if (this.fb.auth().currentUser) await this.fb.auth().signOut();
		const cred = await this.fb.auth().signInWithEmailAndPassword(email, password);
		return cred.user;
	}
	signOut() {
		return this.fb.auth().signOut();
	}
	resetPassword(email) {
		return this.fb.auth().sendPasswordResetEmail(email);
	}
	hasAccount() {
		return true;
	}
	firebase() {
		return this.fb;
	}
}

const LOCAL_KEY = "ceylonry-pos-local-owner";

class LocalAuthProvider {
	kind = "local";
	constructor() {
		this.user = null;
		this.listeners = new Set();
	}
	_account() {
		try {
			return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
		} catch {
			return null;
		}
	}
	get currentUser() {
		return this.user;
	}
	hasAccount() {
		return !!this._account();
	}
	accountEmail() {
		return this._account()?.email || "";
	}
	onChange(cb) {
		this.listeners.add(cb);
		// restore the tab session (business sign-in lasts for the browser tab)
		if (sessionStorage.getItem(STORAGE.businessAuth) === "1" && this._account()) {
			this.user = this._mkUser(this._account().email);
		}
		Promise.resolve().then(() => cb(this.user));
		return () => this.listeners.delete(cb);
	}
	_mkUser(email) {
		return { uid: "local-" + email, email, displayName: "", getIdToken: async () => "" };
	}
	_emit() {
		this.listeners.forEach((fn) => fn(this.user));
	}
	async register(email, password) {
		if (!EMAIL.test(email)) throw new Error("Enter a valid business email.");
		if (password.length < 8) throw new Error("Password must contain at least 8 characters.");
		localStorage.setItem(
			LOCAL_KEY,
			JSON.stringify({ email, passwordHash: await passwordHash(password), createdAt: new Date().toISOString() }),
		);
		return this.signIn(email, password);
	}
	async signIn(email, password) {
		const account = this._account();
		if (!account) throw new Error("Create the business login first.");
		if (account.email !== email || account.passwordHash !== (await passwordHash(password)))
			throw new Error("Incorrect business email or password.");
		this.user = this._mkUser(email);
		sessionStorage.setItem(STORAGE.businessAuth, "1");
		this._emit();
		return this.user;
	}
	async signOut() {
		this.user = null;
		sessionStorage.removeItem(STORAGE.businessAuth);
		this._emit();
	}
	async resetPassword() {
		throw new Error("Password reset is only available with the Appwrite provider. Clear this device's POS login to start again.");
	}
	forget() {
		localStorage.removeItem(LOCAL_KEY);
	}
}

let instance = null;
export function getAuthService() {
	if (!instance) instance = env.authProvider === "local" ? new LocalAuthProvider() : new AppwriteAuthProvider();
	return instance;
}

/** Test seam. */
export function setAuthService(service) {
	instance = service;
}
