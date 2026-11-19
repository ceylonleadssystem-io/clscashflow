/**
 * Customer actions: validate and save customers, prepare feedback e-mail requests, and WhatsApp
 * birthday/special messages recorded in the communications log.
 */
import { T } from "../../db/tables";
import { isEmail, nowIso, phoneKey, whatsappPhone } from "../../domain/format";
import { newId } from "./common";

/** Customer directory, feedback requests and WhatsApp communications. */

export async function saveCustomer(ctx, form) {
	const d = ctx.data();
	const name = form.name.trim();
	const phone = form.phone.trim();
	const email = form.email.trim();
	if (!name) return void (await ctx.ui.alert("Enter customer name."));
	if (phoneKey(phone).length < 7) return void (await ctx.ui.alert("Enter a valid phone number."));
	if (email && !isEmail(email)) return void (await ctx.ui.alert("Enter a valid email or leave it blank."));
	if (d.customers.some((c) => phoneKey(c.phone) === phoneKey(phone) && c.id !== form.id))
		return void (await ctx.ui.alert("A customer with this phone number already exists."));
	const eligible = !!form.discountEligible;
	const value = Number(form.discountValue) || 0;
	if (eligible && (value <= 0 || (form.discountType === "percent" && value > 100)))
		return void (await ctx.ui.alert("Enter a valid discount value."));
	const existing = d.customers.find((c) => c.id === form.id);
	const customer = {
		...(existing || { id: newId("c"), createdAt: nowIso() }),
		name,
		phone,
		email,
		birthday: form.birthday || "",
		company: form.company.trim(),
		address: form.address.trim(),
		tags: form.tags.trim(),
		notes: form.notes.trim(),
		type: form.type || "regular",
		discountEligible: eligible,
		discountType: form.discountType || "percent",
		discountValue: eligible ? value : 0,
		discountExpiry: eligible ? form.discountExpiry || "" : "",
		discountNote: eligible ? (form.discountNote || "").trim() : "",
	};
	await ctx.store.write((tx) => tx.put(T.customers, customer));
	return customer;
}

/**
 * The customer for a guest Guest Manager (/GM) seated at a table: the existing one (same id, else same phone number), or a new
 * customer added with the id GM uses, so the check can carry them even before GM's own sync has reached this device.
 * Returns null when there is no usable phone number (a customer needs one).
 */
export async function ensureCustomer(ctx, c) {
	const d = ctx.data();
	const key = phoneKey(c.phone);
	const found = d.customers.find((x) => x.id === c.id) || (key.length >= 7 && d.customers.find((x) => phoneKey(x.phone) === key));
	if (found) return found;
	const name = String(c.name || "").trim();
	if (!name || key.length < 7) return null;
	const customer = {
		id: c.id || newId("c"), createdAt: nowIso(), name, phone: String(c.phone).trim(), email: isEmail(c.email || "") ? c.email : "", birthday: "", company: "", address: "",
		tags: "GM", notes: "", type: "regular", discountEligible: false, discountType: "percent", discountValue: 0, discountExpiry: "", discountNote: "",
	};
	await ctx.store.write((tx) => tx.put(T.customers, customer));
	return customer;
}

/**
 * The customer behind an online (Shopify) order, for the CRM: the existing one with the same phone number or e-mail (empty details are filled in
 * and the "Shopify" tag added; nothing they already have is overwritten), else a new one. Shopify may not share a customer's details (it
 * hides them until the store is approved), and a customer needs a name plus a phone number or e-mail: with less, null is returned and the
 * order simply has no customer. `c` is { name, phone, email, address, orderName }.
 */
export async function ensureOnlineCustomer(ctx, c) {
	const d = ctx.data();
	const name = String(c.name || "").trim();
	const phone = String(c.phone || "").trim();
	const email = isEmail(c.email || "") ? String(c.email).trim() : "";
	const key = whatsappPhone(phone); // 0771234567 and +94771234567 are the same number
	const mail = email.toLowerCase();
	const found = d.customers.find((x) => (key.length >= 7 && whatsappPhone(x.phone) === key) || (mail && String(x.email || "").toLowerCase() === mail));
	if (found) {
		const tags = String(found.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
		const next = { ...found, email: found.email || email, phone: found.phone || (key.length >= 7 ? phone : ""), address: found.address || String(c.address || "").trim(), tags: tags.some((t) => t.toLowerCase() === "shopify") ? found.tags : [...tags, "Shopify"].join(", ") };
		if (JSON.stringify(next) !== JSON.stringify(found)) await ctx.store.write((tx) => tx.put(T.customers, { ...next, updatedAt: nowIso() }));
		return next;
	}
	if (!name || (key.length < 7 && !email)) return null;
	const customer = {
		id: newId("c"), createdAt: nowIso(), name, phone: key.length >= 7 ? phone : "", email, birthday: "", company: "", address: String(c.address || "").trim(),
		tags: "Shopify", notes: c.orderName ? "Came from Shopify order " + c.orderName : "Came from Shopify", type: "regular", discountEligible: false, discountType: "percent", discountValue: 0, discountExpiry: "", discountNote: "",
	};
	await ctx.store.write((tx) => tx.put(T.customers, customer));
	return customer;
}

/** Opens the e-mail client with a feedback request and records it. */
export async function requestFeedback(ctx, id) {
	const d = ctx.data();
	const c = d.customers.find((x) => x.id === id);
	if (!c?.email) return void (await ctx.ui.alert("Add an email to this customer first."));
	const business = d.settings.business;
	const subject = encodeURIComponent("How was your experience with " + business + "?");
	const body = encodeURIComponent(
		`Hi ${c.name},\n\nThank you for choosing ${business}. We would love your feedback.\n\n${d.settings.feedbackLink || "Please reply to this email with your feedback."}\n\nThank you!`,
	);
	window.location.href = `mailto:${encodeURIComponent(c.email)}?subject=${subject}&body=${body}`;
	await ctx.store.write((tx) => tx.put(T.customers, { ...c, lastFeedbackAt: nowIso() }));
	ctx.ui.notice("Feedback request prepared for " + c.name + ".");
}

export function birthdayMessage(customer, business) {
	return `Hi ${customer.name}! 🎉 ${business || "We"} would love to celebrate your birthday with you. Enjoy a special birthday reward on your next visit. We hope you have a wonderful day!`;
}
export function specialMessage(customer, business) {
	return `Hi ${customer.name}! Thank you for being a valued customer of ${business || "our business"}. We appreciate your support and look forward to seeing you again soon.`;
}

export async function sendCustomerWhatsApp(ctx, customerId, message) {
	const s = ctx.session();
	const c = ctx.data().customers.find((x) => x.id === customerId);
	const phone = whatsappPhone(c?.phone);
	const text = message.trim();
	if (!c || !phone || !text) return void (await ctx.ui.alert("Customer mobile number and message are required."));
	window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(text), "_blank");
	await ctx.store.write((tx) => {
		tx.put(T.customerCommunications, {
			id: newId("cc"),
			customerId: c.id,
			type: "whatsapp",
			message: text,
			at: nowIso(),
			userId: s.userId,
		});
		tx.put(T.customers, { ...c, lastContactAt: nowIso() });
	});
	return true;
}
