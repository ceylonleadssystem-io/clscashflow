// One-time (idempotent) setup of the separate POS administration database.
//
//   APPWRITE_API_KEY=... APPWRITE_PROJECT_ID=... node scripts/setup-admin-db.mjs
//
// Creates database `pos_admin` (override with APPWRITE_ADMIN_DATABASE_ID) with:
//   admins     administrator accounts (email must be unique)
//   audit_log  sign-ins and admin actions
//   kanban_cards, kanban_updates  the feature board and the messages under each card
// Collections get no client permissions: only the server API key can read or write them.
//   diag_signals  tiny (<= 10 min) WebRTC handshake for remote POS diagnostics, one document per account.
//                 It never holds log data: logs travel browser to browser.
// The API key needs the databases scope. It can be removed after setup.
//
// Add the first administrator with `node scripts/hash-admin-password.mjs` (it asks for the details and saves the record), or by
// creating a record in `admins` yourself (Appwrite console): email (lowercase @ceylonrylabs.io), name, passwordHash, active = true,
// failedAttempts = 0

import { Client, Databases } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const project = process.env.APPWRITE_PROJECT_ID || "6a947d6e0012c551dfde";
const key = process.env.APPWRITE_API_KEY;
const DB = process.env.APPWRITE_ADMIN_DATABASE_ID || "pos_admin";
if (!key) {
	console.error("Set APPWRITE_API_KEY (databases scope) and run again.");
	process.exit(1);
}
const db = new Databases(new Client().setEndpoint(endpoint).setProject(project).setKey(key));

// Appwrite answers 409 when something already exists: treat that as "already done".
const once = async (label, fn) => {
	try {
		await fn();
		console.log("created  ", label);
	} catch (e) {
		if (e.code === 409) console.log("exists   ", label);
		else throw e;
	}
};

await once("database " + DB, () => db.create(DB, "POS Administration"));

await once("collection admins", () => db.createCollection(DB, "admins", "Administrators", [], false));
await once("admins.email", () => db.createStringAttribute(DB, "admins", "email", 254, true));
await once("admins.name", () => db.createStringAttribute(DB, "admins", "name", 120, false));
await once("admins.passwordHash", () => db.createStringAttribute(DB, "admins", "passwordHash", 400, true));
await once("admins.role", () => db.createStringAttribute(DB, "admins", "role", 20, false, "admin")); // admin = everything in the portal, support = live support only
await once("admins.active", () => db.createBooleanAttribute(DB, "admins", "active", false, true));
await once("admins.failedAttempts", () => db.createIntegerAttribute(DB, "admins", "failedAttempts", false, 0, 1000, 0));
await once("admins.lockedUntil", () => db.createStringAttribute(DB, "admins", "lockedUntil", 40, false));
await once("admins.lastLoginAt", () => db.createStringAttribute(DB, "admins", "lastLoginAt", 40, false));

await once("collection audit_log", () => db.createCollection(DB, "audit_log", "Audit log", [], false));
await once("audit_log.at", () => db.createStringAttribute(DB, "audit_log", "at", 40, true));
await once("audit_log.adminEmail", () => db.createStringAttribute(DB, "audit_log", "adminEmail", 254, false));
await once("audit_log.action", () => db.createStringAttribute(DB, "audit_log", "action", 80, true));
await once("audit_log.target", () => db.createStringAttribute(DB, "audit_log", "target", 120, false));
await once("audit_log.detail", () => db.createStringAttribute(DB, "audit_log", "detail", 900, false));

// Attributes are created asynchronously; give Appwrite a moment before adding indexes.
await new Promise((r) => setTimeout(r, 4000));
await once("admins email index (unique)", () => db.createIndex(DB, "admins", "email_unique", "unique", ["email"]));
await once("audit_log time index", () => db.createIndex(DB, "audit_log", "at_idx", "key", ["at"], ["DESC"]));

// diag_signals only ever holds short-lived handshakes, so it is safe to rebuild. It is dropped and recreated so an
// earlier half-finished run (attributes too large for one record) cannot leave it in a broken state.
try {
	await db.deleteCollection(DB, "diag_signals");
	console.log("removed  ", "old collection diag_signals");
	await new Promise((r) => setTimeout(r, 3000)); // Appwrite deletes collections asynchronously
} catch (e) {
	if (e.code !== 404) throw e;
}
await once("collection diag_signals", () => db.createCollection(DB, "diag_signals", "Diagnostics signals", [], false));
// offer/answer are capped at 8000 characters by the functions; the column is 20000 so Appwrite stores it as TEXT
// (columns up to 16383 characters count in full toward the ~64 KB record limit and two of them would not fit).
await once("diag_signals.uid", () => db.createStringAttribute(DB, "diag_signals", "uid", 40, true));
await once("diag_signals.requestId", () => db.createStringAttribute(DB, "diag_signals", "requestId", 40, true));
await once("diag_signals.offer", () => db.createStringAttribute(DB, "diag_signals", "offer", 20000, true));
await once("diag_signals.answer", () => db.createStringAttribute(DB, "diag_signals", "answer", 20000, false));
await once("diag_signals.createdAt", () => db.createStringAttribute(DB, "diag_signals", "createdAt", 40, true));
// kds_pairs: short-lived (<= 10 min) WebRTC handshake between a POS and a Kitchen Display. Never holds orders.
await once("collection kds_pairs", () => db.createCollection(DB, "kds_pairs", "KDS pairing signals", [], false));
await once("kds_pairs.key", () => db.createStringAttribute(DB, "kds_pairs", "key", 40, true));
await once("kds_pairs.offer", () => db.createStringAttribute(DB, "kds_pairs", "offer", 20000, true));
await once("kds_pairs.answer", () => db.createStringAttribute(DB, "kds_pairs", "answer", 20000, false));
await once("kds_pairs.pairId", () => db.createStringAttribute(DB, "kds_pairs", "pairId", 40, false));
await once("kds_pairs.createdAt", () => db.createStringAttribute(DB, "kds_pairs", "createdAt", 40, true));
// Feature board of the admin portal (netlify/functions/kanban-board): one card per feature, with messages and updates under it.
await once("collection kanban_cards", () => db.createCollection(DB, "kanban_cards", "Feature board cards", [], false));
await once("kanban_cards.issue", () => db.createIntegerAttribute(DB, "kanban_cards", "issue", false));
await once("kanban_cards.title", () => db.createStringAttribute(DB, "kanban_cards", "title", 300, true));
await once("kanban_cards.status", () => db.createStringAttribute(DB, "kanban_cards", "status", 20, true));
await once("kanban_cards.lastUpdateAt", () => db.createStringAttribute(DB, "kanban_cards", "lastUpdateAt", 40, false));
await once("collection kanban_updates", () => db.createCollection(DB, "kanban_updates", "Feature board updates", [], false));
await once("kanban_updates.cardId", () => db.createStringAttribute(DB, "kanban_updates", "cardId", 36, true));
await once("kanban_updates.message", () => db.createStringAttribute(DB, "kanban_updates", "message", 4000, true));
await once("kanban_updates.author", () => db.createStringAttribute(DB, "kanban_updates", "author", 254, false));
await once("kanban_updates.at", () => db.createStringAttribute(DB, "kanban_updates", "at", 40, true));
await new Promise((r) => setTimeout(r, 4000)); // attributes first, then the index that uses them
await once("kanban_updates card index", () => db.createIndex(DB, "kanban_updates", "card_at_idx", "key", ["cardId", "at"], ["ASC", "ASC"]));
console.log("\nDone. Now add the first record to `admins` and set POS_ADMIN_TOKEN_SECRET in Netlify.");
