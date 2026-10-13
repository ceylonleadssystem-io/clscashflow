/**
 * Guest Manager (GM) UI, served at /GM: bookings, calendar, floor plan, waitlist, guests, messages, reports, shift handover, settings.
 * Plain DOM + template strings; every view is a function that returns HTML, re-rendered when the data changes.
 */
import {
	ACTIVE, SOURCES, seatingMap, STATUSES, addDays, billTotals, billsFor, buildReport, csv, dateStr, endMin, fill, fromMin, guestStats, isFree, nowMin, phoneKey,
	samePhone, serviceAt, slotsFor, suggestTables, toMin, waPhone, waitMinutes, conflicts, monthOf,
} from "./logic.mjs";
import * as S from "./store.mjs";
import { gmAllowed, openCheck, pushCustomers, pushSeating, readPos, tablesFor, toPosCustomer } from "./pos.mjs";

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const prettyDate = (d) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const VIEWS = [["bookings", "Bookings"], ["calendar", "Calendar"], ["floor", "Floor"], ["waitlist", "Waitlist"], ["guests", "Guests"], ["messages", "Messages"], ["reports", "Reports"], ["handover", "Handover"], ["settings", "Settings"]];
const REASONS = ["Guest cancelled", "Change of plans", "Weather", "Duplicate booking", "Venue closed", "Other"];
const OCCASIONS = ["", "Birthday", "Anniversary", "Business", "Date night", "Celebration"];

const ui = { view: "bookings", date: dateStr(), floorTime: fromMin(nowMin()), q: "", from: addDays(dateStr(), -29), to: dateStr(), tab: "all", gq: "" };
let pos = { found: false, business: "", locations: [], settings: {}, customers: [], openOrders: [], sales: [], users: [] };
let posStamp = "";
let allowed = null; // null = the POS switches have not been read yet

// ---------------------------------------------------------------- data helpers
const cfg = () => S.settings();
const tables = () => tablesFor(pos, cfg());
const tableById = () => Object.fromEntries(tables().map((t) => [t.id, t]));
const nums = () => Object.fromEntries(tables().map((t) => [t.id, t.number]));
const business = () => pos.business || cfg().business || "our restaurant";
const guestOf = (r) => S.guests().find((g) => g.id === r.guestId);
const resOn = (date) => S.reservations().filter((r) => r.date === date).sort((a, b) => a.time.localeCompare(b.time));
const tableNames = (r) => (r.tableIds || []).map((id) => tableById()[id]?.number).filter(Boolean).map((n) => "T" + n).join(" + ") || "No table";
const billsOf = (r) => billsFor(r, pos.sales, guestOf(r), nums());
const revenueOf = (r) => billTotals(billsOf(r)).paid;

const spendCache = new Map(); // cleared on every render: bill matching walks all sales
function guestSpend(g) {
	if (spendCache.has(g.id)) return spendCache.get(g.id);
	const seen = new Map();
	for (const r of S.reservations().filter((x) => x.guestId === g.id)) for (const b of billsOf(r)) seen.set(b.receipt || b.createdAt, b);
	if (g.posCustomerId) for (const s of pos.sales) if (s.customerId === g.posCustomerId) seen.set(s.receipt || s.createdAt, s);
	const paid = billTotals([...seen.values()]).paid;
	spendCache.set(g.id, paid);
	return paid;
}
const statsOf = (g) => guestStats(g, S.reservations(), cfg(), guestSpend(g));

function toast(msg) {
	const t = $("#toast");
	t.textContent = msg;
	t.classList.add("on");
	clearTimeout(toast.t);
	toast.t = setTimeout(() => t.classList.remove("on"), 3000);
}

async function refreshPos(force) {
	if (S.store.mode !== "cloud") return;
	try {
		const { stamp } = await S.call("stamp", `users/${S.store.ws}/pos`, "main");
		if (!force && stamp === posStamp && pos.found) return;
		posStamp = stamp;
		const now = dateStr();
		pos = await readPos(S.store.ws, [monthOf(now), monthOf(addDays(now, -30)), ...(ui.view === "reports" ? S.monthsAround(ui.from, 0, 2) : [])]);
		allowed = gmAllowed(pos, cfg().locationId);
		// with "sync with the POS" switched off GM still reads the POS for its feature switch, but uses none of its data
		if (!cfg().posSync) pos = { ...pos, found: false, customers: [], openOrders: [], sales: [] };
		render();
	} catch (e) {
		console.warn("POS read failed", e);
	}
}

// ---------------------------------------------------------------- guests <-> POS
/** Finds the guest for a name/phone/email (by phone first), creating one when there is enough to identify them. */
function ensureGuest({ name, phone, email, guestId }) {
	const all = S.guests();
	let g = all.find((x) => x.id === guestId) || (phone && all.find((x) => samePhone(x.phone, phone)));
	if (g) return g;
	if (!name && !phone) return null;
	const pc = phone && pos.customers.find((c) => samePhone(c.phone, phone));
	return S.put("guest", { id: S.newId("g"), name, phone: phone || "", email: email || pc?.email || "", birthday: pc?.birthday || "", allergies: "", preferences: "", notes: "", tags: "", consent: {}, posCustomerId: pc?.id || "", posDirty: !pc, createdAt: new Date().toISOString() });
}

/** Pushes guests that changed (or whose loyalty tier changed) to the POS as customers. */
async function syncGuests() {
	if (S.store.mode !== "cloud" || !cfg().posSync || !pos.found) return 0;
	const out = [], updated = [];
	for (const g of S.guests()) {
		const tier = statsOf(g).tier;
		if (!g.phone || !(g.posDirty || !g.posCustomerId || g.posTier !== tier)) continue;
		const existing = pos.customers.find((c) => c.id === g.posCustomerId) || pos.customers.find((c) => samePhone(c.phone, g.phone));
		const row = toPosCustomer({ ...g, posCustomerId: existing?.id || g.posCustomerId }, existing, tier);
		out.push(row);
		updated.push({ ...g, posCustomerId: row.id, posDirty: false, posTier: tier });
	}
	if (!out.length) return 0;
	await pushCustomers(S.store.ws, out);
	updated.forEach((g) => S.put("guest", g));
	await refreshPos(true);
	return out.length;
}
let lastSeating = null; // JSON of the seating last written to (or read from) the POS
let seatTimer = 0;
/** Keeps the POS floor plan in step with GM: whenever the seated guests change, the new picture is written to the POS. */
function queueSeating() {
	clearTimeout(seatTimer);
	seatTimer = setTimeout(async () => {
		if (S.store.mode !== "cloud" || allowed !== true || !cfg().posSync || !pos.found) return;
		const map = seatingMap(S.reservations(), S.guests(), cfg(), guestSpend);
		const json = JSON.stringify(map);
		if (lastSeating === null) lastSeating = JSON.stringify(pos.settings.gmSeating || {});
		if (json === lastSeating) return;
		try {
			await pushSeating(S.store.ws, map);
			lastSeating = json;
			syncSoon(); // the seated guest's loyalty details go to the POS customer too
		} catch (e) {
			console.warn("Could not update the POS floor plan", e); // retried on the next change and every 30 seconds
		}
	}, 800);
}
const syncSoon = () => syncGuests().catch((e) => console.warn("Guest sync failed", e));

function importPosCustomers() {
	let n = 0;
	for (const c of pos.customers) {
		if (!c.phone || S.guests().some((g) => g.posCustomerId === c.id || samePhone(g.phone, c.phone))) continue;
		S.put("guest", { id: S.newId("g"), name: c.name, phone: c.phone, email: c.email || "", birthday: c.birthday || "", allergies: "", preferences: "", notes: "", tags: "", consent: {}, posCustomerId: c.id, createdAt: new Date().toISOString() });
		n++;
	}
	return n;
}

