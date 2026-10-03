/**
 * Translates between WatermelonDB raw rows and the plain camelCase objects the POS uses, sorts rows in
 * legacy order, builds canonical strings for change detection, and maps sale lines to and from rows.
 */
import { decode, encode } from "./defineTable";

/**
 * Translate between WatermelonDB raw rows and the plain camelCase objects the
 * POS domain code works with (the same shape the legacy payload used).
 */

/** Raw row -> plain object. `seq` is internal and never exposed. */
export function rawToPlain(spec, raw) {
	let out = {};
	if (raw.extra) {
		try {
			out = JSON.parse(raw.extra) || {};
		} catch {
			out = {};
		}
	}
	out.id = raw.id;
	for (const c of spec.columns) {
		if (c.key === "seq") continue;
		const v = decode(c.type, raw[c.column]);
		if (v !== undefined) out[c.key] = v;
		else delete out[c.key];
	}
	return out;
}

/** Plain object -> raw column values (known columns set to null when absent). */
export function plainToRaw(spec, plain) {
	const raw = {};
	const extra = {};
	for (const [key, value] of Object.entries(plain)) {
		if (key === "id" || key === "seq") continue;
		if (!(key in spec.fields)) {
			if (value !== undefined) extra[key] = value;
		}
	}
	for (const c of spec.columns) {
		if (c.key === "seq") continue;
		raw[c.column] = encode(c.type, plain[c.key]);
	}
	raw.extra = Object.keys(extra).length ? JSON.stringify(extra) : null;
	return raw;
}

export function seqOf(raw) {
	return Number(raw.seq) || 0;
}

/** Sorted exactly like the legacy arrays (unshift = newest first). */
export function sortBySeq(spec, rows) {
	const sorted = rows.slice().sort((a, b) => a.seq - b.seq);
	if (spec.order === "newest") sorted.reverse();
	return sorted.map((r) => r.plain);
}

/**
 * Legacy `syncComparable`, made key-order independent: a canonical JSON string
 * without bookkeeping keys, used to detect real changes.
 */
export function comparable(value) {
	return canonical(value, true);
}

/** Canonical string INCLUDING `updatedAt` (used to skip identical rows). */
export function exactly(value) {
	return canonical(value, false);
}

function canonical(value, ignoreBookkeeping) {
	if (value === undefined || typeof value === "function") return undefined;
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value))
		return "[" + value.map((v) => canonical(v, ignoreBookkeeping) ?? "null").join(",") + "]";
	const keys = Object.keys(value)
		.filter(
			(k) =>
				value[k] !== undefined &&
				!(ignoreBookkeeping && (k === "updatedAt" || k === "syncMeta")),
		)
		.sort();
	return (
		"{" +
		keys.map((k) => JSON.stringify(k) + ":" + canonical(value[k], ignoreBookkeeping)).join(",") +
		"}"
	);
}

// ---- sale lines ------------------------------------------------------------

export const lineRowId = (saleId, index) => `${saleId}:${index}`;

export function lineToRowPlain(saleId, line, index) {
	const { id, ...rest } = line || {};
	return { ...rest, id: lineRowId(saleId, index), saleId, lineIndex: index, lineId: id };
}

export function rowPlainToLine(row) {
	const { id, saleId, lineIndex, lineId, ...rest } = row; // eslint-disable-line no-unused-vars
	return lineId === undefined ? rest : { id: lineId, ...rest };
}
