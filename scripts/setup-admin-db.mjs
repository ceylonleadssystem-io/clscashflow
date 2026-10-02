// One-time (idempotent) setup of the separate POS administration database.
//
//   APPWRITE_API_KEY=... APPWRITE_PROJECT_ID=... node scripts/setup-admin-db.mjs
//
// Creates database `pos_admin` (override with APPWRITE_ADMIN_DATABASE_ID) with:
//   admins     administrator accounts (email must be unique)
//   audit_log  sign-ins and admin actions
// Collections get no client permissions: only the server API key can read or write them.
// The API key needs the databases scope. It can be removed after setup.
//
// Add the first administrator by creating a record in `admins` (Appwrite console):
//   email (lowercase @ceylonrylabs.io), name, passwordHash (from scripts/hash-admin-password.mjs),
//   active = true, failedAttempts = 0

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
console.log("\nDone. Now add the first record to `admins` and set POS_ADMIN_TOKEN_SECRET in Netlify.");
