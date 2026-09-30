import { env } from "../config/env";
import { STORAGE } from "../config/constants";
import { exactly } from "../db/rowMapper";
import { payloadToSnapshot, snapshotToPayload } from "./sync/payload";
import { mergePayload, payloadCovers } from "./sync/merge";
import {
	cacheCatalogue,
	freshAccountDb,
	normalizeAccountDb,
	readCatalogueBackup,
	recoverMissingCatalogue,
	safePayload,
} from "./sync/account";
import { profileHasPosAccess } from "./billing";

/**
 * Cloud sync for one business workspace.
 *
 * Source of truth is WatermelonDB; this service mirrors it to the legacy
 * document `users/{workspaceUid}/pos/main` (payload format unchanged, so the
 * legacy HTML POS and this React POS can share an account). Behaviour ported
 * from the original: per-row last-writer-wins merge, tombstones, per-setting
 * timestamps, pending-sync flag, offline tolerance, periodic pull + push.
 */
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

const withTimeout = (promise, ms = 12000) =>
	Promise.race([
		promise,
		new Promise((_, reject) => setTimeout(() => reject(new Error("Cloud sync timed out")), ms)),
	]);

export class CloudSyncService {
	constructor({ firebase, onStatus }) {
		this.fb = firebase;
		this.onStatus = onStatus || (() => {});
		this.store = null;
		this.ref = null;
		this.lastCloudJson = "";
		this.lastRemoteStamp = "";
		this.inFlight = false;
		this.again = false;
		this.pullTimer = null;
		this.pushTimer = null;
		this.debounce = null;
		this.unsubWrites = null;
		this.handlers = [];
	}

	// -------------------------------------------------------------- identity
	/** Loads the user profile (falls back to the cached copy when offline). */
	async resolveWorkspace(user) {
		const userRef = this.fb.firestore().collection("users").doc(user.uid);
		const profileKey = STORAGE.KEY + "-profile-" + user.uid;
		let profile = {};
		try {
			const snap = await userRef.get();
			profile = snap.exists ? snap.data() : {};
			localStorage.setItem(profileKey, JSON.stringify(profile));
		} catch (e) {
			try {
				profile = JSON.parse(localStorage.getItem(profileKey) || "{}");
			} catch {
				/* ignore */
			}
			if (!Object.keys(profile).length) throw e;
		}
		const workspaceUid = String(profile.ownerUid || user.uid);
		return {
			user,
			userRef,
			profile,
			profileKey,
			workspaceUid,
			workspaceUser: { uid: workspaceUid, email: user.email || "", displayName: user.displayName || "" },
		};
	}

	// ---------------------------------------------------------------- status
	_status(message, state) {
		this.onStatus({ message, state });
	}
	_online() {
		const online = navigator.onLine;
		if (!online) this._status("Offline · saved on this device", "offline");
		return online;
	}
	get pendingKey() {
		return this.dbName + "-pending-sync";
	}
	isPending() {
		return localStorage.getItem(this.pendingKey) === "1";
	}
	markPending() {
		try {
			localStorage.setItem(this.pendingKey, "1");
		} catch {
			/* storage full */
		}
	}
	clearPending() {
		localStorage.removeItem(this.pendingKey);
	}

	// ----------------------------------------------------------- payload I/O
	async _localPayload() {
		if (this._payloadCache && this._payloadCache.version === this.store.version) return this._payloadCache.payload;
		const version = this.store.version;
		const payload = safePayload(snapshotToPayload(await this.store.readSnapshot()));
		this._payloadCache = { version, payload };
		return payload;
	}

	async _apply(payload) {
		await this.store.replaceAll(payloadToSnapshot(payload), { preserveTimestamps: true });
		cacheCatalogue(payload, this.ctx.workspaceUser);
	}

	/** Has the local database ever been populated? */
	async _hasLocalData() {
		const s = await this.store.readSnapshot();
		return !!(s.users.length || s.products.length || s.sales.length || s.settings.business);
	}

