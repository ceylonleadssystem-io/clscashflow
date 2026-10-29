/**
 * Business Tools maths (pure): the expiry status of a medicine batch and the commission each staff member has earned and been paid.
 */

/** "Expired", "Expires in N days" (30 or fewer), "Expiring soon" (90 or fewer) or "Current". */
export const batchStatus = (b, now = new Date()) => {
	const days = Math.ceil((new Date(b.expiry + "T23:59:59") - now) / 86400000);
	return days < 0 ? "Expired" : days <= 30 ? "Expires in " + Math.max(0, days) + " days" : days <= 90 ? "Expiring soon" : "Current";
};

/** One row per user for the range: eligible sales (not voided or refunded), revenue, commission at the user's rate, paid and balance. */
export function commissionRows(users, sales, payments, { from, to }) {
	return users.map((u) => {
		const mine = sales.filter((s) => s.staffId === u.id && s.date >= from && s.date <= to && !["voided", "refunded"].includes(s.status));
		const revenue = mine.reduce((a, s) => a + Number(s.total || 0), 0);
		const commission = (revenue * Number(u.commissionRate || 0)) / 100;
		const paid = payments.filter((p) => p.userId === u.id && p.from === from && p.to === to).reduce((a, p) => a + Number(p.amount || 0), 0);
		return { u, sales: mine, revenue, commission, paid, balance: Math.max(0, commission - paid) };
	});
}
