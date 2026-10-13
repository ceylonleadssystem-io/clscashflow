/**
 * GM data layer. Documents (users/{workspace}/gm/{name}) hold rows merged by id + updatedAt, saved through the same
 * appwrite-docs function the POS uses, with the same sign-in session. "Local" mode keeps the same documents in this browser only.
 *   settings; res-YYYY-MM (reservations), wl-YYYY-MM (waitlist), ho-YYYY-MM (handovers): one document per month;
 *   gu-0..gu-f (guests): 16 buckets chosen from the guest id. Each save or sync only touches one small document.
 */
import { DEFAULT_SETTINGS, addDays, dateStr, mergeRows, monthOf } from "./logic.mjs";

const FN = "/.netlify/functions/appwrite-docs";
const POLL_MS = 6000;
const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 12) : String(Math.random()).slice(2, 14));
export const newId = (p) => p + "-" + uid();

const mem = {}; // document name -> rows
const stamps = {};
const dirty = new Set();
const listeners = new Set();
const saving = new Map();
let timer = 0;

export const store = {
	mode: "", // "cloud" | "local"
	ws: "",
	user: null,
	status: "ok", // ok | saving | offline
	months: new Set(),
	onChange: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
};
const emit = () => listeners.forEach((fn) => fn());
const setStatus = (s) => ((store.status = s), emit());

let token = { v: "", at: 0 };
async function jwt() {
	if (!token.v || Date.now() - token.at > 600000) token = { v: await store.user.getIdToken(), at: Date.now() };
	return token.v;
}
export async function call(action, path, id, extra = {}) {
	const res = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await jwt()) }, body: JSON.stringify({ action, path, id, ...extra }) });
	const j = await res.json().catch(() => ({}));
	if (!res.ok || j.ok === false) throw new Error(j.error || "Could not reach the server.");
	return j;
}
const base = () => `users/${store.ws}/gm`;

async function loadDoc(name) {
	if (store.mode === "local") {
		try {
			return JSON.parse(localStorage.getItem("gm.local." + name)) || [];
		} catch {
			return [];
		}
	}
	const j = await call("get", base(), name);
	stamps[name] = j.stamp || "";
	return j.doc?.data?.rows || [];
}

async function flush(name) {
	if (saving.has(name)) return saving.get(name);
	const p = (async () => {
		dirty.delete(name);
		if (store.mode === "local") {
			localStorage.setItem("gm.local." + name, JSON.stringify(mem[name]));
			return;
		}
		// ponytail: read-merge-write is not atomic; two devices saving the same document in the same instant can drop one change. Per-row documents if that happens.
		mem[name] = mergeRows(await loadDoc(name), mem[name]);
		const j = await call("set", base(), name, { data: { rows: mem[name] } });
		stamps[name] = j.stamp || "";
	})();
	saving.set(name, p);
	try {
		await p;
	} finally {
		saving.delete(name);
	}
}

async function saveDirty() {
	if (!dirty.size) return;
	setStatus("saving");
	try {
		for (const n of [...dirty]) await flush(n);
		setStatus("ok");
	} catch (e) {
		console.warn("GM save failed", e);
		setStatus("offline");
	}
}

async function poll() {
	try {
		if (dirty.size) await saveDirty();
		if (store.mode === "cloud") {
			const { stamps: now } = await call("stamps", base());
			let changed = false;
			for (const name of Object.keys(mem))
				if (!dirty.has(name) && now[name] && now[name] !== stamps[name]) {
					mem[name] = await loadDoc(name);
					changed = true;
				}
			if (changed) emit();
		}
		if (store.status === "offline" && !dirty.size) setStatus("ok");
	} catch {
		setStatus("offline");
	}
}

export async function ensureMonths(months) {
	const need = months.filter((m) => !store.months.has(m));
	if (!need.length) return;
	await Promise.all(need.map(async (m) => ((mem["res-" + m] = mergeRows(await loadDoc("res-" + m), mem["res-" + m])), store.months.add(m))));
	emit();
}
export const monthsAround = (date = dateStr(), back = 1, fwd = 2) => {
	const out = [];
	for (let i = -back; i <= fwd; i++) out.push(monthOf(addDays(date.slice(0, 7) + "-15", i * 30)));
	return [...new Set(out)];
};