	// ---------------------------------------------------------------- attach
	/**
	 * Reconcile local + remote data, then start the sync loops.
	 * `legacyPayload`: optional blob imported from the legacy localStorage keys.
	 */
	async attach(store, ctx, { dbName, legacyPayloads = [] }) {
		this.store = store;
		this.ctx = ctx;
		this.dbName = dbName;
		const { profile, workspaceUid, workspaceUser, userRef } = ctx;
		this.ref = this.fb.firestore().collection("users").doc(workspaceUid).collection("pos").doc("main");

		let localPayload = (await this._hasLocalData()) ? clone(await this._localPayload()) : null;
		const [legacyWorkspace, legacyRoot] = legacyPayloads;
		if (!localPayload && legacyWorkspace && typeof legacyWorkspace === "object") {
			localPayload = legacyWorkspace;
			if (!localPayload.accountUid) localPayload.accountUid = workspaceUid;
		}
		const catalogueBackup = readCatalogueBackup(workspaceUid);
		cacheCatalogue(localPayload, workspaceUser);

		let pending = this.isPending();
		let remote = null;
		try {
			remote = await withTimeout(this.ref.get());
		} catch (e) {
			console.warn("POS started from this device while offline", e);
		}
		const remoteData = remote && remote.exists ? remote.data() : null;
		const remotePayload = remoteData?.payload || null;
		const hasRemotePos = !!remotePayload;
		const hasLocalPos = !!(localPayload && typeof localPayload === "object");
		const remoteOwnedByUser = !(remoteData?.ownerUid && remoteData.ownerUid !== workspaceUid);
		let preSyncRecovered = false;

		if (remoteOwnedByUser) {
			const seed = localPayload || remotePayload || freshAccountDb(profile, workspaceUser);
			preSyncRecovered = recoverMissingCatalogue(
				seed,
				[localPayload, catalogueBackup, remotePayload, legacyRoot],
				profile,
				workspaceUser,
			);
			if (preSyncRecovered) {
				localPayload = seed;
				this.markPending();
				pending = true;
			}
		}
		if (!profileHasPosAccess(profile) && (hasRemotePos || hasLocalPos)) {
			profile.posEnabled = true;
			profile.posPlan = "pos";
			localStorage.setItem(ctx.profileKey, JSON.stringify(profile));
			try {
				await userRef.set(
					{ posEnabled: true, posPlan: "pos", updatedAt: this.fb.firestore.FieldValue.serverTimestamp() },
					{ merge: true },
				);
			} catch (e) {
				console.warn("POS entitlement repair will retry later", e);
			}
		}

		const normalize = (p) => normalizeAccountDb(p, profile, workspaceUser);
		if (pending && localPayload) {
			await this._apply(normalize(mergePayload(remotePayload, clone(localPayload), true)));
			this.lastCloudJson = "";
			await this.syncNow();
		} else if (remoteData?.ownerUid && remoteData.ownerUid !== workspaceUid) {
			await this._apply(normalize(freshAccountDb(profile, workspaceUser)));
			this.lastCloudJson = "";
			await this.syncNow();
		} else if (remotePayload) {
			await this._apply(normalize(mergePayload(remotePayload, clone(localPayload) || {}, false)));
			this.lastCloudJson = exactly(normalize(JSON.parse(JSON.stringify(remotePayload))));
			if (exactly(await this._localPayload()) !== this.lastCloudJson) {
				this.markPending();
				await this.syncNow();
			}
		} else if (localPayload) {
			await this._apply(normalize(localPayload));
			this.lastCloudJson = "";
			await this.syncNow();
		} else {
			await this._apply(normalize(freshAccountDb(profile, workspaceUser)));
			this.lastCloudJson = "";
			await this.syncNow();
		}

		// a device catalogue that is still empty can be rebuilt from backups / history
		const current = normalize(clone(await this._localPayload()));
		const recovered = recoverMissingCatalogue(
			current,
			[localPayload, remotePayload, catalogueBackup, legacyRoot],
			profile,
			workspaceUser,
		);
		if (recovered) {
			await this._apply(current);
			this.markPending();
			this.lastCloudJson = "";
			await this.syncNow();
		}
		return { restoredCatalogue: preSyncRecovered || recovered };
	}

	// ------------------------------------------------------------- loops
	start() {
		this.stop();
		this.unsubWrites = this.store.onWrite(({ origin }) => {
			if (origin === "sync") return;
			this.markPending();
			clearTimeout(this.debounce);
			this.debounce = setTimeout(() => this.syncNow(), 250);
		});
		this.pull();
		this.pullTimer = setInterval(() => this.pull(), env.syncPullMs);
		this.pushTimer = setInterval(() => this.syncNow(), env.syncPushMs);
		const online = () => {
			this._online();
			this.syncNow();
		};
		const focus = () => this.syncNow();
		const visibility = () => !document.hidden && this.syncNow();
		const offline = () => this._online();
		window.addEventListener("online", online);
		window.addEventListener("offline", offline);
		window.addEventListener("focus", focus);
		document.addEventListener("visibilitychange", visibility);
		window.addEventListener("beforeunload", focus);
		this.handlers = [
			["online", online],
			["offline", offline],
			["focus", focus],
			["beforeunload", focus],
		];
		this.visibility = visibility;
	}

