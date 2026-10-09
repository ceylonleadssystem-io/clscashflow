/**
 * Compatibility layer exposing Appwrite through the older "clsBackend" auth/firestore-style API, so the
 * Netlify docs function and the shared platform script keep working. Components use auth.service.js instead.
 */
import { Account, Client, ID } from "appwrite";
import { env } from "../../config/env";
import { createLogger } from "../../utils/logger";

const log = createLogger("appwrite");

/**
 * Appwrite <-> "clsBackend-style" compatibility layer.
 *
 * This is an ES-module port of `assets/appwrite-compat.js`. The legacy
 * pages (and the shared `platform.js` billing/paywall/support script) talk to
 * `window.clsBackend.auth()/firestore()`; keeping the same facade means the
 * existing Netlify function `appwrite-docs` and platform.js keep working
 * unchanged. React components never touch this file directly - they use
 * `auth.service.js` and `cloud.service.js`.
 *
 * Endpoint / project come from env (`VITE_APPWRITE_*`).
 */
let installed = null;

export function getAppwriteCompat() {
	if (installed) return installed;

	const client = new Client().setEndpoint(env.appwriteEndpoint).setProject(env.appwriteProjectId);
	const account = new Account(client);
	let currentUser = null;
	let listeners = [];
	// An Appwrite sign-in token (JWT) is valid for 15 minutes and creating one is a call to Appwrite (rate limited), so one
	// token is reused for 10 minutes instead of asking for a new one with every sync request.
	let jwt = { uid: "", token: "", at: 0 };
	const idToken = async (uid, force) => {
		if (!force && jwt.uid === uid && jwt.token && Date.now() - jwt.at < 600000) return jwt.token;
		jwt = { uid, token: (await account.createJWT()).jwt, at: Date.now() };
		return jwt.token;
	};

	const userShape = (user) =>
		user
			? {
					uid: user.$id,
					email: user.email || "",
					displayName: user.name || "",
					photoURL: (user.prefs || {}).photoURL || "",
					emailVerified: !!user.emailVerification,
					getIdToken: (force) => idToken(user.$id, force),
					updateProfile: async (p) => {
						if (p.displayName != null) await account.updateName(p.displayName);
						currentUser = await loadUser();
						return currentUser;
					},
				}
			: null;

	const loadUser = async () => {
		try {
			return userShape(await account.get());
		} catch {
			return null;
		}
	};
	const emit = () =>
		listeners.slice().forEach((fn) => {
			try {
				fn(currentUser);
			} catch (e) {
				console.error(e);
				log.error("auth listener threw", e);
			}
		});
	const init = loadUser().then((u) => {
		currentUser = u;
		emit();
	});

	const authApi = {
		get currentUser() {
			return currentUser;
		},
		onAuthStateChanged(fn) {
			listeners.push(fn);
			init.then(() => fn(currentUser));
			return () => {
				listeners = listeners.filter((x) => x !== fn);
			};
		},
		async signInWithEmailAndPassword(email, password) {
			await account.createEmailPasswordSession(email, password);
			currentUser = await loadUser();
			log.info("email session created");
			emit();
			return { user: currentUser };
		},
		async createUserWithEmailAndPassword(email, password) {
			await account.create(ID.unique(), email, password);
			log.info("account created");
			await account.createEmailPasswordSession(email, password);
			currentUser = await loadUser();
			emit();
			return { user: currentUser };
		},
		async signInWithToken(userId, secret) {
			await account.createSession(userId, secret);
			currentUser = await loadUser();
			emit();
			return { user: currentUser };
		},
		async signOut() {
			try {
				await account.deleteSession("current");
			} catch (e) {
				// 401 means there was no session to delete (already signed out): expected, stay quiet.
				// Anything else (network, server) leaves a session alive on the server, so record it.
				// Local state is cleared below either way so the user is never stuck signed in on screen.
				if (e?.code !== 401) log.warn("sign-out: could not end the server session; clearing local state anyway", e);
			}
			currentUser = null;
			emit();
		},
		sendPasswordResetEmail: (email) => account.createRecovery(email, location.origin + "/reset-password.html"),
		signInWithPopup(provider) {
			account.createOAuth2Session((provider && provider.provider) || "google", location.origin + "/signin.html", location.origin + "/signin.html");
			return new Promise(() => {});
		},
	};

	// ---- document store (proxied through the Netlify function) --------------
	const request = (body, publicRead) =>
		init.then(async () => {
			for (let attempt = 0; ; attempt++) {
				const headers = { "Content-Type": "application/json" };
				if (currentUser && !publicRead) headers.Authorization = "Bearer " + (await currentUser.getIdToken(attempt > 0));
				const r = await fetch(env.docsFunctionUrl, { method: "POST", headers, body: JSON.stringify(body) });
				const j = await r.json();
				// a reused token that the server no longer accepts: get a fresh one and try once more
				if (r.status === 401 && currentUser && !publicRead && attempt === 0) continue;
				if (!r.ok || j.ok === false) {
					log.warn("docs function request failed", null, { action: body.action, path: body.path, status: r.status });
					throw new Error(j.error || "Appwrite request failed.");
				}
				return j;
			}
		});

	class Snap {
		constructor(row, stamp) {
			this.id = (row && row.id) || "";
			this.exists = !!row;
			this._data = (row && row.data) || null;
			this.stamp = stamp || ""; // when the document was last written on the server
		}
		data() {
			return this._data ? Object.assign({}, this._data) : undefined;
		}
	}
	class QueryRef {
		constructor(path, filters, order, limit) {
			this.path = path;
			this.filters = filters || [];
			this.order = order;
			this.max = limit;
		}
		where(f, o, v) {
			return new QueryRef(this.path, this.filters.concat([{ field: f, op: o, value: v }]), this.order, this.max);
		}
		orderBy(f, d) {
			return new QueryRef(this.path, this.filters, { field: f, dir: d || "asc" }, this.max);
		}
		limit(n) {
			return new QueryRef(this.path, this.filters, this.order, n);
		}
		async get() {
			const j = await request({
				action: "query",
				path: this.path,
				options: { filters: this.filters, order: this.order && this.order.field, dir: this.order && this.order.dir, limit: this.max },
			});
			const docs = (j.docs || []).map((x) => new Snap(x));
			return { docs, empty: !docs.length, size: docs.length, forEach: (fn) => docs.forEach(fn) };
		}
		onSnapshot(fn, err) {
			let stopped = false;
			let timer;
			const poll = async () => {
				try {
					if (!stopped) fn(await this.get());
				} catch (e) {
					if (err) err(e);
				}
				if (!stopped) timer = setTimeout(poll, 5000);
			};
			poll();
			return () => {
				stopped = true;
				clearTimeout(timer);
			};
		}
	}
	class DocRef {
		constructor(path, id) {
			this.path = path;
			this.id = id || "doc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
		}
		collection(n) {
			return new CollectionRef(this.path + "/" + this.id + "/" + n);
		}
		async get() {
			const j = await request({ action: "get", path: this.path, id: this.id }, /^users\/[^/]+\/team$/.test(this.path));
			return new Snap(j.doc, j.stamp);
		}
		/** Just the last-write time of the document (a few bytes), so a device can tell whether anything changed before downloading it. */
		async stamp() {
			const j = await request({ action: "stamp", path: this.path, id: this.id });
			return { exists: !!j.exists, stamp: j.stamp || "" };
		}
		async set(data, opt) {
			const j = await request({ action: "set", path: this.path, id: this.id, data, merge: !!(opt && opt.merge) });
			this.lastStamp = j.stamp || ""; // the write time the server gave this save, and the stamp it replaced
			this.lastPreviousStamp = j.previousStamp || "";
			return this;
		}
		async update(data) {
			await request({ action: "update", path: this.path, id: this.id, data });
			return this;
		}
		async delete() {
			await request({ action: "delete", path: this.path, id: this.id });
		}
	}
	class CollectionRef extends QueryRef {
		constructor(path) {
			super(path);
		}
		doc(id) {
			return new DocRef(this.path, id);
		}
		async add(data) {
			const d = new DocRef(this.path);
			await d.set(data);
			return d;
		}
	}
	const firestore = () => ({
		collection: (n) => new CollectionRef(n),
		batch() {
			const jobs = [];
			return {
				set: (r, d, o) => jobs.push(() => r.set(d, o)),
				delete: (r) => jobs.push(() => r.delete()),
				commit: () => Promise.all(jobs.map((f) => f())),
			};
		},
	});
	firestore.FieldValue = { serverTimestamp: () => new Date().toISOString(), delete: () => ({ __delete: true }) };

	installed = {
		apps: [{}],
		initializeApp() {
			return installed;
		},
		auth: () => authApi,
		firestore,
	};
	installed.auth.GoogleAuthProvider = function GoogleAuthProvider() {
		this.provider = "google";
	};
	return installed;
}

/** Exposes the compat object as `window.clsBackend` for platform.js / legacy portals. */
export function installGlobalClsBackend() {
	if (typeof window === "undefined") return null;
	if (!window.clsBackend) window.clsBackend = getAppwriteCompat();
	return window.clsBackend;
}
