// Prints the `passwordHash` value to paste into an `admins` record.
//   node scripts/hash-admin-password.mjs            (prompts without echo)
// The password never leaves this machine and is not stored anywhere.

import { createRequire } from "node:module";
import readline from "node:readline";

const { hashPassword } = createRequire(import.meta.url)("../netlify/lib/admin-auth.js");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = (s) => rl.output.write(s.includes("Password") ? s : ""); // do not echo what is typed
rl.question("Password (min 12 characters): ", (pw) => {
	rl.close();
	console.log();
	if (pw.length < 12) {
		console.error("Use at least 12 characters.");
		process.exit(1);
	}
	console.log(hashPassword(pw));
});
