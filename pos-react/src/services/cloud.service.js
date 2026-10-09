/**
 * Cloud sync for one business workspace: mirrors the local WatermelonDB data to the legacy cloud document
 * with per-row last-writer-wins merge, offline tolerance, pending flags, catalogue recovery and periodic pull/push loops.
 */
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
import { createLogger } from "../utils/logger";

const log = createLogger("cloud");

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

// Rejects if the cloud call takes longer than `ms`. The timer is cleared as soon as the call
// settles so finished requests don't leave a pending timeout behind (it would also fire a
// rejection nobody listens to, and keep a Node/test process alive).
const withTimeout = (promise, ms = 12000) => {
	let timer;
	const timeout = new Promise((_, reject) => {
		timer = setTimeout(() => reject(new Error("Cloud sync timed out")), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export class CloudSyncService {
	constructor({ clsBackend, onStatus }) {
		this.fb = clsBackend;
		this.onStatus = onStatus || (() => {});
		this.store = null;
		this.ref = null;
		this.lastCloudJson = "";
		this.lastRemoteStamp = "";
		this.lastServerStamp = ""; // server write time of the cloud document as last seen: lets pull() skip the download when nothing changed
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
			if (!Object.keys(profile).length) {
				log.error("profile load failed and no cached profile exists", e);
				throw e;
			}
			log.warn("profile load failed; using cached profile", e);
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

		log.info("attach started", { dbName, hasLocal: !!localPayload, hasLegacy: !!legacyWorkspace });
		let pending = this.isPending();
		let remote = null;
		try {
			remote = await withTimeout(this.ref.get());
		} catch (e) {
			console.warn("POS started from this device while offline", e);
			log.warn("remote read failed on attach; starting from local data", e);
		}
		const remoteData = remote && remote.exists ? remote.data() : null;
		this.lastServerStamp = remote?.stamp || "";
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
				log.warn("catalogue recovered from backup before sync");
				localPayload = seed;
				this.markPending();
				pending = true;
			}
		}
		if (!profileHasPosAccess(profile) && (hasRemotePos || hasLocalPos)) {
			log.info("repairing missing POS entitlement on profile");
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
				log.warn("entitlement repair failed; will retry later", e);
			}
		}

		const normalize = (p) => normalizeAccountDb(p, profile, workspaceUser);
		// Branch order matters: unsynced local edits win over remote, a foreign-owned remote doc is never merged.
		if (pending && localPayload) {
			log.info("attach: merging pending local changes over remote");
			await this._apply(normalize(mergePayload(remotePayload, clone(localPayload), true)));
			this.lastCloudJson = "";
			await this.syncNow();
		} else if (remoteData?.ownerUid && remoteData.ownerUid !== workspaceUid) {
			log.warn("remote POS document belongs to another owner; starting a fresh account database");
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
			log.warn("empty catalogue rebuilt from backups/history");
			await this._apply(current);
			this.markPending();
			this.lastCloudJson = "";
			await this.syncNow();
		}
		log.info("attach finished", { restoredCatalogue: preSyncRecovered || recovered });
		return { restoredCatalogue: preSyncRecovered || recovered };
	}

	// ------------------------------------------------------------- loops
	start() {
		this.stop();
		log.info("sync loops started", { pullMs: env.syncPullMs, pushMs: env.syncPushMs });
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
			// Ask for the write time only (a few bytes); the whole document, often several MB, is downloaded only when it changed.
			if (this.lastServerStamp && typeof this.ref.stamp === "function") {
				try {
					const head = await withTimeout(this.ref.stamp());
					if (head.exists && head.stamp === this.lastServerStamp) {
						this._status(this.isPending() ? "Syncing POS with cloud…" : "POS is online · cloud synced", this.isPending() ? "syncing" : "saved");
						return;
					}
				} catch (e) {
					log.warn("cloud stamp check failed; reading the whole document", e);
				}
			}
			const snapshot = await withTimeout(this.ref.get());
			const remoteData = snapshot.exists ? snapshot.data() : null;
			const remote = remoteData?.payload || null;
			if (remote) await this._applyRemote(remote, remoteData?.updatedAt);
			this.lastServerStamp = snapshot.stamp || "";
			if (this.isPending() && payloadCovers(remote, await this._localPayload())) this.clearPending();
			if (this.isPending()) this._status("Syncing POS with cloud…", "syncing");
			else this._status("POS is online · cloud synced", "saved");
		} catch (error) {
			this._status("Cloud sync failed · tap to retry", "retry");
			console.warn("POS live sync paused", error);
			log.warn("pull failed", error);
		}
	}

	async _applyRemote(incoming, stamp) {
		const { profile, workspaceUser } = this.ctx;
		const local = await this._localPayload();
		const localDirty = this.isPending() || exactly(local) !== this.lastCloudJson;
		if (!localDirty && stamp && stamp === this.lastRemoteStamp) return;
		const merged = normalizeAccountDb(mergePayload(incoming, clone(local), localDirty), profile, workspaceUser);
		const incomingJson = exactly(normalizeAccountDb(JSON.parse(JSON.stringify(incoming)), profile, workspaceUser));
		if (exactly(safePayload(merged)) !== exactly(local)) {
			log.info("remote changes merged into local database", { localDirty });
			await this._apply(merged);
		}
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
		const startedAt = Date.now();
		log.info("push started", { pending });
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
				// Nobody else wrote between our read and our save (the server replaced exactly the version we read): the cloud now holds
				// what we sent, so there is nothing to download to confirm it. Otherwise read it back as before.
				const unchangedMeanwhile = !!snapshot.stamp && this.ref.lastPreviousStamp === snapshot.stamp && !!this.ref.lastStamp;
				if (unchangedMeanwhile) {
					verified = safePayload(merged);
					this.lastServerStamp = this.ref.lastStamp;
					this.lastRemoteStamp = "";
				} else {
					const confirmation = await withTimeout(this.ref.get());
					verified = confirmation.exists ? confirmation.data()?.payload : null;
					this.lastRemoteStamp = confirmation.exists ? confirmation.data()?.updatedAt || "" : "";
					this.lastServerStamp = confirmation.stamp || "";
				}
				if (payloadCovers(verified, payload)) break;
				log.warn("cloud did not confirm push; retrying", { attempt: attempt + 1 });
				if (attempt === 2) throw new Error("Cloud did not confirm the latest device changes.");
			}
			const latest = await this._localPayload();
			const changedDuringSync = exactly(latest) !== json;
			const merged = normalizeAccountDb(mergePayload(verified, clone(latest), changedDuringSync), profile, workspaceUser);
			if (exactly(safePayload(merged)) !== exactly(latest)) await this._apply(merged);
			this.lastCloudJson = exactly(normalizeAccountDb(JSON.parse(JSON.stringify(verified)), profile, workspaceUser));
			log.info("push finished", { ms: Date.now() - startedAt, changedDuringSync });
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
			log.error("push failed; changes kept locally", e, { ms: Date.now() - startedAt, online: navigator.onLine });
		} finally {
			this.inFlight = false;
			if (this.again) {
				this.again = false;
				setTimeout(() => this.syncNow(), 250);
			}
		}
	}
}