// ---------------------------------------------------------------- messages
function vars(r) {
	const t = r.tableIds?.length ? tableNames(r) : "";
	return { name: (r.name || "").split(" ")[0] || "there", party: r.party, date: prettyDate(r.date), time: r.time, business: business(), table: t };
}
function canSend(kind, g, channel) {
	if (kind !== "followup") return true; // service messages (confirm, reminder, change, cancel, waitlist) need no marketing consent
	return !!(g?.consent?.marketing && g.consent[channel]);
}
/** Opens WhatsApp or the mail app with the message and records it on the booking / waitlist entry. */
function sendMsg(kind, item, channel, isWait) {
	const g = item.guestId ? S.guests().find((x) => x.id === item.guestId) : null;
	const phone = item.phone || g?.phone, email = item.email || g?.email;
	if (!canSend(kind, g, channel)) return toast("This guest has not agreed to marketing messages on " + (channel === "whatsapp" ? "WhatsApp" : "email") + ".");
	if (channel === "whatsapp" ? !phone : !email) return toast("No " + (channel === "whatsapp" ? "phone number" : "email") + " on this booking.");
	const text = fill(cfg().templates[kind], vars(item));
	const url = channel === "whatsapp" ? `https://wa.me/${waPhone(phone, cfg().countryCode)}?text=${encodeURIComponent(text)}` : `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(business())}&body=${encodeURIComponent(text)}`;
	window.open(url, "_blank", "noopener");
	S.put(isWait ? "waitlist" : "reservation", { ...item, comms: [...(item.comms || []), { at: new Date().toISOString(), kind, channel }] });
}

// ---------------------------------------------------------------- dialogs
const dlg = () => $("#dlg");
function dialog(title, body, { submit = "Save", onSubmit, wide = false, extra = "" } = {}) {
	const d = dlg();
	d.className = wide ? "wide" : "";
	d.innerHTML = `<form method="dialog"><header><h2>${esc(title)}</h2><button type="button" class="sm" data-act="close" aria-label="Close">✕</button></header><div class="body">${body}<div class="err" id="derr" role="alert"></div></div><footer>${extra}<button type="button" data-act="close">${onSubmit ? "Cancel" : "Close"}</button>${onSubmit ? `<button type="submit" class="pri">${esc(submit)}</button>` : ""}</footer></form>`;
	const form = $("form", d);
	form.querySelectorAll("button:not([type])").forEach((b) => (b.type = "button"));
	form.onsubmit = async (e) => {
		e.preventDefault();
		if (!onSubmit) return;
		const err = await onSubmit(new FormData(form), form);
		if (err) $("#derr").textContent = err;
		else d.close();
	};
	if (!d.open) d.showModal();
	return form;
}

/** Table chips that follow the date/time/party/duration fields of a form; auto-picks the best fit until staff tick tables themselves. */
function bindTables(form, chosen, exclude = "") {
	const box = $("#tbl", form);
	let auto = !chosen.size;
	const q = () => ({ date: form.date.value, time: form.time.value, party: +form.party.value || 1, duration: +form.duration.value || 90, exclude, buffer: cfg().buffer });
	const paint = () => {
		const p = q(), all = S.reservations();
		if (auto) {
			chosen.clear();
			suggestTables(tables(), all, p).forEach((id) => chosen.add(id));
		}
		if (!tables().length) return void (box.innerHTML = `<p class="mute">No tables yet. Add tables in the POS Tables screen, or under Settings → Own tables.</p>`);
		box.innerHTML = `<div class="chips">${tables().map((t) => {
			const c = conflicts(t.id, p.date, p.time, p.duration, all, { exclude, buffer: p.buffer });
			return `<label class="${c.length ? "busy" : ""}"><input type="checkbox" name="tbl" value="${esc(t.id)}" ${chosen.has(t.id) ? "checked" : ""}> T${esc(t.number)} · ${t.seats} seats${c.length ? ` · taken ${esc(c[0].time)}` : ""}</label>`;
		}).join("")}</div>`;
		const seats = [...chosen].reduce((a, id) => a + (tableById()[id]?.seats || 0), 0);
		if (chosen.size && seats < p.party) box.insertAdjacentHTML("beforeend", `<p class="err">Selected tables seat ${seats}, party is ${p.party}.</p>`);
		if (auto && !chosen.size) box.insertAdjacentHTML("beforeend", `<p class="err">No free table fits this party then. Pick another time or tables.</p>`);
	};
	form.addEventListener("input", (e) => {
		if (e.target.name === "tbl") {
			auto = false;
			e.target.checked ? chosen.add(e.target.value) : chosen.delete(e.target.value);
			paint();
		} else if (["date", "time", "party", "duration"].includes(e.target.name)) paint();
	});
	paint();
}

const opt = (list, cur) => list.map((v) => `<option ${v === cur ? "selected" : ""}>${esc(v)}</option>`).join("");
const guestList = () => `<datalist id="gl">${S.guests().map((g) => `<option value="${esc(g.name)}">${esc(g.phone)}</option>`).join("")}${pos.customers.filter((c) => !S.guests().some((g) => g.posCustomerId === c.id)).map((c) => `<option value="${esc(c.name)}">${esc(c.phone)} (POS)</option>`).join("")}</datalist><datalist id="sl">${pos.users.map((u) => `<option value="${esc(u.name)}">`).join("")}</datalist>`;

/** Fills phone/email when a known guest or POS customer is picked. */
function bindGuestFill(form) {
	const fillFrom = (g) => {
		if (!g) return;
		if (!form.name.value) form.name.value = g.name;
		if (!form.phone.value) form.phone.value = g.phone || "";
		if (form.email && !form.email.value) form.email.value = g.email || "";
		const info = $("#ginfo", form);
		if (info && g.id) {
			const st = statsOf(g);
			info.innerHTML = [g.allergies && `<span class="pill bad">Allergies: ${esc(g.allergies)}</span>`, st.risky && `<span class="pill warn">${st.noShows} no-shows</span>`, `<span class="pill info">${st.tier} · ${st.visits} visits</span>`].filter(Boolean).join(" ");
		}
	};
	form.name.addEventListener("change", () => fillFrom(S.guests().find((g) => g.name === form.name.value) || pos.customers.find((c) => c.name === form.name.value)));
	form.phone.addEventListener("change", () => fillFrom(S.guests().find((g) => samePhone(g.phone, form.phone.value)) || pos.customers.find((c) => samePhone(c.phone, form.phone.value))));
}

