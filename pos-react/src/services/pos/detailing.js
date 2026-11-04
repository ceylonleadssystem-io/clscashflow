/**
 * Detailing actions (Automobile business type): vehicles, service packages, bookings / job cards, the job workflow,
 * stock use, invoices and payments. A fully paid invoice is also recorded as a normal POS sale, so Sales History,
 * Reports and the Dashboard include it.
 */
import { T } from "../../db/tables";
import { money, nowIso, today } from "../../domain/format";
import { applyStockChange, movementRow, newId, stamp } from "./common";

/** Order of a job: each step moves to the next one. Cancelled can be reached from any step before In Progress. */
export const JOB_FLOW = ["Booked", "Confirmed", "Assigned", "Travelling", "Arrived", "In Progress", "Quality Check", "Completed", "Invoiced"];

const MANAGERS = ["owner", "manager", "admin"];
const guard = (ctx, roles = ["owner", "manager", "admin", "cashier"]) => {
	if (roles.includes(ctx.session().user?.role)) return true;
	ctx.ui.notice("You do not have access to change detailing records.");
	return false;
};
const find = (ctx, key, id) => ctx.data()[key].find((x) => x.id === id);
const put = (ctx, table, row) => ctx.store.write((tx) => tx.put(table, row));

export const jobTotal = (job) => Math.max(0, (Number(job.price) || 0) - (Number(job.discount) || 0));
export const jobPaid = (job) => (job.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);

export async function saveVehicle(ctx, f) {
	if (!guard(ctx)) return null;
	const registration = f.registration.trim().toUpperCase();
	if (!f.customerId || !registration) return void (await ctx.ui.alert("Select the owner and enter the registration number."));
	if (ctx.data().vehicles.some((v) => v.id !== f.id && v.registration.toUpperCase() === registration)) return void (await ctx.ui.alert("That registration already exists."));
	const row = { ...(find(ctx, "vehicles", f.id) || { id: newId("veh"), createdAt: nowIso() }), customerId: f.customerId, registration, make: f.make.trim(), model: f.model.trim(), year: String(f.year || "").trim(), colour: f.colour.trim(), category: f.category, notes: f.notes.trim() };
	await put(ctx, T.vehicles, row);
	return row;
}

export async function savePackage(ctx, f) {
	if (!guard(ctx, MANAGERS)) return null;
	const price = Number(f.price);
	const durationMin = Number(f.durationMin) || 60;
	if (!f.name.trim() || !Number.isFinite(price) || price < 0) return void (await ctx.ui.alert("Enter the package name and a valid price."));
	const supplies = (f.supplies || []).filter((s) => s.itemId && Number(s.qty) > 0).map((s) => ({ itemId: s.itemId, qty: Number(s.qty) }));
	const row = { ...(find(ctx, "detailPackages", f.id) || { id: newId("pkg"), createdAt: nowIso() }), name: f.name.trim(), category: f.category, price, durationMin, description: f.description.trim(), supplies, active: f.active !== false };
	await put(ctx, T.detailPackages, row);
	return row;
}

/** Create or edit a booking. Changing the technician or time re-checks that the technician is free. */
export async function saveJob(ctx, f) {
	if (!guard(ctx)) return null;
	const d = ctx.data();
	const existing = find(ctx, "detailJobs", f.id);
	const pkg = find(ctx, "detailPackages", f.packageId);
	if (!f.customerId || !f.vehicleId || !pkg || !f.scheduledAt) return void (await ctx.ui.alert("Select the customer, vehicle, package and appointment time."));
	if (existing && ["Completed", "Invoiced", "Cancelled"].includes(existing.status)) return void (await ctx.ui.alert("This job is closed."));
	const veh = find(ctx, "vehicles", f.vehicleId);
	if (!veh || veh.customerId !== f.customerId) return void (await ctx.ui.alert("The vehicle does not belong to the selected customer."));
	const discount = Number(f.discount) || 0;
	const price = existing && existing.packageId === pkg.id ? Number(existing.price) : pkg.price;
	if (discount < 0 || discount > price) return void (await ctx.ui.alert("The discount cannot be more than the price."));
	if (f.technicianId && clash(d, f, pkg)) return void (await ctx.ui.alert("That technician already has a job at this time."));
	let status = existing?.status || "Booked";
	if (f.technicianId && ["Booked", "Confirmed"].includes(status)) status = "Assigned";
	const row = { ...(existing || { id: newId("job"), createdAt: nowIso(), payments: [] }), customerId: f.customerId, vehicleId: f.vehicleId, packageId: pkg.id, packageName: pkg.name, price, discount, scheduledAt: f.scheduledAt, address: f.address.trim(), technicianId: f.technicianId || "", notes: f.notes.trim(), status };
	await put(ctx, T.detailJobs, stamp(row, ctx.session()));
	return row;
}

