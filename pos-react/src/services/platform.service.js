import { env } from "../config/env";

/**
 * Bridge to the shared platform script (`/assets/platform.js`) that the whole
 * Ceylonry product family uses: EmailJS receipt sender, subscription paywall,
 * bank-transfer payment dialog and support widget.
 *
 * It is an *external integration point*: the script is loaded lazily, every
 * call is optional, and components only talk to these wrappers.
 */
let loading = null;

export function loadPlatformScript() {
	if (typeof window === "undefined") return Promise.resolve(false);
	if (window.clsSendPaymentReceiptEmail) return Promise.resolve(true);
	if (loading) return loading;
	loading = new Promise((resolve) => {
		const script = document.createElement("script");
		script.src = env.platformScriptUrl;
		script.async = true;
		script.onload = () => resolve(true);
		script.onerror = () => {
			console.warn("platform.js could not be loaded - billing widgets and receipt e-mail are unavailable.");
			resolve(false);
		};
		document.head.appendChild(script);
	});
	return loading;
}

export const platformAvailable = () => typeof window !== "undefined" && !!window.clsSendPaymentReceiptEmail;

/**
 * E-mails the ORDER to the customer (items, modifiers, totals, payment method)
 * through EmailJS. Uses the business' EmailJS service and an order template whose
 * body is `{{{message_html}}}` (see public/email-templates/pos-order-email.html).
 * Template id: settings.ejsOrderTemplate -> VITE_EJS_ORDER_TEMPLATE -> the legacy
 * receipt template (same `message_html` body).
 */
export async function sendOrderEmail({ to, subject, html, customerName, settings }) {
	await loadPlatformScript();
	const publicKey = settings.ejsKey || env.ejsKey;
	const serviceId = settings.ejsService || env.ejsService;
	const templateId = settings.ejsOrderTemplate || env.ejsOrderTemplate || settings.ejsReceiptTemplate || env.ejsReceiptTemplate;
	if (!publicKey || !serviceId || !templateId) throw new Error("EmailJS is not configured for order e-mails.");
	if (!window.emailjs || typeof window.emailjs.send !== "function") {
		if (!window.clsLoadScriptOnce) throw new Error("Email service unavailable");
		await window.clsLoadScriptOnce("https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js", "cls-emailjs");
	}
	if (!window.emailjs) throw new Error("EmailJS browser SDK did not load.");
	window.emailjs.init?.({ publicKey });
	const params = {
		to_email: to,
		user_email: to,
		email: to,
		customer_email: to,
		recipient_email: to,
		to,
		to_name: customerName,
		customer_name: customerName,
		from_name: settings.business || "Ceylonry POS",
		reply_to: settings.email || "",
		subject,
		message_html: html,
		business_name: settings.business || "",
	};
	await window.emailjs.send(serviceId, templateId, params, { publicKey });
	return true;
}

export function setPlatformProfile(profile) {
	if (typeof window !== "undefined") window._profile = profile;
}

export async function renderPaywall(profile) {
	await loadPlatformScript();
	window.clsRenderSubscriptionPaywall?.(profile, { plan: "pos" });
}

export async function openBankTransfer(profile) {
	await loadPlatformScript();
	if (window.clsOpenBankTransferPayment) window.clsOpenBankTransferPayment("pos", profile || window._profile || {});
}

/**
 * After a payment slip is submitted for the POS plan, mirror the POS specific
 * entitlement fields on the user profile (legacy behaviour).
 */
export function patchReceiptSubmission(clsBackend) {
	const base = window.clsSubmitSubscriptionReceipt;
	if (!base || base.__posPatched) return;
	const patched = async function (file, profile, plan, statusEl, cycle) {
		const ok = await base(file, profile, plan, statusEl, cycle);
		if (ok && plan === "pos") {
			const user = clsBackend.auth().currentUser;
			const next = profile.nextPaymentDue || "";
			if (user)
				await clsBackend
					.firestore()
					.collection("users")
					.doc(user.uid)
					.set(
						{
							posPaid: true,
							posAccountPaused: false,
							posSubscriptionStatus: "receipt-submitted",
							posPaymentReminderStatus: "submitted",
							posLastPaymentSlipAt: new Date().toISOString(),
							posNextPaymentDue: next,
							posBillingCycle: cycle || "monthly",
							updatedAt: clsBackend.firestore.FieldValue.serverTimestamp(),
						},
						{ merge: true },
					);
		}
		return ok;
	};
	patched.__posPatched = true;
	window.clsSubmitSubscriptionReceipt = patched;
}

/** Optional hook for kitchen-printer integrations (window.clsPrintKitchenTicket). */
export const kitchenPrinterHook = () =>
	typeof window !== "undefined" && typeof window.clsPrintKitchenTicket === "function"
		? window.clsPrintKitchenTicket
		: null;

/** POST the welcome/onboarding e-mails once per account. */
export async function sendOnboardingEmails(user, profile) {
	if (profile.posWelcomeEmailSentAt || !navigator.onLine) return;
	try {
		const token = await user.getIdToken();
		const mobile =
			sessionStorage.getItem("ceylonry-pos-onboarding-mobile") ||
			profile.posMobile ||
			profile.mobile ||
			profile.phone ||
			"";
		const response = await fetch(env.onboardingEmailUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
			body: JSON.stringify({
				email: user.email,
				name: profile.name,
				business: profile.posBusinessName || profile.bizName,
				mobile,
			}),
		});
		if (response.ok) sessionStorage.removeItem("ceylonry-pos-onboarding-mobile");
		else console.warn("POS onboarding email will retry on the next sign-in");
	} catch (error) {
		console.warn("POS onboarding email will retry on the next sign-in", error);
	}
}

/** Loads the optional bundled catalogue photos (window.CLS_AZURE_SWIM_IMAGES). */
export async function loadCatalogueImages() {
	if (!env.catalogueImagesUrl || window.CLS_AZURE_SWIM_IMAGES) return window.CLS_AZURE_SWIM_IMAGES || {};
	await new Promise((resolve) => {
		const s = document.createElement("script");
		s.src = env.catalogueImagesUrl;
		s.onload = resolve;
		s.onerror = resolve;
		document.head.appendChild(s);
	});
	return window.CLS_AZURE_SWIM_IMAGES || {};
}