function bookingDialog(r, preset = {}) {
	const c = cfg(), edit = !!r;
	const v = { name: "", phone: "", email: "", party: 2, date: ui.date, time: "19:00", duration: 0, source: "Phone", occasion: "", notes: "", host: "", ...preset, ...(r || {}) };
	const svc = serviceAt(c.services, v.time) || { name: "", duration: 90 };
	v.duration = v.duration || svc.duration;
	const chosen = new Set(r?.tableIds || preset.tableIds || []);
	const form = dialog(edit ? "Edit booking" : "New booking", `${guestList()}
		<div class="grid2"><label>Guest name<input name="name" list="gl" required value="${esc(v.name)}" autocomplete="off"></label><label>Phone / WhatsApp<input name="phone" type="tel" value="${esc(v.phone)}"></label></div>
		<div id="ginfo" class="chips"></div>
		<div class="grid2"><label>Email<input name="email" type="email" value="${esc(v.email)}"></label><label>Guests<input name="party" type="number" min="1" max="60" required value="${v.party}"></label></div>
		<div class="grid2"><label>Date<input name="date" type="date" required value="${v.date}"></label><label>Time<input name="time" type="time" step="900" required value="${v.time}"></label></div>
		<div class="grid2"><label>Service<select name="service">${c.services.map((s) => `<option value="${esc(s.name)}" data-d="${s.duration}" ${s.name === (v.service || svc.name) ? "selected" : ""}>${esc(s.name)}</option>`).join("")}<option value="">Other</option></select></label><label>Stay (minutes)<input name="duration" type="number" min="15" step="15" value="${v.duration}"></label></div>
		<div id="slots"></div>
		<div><label>Tables</label><div id="tbl"></div></div>
		<div class="grid2"><label>Source<select name="source">${opt(SOURCES, v.source)}</select></label><label>Occasion<select name="occasion">${opt(OCCASIONS, v.occasion)}</select></label></div>
		<label>Assigned to (host / server)<input name="host" list="sl" value="${esc(v.host)}"></label>
		<label>Notes (seating wishes, allergies for this visit)<textarea name="notes">${esc(v.notes)}</textarea></label>
		${edit ? "" : `<label class="chk"><input type="checkbox" name="wa" checked> Open the WhatsApp confirmation after saving</label>`}`,
		{
			wide: true,
			submit: edit ? "Save changes" : "Book table",
			onSubmit: async (fd) => {
				const name = fd.get("name").trim(), party = +fd.get("party"), date = fd.get("date"), time = fd.get("time"), duration = +fd.get("duration") || 90;
				if (!name || !party || !date || !time) return "Enter the guest name, party size, date and time.";
				const ids = fd.getAll("tbl"), others = S.reservations();
				const clash = ids.map((id) => conflicts(id, date, time, duration, others, { exclude: r?.id, buffer: c.buffer })[0]).filter(Boolean);
				if (clash.length && !confirm(`Table clash with ${clash[0].name} at ${clash[0].time}. Book anyway?`)) return "Pick a free table or time.";
				const seats = ids.reduce((a, id) => a + (tableById()[id]?.seats || 0), 0);
				if (ids.length && seats < party && !confirm(`Those tables seat ${seats}, the party is ${party}. Book anyway?`)) return "Pick bigger tables.";
				await S.ensureMonths([monthOf(date)]);
				const g = ensureGuest({ name, phone: fd.get("phone").trim(), email: fd.get("email").trim(), guestId: r?.guestId });
				const row = S.put("reservation", {
					...(r || { id: S.newId("r"), status: "booked", createdAt: new Date().toISOString(), comms: [] }),
					guestId: g?.id || "", name, phone: fd.get("phone").trim(), email: fd.get("email").trim(), party, date, time, duration, service: fd.get("service"),
					tableIds: ids, source: fd.get("source"), occasion: fd.get("occasion"), host: fd.get("host").trim(), notes: fd.get("notes").trim(),
				});
				ui.date = date;
				toast(edit ? "Booking updated." : "Table booked.");
				if (!edit && fd.get("wa") && row.phone) sendMsg("confirm", row, "whatsapp");
				if (g?.posDirty) syncSoon();
			},
		});
	bindGuestFill(form);
	bindTables(form, chosen, r?.id);
	const showSlots = () => {
		const s = c.services.find((x) => x.name === form.service.value);
		if (!s) return void ($("#slots", form).innerHTML = "");
		const list = slotsFor(s, tables(), S.reservations(), { date: form.date.value, party: +form.party.value || 1, buffer: c.buffer, step: c.slotStep });
		$("#slots", form).innerHTML = `<label>Available ${esc(s.name)} times</label><div class="chips">${list.length ? list.map((x) => `<button type="button" class="sm" data-slot="${x.time}">${x.time}</button>`).join("") : '<span class="mute">Fully booked for this party size.</span>'}</div>`;
	};
	form.addEventListener("input", (e) => {
		if (e.target.name === "service") form.duration.value = e.target.selectedOptions[0].dataset.d || form.duration.value;
		if (["date", "party", "service", "duration"].includes(e.target.name)) showSlots();
	});
	form.addEventListener("click", (e) => {
		const s = e.target.dataset?.slot;
		if (s) {
			form.time.value = s;
			form.time.dispatchEvent(new Event("input", { bubbles: true }));
		}
	});
	showSlots();
}

function walkInDialog() {
	const chosen = new Set(), c = cfg(), now = fromMin(nowMin());
	const form = dialog("Walk-in", `${guestList()}
		<div class="grid2"><label>Name (optional)<input name="name" list="gl" autocomplete="off"></label><label>Phone (optional)<input name="phone" type="tel"></label></div>
		<div id="ginfo" class="chips"></div>
		<label>Guests<input name="party" type="number" min="1" max="60" required value="2"></label>
		<input type="hidden" name="date" value="${dateStr()}"><input type="hidden" name="time" value="${now}"><input type="hidden" name="duration" value="${(serviceAt(c.services, now) || {}).duration || 90}">
		<div><label>Seat at</label><div id="tbl"></div></div>`,
		{
			submit: "Seat now",
			onSubmit: (fd) => {
				const ids = fd.getAll("tbl"), party = +fd.get("party");
				if (!party) return "Enter the number of guests.";
				if (!ids.length) return "No table selected. Add them to the waitlist instead.";
				const g = ensureGuest({ name: fd.get("name").trim(), phone: fd.get("phone").trim() });
				const t = new Date().toISOString();
				S.put("reservation", { id: S.newId("r"), guestId: g?.id || "", name: fd.get("name").trim() || "Walk-in", phone: fd.get("phone").trim(), email: "", party, date: dateStr(), time: fd.get("time"), duration: +fd.get("duration"), service: "", tableIds: ids, source: "Walk-in", walkIn: true, status: "seated", arrivedAt: t, seatedAt: t, createdAt: t, comms: [], notes: "", occasion: "", host: "" });
				ui.date = dateStr();
				toast("Walk-in seated.");
			},
			extra: `<button type="button" data-act="wait-new">Add to waitlist instead</button>`,
		});
	bindGuestFill(form);
	bindTables(form, chosen);
}

function seatDialog(r) {
	const chosen = new Set(), now = dateStr() === r.date ? fromMin(nowMin()) : r.time;
	const form = dialog("Seat " + r.name, `<p>${r.party} guests · ${esc(r.time)}</p><input type="hidden" name="date" value="${r.date}"><input type="hidden" name="time" value="${now}"><input type="hidden" name="duration" value="${r.duration}"><input type="hidden" name="party" value="${r.party}"><div id="tbl"></div>`, {
		submit: "Seat",
		onSubmit: (fd) => {
			const ids = fd.getAll("tbl");
			if (!ids.length) return "Pick a table.";
			S.put("reservation", { ...r, tableIds: ids, status: "seated", arrivedAt: r.arrivedAt || new Date().toISOString(), seatedAt: new Date().toISOString() });
		},
	});
	bindTables(form, chosen, r.id);
}

function cancelDialog(r, status = "cancelled") {
	dialog("Cancel booking", `<p>${esc(r.name)} · ${esc(prettyDate(r.date))} ${esc(r.time)}</p><label>Reason<select name="reason">${opt(REASONS, "")}</select></label><label class="chk"><input type="checkbox" name="msg" checked> Open the WhatsApp cancellation message</label>`, {
		submit: "Cancel booking",
		onSubmit: (fd) => {
			const row = S.put("reservation", { ...r, status, cancelReason: fd.get("reason"), cancelledAt: new Date().toISOString() });
			if (fd.get("msg") && r.phone) sendMsg("cancel", row, "whatsapp");
		},
	});
}

function setStatus(r, status) {
	if (status === "seated" && !(r.tableIds || []).length) return seatDialog(r);
	if (status === "cancelled") return cancelDialog(r);
	if (status === "seated" && (r.tableIds || []).some((id) => conflicts(id, r.date, fromMin(nowMin()), 1, S.reservations(), { exclude: r.id }).some((o) => o.status === "seated")) && !confirm("A party is still seated at that table. Seat anyway?")) return;
	const at = new Date().toISOString(), stamp = { arrived: { arrivedAt: at }, seated: { seatedAt: at, arrivedAt: r.arrivedAt || at }, completed: { completedAt: at }, no_show: { noShowAt: at } }[status] || {};
	S.put("reservation", { ...r, status, ...stamp });
	if (status === "completed" || status === "no_show") setTimeout(syncSoon, 800);
}

