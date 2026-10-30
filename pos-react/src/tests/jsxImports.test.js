import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// A component used in JSX but never imported or defined builds fine and only fails when the page opens ("X is not defined"). This reads every
// .jsx file and requires each capitalised tag to be imported, declared, or destructured in that file.
const root = new URL("..", import.meta.url).pathname;
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? (f === "tests" || f === "node_modules" ? [] : walk(join(dir, f))) : f.endsWith(".jsx") ? [join(dir, f)] : []));

describe("JSX components are all defined", () => {
	it("every capitalised tag is imported or declared in its file", () => {
		const bad = [];
		for (const file of walk(root)) {
			const src = readFileSync(file, "utf8");
			for (const tag of new Set([...src.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>.]/g)].map((m) => m[1]))) {
				const defined = new RegExp(`(\\bimport\\b[^;]*\\b${tag}\\b[^;]*from)|(\\bfunction\\s+${tag}\\b)|(\\b(?:const|let|var|class)\\s+${tag}\\b)|(\\{[^}]*\\b${tag}\\b[^}]*\\}\\s*(=|\\)\\s*=>))`, "s");
				if (!defined.test(src)) bad.push(file.slice(root.length) + ": <" + tag + ">");
			}
		}
		expect(bad).toEqual([]);
	});
});
