// Creates a password hash for an `admins` record. No interactive typing, so no typos:
//   node scripts/hash-admin-password.mjs                      generates a strong random password
//   ADMIN_PASSWORD='my passphrase' node scripts/hash-admin-password.mjs    uses your own (min 12 chars)
// It prints the password (once) and the `passwordHash` line, after checking the hash verifies.
// Nothing is stored or sent anywhere.

import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";

const { hashPassword, verifyPassword } = createRequire(import.meta.url)("../netlify/lib/admin-auth.js");

const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD || randomBytes(15).toString("base64url"); // 20 characters, A-Z a-z 0-9 - _
if (password.length < 12) {
	console.error("Use at least 12 characters.");
	process.exit(1);
}
const hash = hashPassword(password);
if (!verifyPassword(password, hash)) {
	console.error("Internal self-check failed. Nothing was created.");
	process.exit(1);
}
console.log(generated ? `\nPassword (shown once, save it in your password manager):\n${password}\n` : "\nUsing the password you supplied.\n");
console.log(`passwordHash (${hash.length} characters, one line, no spaces; paste the whole line into the record):\n${hash}\n`);
