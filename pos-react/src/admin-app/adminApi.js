import { env } from "../config/env";
import { getAuthService } from "../services/auth.service";
import { localAdminApi } from "./localAdmin";
import { createLogger } from "../utils/logger";

const log = createLogger("admin");

/** Calls the admin Netlify function with the signed-in administrator's Appwrite JWT. */
export async function adminApi(body) {
	if (env.authProvider === "local") return localAdminApi(body);
	const user = getAuthService().currentUser;
	if (!user) throw new Error("Sign in again.");
	const token = await user.getIdToken();
	const res = await fetch(env.adminFunctionUrl + (body ? "" : "?fresh=" + Date.now()), {
		method: body ? "POST" : "GET",
		cache: "no-store",
		headers: { Authorization: "Bearer " + token, ...(body ? { "Content-Type": "application/json" } : {}) },
		body: body ? JSON.stringify(body) : undefined,
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok || !json.ok) {
		const err = new Error(json.error || "Request failed (" + res.status + ").");
		log.error("admin request failed", err, { action: body?.action || "list", accountId: body?.userId, status: res.status });
		throw err;
	}
	// Single choke point for admin actions (account lookup, plan/billing/access changes): log ids only, never payloads.
	if (body) log.info("admin action", { action: body.action, accountId: body.userId });
	return json;
}

/** Sends an invoice through the existing SMTP function. */
export async function emailInvoice({ to, invoice, clientName, businessName }) {
	if (env.authProvider === "local") {
		console.info("[dev] invoice e-mail skipped in local mode", to, invoice.number);
		return true;
	}
	const res = await fetch(env.sendInvoiceUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			to,
			bizName: "Ceylonry Labs",
			bizEmail: "accounts@ceylonrylabs.io",
			clientName: clientName || businessName || "Customer",
			invNum: invoice.number,
			cur: "LKR",
			lines: invoice.lines,
			sub: invoice.amount,
			amount: invoice.amount,
			date: new Date(invoice.createdAtUtc || Date.now()).toLocaleDateString("en-GB"),
			due: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-GB") : "",
			notes: invoice.note || "Ceylonry POS subscription. Thank you for your business.",
			accent: "#ff4d0a",
		}),
	});
	const out = await res.json().catch(() => ({}));
	if (!res.ok || out.ok === false) throw new Error(out.error || "Email failed (" + res.status + ").");
	return true;
}
