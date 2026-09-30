import { T } from "../../db/tables";
import { nowIso } from "../../domain/format";
import { newId } from "./common";

/** Appointments, memberships, prescriptions, medicine batches and staff commissions. */

const canManage = (ctx) => ["owner", "manager"].includes(ctx.session().user?.role);
const guard = (ctx) => {
	if (canManage(ctx)) return true;
	ctx.ui.notice("Owner or manager access is required to change business records.");
	return false;
};

export async function saveAppointment(ctx, f) {
	if (!guard(ctx)) return null;
	if (!f.customerId || !f.serviceId || !f.time) return void (await ctx.ui.alert("Select a customer, service, and appointment time."));
	const row = { ...(ctx.data().appointments.find((x) => x.id === f.id) || { id: newId("a"), createdAt: nowIso() }), customerId: f.customerId, serviceId: f.serviceId, time: f.time, staffId: f.staffId, status: f.status, notes: f.notes.trim() };
	await ctx.store.write((tx) => tx.put(T.appointments, row));
	return row;
}

export async function saveMembership(ctx, f) {
	if (!guard(ctx)) return null;
	const discount = Number(f.discount || 0);
	if (!f.customerId || !f.name.trim() || discount < 0 || discount > 100) return void (await ctx.ui.alert("Select a customer and enter a valid membership and discount."));
	const row = { ...(ctx.data().memberships.find((x) => x.id === f.id) || { id: newId("m"), createdAt: nowIso() }), customerId: f.customerId, name: f.name.trim(), discount, status: f.status, start: f.start, end: f.end };
	await ctx.store.write((tx) => tx.put(T.memberships, row));
	return row;
}

export async function savePrescription(ctx, f) {
	if (!guard(ctx)) return null;
	if (!f.customerId || !f.reference.trim()) return void (await ctx.ui.alert("Select a customer and enter the prescription reference."));
	const row = { ...(ctx.data().prescriptions.find((x) => x.id === f.id) || { id: newId("rx"), createdAt: nowIso() }), customerId: f.customerId, reference: f.reference.trim(), date: f.date, prescriber: f.prescriber.trim(), status: f.status, notes: f.notes.trim() };
	await ctx.store.write((tx) => tx.put(T.prescriptions, row));
	return row;
}

export async function saveMedicineBatch(ctx, f) {
	if (!guard(ctx)) return null;
	const d = ctx.data();
	const quantity = Number(f.quantity);
	if (!f.itemId || !f.batchNumber.trim() || !Number.isFinite(quantity) || quantity < 0 || !f.expiry)
		return void (await ctx.ui.alert("Select an inventory item and enter batch, quantity, and expiry."));
	if (d.medicineBatches.some((b) => b.id !== f.id && b.itemId === f.itemId && b.batchNumber.toLowerCase() === f.batchNumber.trim().toLowerCase()))
		return void (await ctx.ui.alert("That batch number already exists for this medicine."));
	const row = { ...(d.medicineBatches.find((x) => x.id === f.id) || { id: newId("batch"), createdAt: nowIso() }), itemId: f.itemId, batchNumber: f.batchNumber.trim(), quantity, expiry: f.expiry, received: f.received, supplier: f.supplier.trim() };
	await ctx.store.write((tx) => tx.put(T.medicineBatches, row));
	return row;
}

const TABLE = { appointments: T.appointments, memberships: T.memberships, prescriptions: T.prescriptions, medicineBatches: T.medicineBatches };
export async function removeRecord(ctx, collection, id) {
	if (!guard(ctx)) return false;
	if (!id || !(await ctx.ui.confirm("Delete this record?"))) return false;
	await ctx.store.write((tx) => tx.remove(TABLE[collection], id));
	return true;
}

export async function setCommissionRate(ctx, userId, rate) {
	if (!guard(ctx)) return;
	const user = ctx.data().users.find((u) => u.id === userId);
	if (user) await ctx.store.write((tx) => tx.put(T.users, { ...user, commissionRate: Math.max(0, Math.min(100, Number(rate || 0))) }));
}

export async function recordCommissionPayment(ctx, userId, amount, from, to) {
	if (!guard(ctx)) return;
	if (amount <= 0 || !(await ctx.ui.confirm("Record LKR " + amount.toFixed(2) + " as paid?"))) return;
	await ctx.store.write((tx) =>
		tx.put(T.commissionPayments, { id: newId("cp"), userId, amount, from, to, paidAt: nowIso(), recordedBy: ctx.session().userId }),
	);
}
