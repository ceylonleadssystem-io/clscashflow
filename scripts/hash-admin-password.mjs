// Creates (or updates) a POS administrator in the `admins` collection of the `pos_admin` database.
//
//   node scripts/hash-admin-password.mjs
//
// It asks for what it needs, shows a summary, and only writes after you confirm:
//   - administrator email (must be @ceylonrylabs.io), name
//   - password (leave empty to generate a strong one, shown once) and the Appwrite API key (databases scope), both typed hidden
// If the email already exists you are asked whether to set a new password and re-activate the account.
// Nothing is written until you confirm. The API key and password are never printed or stored.
//
// Settings with defaults (override with environment variables): APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_ADMIN_DATABASE_ID.
// For scripts: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD and APPWRITE_API_KEY answer the matching questions;
// add ADMIN_YES=1 to skip the final confirmation. Run scripts/setup-admin-db.mjs first if the database does not exist yet.

import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { createInterface } from "node:readline/promises";
import { Client, Databases, ID, Query } from "node-appwrite";

const { hashPassword, verifyPassword } = createRequire(import.meta.url)("../netlify/lib/admin-auth.js");

const endpoint = process.env.APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const project = process.env.APPWRITE_PROJECT_ID || "6a947d6e0012c551dfde";
const DB = process.env.APPWRITE_ADMIN_DATABASE_ID || "pos_admin";
const DOMAIN = "@ceylonrylabs.io";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let hidden = false;
const write = rl._writeToOutput?.bind(rl);
if (write) rl._writeToOutput = (text) => (hidden ? undefined : write(text)); // typed characters stay invisible while `hidden`

// Lines are read from one iterator so typed and piped input behave the same (a question never loses a line already received).
const lines = rl[Symbol.asyncIterator]();
const readLine = async () => {
	const { value, done } = await lines.next();
	if (done) fail("Input ended before all answers were given. Nothing was written.");
	return String(value).trim();
};
const ask = async (question) => (process.stdout.write(question), readLine());
const askHidden = async (question) => {
	process.stdout.write(question);
	hidden = true;
	try {
		return await readLine();
	} finally {
		hidden = false;
		process.stdout.write("\n");
	}
};
const fail = (message) => {
	console.error("\n" + message);
	rl.close();
	process.exit(1);
};

console.log("\nAdd or update a POS administrator\n");

// 1. who
let email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
while (!email) {
	const typed = (await ask(`Administrator email (must end with ${DOMAIN}): `)).toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typed) || !typed.endsWith(DOMAIN)) console.log(`  Enter a valid email ending with ${DOMAIN}.`);
	else email = typed;
}
if (!email.endsWith(DOMAIN)) fail(`The email must end with ${DOMAIN}.`);
const name = (process.env.ADMIN_NAME || (await ask("Full name: "))).trim().slice(0, 120);

// 2. password: your own (12+ characters, typed twice) or a generated one
let password = process.env.ADMIN_PASSWORD || "";
let generated = false;
if (!password) {
	while (!password) {
		const first = await askHidden("Password (12+ characters, leave empty to generate a strong one): ");
		if (!first) {
			password = randomBytes(15).toString("base64url"); // 20 characters, A-Z a-z 0-9 - _
			generated = true;
		} else if (first.length < 12) console.log("  Use at least 12 characters.");
		else if (first !== (await askHidden("Type the password again: "))) console.log("  The two entries do not match.");
		else password = first;
	}
}
if (password.length < 12) fail("Use at least 12 characters.");
const hash = hashPassword(password);
if (!verifyPassword(password, hash)) fail("Internal self-check failed. Nothing was created.");

// 3. where
const key = process.env.APPWRITE_API_KEY || (await askHidden("Appwrite API key (databases scope, input hidden): "));
if (!key) fail("An Appwrite API key is needed to save the administrator.");
const db = new Databases(new Client().setEndpoint(endpoint).setProject(project).setKey(key));

let existing;
try {
	existing = (await db.listDocuments(DB, "admins", [Query.equal("email", [email]), Query.limit(1)])).documents[0];
} catch (e) {
	fail(
		e.code === 401 || e.code === 403
			? "Appwrite did not accept the API key (it needs the databases scope)."
			: e.code === 404
				? `Database "${DB}" or its "admins" collection was not found. Run scripts/setup-admin-db.mjs first.`
				: "Could not reach the database: " + (e.message || e),
	);
}

// 4. confirm, then write
console.log("\nSummary");
console.log(`  Email     ${email}`);
console.log(`  Name      ${name || "(none)"}`);
console.log(`  Password  ${generated ? "generated (shown after saving)" : "the one you typed"}`);
console.log(`  Database  ${DB} > admins on project ${project}`);
console.log(`  Action    ${existing ? "UPDATE the existing administrator: new password, account set active, lock cleared" : "CREATE a new administrator"}\n`);
if (process.env.ADMIN_YES !== "1" && !/^y(es)?$/i.test(await ask("Save to the database? (y/N): "))) fail("Cancelled. Nothing was written.");

try {
	if (existing) {
		await db.updateDocument(DB, "admins", existing.$id, { passwordHash: hash, ...(name ? { name } : {}), active: true, failedAttempts: 0, lockedUntil: null });
	} else {
		await db.createDocument(DB, "admins", ID.unique(), { email, name, passwordHash: hash, active: true, failedAttempts: 0 });
	}
} catch (e) {
	fail("Could not save: " + (e.message || e));
}
rl.close();

console.log(`\nSaved: ${existing ? "updated" : "created"} administrator ${email}.`);
console.log(generated ? `\nPassword (shown once, save it in your password manager):\n${password}\n` : "\nSign in with the password you typed.\n");
console.log("Sign in at /posv2/admin. The API key was not stored; you can remove it from Appwrite if it was created only for this.");
