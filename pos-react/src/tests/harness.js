/**
 * Test harness: builds the real POS services on a real in-memory WatermelonDB with a fake UI and session, and
 * exposes helpers (productForm, line, openShift, addProduct) so service tests read like real workflows.
 */
import { vi } from "vitest";
import { createDatabase } from "../db/database";
import { PosStore } from "../db/PosStore";
import { createRepositories } from "../db/repositories";
import { resolveFeatures } from "../config/features";
import { freshAccountDb } from "../services/sync/account";
import { payloadToSnapshot } from "../services/sync/payload";
import { makeCtx } from "../services/pos/common";
import { bindServices } from "../services/pos";

let n = 0;

/**
 * Real services on a real (in-memory LokiJS) WatermelonDB.
 * `h.svc.*` refreshes the snapshot before and after every call, so `h.data()` is always current.
 */
export async function createHarness({ role = "owner", features = {}, settings = {}, confirm = true, prompt = "reason" } = {}) {
	const store = new PosStore(createDatabase("test-" + ++n + "-" + Math.random()));
	const payload = freshAccountDb({ name: "Owner", posBusinessName: "Test Cafe" }, { uid: "uid1", email: "owner@test.lk" });
	payload.settings = { ...payload.settings, ...settings };
	await store.replaceAll(payloadToSnapshot(payload));
	let cache = await store.readSnapshot();
	const messages = { alerts: [], notices: [] };
	const answers = { confirm, prompt };
	const ui = {
		notice: (m) => void messages.notices.push(m),
		alert: async (m) => void messages.alerts.push(m),
		confirm: async () => answers.confirm,
		prompt: async () => answers.prompt,
	};
	const session = {
		userId: "u-owner",
		user: { id: "u-owner", name: "Owner", role },
		locationId: "loc-main",
		sessionId: "sess1",
		deviceId: "dev1",
		businessId: "uid1",
	};
	const flags = resolveFeatures(features).enabled;
	const ctx = makeCtx({ store, getData: () => cache, getSession: () => session, getFeatures: () => flags, ui, repos: createRepositories(store) });
	const refresh = async () => (cache = await store.readSnapshot());
	const raw = bindServices(ctx);
	const svc = Object.fromEntries(
		Object.entries(raw).map(([group, fns]) => [
			group,
			Object.fromEntries(
				Object.entries(fns).map(([name, fn]) => [
					name,
					async (...args) => {
						await refresh();
						const out = await fn(...args);
						await refresh();
						return out;
					},
				]),
			),
		]),
	);
	return { store, svc, ctx, session, messages, answers, flags, data: () => cache, refresh, lastAlert: () => messages.alerts.at(-1) };
}

export const productForm = (o = {}) => ({ name: "Milk Tea", category: "Drinks", subcategory: "", cost: "100", price: "250", type: "Service", code: "", image: "", ...o });
export const line = (p, qty = 1) => ({ id: p.id, productId: p.id, name: p.name, qty, price: p.price, cost: p.cost, modifiers: [] });
export const noDiscount = { type: "percent", value: 0 };

/** Clock in + open register (needed before accepting cash). */
export async function openShift(h, amount = 1000) {
	return h.svc.staff.clockInAndOpenRegister(amount);
}
export async function addProduct(h, o) {
	return h.svc.catalog.saveProduct(productForm(o));
}
export { vi };