/** Another open job of the same technician that overlaps this one. */
function clash(d, f, pkg) {
	const start = Date.parse(f.scheduledAt);
	const end = start + (pkg.durationMin || 60) * 60000;
	return d.detailJobs.some((j) => {
		if (j.id === f.id || j.technicianId !== f.technicianId || ["Completed", "Invoiced", "Cancelled"].includes(j.status)) return false;
		const s = Date.parse(j.scheduledAt);
		const minutes = d.detailPackages.find((p) => p.id === j.packageId)?.durationMin || 60;
		return s < end && start < s + minutes * 60000;
	});
}

/** Move a job one step forward in the workflow (or to Cancelled). */
export async function advanceJob(ctx, id, to) {
	if (!guard(ctx)) return false;
	const job = find(ctx, "detailJobs", id);
	if (!job) return void (await ctx.ui.alert("Job not found."));
	if (to === "Cancelled") {
		if (["In Progress", "Quality Check", "Completed", "Invoiced", "Cancelled"].includes(job.status)) return void (await ctx.ui.alert("This job can no longer be cancelled."));
		if (!(await ctx.ui.confirm("Cancel this booking?"))) return false;
		await put(ctx, T.detailJobs, { ...job, status: "Cancelled" });
		return true;
	}
	const from = JOB_FLOW.indexOf(job.status);
	if (to !== JOB_FLOW[from + 1] || to === "Invoiced") return void (await ctx.ui.alert("Follow the job workflow in order."));
	if (job.paused) return void (await ctx.ui.alert("Resume the job first."));
	if (["Assigned", "Travelling"].includes(to) && !job.technicianId) return void (await ctx.ui.alert("Assign a technician first."));
	if (to === "In Progress" && (!job.inspection || !job.signedBy)) return void (await ctx.ui.alert("Record the inspection and the customer sign-off first."));
	const next = { ...job, status: to };
	if (to === "In Progress") next.startedAt = nowIso();
	if (to === "Completed") {
		next.completedAt = nowIso();
		return finishJob(ctx, next);
	}
	await put(ctx, T.detailJobs, next);
	return true;
}

/** Completing a job takes the package supplies out of inventory (once) and records the stock movements. */
async function finishJob(ctx, job) {
	const d = ctx.data();
	const s = ctx.session();
	const pkg = find(ctx, "detailPackages", job.packageId);
	const loc = s.locationId && s.locationId !== "all" ? s.locationId : d.locations[0]?.id;
	await ctx.store.write(async (tx) => {
		if (!job.stockDeducted) {
			for (const sup of pkg?.supplies || []) {
				const item = d.inventory.find((i) => i.id === sup.itemId);
				if (!item) continue;
				const res = applyStockChange(item, -sup.qty, loc);
				tx.put(T.inventoryItems, res.item);
				tx.put(T.stockMovements, movementRow(res.item, res.balance, -sup.qty, "Detailing job", job.id, s));
			}
		}
		tx.put(T.detailJobs, { ...job, stockDeducted: true });
	});
	return true;
}

export async function togglePause(ctx, id) {
	if (!guard(ctx)) return false;
	const job = find(ctx, "detailJobs", id);
	if (!job || job.status !== "In Progress") return void (await ctx.ui.alert("Only running jobs can be paused."));
	await put(ctx, T.detailJobs, { ...job, paused: !job.paused });
	return true;
}

/** Inspection notes and the customer's sign-off name, needed before the work starts. */
export async function saveInspection(ctx, id, { inspection, signedBy }) {
	if (!guard(ctx)) return false;
	const job = find(ctx, "detailJobs", id);
	if (!job) return false;
	if (["Completed", "Invoiced", "Cancelled"].includes(job.status)) return void (await ctx.ui.alert("This job is closed."));
	if (!inspection.trim() || !signedBy.trim()) return void (await ctx.ui.alert("Enter the inspection notes and the name of the customer who signs off."));
	await put(ctx, T.detailJobs, { ...job, inspection: inspection.trim(), signedBy: signedBy.trim() });
	return true;
}

