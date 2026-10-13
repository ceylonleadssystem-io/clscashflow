// One-time (idempotent) setup of the Guest Manager database.
//
//   APPWRITE_API_KEY=... node scripts/setup-gm-db.mjs
//
// Creates database `gm` with collection `gm_documents` (override with APPWRITE_GM_DATABASE_ID / APPWRITE_GM_COLLECTION_ID),
// with the same fields the document store writes (netlify/lib/appwrite.js). No client permissions: only the server API key
// can read or write it. The API key needs the databases scope and can be removed afterwards.
//
// Run it before the site that uses it is deployed: the document store, /ready and the account delete all expect the database
// to exist. Add a daily backup policy for the `gm` database in the Appwrite console.

import { Client, Databases } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const project = process.env.APPWRITE_PROJECT_ID || "6a947d6e0012c551dfde";
const key = process.env.APPWRITE_API_KEY;
const DB = process.env.APPWRITE_GM_DATABASE_ID || "gm";
const COL = process.env.APPWRITE_GM_COLLECTION_ID || "gm_documents";
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

await once("database " + DB, () => db.create(DB, "Guest Manager"));
await once("collection " + COL, () => db.createCollection(DB, COL, "Guest Manager documents", [], false));
await once(COL + ".path", () => db.createStringAttribute(DB, COL, "path", 512, true));
await once(COL + ".docId", () => db.createStringAttribute(DB, COL, "docId", 128, true));
await once(COL + ".data", () => db.createStringAttribute(DB, COL, "data", 1000000, true));
await once(COL + ".ownerUid", () => db.createStringAttribute(DB, COL, "ownerUid", 64, false));
await once(COL + ".email", () => db.createStringAttribute(DB, COL, "email", 320, false));
await once(COL + ".createdAt", () => db.createStringAttribute(DB, COL, "createdAt", 40, true));
await once(COL + ".updatedAt", () => db.createStringAttribute(DB, COL, "updatedAt", 40, true));

// Attributes are created in the background: wait until they are available before adding indexes.
for (let i = 0; i < 30; i++) {
	const { attributes } = await db.listAttributes(DB, COL);
	if (attributes.every((a) => a.status === "available")) break;
	await new Promise((r) => setTimeout(r, 1000));
}
await once(COL + " path index", () => db.createIndex(DB, COL, "path_idx", "key", ["path"]));
await once(COL + " path search index", () => db.createIndex(DB, COL, "path_search", "fulltext", ["path"]));
console.log("Done.");
