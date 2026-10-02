// Checks a password against the passwordHash stored in an `admins` record.
//   ADMIN_HASH='scrypt$...' ADMIN_PASSWORD='the password' node scripts/verify-admin-password.mjs
import { createRequire } from "node:module";

const { verifyPassword } = createRequire(import.meta.url)("../netlify/lib/admin-auth.js");
const hash = String(process.env.ADMIN_HASH || "").trim();
const password = process.env.ADMIN_PASSWORD || "";
console.log(`Hash: ${hash.length} characters, ${hash.split("$").length} parts, starts "${hash.slice(0, 18)}" (expected 130 characters, 6 parts, "scrypt$16384$8$1$").`);
console.log(verifyPassword(password, hash) ? "MATCH" : "NO MATCH: different password, or the hash changed when copying (line break, space, missing end).");