const BUCKETS = [..."0123456789abcdef"];
const bucketOf = (id) => ([...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 16).toString(16);

/** Moves guests, waitlist and handovers from the first layout (one document each) into the split documents, once. */
async function migrate() {
	if (settings().split === 2) return;
	const legacy = [["guests", "guest"], ["waitlist", "waitlist"], ["handovers", "handover"]];
	const old = [];
	for (const [name, kind] of legacy) {
		const rows = await loadDoc(name);
		if (!rows.length) continue;
		old.push(name);
		for (const r of rows) {
			const to = docFor(kind, r);
			mem[to] = mergeRows(mem[to], [r]);
			dirty.add(to);
		}
	}
	await saveDirty();
	if (store.status === "offline") return; // the old documents stay untouched; the move is retried on the next load
	for (const name of old) {
		if (store.mode === "local") localStorage.removeItem("gm.local." + name);
		else await call("set", base(), name, { data: { rows: [] } });
	}
	put("settings", { ...settings(), split: 2 });
}

async function boot() {
	const m = monthOf(dateStr()), back = (n) => monthOf(addDays(dateStr(), -n));
	const names = ["settings", ...BUCKETS.map((b) => "gu-" + b), "wl-" + m, "wl-" + back(30), "ho-" + m, "ho-" + back(30), "ho-" + back(60)];
	await Promise.all(names.map(async (n) => (mem[n] = await loadDoc(n))));
	await ensureMonths(monthsAround());
	await migrate();
	clearInterval(timer);
	timer = setInterval(poll, POLL_MS);
	window.addEventListener("storage", async (e) => {
		if (store.mode === "local" && e.key?.startsWith("gm.local.")) {
			const n = e.key.slice(9);
			mem[n] = await loadDoc(n);
			emit();
		}
	});
	emit();
}

export async function startCloud(user) {
	store.user = user;
	store.mode = "cloud";
	const profile = await call("get", "users", user.uid).catch(() => ({}));
	store.ws = String(profile.doc?.data?.ownerUid || user.uid);
	await boot();
}
export async function startLocal() {
	store.mode = "local";
	store.ws = "local";
	await boot();
}

// ---------------------------------------------------------------- reads / writes
const rowsOf = (prefix) => Object.keys(mem).filter((n) => n.startsWith(prefix)).flatMap((n) => mem[n]);
export const guests = () => rowsOf("gu-").filter((g) => !g.deleted);
export const waitlist = () => rowsOf("wl-");
export const handovers = () => rowsOf("ho-").sort((a, b) => (b.at || "").localeCompare(a.at || ""));
export const settings = () => {
	const s = (mem.settings || [])[0] || {};
	return { ...DEFAULT_SETTINGS, ...s, templates: { ...DEFAULT_SETTINGS.templates, ...(s.templates || {}) } };
};
/** Every loaded reservation; a row that moved to another month keeps only its newest copy. */
export const reservations = () => {
	const by = new Map();
	for (const n of Object.keys(mem))
		if (n.startsWith("res-"))
			for (const r of mem[n]) {
				const o = by.get(r.id);
				if (!o || (r.updatedAt || "") >= (o.updatedAt || "")) by.set(r.id, r);
			}
	return [...by.values()];
};

const docFor = (kind, row) =>
	({ reservation: () => "res-" + monthOf(row.date), waitlist: () => "wl-" + monthOf(row.addedAt || dateStr()), handover: () => "ho-" + monthOf(row.at || dateStr()), guest: () => "gu-" + bucketOf(row.id), settings: () => "settings" })[kind]();
/** Inserts or replaces a row (matched by id) and saves it. kind: reservation | guest | waitlist | handover | settings */
export function put(kind, row) {
	const name = docFor(kind, row);
	const next = { ...row, updatedAt: new Date().toISOString() };
	mem[name] = [...(mem[name] || []).filter((r) => r.id !== next.id), next];
	dirty.add(name);
	emit();
	clearTimeout(put.t);
	put.t = setTimeout(saveDirty, 400);
	return next;
}
