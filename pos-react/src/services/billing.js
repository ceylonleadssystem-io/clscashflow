/** Subscription / trial access rules (ported from the legacy cloud layer). */

const DAY = 86400000;
const PAID_STATUSES = ["active", "manual-paid", "payment-submitted", "receipt-submitted"];

export function posAccessProfile(profile, user) {
	return {
		uid: user.uid,
		email: user.email || "",
		name: profile.name || "",
		bizName: profile.posBusinessName || profile.bizName || "",
		plan: "pos",
		currentPlan: "pos",
		planMonthlyPrice: 5500, // POS Starter monthly price (config/plans.js)
		planPrice: 42000,
		billingCycle: profile.posBillingCycle || "monthly",
		trialStart: profile.posTrialStart || profile.trialStart,
		trialEnd: profile.posTrialEnd || profile.trialEnd,
		paid: profile.posPaid === true,
		subscriptionStatus: profile.posSubscriptionStatus || "trial",
		accountPaused: profile.posAccountPaused === true,
		paymentRequestToken: profile.posPaymentRequestToken || "",
		lastPaymentSlipAt: profile.posLastPaymentSlipAt || "",
		nextPaymentDue: profile.posNextPaymentDue || "",
		subscriptionCurrentPeriodEnd: profile.posNextPaymentDue || "",
	};
}

export function accessAllowed(p, now = Date.now()) {
	const status = String(p.subscriptionStatus || "").toLowerCase();
	const paid = p.paid === true || PAID_STATUSES.includes(status);
	const trialEnd = Date.parse(p.trialEnd || "");
	const paymentDue = Date.parse(p.nextPaymentDue || "");
	if (p.accountPaused === true || status === "paused") return false;
	if (!paid) return !trialEnd || now < trialEnd;
	return !paymentDue || now <= paymentDue + DAY;
}

export function profileHasPosAccess(profile) {
	const product = String(profile.product || "").toLowerCase();
	return (
		profile.posEnabled === true ||
		profile.plan === "pos" ||
		profile.currentPlan === "pos" ||
		profile.posPlan === "pos" ||
		product === "pos" ||
		product.includes("pos")
	);
}

/** Banner warning text shown above the content (trial / payment due). */
export function billingWarning(p, now = Date.now()) {
	const paid = p.paid === true || ["active", "manual-paid"].includes(String(p.subscriptionStatus || "").toLowerCase());
	const due = Date.parse(paid ? p.nextPaymentDue : p.trialEnd);
	if (!due) return "";
	const days = Math.ceil((due - now) / DAY);
	if (!paid && days >= 0 && days <= 7)
		return "Trial ends in " + days + " day" + (days === 1 ? "" : "s") + ". Billing is available in Settings.";
	if (paid && days > 0 && days <= 7)
		return "Payment due in " + days + " day" + (days === 1 ? "" : "s") + ". Review Billing in Settings.";
	if (paid && days === 0) return "Payment is due today.";
	if (paid && days < 0) return "Payment is overdue. Contact accounts after payment so an administrator can confirm it.";
	return "";
}