	stop() {
		clearInterval(this.pullTimer);
		clearInterval(this.pushTimer);
		clearTimeout(this.debounce);
		this.unsubWrites?.();
		this.unsubWrites = null;
		for (const [ev, fn] of this.handlers) window.removeEventListener(ev, fn);
		if (this.visibility) document.removeEventListener("visibilitychange", this.visibility);
		this.handlers = [];
	}

	retry() {
		this._status("Retrying cloud sync…", "syncing");
		return this.syncNow();
	}

	/** Pull remote changes and merge them into the local database. */
	async pull() {
		if (!navigator.onLine || this.inFlight || !this.ref) return;
		try {
			const snapshot = await withTimeout(this.ref.get());
			const remoteData = snapshot.exists ? snapshot.data() : null;
			const remote = remoteData?.payload || null;
			if (remote) await this._applyRemote(remote, remoteData?.updatedAt);
			if (this.isPending() && payloadCovers(remote, await this._localPayload())) this.clearPending();
			if (this.isPending()) this._status("Syncing POS with cloud…", "syncing");
			else this._status("POS is online · cloud synced", "saved");
		} catch (error) {
			this._status("Cloud sync failed · tap to retry", "retry");
			console.warn("POS live sync paused", error);
		}
	}

	async _applyRemote(incoming, stamp) {
		const { profile, workspaceUser } = this.ctx;
		const local = await this._localPayload();
		const localDirty = this.isPending() || exactly(local) !== this.lastCloudJson;
		if (!localDirty && stamp && stamp === this.lastRemoteStamp) return;
		const merged = normalizeAccountDb(mergePayload(incoming, clone(local), localDirty), profile, workspaceUser);
		const incomingJson = exactly(normalizeAccountDb(JSON.parse(JSON.stringify(incoming)), profile, workspaceUser));
		if (exactly(safePayload(merged)) !== exactly(local)) await this._apply(merged);
		this.lastCloudJson = incomingJson;
		this.lastRemoteStamp = stamp || "";
		if (exactly(await this._localPayload()) !== incomingJson) {
			this.markPending();
			this.syncNow();
		}
	}

	/** Push local changes (merging with whatever is in the cloud). */
	async syncNow() {
		if (!this.ref || !this.store) return;
		if (this.inFlight) {
			this.again = true;
			return;
		}
		const { profile, workspaceUser } = this.ctx;
		const pending = this.isPending();
		const payload = await this._localPayload();
		const json = exactly(payload);
		if (!this._online()) {
			this.markPending();
			return;
		}
		if (json === this.lastCloudJson && !pending) {
			this._status("POS is online · cloud synced", "saved");
			return;
		}
		this.inFlight = true;
		this._status("Syncing POS with cloud…", "syncing");
		try {
			let verified = null;
			for (let attempt = 0; attempt < 3; attempt++) {
				const snapshot = await withTimeout(this.ref.get());
				const remote = snapshot.exists ? snapshot.data()?.payload : null;
				const merged = normalizeAccountDb(mergePayload(remote, clone(payload), true), profile, workspaceUser);
				await withTimeout(
					this.ref.set(
						{
							ownerUid: workspaceUser.uid,
							payload: safePayload(merged),
							updatedAt: this.fb.firestore.FieldValue.serverTimestamp(),
						},
						{ merge: true },
					),
					20000,
				);
				const confirmation = await withTimeout(this.ref.get());
				verified = confirmation.exists ? confirmation.data()?.payload : null;
				this.lastRemoteStamp = confirmation.exists ? confirmation.data()?.updatedAt || "" : "";
				if (payloadCovers(verified, payload)) break;
				if (attempt === 2) throw new Error("Cloud did not confirm the latest device changes.");
			}
			const latest = await this._localPayload();
			const changedDuringSync = exactly(latest) !== json;
			const merged = normalizeAccountDb(mergePayload(verified, clone(latest), changedDuringSync), profile, workspaceUser);
			if (exactly(safePayload(merged)) !== exactly(latest)) await this._apply(merged);
			this.lastCloudJson = exactly(normalizeAccountDb(JSON.parse(JSON.stringify(verified)), profile, workspaceUser));
			if (changedDuringSync) {
				this.markPending();
				this.again = true;
			} else this.clearPending();
			this._status(
				changedDuringSync ? "Syncing POS with cloud…" : "POS is online · cloud synced",
				changedDuringSync ? "syncing" : "saved",
			);
		} catch (e) {
			this.markPending();
			this._status(
				navigator.onLine
					? "Cloud sync failed · changes saved locally · tap to retry"
					: "Offline · saved on this device",
				navigator.onLine ? "retry" : "offline",
			);
			console.warn("POS cloud sync delayed; changes remain saved on this device", e);
		} finally {
			this.inFlight = false;
			if (this.again) {
				this.again = false;
				setTimeout(() => this.syncNow(), 250);
			}
		}
	}
}