/** Number the invoice and close the job. Invoice numbers run INV-0001, INV-0002... */
export async function createInvoice(ctx, id) {
	if (!guard(ctx)) return false;
	const job = find(ctx, "detailJobs", id);
	if (!job || job.status !== "Completed") return void (await ctx.ui.alert("Complete the job before invoicing."));
	if (job.invoiceNumber) return void (await ctx.ui.alert("Invoice already generated."));
	const last = ctx.data().detailJobs.reduce((m, j) => Math.max(m, Number(String(j.invoiceNumber || "").replace(/\D/g, "")) || 0), 0);
	await put(ctx, T.detailJobs, { ...job, status: "Invoiced", invoiceNumber: "INV-" + String(last + 1).padStart(4, "0"), invoicedAt: nowIso() });
	return true;
}

/** Record a payment. When the invoice is fully paid it is also written as a completed POS sale. */
export async function recordPayment(ctx, id, { method, amount }) {
	if (!guard(ctx)) return false;
	const d = ctx.data();
	const s = ctx.session();
	const job = find(ctx, "detailJobs", id);
	if (!job || !job.invoiceNumber) return void (await ctx.ui.alert("Generate the invoice first."));
	const pay = Number(amount);
	const due = jobTotal(job) - jobPaid(job);
	if (!Number.isFinite(pay) || pay <= 0) return void (await ctx.ui.alert("Enter the payment amount."));
	if (pay > due + 0.005) return void (await ctx.ui.alert(`The payment is more than the balance of ${money(due)}.`));
	const payments = [...(job.payments || []), { method, amount: pay, at: nowIso() }];
	let next = { ...job, payments };
	await ctx.store.write((tx) => {
		if (jobTotal(next) - payments.reduce((a, p) => a + p.amount, 0) < 0.005) {
			const customer = find(ctx, "customers", job.customerId);
			const methods = [...new Set(payments.map((p) => p.method))];
			const sale = stamp(
				{
					id: "det" + job.id,
					receipt: job.invoiceNumber,
					orderNumber: job.invoiceNumber,
					date: today(),
					createdAt: nowIso(),
					customerId: job.customerId,
					customerName: customer?.name || "",
					customerPhone: customer?.phone || "",
					payment: methods.length > 1 ? "Split" : methods[0],
					lines: [{ productId: job.packageId, code: "DETAIL", name: job.packageName, qty: 1, price: jobTotal(job), cost: 0, type: "service" }],
					total: jobTotal(job),
					cost: 0,
					profit: jobTotal(job),
					staffId: s.userId,
					status: "completed",
					orderChannel: "Retail",
					locationId: s.locationId && s.locationId !== "all" ? s.locationId : d.locations[0]?.id,
					businessId: s.businessId,
					committedAt: nowIso(),
				},
				s,
			);
			tx.putSale(sale);
			next = { ...next, saleId: sale.id };
		}
		tx.put(T.detailJobs, next);
	});
	return true;
}

const TABLE = { vehicles: T.vehicles, detailPackages: T.detailPackages, detailJobs: T.detailJobs };
export async function removeRecord(ctx, collection, id) {
	if (!guard(ctx, MANAGERS)) return false;
	const d = ctx.data();
	if (collection === "vehicles" && d.detailJobs.some((j) => j.vehicleId === id)) return void (await ctx.ui.alert("This vehicle has jobs. Cancel the jobs instead of deleting the vehicle."));
	if (collection === "detailPackages" && d.detailJobs.some((j) => j.packageId === id)) return void (await ctx.ui.alert("This package is used by jobs. Switch it to inactive instead of deleting it."));
	if (collection === "detailJobs" && ["Invoiced", "Completed"].includes(find(ctx, "detailJobs", id)?.status)) return void (await ctx.ui.alert("Completed and invoiced jobs are kept for the records."));
	if (!(await ctx.ui.confirm("Delete this record?"))) return false;
	await ctx.store.write((tx) => tx.remove(TABLE[collection], id));
	return true;
}
