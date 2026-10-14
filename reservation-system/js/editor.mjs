/**
 * Table layout editor (floors and tables), shown inside a Guest Manager dialog. It edits a plain state object
 * { floors: [{ id, name }], byFloor: { floorId: [table] }, cur: floorId, sel: tableId } and leaves saving to the caller.
 * Drag a table to move it; the form changes its number, seats, shape, size and whether it is for seating.
 */
import { GRID, MAIN_FLOOR, TABLE_SHAPES, findFreeSpot, nextTableNumber, normalizeTable, overlapsOthers } from "./logic.mjs";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rid = () => Math.random().toString(36).slice(2, 10);
const pct = (v, total) => (v / total) * 100 + "%";

export function mountEditor(root, state) {
	const cur = () => state.byFloor[state.cur] || (state.byFloor[state.cur] = []);
	const allTables = () => Object.values(state.byFloor).flat();
	const sel = () => cur().find((t) => t.id === state.sel);
	let error = "";

	function render() {
		const t = sel();
		root.innerHTML = `
		<div class="chips ed-floors" role="tablist" aria-label="Floors">${state.floors.map((f) => `<button type="button" role="tab" aria-selected="${f.id === state.cur}" class="sm ${f.id === state.cur ? "pri" : ""}" data-ed="floor" data-id="${esc(f.id)}">${esc(f.name)} · ${(state.byFloor[f.id] || []).length}</button>`).join("")}
			<button type="button" class="sm" data-ed="add-floor">+ Floor</button><button type="button" class="sm" data-ed="rename-floor">Rename</button>${state.cur !== MAIN_FLOOR ? '<button type="button" class="sm bad" data-ed="delete-floor">Delete floor</button>' : ""}</div>
		<div class="floor ed-canvas" id="edcanvas">${cur().map((x) => `<div class="tb ${x.shape} ${x.active ? "" : "inactive"} ${x.id === state.sel ? "sel" : ""}" data-t="${esc(x.id)}" style="left:${pct(x.x, GRID.w)};top:${pct(x.y, GRID.h)};width:${pct(x.w, GRID.w)};height:${pct(x.h, GRID.h)}" tabindex="0" role="button" aria-label="Table ${esc(x.number)}"><b>${esc(x.number)}</b><small>${x.active ? x.seats + " seats" : "not for seating"}</small></div>`).join("")}${cur().length ? "" : '<p class="empty">No tables on this floor yet. Add one.</p>'}</div>
		<div class="bar"><button type="button" class="sm pri" data-ed="add">+ Add table</button><span class="mute">Drag a table to move it. Pick one to change it.</span></div>
		${t ? `<div class="card ed-form"><div class="grid2">
			<label>Table number<input data-f="number" maxlength="12" value="${esc(t.number)}"></label>
			<label>Seats<input data-f="seats" type="number" min="1" max="40" value="${t.seats}"></label>
			<label>Shape<select data-f="shape">${TABLE_SHAPES.map((s) => `<option value="${s}" ${s === t.shape ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}</select></label>
			<label>Width<input data-f="w" type="number" min="${GRID.min}" max="${GRID.max}" step="${GRID.step}" value="${t.w}"></label>
			${t.shape === "rect" ? `<label>Height<input data-f="h" type="number" min="${GRID.min}" max="${GRID.max}" step="${GRID.step}" value="${t.h}"></label>` : ""}
			<label class="chk"><input data-f="active" type="checkbox" ${t.active ? "checked" : ""}> Used for seating (untick for a bar or podium)</label></div>
			<button type="button" class="sm bad" data-ed="delete">Delete table</button></div>` : ""}
		<div class="err" role="alert">${esc(error)}</div>`;
	}

	/** Applies a change to the selected table; geometry changes that would overlap another table are refused. */
	function patch(change) {
		const t = sel();
		if (!t) return;
		const next = normalizeTable({ ...t, ...change });
		if (["x", "y", "w", "h", "shape"].some((k) => k in change) && overlapsOthers(cur(), next)) return void (error = "Tables can't overlap. Move it to a free spot.");
		error = "";
		cur().splice(cur().indexOf(t), 1, next);
	}

	root.addEventListener("click", (e) => {
		const b = e.target.closest("[data-ed]"),
			tb = e.target.closest("[data-t]");
		if (tb && !b) {
			state.sel = tb.dataset.t;
			return render();
		}
		if (!b) return;
		const act = b.dataset.ed;
		if (act === "floor") (state.cur = b.dataset.id), (state.sel = ""), (error = "");
		else if (act === "add-floor") {
			const name = (prompt("Name of the new floor (for example Terrace or Upstairs)") || "").trim().slice(0, 40);
			if (!name) return;
			if (state.floors.some((f) => f.name.toLowerCase() === name.toLowerCase())) error = "There is already a floor called " + name + ".";
			else {
				const id = "fl-" + rid();
				state.floors.push({ id, name });
				state.byFloor[id] = [];
				(state.cur = id), (state.sel = ""), (error = "");
			}
		} else if (act === "rename-floor") {
			const f = state.floors.find((x) => x.id === state.cur),
				name = (prompt("New name for this floor", f.name) || "").trim().slice(0, 40);
			if (name && !state.floors.some((x) => x.id !== f.id && x.name.toLowerCase() === name.toLowerCase())) f.name = name;
			else if (name && name !== f.name) error = "There is already a floor called " + name + ".";
		} else if (act === "delete-floor") {
			const f = state.floors.find((x) => x.id === state.cur);
			if (!confirm(`Delete the floor ${f.name} and its ${cur().length} table(s)?`)) return;
			state.floors = state.floors.filter((x) => x.id !== f.id);
			delete state.byFloor[f.id];
			(state.cur = MAIN_FLOOR), (state.sel = ""), (error = "");
		} else if (act === "add") {
			const spot = findFreeSpot(cur(), 100, 100);
			if (!spot) error = "No room for another table. Make a table smaller or remove one first.";
			else {
				const t = normalizeTable({ id: "tbl-" + rid(), number: nextTableNumber(allTables()), seats: 4, shape: "square", w: 100, ...spot });
				cur().push(t);
				(state.sel = t.id), (error = "");
			}
		} else if (act === "delete") {
			const t = sel();
			if (t && confirm("Delete table " + t.number + "?")) (state.byFloor[state.cur] = cur().filter((x) => x !== t)), (state.sel = "");
		}
		render();
	});

	// Enter in a field must not save the whole layout dialog
	root.addEventListener("keydown", (e) => e.key === "Enter" && e.target.tagName === "INPUT" && e.preventDefault());

	root.addEventListener("input", (e) => {
		const f = e.target.dataset.f;
		if (!f) return;
		patch({ [f]: f === "active" ? e.target.checked : f === "number" || f === "shape" ? e.target.value : +e.target.value });
		// the form keeps focus while typing: only the canvas and the error line are refreshed
		const t = sel(), el = root.querySelector(`[data-t="${CSS.escape(state.sel)}"]`);
		if (t && el) {
			el.className = `tb ${t.shape} ${t.active ? "" : "inactive"} sel`;
			el.style.cssText = `left:${pct(t.x, GRID.w)};top:${pct(t.y, GRID.h)};width:${pct(t.w, GRID.w)};height:${pct(t.h, GRID.h)}`;
			el.innerHTML = `<b>${esc(t.number)}</b><small>${t.active ? t.seats + " seats" : "not for seating"}</small>`;
		}
		root.querySelector(".err").textContent = error;
	});
	// shape and size changes can change the form itself (a rectangle has a height): redraw on commit
	root.addEventListener("change", (e) => e.target.dataset.f === "shape" && render());

	// drag to move; snaps to the grid, an overlapping spot is refused
	root.addEventListener("pointerdown", (e) => {
		const tb = e.target.closest("[data-t]");
		if (!tb) return;
		const t = cur().find((x) => x.id === tb.dataset.t),
			canvas = root.querySelector("#edcanvas"),
			scale = GRID.w / canvas.getBoundingClientRect().width,
			from = { x: e.clientX, y: e.clientY, t };
		state.sel = t.id;
		let moved = false;
		const move = (ev) => {
			const next = normalizeTable({ ...from.t, x: from.t.x + (ev.clientX - from.x) * scale, y: from.t.y + (ev.clientY - from.y) * scale });
			if (overlapsOthers(cur(), next)) return;
			moved = true;
			cur().splice(cur().findIndex((x) => x.id === t.id), 1, next);
			tb.style.left = pct(next.x, GRID.w);
			tb.style.top = pct(next.y, GRID.h);
		};
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			render();
			if (moved) error = "";
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	});

	render();
}
