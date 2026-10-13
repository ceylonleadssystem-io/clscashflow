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