function guestDialog(g) {
	const edit = !!g.id;
	const st = edit ? statsOf(g) : null;
	const hist = edit ? S.reservations().filter((r) => r.guestId === g.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
	dialog(edit ? g.name : "New guest", `
		<div class="grid2"><label>Name<input name="name" required value="${esc(g.name)}"></label><label>Phone / WhatsApp<input name="phone" type="tel" required value="${esc(g.phone)}"></label></div>
		<div class="grid2"><label>Email<input name="email" type="email" value="${esc(g.email)}"></label><label>Birthday<input name="birthday" type="date" value="${esc(g.birthday)}"></label></div>
		<label>Allergies / dietary<input name="allergies" value="${esc(g.allergies)}"></label>
		<label>Preferences (favourite table, drinks…)<input name="preferences" value="${esc(g.preferences)}"></label>
		<label>Notes<textarea name="notes">${esc(g.notes)}</textarea></label>
		<label>Tags (comma separated)<input name="tags" value="${esc(g.tags)}"></label>
		<fieldset class="card"><legend>Marketing consent</legend>
			<label class="chk"><input type="checkbox" name="c_marketing" ${g.consent?.marketing ? "checked" : ""}> Agrees to receive offers and follow-ups</label>
			<label class="chk"><input type="checkbox" name="c_whatsapp" ${g.consent?.whatsapp ? "checked" : ""}> on WhatsApp</label>
			<label class="chk"><input type="checkbox" name="c_email" ${g.consent?.email ? "checked" : ""}> by email</label>
			<small class="mute">Booking confirmations and reminders are service messages and do not need this. ${g.consent?.at ? "Recorded " + esc(g.consent.at.slice(0, 10)) + "." : ""}</small></fieldset>
		${edit ? `<div class="chips"><span class="pill info">${st.tier}</span><span class="pill">${st.visits} visits</span><span class="pill">${st.points} points</span><span class="pill ${st.noShows ? "warn" : ""}">${st.noShows} no-shows</span><span class="pill">${st.cancels} cancellations</span>${pos.found ? `<span class="pill">Spend ${money(st.spend)}</span>` : ""}<span class="pill ${g.posCustomerId ? "ok" : ""}">${g.posCustomerId ? "Linked to POS customer" : "Not in POS"}</span></div>
		<h3>Visit history</h3>${hist.length ? `<table class="tbl"><tbody>${hist.map((r) => `<tr><td>${esc(r.date)} ${esc(r.time)}</td><td>${r.party} guests · ${esc(tableNames(r))}</td><td>${esc(STATUSES[r.status])}</td><td>${money(revenueOf(r))}</td></tr>`).join("")}</tbody></table>` : '<p class="mute">No visits yet.</p>'}` : ""}`,
		{
			wide: true,
			extra: edit ? `<button type="button" class="bad" data-act="guest-del" data-id="${g.id}">Delete</button><button type="button" data-act="new-booking-for" data-id="${g.id}">Book a table</button>` : "",
			onSubmit: (fd) => {
				const phone = fd.get("phone").trim();
				if (phoneKey(phone).length < 7) return "Enter a valid phone number.";
				const dup = S.guests().find((x) => x.id !== g.id && samePhone(x.phone, phone));
				if (dup) return "Another guest already uses this phone number: " + dup.name;
				const consent = { marketing: !!fd.get("c_marketing"), whatsapp: !!fd.get("c_whatsapp"), email: !!fd.get("c_email"), at: g.consent?.at };
				if (JSON.stringify([consent.marketing, consent.whatsapp, consent.email]) !== JSON.stringify([g.consent?.marketing, g.consent?.whatsapp, g.consent?.email])) consent.at = new Date().toISOString();
				S.put("guest", { ...g, id: g.id || S.newId("g"), createdAt: g.createdAt || new Date().toISOString(), name: fd.get("name").trim(), phone, email: fd.get("email").trim(), birthday: fd.get("birthday"), allergies: fd.get("allergies").trim(), preferences: fd.get("preferences").trim(), notes: fd.get("notes").trim(), tags: fd.get("tags").trim(), consent, posDirty: true });
				toast("Guest saved.");
				syncSoon();
			},
		});
}

function detailDialog(r) {
	const g = guestOf(r), bills = billsOf(r), tot = billTotals(bills), st = g && statsOf(g);
	const open = (r.tableIds || []).map((id) => tableById()[id]).filter(Boolean).map((t) => openCheck(pos, t)).filter(Boolean);
	const btn = (act, label, cls = "") => `<button class="sm ${cls}" data-act="${act}" data-id="${r.id}">${label}</button>`;
	dialog(`${r.name} · ${r.party} guests`, `
		<div class="chips"><span class="pill info">${esc(STATUSES[r.status])}</span><span class="pill">${esc(prettyDate(r.date))} ${esc(r.time)}–${fromMin(endMin(r))}</span><span class="pill">${esc(tableNames(r))}</span><span class="pill">${esc(r.source || "")}</span>${r.occasion ? `<span class="pill">${esc(r.occasion)}</span>` : ""}${r.host ? `<span class="pill">Host: ${esc(r.host)}</span>` : ""}</div>
		<div class="chips">${r.phone ? `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>` : ""} ${r.email ? esc(r.email) : ""}</div>
		${g ? `<div class="chips">${g.allergies ? `<span class="pill bad">Allergies: ${esc(g.allergies)}</span>` : ""}${g.preferences ? `<span class="pill">${esc(g.preferences)}</span>` : ""}<span class="pill info">${st.tier} · ${st.visits} visits · ${st.points} pts</span>${st.risky ? `<span class="pill warn">${st.noShows} no-shows</span>` : ""}</div>` : ""}
		${r.notes ? `<p>${esc(r.notes)}</p>` : ""}${r.cancelReason ? `<p class="mute">Cancelled: ${esc(r.cancelReason)}</p>` : ""}
		<h3>POS bills ${pos.found ? "" : '<small class="mute">(POS not connected)</small>'}</h3>
		${open.length ? `<p class="pill warn">Open check on the POS</p>` : ""}
		${bills.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Receipt</th><th>Payment</th><th>Discount</th><th>Refunded</th><th>Total</th></tr></thead><tbody>${bills.map((b) => `<tr><td>${esc(b.receipt || b.orderNumber)}</td><td>${esc(b.payment)}</td><td>${money(b.discount?.amount)}</td><td>${money((b.refunds || []).reduce((a, x) => a + (+x.amount || 0), 0))}</td><td>${money(b.total)}${b.status === "voided" ? " (void)" : ""}</td></tr>`).join("")}</tbody><tfoot><tr><th colspan="2">${tot.count} bills</th><th>${money(tot.discount)}</th><th>${money(tot.refunded)}</th><th>${money(tot.paid)}</th></tr></tfoot></table></div>` : '<p class="mute">No bills yet. Bills rung up on this table after seating appear here.</p>'}
		<h3>Messages</h3>${(r.comms || []).length ? `<ul>${r.comms.map((c) => `<li>${esc(c.kind)} · ${esc(c.channel)} · ${esc(c.at.slice(0, 16).replace("T", " "))}</li>`).join("")}</ul>` : '<p class="mute">None sent.</p>'}
		<div class="chips">${["confirm", "reminder", "change", "followup"].map((k) => btn("msg-wa:" + k, k[0].toUpperCase() + k.slice(1) + " (WhatsApp)")).join("")}${btn("msg-em:confirm", "Confirm (email)")}</div>`,
		{ wide: true, extra: `${ACTIVE.includes(r.status) ? btn("edit", "Edit") : ""}${g ? btn("guest", "Guest profile") : ""}` });
}

function waitDialog() {
	dialog("Add to waitlist", `<label>Name<input name="name" required></label><label>Phone / WhatsApp<input name="phone" type="tel"></label><label>Guests<input name="party" type="number" min="1" value="2" required></label>`, {
		submit: "Add",
		onSubmit: (fd) => {
			const party = +fd.get("party"), mins = waitMinutes(tables(), S.reservations(), { date: dateStr(), party, now: nowMin(), buffer: cfg().buffer });
			S.put("waitlist", { id: S.newId("w"), name: fd.get("name").trim(), phone: fd.get("phone").trim(), party, status: "waiting", addedAt: new Date().toISOString(), quote: mins, comms: [] });
			toast(mins == null ? "No table is big enough: tell the guest." : `Quoted wait ${mins ? mins + " min" : "none (table free)"}.`);
		},
	});
}

// ---------------------------------------------------------------- views
const pillFor = (s) => ({ booked: "info", confirmed: "info", arrived: "warn", seated: "bad", completed: "ok", cancelled: "", no_show: "bad" })[s] || "";

function resRow(r) {
	const g = guestOf(r), st = g && statsOf(g), a = (act, label, cls = "") => `<button class="sm ${cls}" data-act="${act}" data-id="${r.id}">${label}</button>`;
	const flow = { booked: a("st:confirmed", "Confirm") + a("st:arrived", "Arrived", "pri"), confirmed: a("st:arrived", "Arrived", "pri"), arrived: a("st:seated", "Seat", "pri"), seated: a("st:completed", "Complete", "pri") }[r.status] || "";
	const late = ["booked", "confirmed"].includes(r.status) && r.date === dateStr() && nowMin() > toMin(r.time) + 15;
	return `<div class="row"><div class="t">${esc(r.time)}</div><div class="who"><b>${esc(r.name)} · ${r.party}</b><small>${esc(tableNames(r))} · ${esc(r.source || "")}${r.occasion ? " · " + esc(r.occasion) : ""}${r.host ? " · " + esc(r.host) : ""}</small>
		<span class="pill ${pillFor(r.status)}">${esc(STATUSES[r.status])}</span> ${late ? '<span class="pill warn">Late</span>' : ""}${g?.allergies ? ` <span class="pill bad">Allergy</span>` : ""}${st?.risky ? ` <span class="pill warn">${st.noShows} no-shows</span>` : ""}${st && st.tier !== "Bronze" ? ` <span class="pill info">${st.tier}</span>` : ""}</div>
		<div class="acts">${flow}${["booked", "confirmed"].includes(r.status) ? a("st:no_show", "No-show", "bad") : ""}${ACTIVE.includes(r.status) && r.status !== "seated" ? a("st:cancelled", "Cancel", "bad") : ""}${a("detail", "Details")}</div></div>`;
}

function dateBar(extra = "") {
	return `<div class="bar"><button data-act="day:-1" aria-label="Previous day">‹</button><input type="date" id="dsel" value="${ui.date}" aria-label="Date"><button data-act="day:1" aria-label="Next day">›</button><button data-act="day:0">Today</button><span class="grow"></span>${extra}</div>`;
}

function viewBookings() {
	const all = resOn(ui.date), live = all.filter((r) => ACTIVE.includes(r.status)), t = tables();
	const seatedNow = all.filter((r) => r.status === "seated");
	const filt = { all: () => true, due: (r) => ["booked", "confirmed"].includes(r.status), in: (r) => ["arrived", "seated"].includes(r.status), done: (r) => ["completed", "cancelled", "no_show"].includes(r.status) }[ui.tab];
	const rows = all.filter(filt).filter((r) => !ui.q || (r.name + r.phone).toLowerCase().includes(ui.q.toLowerCase()));
	const free = t.filter((x) => isFree(x.id, ui.date, fromMin(nowMin()), 1, S.reservations())).length;
	return `${dateBar(`<button data-act="walkin">+ Walk-in</button><button class="pri" data-act="new">+ New booking</button>`)}
	<div class="cards"><div class="card stat"><b>${live.length + all.filter((r) => r.status === "completed").length}</b><span>Bookings</span></div><div class="card stat"><b>${all.filter((r) => r.status !== "cancelled" && r.status !== "no_show").reduce((a, r) => a + r.party, 0)}</b><span>Covers</span></div><div class="card stat"><b>${all.filter((r) => r.status === "arrived").length}</b><span>Waiting to be seated</span></div><div class="card stat"><b>${seatedNow.length}</b><span>Seated</span></div>${ui.date === dateStr() ? `<div class="card stat"><b>${free}/${t.length}</b><span>Tables free now</span></div>` : ""}<div class="card stat"><b>${all.filter((r) => r.status === "no_show").length}/${all.filter((r) => r.status === "cancelled").length}</b><span>No-shows / cancelled</span></div></div>
	<div class="bar">${[["all", "All"], ["due", "Expected"], ["in", "In house"], ["done", "Finished"]].map(([k, l]) => `<button class="sm ${ui.tab === k ? "pri" : ""}" data-act="tab:${k}">${l}</button>`).join("")}<input class="grow" id="rq" type="search" placeholder="Search name or phone" value="${esc(ui.q)}"></div>
	${rows.length ? rows.map(resRow).join("") : `<p class="empty">No bookings ${ui.tab === "all" ? "for this day" : "here"}.</p>`}`;
}

function viewCalendar() {
	const c = cfg(), t = tables(), start = Math.floor(Math.min(...c.services.map((s) => toMin(s.start)), 660) / 60) * 60, end = Math.ceil(Math.max(...c.services.map((s) => toMin(s.end)), 1380) / 60) * 60, span = end - start, hrs = span / 60;
	const day = resOn(ui.date).filter((r) => !["cancelled", "no_show"].includes(r.status));
	const week = Array.from({ length: 7 }, (_, i) => addDays(ui.date, i - 3));
	return `${dateBar()}<div class="bar">${week.map((d) => `<button class="sm ${d === ui.date ? "pri" : ""}" data-act="goto:${d}">${prettyDate(d)}<br><small>${S.reservations().filter((r) => r.date === d && ACTIVE.includes(r.status)).length} bookings</small></button>`).join("")}</div>
	${t.length ? `<div class="scroll"><div class="tl" style="--h:${hrs}"><div class="hd"><span></span><div>${Array.from({ length: hrs }, (_, i) => `<span>${fromMin(start + i * 60)}</span>`).join("")}</div></div>
	${t.map((x) => `<div class="l"><b>T${esc(x.number)} <small class="mute">${x.seats}</small></b><div class="lane">${day.filter((r) => (r.tableIds || []).includes(x.id)).map((r) => `<button class="blk ${r.status}" style="left:${((toMin(r.time) - start) / span) * 100}%;width:${((+r.duration || 90) / span) * 100}%" data-act="detail" data-id="${r.id}" title="${esc(r.name)}">${esc(r.name)} · ${r.party}</button>`).join("")}</div></div>`).join("")}
	<div class="l"><b>No table</b><div class="lane">${day.filter((r) => !(r.tableIds || []).length).map((r) => `<button class="blk" style="left:${((toMin(r.time) - start) / span) * 100}%;width:${((+r.duration || 90) / span) * 100}%" data-act="detail" data-id="${r.id}">${esc(r.name)} · ${r.party}</button>`).join("")}</div></div></div></div>` : noTables()}`;
}
const noTables = () => `<p class="empty">No tables yet. ${cfg().layoutFrom === "pos" ? "Draw your floor in the POS Tables screen, or switch to own tables in Settings." : "Add tables in Settings → Own tables."}</p>`;

function viewFloor() {
	const t = tables(), all = S.reservations(), at = ui.floorTime, p = (x) => `${x}%`;
	const state = (tb) => {
		const now = conflicts(tb.id, ui.date, at, 1, all);
		const cur = now.find((r) => r.status === "seated") || now.find((r) => r.status === "arrived") || now[0];
		if (cur) return { cls: cur.status === "seated" ? "seated" : cur.status === "arrived" ? "arrived" : "reserved", r: cur };
		const soon = conflicts(tb.id, ui.date, at, 60, all)[0];
		return soon ? { cls: "reserved", r: soon } : { cls: "", r: null };
	};
	const unseated = resOn(ui.date).filter((r) => r.status === "arrived");
	return `${dateBar(`<label>At <input type="time" id="ftime" value="${at}" style="width:auto"></label><button data-act="fnow">Now</button>`)}
	<div class="legend"><span>🟩 Free</span><span>🟦 Reserved</span><span>🟨 Arrived</span><span>🟥 Seated</span><span>POS layout: ${pos.found && cfg().layoutFrom === "pos" ? "synced from the POS" : "GM's own tables"}</span></div>
	${t.length ? `<div class="floor">${t.map((tb) => { const s = state(tb), oc = openCheck(pos, tb); return `<button class="tb ${tb.shape} ${s.cls}" style="left:${p((tb.x / 900) * 100)};top:${p((tb.y / 560) * 100)};width:${p((tb.w / 900) * 100)};height:${p((tb.h / 560) * 100)}" data-act="table" data-id="${esc(tb.id)}" aria-label="Table ${esc(tb.number)}"><b>${esc(tb.number)}</b><small>${tb.seats} seats</small>${s.r ? `<span>${esc(s.r.name.slice(0, 12))}</span>` : ""}${oc ? '<span class="chk">check open</span>' : ""}</button>`; }).join("")}</div>` : noTables()}
	${unseated.length ? `<h3 style="margin-top:14px">Arrived, waiting for a table</h3>${unseated.map(resRow).join("")}` : ""}`;
}

function tableDialog(tb) {
	const day = resOn(ui.date).filter((r) => (r.tableIds || []).includes(tb.id) && !["cancelled", "no_show"].includes(r.status));
	dialog(`Table ${tb.number} · ${tb.seats} seats`, day.length ? day.map(resRow).join("") : '<p class="mute">Nothing booked on this table today.</p>', { wide: true, extra: `<button data-act="walkin">Walk-in</button><button class="pri" data-act="new-at" data-id="${esc(tb.id)}">Book this table</button>` });
}

function viewWaitlist() {
	const list = S.waitlist().filter((w) => w.status === "waiting" || w.status === "notified").sort((a, b) => a.addedAt.localeCompare(b.addedAt));
	return `<div class="bar"><h2 class="grow">Waitlist (${list.length})</h2><button class="pri" data-act="wait-new">+ Add party</button></div>${list.length ? list.map((w) => {
		const mins = waitMinutes(tables(), S.reservations(), { date: dateStr(), party: w.party, now: nowMin(), buffer: cfg().buffer });
		const waited = Math.round((Date.now() - Date.parse(w.addedAt)) / 60000), a = (act, l, cls = "") => `<button class="sm ${cls}" data-act="${act}" data-id="${w.id}">${l}</button>`;
		return `<div class="row"><div class="t">${w.party}</div><div class="who"><b>${esc(w.name)}</b><small>Waiting ${waited} min · quoted ${w.quote == null ? "no table fits" : w.quote + " min"} · now ~${mins == null ? "?" : mins + " min"} ${w.status === "notified" ? "· notified" : ""}</small></div><div class="acts">${a("w-seat", "Seat", "pri")}${w.phone ? a("w-notify", "Table ready (WhatsApp)") : ""}${a("w-left", "Left", "bad")}</div></div>`;
	}).join("") : '<p class="empty">Nobody waiting.</p>'}`;
}

function viewGuests() {
	return `<div class="bar"><input class="grow" id="gq" type="search" placeholder="Search guests by name, phone, tag or allergy" value="${esc(ui.gq)}"><button data-act="pos-sync">Sync with POS</button><button class="pri" data-act="guest-new">+ New guest</button></div><div id="glist">${guestRows()}</div>`;
}
function guestRows() {
	const q = ui.gq.toLowerCase(), list = S.guests().filter((g) => !q || [g.name, g.phone, g.email, g.tags, g.allergies].join(" ").toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 200);
	if (!list.length) return '<p class="empty">No guests yet. They are created from bookings, or use Sync with POS to import your POS customers.</p>';
	return `<div class="scroll"><table class="tbl"><thead><tr><th>Guest</th><th>Contact</th><th>Visits</th><th>Tier</th><th>Flags</th></tr></thead><tbody>${list.map((g) => { const s = statsOf(g); return `<tr><td><button class="sm" data-act="guest" data-id="${g.id}">${esc(g.name)}</button></td><td>${esc(g.phone)}<br><small class="mute">${esc(g.email)}</small></td><td>${s.visits}${s.last ? `<br><small class="mute">last ${esc(s.last)}</small>` : ""}</td><td>${s.tier} · ${s.points} pts</td><td>${g.allergies ? '<span class="pill bad">Allergy</span> ' : ""}${s.risky ? `<span class="pill warn">${s.noShows} no-shows</span> ` : ""}${g.consent?.marketing ? '<span class="pill ok">Opted in</span>' : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
}

function viewMessages() {
	const today = dateStr(), tomorrow = addDays(today, 1), all = S.reservations();
	const sent = (r, k) => (r.comms || []).some((c) => c.kind === k);
	const groups = [
		["Confirmations to send", all.filter((r) => r.status === "booked" && r.phone && !sent(r, "confirm") && r.date >= today), "confirm"],
		["Reminders for today and tomorrow", all.filter((r) => ["booked", "confirmed"].includes(r.status) && r.phone && [today, tomorrow].includes(r.date) && !sent(r, "reminder")), "reminder"],
		["Follow-ups (guests who opted in)", all.filter((r) => r.status === "completed" && [today, addDays(today, -1), addDays(today, -2)].includes(r.date) && !sent(r, "followup") && guestOf(r)?.consent?.marketing), "followup"],
	];
	const log = all.flatMap((r) => (r.comms || []).map((c) => ({ ...c, name: r.name }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
	return groups.map(([title, rows, kind]) => `<h2>${title} (${rows.length})</h2>${rows.length ? rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((r) => `<div class="row"><div class="t">${esc(r.time)}</div><div class="who"><b>${esc(r.name)} · ${r.party}</b><small>${esc(prettyDate(r.date))}</small></div><div class="acts"><button class="sm pri" data-act="msg-wa:${kind}" data-id="${r.id}">WhatsApp</button><button class="sm" data-act="msg-em:${kind}" data-id="${r.id}" ${r.email || guestOf(r)?.email ? "" : "disabled"}>Email</button></div></div>`).join("") : '<p class="mute">Nothing due.</p>'}`).join("") +
		`<h2>Recent messages</h2>${log.length ? `<table class="tbl"><tbody>${log.map((l) => `<tr><td>${esc(l.at.slice(0, 16).replace("T", " "))}</td><td>${esc(l.name)}</td><td>${esc(l.kind)}</td><td>${esc(l.channel)}</td></tr>`).join("")}</tbody></table>` : '<p class="mute">None yet.</p>'}<p class="mute">Messages open in WhatsApp or your mail app with the text ready; edit the wording under Settings → Messages. Automatic sending needs a WhatsApp Business API account.</p>`;
}

function viewReports() {
	const all = S.reservations(), list = all.filter((r) => r.date >= ui.from && r.date <= ui.to), revenue = {};
	list.forEach((r) => (revenue[r.id] = revenueOf(r)));
	const rep = buildReport(list, tables(), cfg(), { from: ui.from, to: ui.to, revenue, allReservations: all });
	const max = Math.max(1, ...Object.values(rep.byDay));
	const card = (b, l) => `<div class="card stat"><b>${b}</b><span>${l}</span></div>`;
	return `<div class="bar"><label>From <input type="date" id="rfrom" value="${ui.from}" style="width:auto"></label><label>To <input type="date" id="rto" value="${ui.to}" style="width:auto"></label><span class="grow"></span><button data-act="csv">Download CSV</button></div>
	<div class="cards">${card(rep.total, "Bookings")}${card(rep.covers, "Covers")}${card(rep.completed, "Completed")}${card(rep.walkIns, "Walk-ins")}${card(rep.cancelled + " (" + rep.cancelRate + "%)", "Cancellations")}${card(rep.noShows + " (" + rep.noShowRate + "%)", "No-shows")}${card(rep.repeatGuests + "/" + rep.guestsServed, "Repeat guests")}${card(pos.found ? money(rep.revenue) : "–", "Booking revenue (POS)")}</div>
	<h2>Bookings by day</h2>${Object.keys(rep.byDay).sort().map((d) => `<div class="bar-chart"><span>${esc(d.slice(5))}</span><i style="width:${(rep.byDay[d] / max) * 100}%"></i><b>${rep.byDay[d]}</b></div>`).join("") || '<p class="mute">No bookings in this range.</p>'}
	<h2>Revenue by booking source</h2><div class="scroll"><table class="tbl"><thead><tr><th>Source</th><th>Bookings</th><th>Covers</th><th>Revenue</th></tr></thead><tbody>${Object.entries(rep.bySource).map(([s, v]) => `<tr><td>${esc(s)}</td><td>${v.bookings}</td><td>${v.covers}</td><td>${pos.found ? money(v.revenue) : "–"}</td></tr>`).join("")}</tbody></table></div>
	<h2>Table utilisation</h2><div class="scroll"><table class="tbl"><thead><tr><th>Table</th><th>Seats</th><th>Booked hours</th><th>Occupancy</th></tr></thead><tbody>${rep.util.map((u) => `<tr><td>${esc(u.table)}</td><td>${u.seats}</td><td>${(u.minutes / 60).toFixed(1)}</td><td>${u.pct}%</td></tr>`).join("")}</tbody></table></div>
	<h2>Cancellation reasons</h2>${Object.entries(rep.reasons).map(([k, v]) => `<div class="bar-chart"><span>${esc(k)}</span><i style="width:${(v / rep.cancelled) * 100}%"></i><b>${v}</b></div>`).join("") || '<p class="mute">None.</p>'}`;
}

function viewHandover() {
	const snap = handoverSnapshot();
	return `<div class="card"><h2>End-of-shift handover</h2><p class="mute">${snap.join(" · ")}</p><form id="hform" class="grid2"><label>Shift<select name="shift">${opt(["Morning", "Lunch", "Dinner", "Closing"], "")}</select></label><label>Handed over by<input name="by" list="sl" required>${guestList()}</label><label style="grid-column:1/-1">Notes for the next shift<textarea name="notes" placeholder="VIP arriving, table 4 wobbles, kitchen out of fish…"></textarea></label><button class="pri">Save handover</button></form></div>
	<h2>Previous handovers</h2>${S.handovers().slice(0, 15).map((h) => `<div class="card" style="margin-bottom:8px"><b>${esc(h.shift)} · ${esc(h.by)}</b> <small class="mute">${esc(h.at.slice(0, 16).replace("T", " "))}</small><p>${esc(h.notes)}</p><small class="mute">${esc((h.snapshot || []).join(" · "))}</small></div>`).join("") || '<p class="mute">None yet.</p>'}`;
}
function handoverSnapshot() {
	const t = resOn(dateStr());
	return [`${t.filter((r) => ["booked", "confirmed"].includes(r.status)).length} still expected`, `${t.filter((r) => r.status === "arrived").length} waiting to be seated`, `${t.filter((r) => r.status === "seated").length} seated`, `${S.waitlist().filter((w) => w.status === "waiting").length} on the waitlist`, `${t.filter((r) => r.status === "no_show").length} no-shows`, `${pos.openOrders.filter((o) => o.status === "open").length} open POS checks`];
}

function viewSettings() {
	const c = cfg(), t = c.templates, can = S.store.mode === "cloud";
	return `<form id="sform" class="grid2">
	<div class="card" style="grid-column:1/-1"><h2>POS connection</h2><p>${can ? (pos.found ? `<span class="pill ok">Connected</span> ${pos.customers.length} customers · ${tablesFor(pos, { ...c, layoutFrom: "pos" }).length} tables in the POS layout` : '<span class="pill warn">No POS data found for this account</span>') : '<span class="pill warn">Local mode: this device only, no POS link. Sign in to connect.</span>'}</p>
	<label class="chk"><input type="checkbox" name="posSync" ${c.posSync ? "checked" : ""} ${can ? "" : "disabled"}> Sync guests, bills and the open checks with the POS</label>
	<div class="grid2"><label>Table layout from<select name="layoutFrom"><option value="pos" ${c.layoutFrom === "pos" ? "selected" : ""}>The POS floor plan</option><option value="own" ${c.layoutFrom === "own" ? "selected" : ""}>GM's own tables</option></select></label>
	<label>POS location<select name="locationId"><option value="">Default</option>${pos.locations.map((l) => `<option value="${esc(l.id)}" ${c.locationId === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label></div></div>
	<label style="grid-column:1/-1">Services (one per line: name, start, end, minutes per booking)<textarea name="services" rows="3">${c.services.map((s) => [s.name, s.start, s.end, s.duration].join(", ")).join("\n")}</textarea></label>
	<label>Slot step (minutes)<input name="slotStep" type="number" min="5" step="5" value="${c.slotStep}"></label><label>Turnaround between parties (minutes)<input name="buffer" type="number" min="0" step="5" value="${c.buffer}"></label>
	<label>Flag guests after this many no-shows<input name="noShowLimit" type="number" min="1" value="${c.noShowLimit}"></label><label>Phone country code (for WhatsApp)<input name="countryCode" value="${esc(c.countryCode)}"></label>
	<label>Spend per loyalty point<input name="spendPerPoint" type="number" min="1" value="${c.spendPerPoint}"></label><label>Silver after visits / Gold after visits<span class="chips" style="margin-top:3px"><input name="silverVisits" type="number" min="1" value="${c.silverVisits}" style="width:48%"><input name="goldVisits" type="number" min="1" value="${c.goldVisits}" style="width:48%"></span></label>
	<label style="grid-column:1/-1">Own tables (one per line: number, seats) — used when the layout is not from the POS<textarea name="ownTables" rows="4">${c.ownTables.map((x) => x.number + ", " + x.seats).join("\n")}</textarea></label>
	${Object.keys(t).map((k) => `<label style="grid-column:1/-1">Message: ${k}<textarea name="t_${k}" rows="2">${esc(t[k])}</textarea></label>`).join("")}
	<p class="mute" style="grid-column:1/-1">Placeholders: {name} {party} {date} {time} {table} {business}</p><div class="err" id="serr" style="grid-column:1/-1"></div><button class="pri">Save settings</button></form>`;
}

function saveSettings(form) {
	const fd = new FormData(form), err = (m) => (($("#serr").textContent = m), false);
	const services = fd.get("services").split("\n").map((l) => l.split(",").map((x) => x.trim())).filter((p) => p[0]).map(([name, start, end, d]) => ({ name, start, end, duration: +d || 90 }));
	if (!services.length || services.some((s) => !/^\d{1,2}:\d{2}$/.test(s.start) || !/^\d{1,2}:\d{2}$/.test(s.end))) return err("Services need a name, a start and an end time like 18:00.");
	const old = cfg(), own = fd.get("ownTables").split("\n").map((l) => l.split(",").map((x) => x.trim())).filter((p) => p[0]);
	const ownTables = own.map(([number, seats]) => ({ id: old.ownTables.find((t) => t.number === number)?.id || "gt-" + number, number, seats: +seats || 2 }));
	S.put("settings", { ...old, id: "settings", services, ownTables, posSync: !!fd.get("posSync") && S.store.mode === "cloud", layoutFrom: fd.get("layoutFrom"), locationId: fd.get("locationId"), slotStep: +fd.get("slotStep") || 30, buffer: +fd.get("buffer") || 0, noShowLimit: +fd.get("noShowLimit") || 3, countryCode: fd.get("countryCode").replace(/\D/g, "") || "94", spendPerPoint: +fd.get("spendPerPoint") || 100, silverVisits: +fd.get("silverVisits") || 5, goldVisits: +fd.get("goldVisits") || 15, templates: Object.fromEntries(Object.keys(old.templates).map((k) => [k, fd.get("t_" + k)])) });
	toast("Settings saved.");
	refreshPos(true);
	return false;
}

// ---------------------------------------------------------------- shell + events
function signInView() {
	return `<form id="signin" class="card signin"><h1>Guest Manager</h1><p class="mute">POS business sign in. Use the same email and password as the POS; if this browser is already signed in to the POS you will not see this page.</p><label>Business email<input name="email" type="email" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><div class="err" id="serr" role="alert"></div><button class="pri">Sign in</button><button type="button" data-act="forgot">Forgot password?</button><button type="button" data-act="local">Use on this device only (no sync)</button></form>`;
}

function lockedView() {
	return `<div class="card signin"><h1>Guest Manager</h1>${allowed === false ? "<p>Guest Manager is not switched on for this account. Ask Ceylonry to enable it (admin portal → Features), or check that your plan includes it.</p>" : '<p class="err">Could not check this account\'s features. Check the connection and try again.</p>'}<button class="pri" data-act="recheck">Check again</button><a href="/posv2/">Back to the POS</a></div>`;
}

function render() {
	cancelAnimationFrame(render.f);
	render.f = requestAnimationFrame(() => {
		spendCache.clear();
		const root = $("#app");
		if (!S.store.mode) return;
		const focus = document.activeElement?.id, caret = document.activeElement?.selectionStart;
		if (S.store.mode === "cloud" && allowed !== true) return void (root.innerHTML = lockedView());
		const body = { bookings: viewBookings, calendar: viewCalendar, floor: viewFloor, waitlist: viewWaitlist, guests: viewGuests, messages: viewMessages, reports: viewReports, handover: viewHandover, settings: viewSettings }[ui.view]();
		const st = S.store.status;
		root.innerHTML = `<header class="top"><div><h1>Guest Manager <small class="sub">${esc(business())}</small></h1></div><div class="chips"><span class="pill ${S.store.mode === "cloud" ? "ok" : "warn"}">${S.store.mode === "cloud" ? "Synced" : "This device only"}</span><span class="pill ${pos.found ? "ok" : ""}">POS ${pos.found ? "linked" : "not linked"}</span>${st !== "ok" ? `<span class="pill ${st === "offline" ? "bad" : "info"}">${st === "offline" ? "Offline: will retry" : "Saving…"}</span>` : ""}${S.store.mode === "cloud" ? `<a href="/posv2/">POS</a>` : ""}</div></header>
		<nav aria-label="Sections">${VIEWS.map(([k, l]) => `<button data-act="view:${k}" ${ui.view === k ? 'aria-current="page"' : ""}>${l}</button>`).join("")}</nav><main>${body}</main>`;
		if (focus) {
			const el = document.getElementById(focus);
			if (el) {
				el.focus();
				try { el.setSelectionRange(caret, caret); } catch { /* not a text field */ }
			}
		}
	});
}

const go = (patch) => (Object.assign(ui, patch), S.ensureMonths([monthOf(ui.date), monthOf(addDays(ui.date, 3)), monthOf(addDays(ui.date, -3))]), render());
const byId = (id) => S.reservations().find((r) => r.id === id);

const ACTIONS = {
	close: () => dlg().close(),
	view: (v) => go({ view: v }),
	day: (n) => go({ date: +n ? addDays(ui.date, +n) : dateStr() }),
	goto: (d) => go({ date: d }),
	tab: (k) => go({ tab: k }),
	new: () => bookingDialog(),
	"new-at": (_, id) => bookingDialog(null, { tableIds: [id] }),
	walkin: () => walkInDialog(),
	st: (s, id) => setStatus(byId(id), s),
	detail: (_, id) => detailDialog(byId(id)),
	edit: (_, id) => bookingDialog(byId(id)),
	guest: (_, id) => guestDialog(S.guests().find((g) => g.id === id) || S.guests().find((g) => g.id === byId(id)?.guestId)),
	"guest-new": () => guestDialog({ name: "", phone: "", email: "", birthday: "", allergies: "", preferences: "", notes: "", tags: "", consent: {} }),
	"guest-del": (_, id) => confirm("Delete this guest? Their bookings stay.") && (S.put("guest", { ...S.guests().find((g) => g.id === id), deleted: true }), dlg().close()),
	"new-booking-for": (_, id) => { const g = S.guests().find((x) => x.id === id); dlg().close(); bookingDialog(null, { name: g.name, phone: g.phone, email: g.email }); },
	table: (_, id) => tableDialog(tableById()[id]),
	fnow: () => go({ floorTime: fromMin(nowMin()), date: dateStr() }),
	"wait-new": () => waitDialog(),
	"w-seat": (_, id) => {
		const w = S.waitlist().find((x) => x.id === id);
		const g = ensureGuest({ name: w.name, phone: w.phone });
		const t = new Date().toISOString(), r = S.put("reservation", { id: S.newId("r"), guestId: g?.id || "", name: w.name, phone: w.phone, email: "", party: w.party, date: dateStr(), time: fromMin(nowMin()), duration: 90, service: "", tableIds: [], source: "Walk-in", walkIn: true, status: "arrived", arrivedAt: t, createdAt: t, comms: [], notes: "", occasion: "", host: "" });
		S.put("waitlist", { ...w, status: "seated" });
		ui.date = dateStr();
		seatDialog(r);
	},
	"w-notify": (_, id) => { const w = S.waitlist().find((x) => x.id === id); sendMsg("waitlist", w, "whatsapp", true); S.put("waitlist", { ...S.waitlist().find((x) => x.id === id), status: "notified" }); },
	"w-left": (_, id) => S.put("waitlist", { ...S.waitlist().find((x) => x.id === id), status: "left" }),
	"msg-wa": (k, id) => sendMsg(k, byId(id), "whatsapp"),
	"msg-em": (k, id) => sendMsg(k, byId(id), "email"),
	"pos-sync": async () => {
		await refreshPos(true);
		if (!pos.found) return toast("No POS data to sync with. Check Settings.");
		const imported = importPosCustomers(), pushed = await syncGuests().catch((e) => (toast("Sync failed: " + e.message), 0));
		toast(`Synced: ${imported} imported from the POS, ${pushed} sent to the POS.`);
	},
	csv: () => {
		const list = S.reservations().filter((r) => r.date >= ui.from && r.date <= ui.to).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
		const blob = new Blob([csv([["Date", "Time", "Name", "Phone", "Guests", "Table", "Source", "Status", "Cancel reason", "POS revenue"], ...list.map((r) => [r.date, r.time, r.name, r.phone, r.party, tableNames(r), r.source, STATUSES[r.status], r.cancelReason || "", revenueOf(r)])])], { type: "text/csv" });
		const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `gm-bookings-${ui.from}-${ui.to}.csv` });
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 2000);
	},
	recheck: () => refreshPos(true),
	forgot: async () => {
		const email = $("#signin")?.email.value.trim();
		if (!email) return void ($("#serr").textContent = "Enter your business email first.");
		try {
			await window.clsBackend.auth().sendPasswordResetEmail(email);
			$("#serr").textContent = "If that account exists, a reset link is on its way.";
		} catch (e) {
			$("#serr").textContent = e.message;
		}
	},
	local: async () => { await S.startLocal(); render(); },
};

document.addEventListener("click", (e) => {
	const b = e.target.closest("[data-act]");
	if (!b) return;
	const [name, arg] = b.dataset.act.split(":");
	const fn = ACTIONS[name];
	if (!fn) return;
	// anything launched from inside a dialog replaces it (messages leave it open)
	if (b.closest("dialog") && name !== "close" && !name.startsWith("msg")) dlg().close();
	Promise.resolve(fn(arg, b.dataset.id, e)).catch((err) => toast(err.message));
});
document.addEventListener("input", (e) => {
	if (e.target.id === "rq") go({ q: e.target.value });
	if (e.target.id === "gq") (ui.gq = e.target.value, ($("#glist").innerHTML = guestRows()));
});
document.addEventListener("change", (e) => {
	const m = { dsel: ["date"], ftime: ["floorTime"], rfrom: ["from"], rto: ["to"] }[e.target.id];
	if (!m || !e.target.value) return;
	if (e.target.id === "rfrom" || e.target.id === "rto") S.ensureMonths(S.monthsAround(e.target.id === "rfrom" ? e.target.value : ui.from, 0, 2)).then(() => (S.store.mode === "cloud" ? refreshPos(true) : 0));
	go({ [m[0]]: e.target.value });
});
document.addEventListener("submit", async (e) => {
	const f = e.target;
	if (f.id === "sform") (e.preventDefault(), saveSettings(f));
	if (f.id === "hform") {
		e.preventDefault();
		const fd = new FormData(f);
		S.put("handover", { id: S.newId("h"), at: new Date().toISOString(), shift: fd.get("shift"), by: fd.get("by"), notes: fd.get("notes"), snapshot: handoverSnapshot() });
		toast("Handover saved.");
	}
	if (f.id === "signin") {
		e.preventDefault();
		const fd = new FormData(f);
		try {
			await window.clsBackend.auth().signInWithEmailAndPassword(fd.get("email"), fd.get("password"));
			await start();
		} catch (err) {
			$("#serr").textContent = /invalid|credential/i.test(err.message) ? "Incorrect email or password." : err.message;
		}
	}
});

async function start() {
	const user = window.clsBackend?.auth().currentUser;
	if (!user) return void ($("#app").innerHTML = signInView());
	try {
		await S.startCloud(user);
		await refreshPos(true);
		setInterval(() => (refreshPos(false), queueSeating()), 30000);
		render();
		if (pos.found) syncSoon();
	} catch (err) {
		$("#app").innerHTML = `<div class="card signin"><h1>Guest Manager</h1><p class="err">${esc(err.message)}</p><button data-act="local">Use on this device only</button></div>`;
	}
}

S.store.onChange(render);
S.store.onChange(queueSeating);
(async () => {
	const auth = window.clsBackend?.auth();
	if (!auth) return void ($("#app").innerHTML = signInView());
	await new Promise((res) => auth.onAuthStateChanged(() => res()));
	await start();
})();
