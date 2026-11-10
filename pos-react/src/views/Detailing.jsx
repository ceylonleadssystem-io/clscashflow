/**
 * Detailing page (Automobile business type): overview, bookings and job cards, vehicles, service packages and invoices.
 * All records live in the POS database (vehicles, detail_packages, detail_jobs) next to the customers, staff, inventory
 * and sales the rest of the POS already uses. Actions are in services/pos/detailing.js.
 */
import { useMemo, useRef, useState } from "react";
import { Kpi, Modal, ModalBody } from "../components/ui";
import { money, today, whatsappPhone } from "../domain/format";
import { customerName } from "../domain/names";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { useUi } from "../store/UiProvider";
import { JOB_FLOW, jobPaid, jobTotal } from "../services/pos/detailing";
import { FULL_SETTINGS_ROLES } from "../config/roles";

const TABS = [
	["overview", "Overview"],
	["jobs", "Bookings & Jobs"],
	["vehicles", "Vehicles"],
	["packages", "Packages"],
	["invoices", "Invoices"],
];
const CATEGORIES = ["Sedan", "Hatchback", "SUV", "Van", "Pickup", "Motorbike"];
const PAY_METHODS = ["Cash", "Card", "Bank transfer", "Other"];
const CLOSED = ["Completed", "Invoiced", "Cancelled"];
const NEXT_LABEL = { Confirmed: "Confirm", Assigned: "Assign", Travelling: "Start travel", Arrived: "Mark arrived", "In Progress": "Start job", "Quality Check": "Quality check", Completed: "Complete job" };
const when = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");
const localNow = () => today() + "T09:00";
const FILTERS = [
	["all", "All"],
	["today", "Today"],
	["upcoming", "Upcoming"],
	["progress", "In progress"],
	["done", "Completed"],
];
/** Customer message for the job's stage (booking confirmation, technician on the way, service complete, invoice ready). */
const messageFor = (j, business) => {
	const what = `${j.packageName} on ${when(j.scheduledAt)}`;
	if (["Travelling", "Arrived"].includes(j.status)) return `Your technician is on the way for your ${what}. ${business}`;
	if (j.status === "In Progress" || j.status === "Quality Check") return `Your vehicle service has started (${j.packageName}). ${business}`;
	if (j.status === "Invoiced") return `Your invoice ${j.invoiceNumber} for ${money(jobTotal(j))} is ready. Thank you for choosing us. ${business}`;
	if (j.status === "Completed") return `Your vehicle service is complete. Thank you for choosing us. ${business}`;
	return `Your appointment is confirmed: ${what}. ${business}`;
};

export function Detailing({ tab: forced }) {
	const data = useData();
	const { svc, currentUser } = usePos();
	const ui = useUi();
	const manager = FULL_SETTINGS_ROLES.includes(currentUser?.role);
	const [tabState, setTab] = useState("overview");
	const tab = forced || tabState; // the Automobile shell picks the page from its own sidebar
	const [modal, setModal] = useState(null); // { kind, id?, jobId? }
	const [q, setQ] = useState("");
	const cname = (id) => customerName(data.customers, id);
	const veh = (id) => data.vehicles.find((v) => v.id === id);
	const vlabel = (id) => (veh(id) ? `${veh(id).registration} · ${[veh(id).make, veh(id).model].filter(Boolean).join(" ")}` : "Vehicle removed");
	const tech = (id) => data.users.find((u) => u.id === id)?.name || "Unassigned";
	const match = (...parts) => !q.trim() || parts.join(" ").toLowerCase().includes(q.trim().toLowerCase());
	const [filter, setFilter] = useState("all");
	const [day, setDay] = useState("");
	// technicians (the cashier role) see only the jobs assigned to them; owners, managers and accountants see everything
	const mine = !["owner", "manager", "admin", "accountant"].includes(currentUser?.role);
	const visible = useMemo(() => (mine ? data.detailJobs.filter((j) => j.technicianId === currentUser?.id) : data.detailJobs), [data.detailJobs, mine, currentUser?.id]);
	const jobs = useMemo(() => [...visible].sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || "")), [visible]);
	const shown = jobs.filter((j) => {
		const d = (j.scheduledAt || "").slice(0, 10);
		if (day && d !== day) return false;
		if (filter === "today") return d === today() && j.status !== "Cancelled";
		if (filter === "upcoming") return d > today() && !CLOSED.includes(j.status);
		if (filter === "progress") return ["Travelling", "Arrived", "In Progress", "Quality Check"].includes(j.status);
		if (filter === "done") return ["Completed", "Invoiced"].includes(j.status);
		return true;
	});
	const message = (j) => {
		const phone = whatsappPhone(data.customers.find((c) => c.id === j.customerId)?.phone);
		if (!phone) return ui.notice("The customer has no valid phone number.");
		window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageFor(j, data.settings.business || ""))}`, "_blank", "noopener");
	};

	const stats = useMemo(() => {
		const day = today();
		const paid = data.detailJobs.reduce((a, j) => a + jobPaid(j), 0);
		const pending = data.detailJobs.filter((j) => j.invoiceNumber).reduce((a, j) => a + (jobTotal(j) - jobPaid(j)), 0);
		return {
			today: data.detailJobs.filter((j) => (j.scheduledAt || "").slice(0, 10) === day && j.status !== "Cancelled").length,
			active: data.detailJobs.filter((j) => !CLOSED.includes(j.status) && ["Travelling", "Arrived", "In Progress", "Quality Check"].includes(j.status)).length,
			done: data.detailJobs.filter((j) => ["Completed", "Invoiced"].includes(j.status)).length,
			paid,
			pending,
			low: data.inventory.filter((i) => Number(i.reorder) > 0 && Number(i.qty) <= Number(i.reorder)),
		};
	}, [data.detailJobs, data.inventory]);

	const advance = (job, to) => svc.detailing.advanceJob(job.id, to);
	const actions = (j) => {
		const next = JOB_FLOW[JOB_FLOW.indexOf(j.status) + 1];
		return (
			<div className="tools">
				{!CLOSED.includes(j.status) && (
					<button className="btn out" onClick={() => setModal({ kind: "job", id: j.id })}>
						Edit
					</button>
				)}
				{["Travelling", "Arrived", "In Progress"].includes(j.status) && (
					<button className="btn out" onClick={() => setModal({ kind: "inspect", id: j.id })}>
						Inspection
					</button>
				)}
				{j.status === "In Progress" && (
					<button className="btn out" onClick={() => svc.detailing.togglePause(j.id)}>
						{j.paused ? "Resume" : "Pause"}
					</button>
				)}
				{next && !CLOSED.includes(j.status) && (
					<button className="btn gold" disabled={j.paused} onClick={() => advance(j, next)}>
						{NEXT_LABEL[next] || next}
					</button>
				)}
				{j.status !== "Cancelled" && (
					<button className="btn out" title="Open a WhatsApp message for the customer" onClick={() => message(j)}>
						Message
					</button>
				)}
				{j.status === "Completed" && manager && (
					<button className="btn gold" onClick={() => svc.detailing.createInvoice(j.id)}>
						Create invoice
					</button>
				)}
				{!["In Progress", "Quality Check", "Completed", "Invoiced", "Cancelled"].includes(j.status) && (
					<button className="btn out" onClick={() => advance(j, "Cancelled")}>
						Cancel
					</button>
				)}
			</div>
		);
	};

	const jobRows = (list) =>
		list.map((j) => (
			<tr key={j.id}>
				<td>{when(j.scheduledAt)}</td>
				<td>{cname(j.customerId)}</td>
				<td>{vlabel(j.vehicleId)}</td>
				<td>{j.packageName}</td>
				<td>{tech(j.technicianId)}</td>
				<td>
					<span className="badge">{j.paused ? "Paused" : j.status}</span>
				</td>
				<td>{actions(j)}</td>
			</tr>
		));

	return (
		<section className="view active" id="view-detailing">
			{!forced && (
				<div className="tools" role="tablist" style={{ marginBottom: 14, flexWrap: "wrap" }}>
					{TABS.map(([id, label]) => (
						<button key={id} role="tab" aria-selected={tab === id} className={"btn " + (tab === id ? "gold" : "out")} onClick={() => setTab(id)}>
							{label}
						</button>
					))}
				</div>
			)}

			{tab === "reports" && <DetailingReports data={data} cname={cname} tech={tech} />}

			{tab === "overview" && (
				<>
					<div className="grid4">
						<Kpi label="Scheduled today" value={stats.today} />
						<Kpi label="Active jobs" value={stats.active} />
						<Kpi label="Completed jobs" value={stats.done} />
						<Kpi label="Payments received" value={money(stats.paid)} note={stats.pending > 0 ? `${money(stats.pending)} pending` : "Nothing pending"} />
					</div>
					<div className="panel" style={{ marginTop: 16 }}>
						<div className="panel-head">
							<div>
								<div className="panel-title">Needs your attention</div>
								<div className="muted">Unassigned bookings and supplies running low</div>
							</div>
							<div className="tools">
								<button className="btn" onClick={() => setModal({ kind: "job" })}>
									+ New booking
								</button>
							</div>
						</div>
						<div className="modal-body">
							<p>{jobs.filter((j) => ["Booked", "Confirmed"].includes(j.status) && !j.technicianId).length} booking(s) waiting for a technician.</p>
							<p>{stats.low.length ? "Low on stock: " + stats.low.map((i) => i.name).join(", ") : "No supplies are running low."}</p>
						</div>
					</div>
					<WeekRevenue jobs={visible} />
					<div className="panel" style={{ marginTop: 16 }}>
						<div className="panel-head">
							<div className="panel-title">Recent activity</div>
						</div>
						<div className="modal-body">
							{[...visible]
								.sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""))
								.slice(0, 6)
								.map((j) => (
									<p key={j.id}>
										<strong>{j.packageName}</strong> for {cname(j.customerId)} ({vlabel(j.vehicleId)}): {j.paused ? "Paused" : j.status}
									</p>
								))}
							{!visible.length && <p className="muted">No activity yet.</p>}
						</div>
					</div>
					<div className="panel" style={{ marginTop: 16 }}>
						<div className="panel-head">
							<div className="panel-title">Upcoming jobs</div>
						</div>
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>When</th>
										<th>Customer</th>
										<th>Vehicle</th>
										<th>Package</th>
										<th>Technician</th>
										<th>Status</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{jobRows(jobs.filter((j) => !CLOSED.includes(j.status)).slice(0, 8))}
									{!jobs.some((j) => !CLOSED.includes(j.status)) && (
										<tr>
											<td colSpan="7">No open jobs. Add a booking to get started.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</>
			)}

			{tab === "jobs" && (
				<div className="panel">
					<div className="panel-head">
						<div>
							<div className="panel-title">Bookings & Jobs</div>
							<div className="muted">Follow each job from booking to invoice</div>
						</div>
						<div className="tools">
							<input className="input" type="search" placeholder="Search bookings" aria-label="Search bookings" value={q} onChange={(e) => setQ(e.target.value)} />
							<input className="input" type="date" aria-label="Calendar date" value={day} onChange={(e) => setDay(e.target.value)} />
							{!mine && (
								<button className="btn" onClick={() => setModal({ kind: "job" })}>
									+ Booking
								</button>
							)}
						</div>
					</div>
					<div className="tools" role="group" aria-label="Show jobs" style={{ padding: "0 18px 12px", flexWrap: "wrap" }}>
						{FILTERS.map(([id, label]) => (
							<button key={id} type="button" aria-pressed={filter === id} className={"btn " + (filter === id ? "gold" : "out")} onClick={() => setFilter(id)}>
								{label}
							</button>
						))}
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>When</th>
									<th>Customer</th>
									<th>Vehicle</th>
									<th>Package</th>
									<th>Technician</th>
									<th>Status</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{jobRows(shown.filter((j) => match(cname(j.customerId), vlabel(j.vehicleId), j.packageName, j.status, j.invoiceNumber)))}
								{!shown.length && (
									<tr>
										<td colSpan="7">{jobs.length ? "No jobs match this view." : mine ? "No jobs are assigned to you." : "No bookings yet."}</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{tab === "vehicles" && (
				<div className="panel">
					<div className="panel-head">
						<div>
							<div className="panel-title">Vehicles</div>
							<div className="muted">Every customer vehicle and its service history</div>
						</div>
						<div className="tools">
							<input className="input" type="search" placeholder="Search vehicles" aria-label="Search vehicles" value={q} onChange={(e) => setQ(e.target.value)} />
							<button className="btn" onClick={() => setModal({ kind: "vehicle" })}>
								+ Vehicle
							</button>
						</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Registration</th>
									<th>Vehicle</th>
									<th>Owner</th>
									<th>Category</th>
									<th>Services</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{data.vehicles
									.filter((v) => match(v.registration, v.make, v.model, cname(v.customerId)))
									.map((v) => (
										<tr key={v.id}>
											<td>{v.registration}</td>
											<td>{[v.year, v.make, v.model, v.colour].filter(Boolean).join(" ")}</td>
											<td>{cname(v.customerId)}</td>
											<td>{v.category}</td>
											<td>{data.detailJobs.filter((j) => j.vehicleId === v.id && ["Completed", "Invoiced"].includes(j.status)).length}</td>
											<td>
												<div className="tools">
													<button className="btn out" onClick={() => setModal({ kind: "history", id: v.id })}>
														History
													</button>
													<button className="btn out" onClick={() => setModal({ kind: "vehicle", id: v.id })}>
														Edit
													</button>
												</div>
											</td>
										</tr>
									))}
								{!data.vehicles.length && (
									<tr>
										<td colSpan="6">No vehicles yet.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{tab === "packages" && (
				<div className="panel">
					<div className="panel-head">
						<div>
							<div className="panel-title">Service packages</div>
							<div className="muted">Prices, duration and the supplies each package uses</div>
						</div>
						<div className="tools">
							<button className="btn" disabled={!manager} onClick={() => setModal({ kind: "package" })}>
								+ Package
							</button>
						</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Package</th>
									<th>Category</th>
									<th>Price</th>
									<th>Duration</th>
									<th>Supplies</th>
									<th>Status</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{data.detailPackages.map((p) => (
									<tr key={p.id}>
										<td>{p.name}</td>
										<td>{p.category}</td>
										<td>{money(p.price)}</td>
										<td>{p.durationMin} min</td>
										<td>{(p.supplies || []).length || "—"}</td>
										<td>
											<span className="badge">{p.active === false ? "Inactive" : "Active"}</span>
										</td>
										<td>
											<button className="btn out" disabled={!manager} onClick={() => setModal({ kind: "package", id: p.id })}>
												Edit
											</button>
										</td>
									</tr>
								))}
								{!data.detailPackages.length && (
									<tr>
										<td colSpan="7">No packages yet. Add one to start taking bookings.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{tab === "invoices" && (
				<div className="panel">
					<div className="panel-head">
						<div>
							<div className="panel-title">Invoices</div>
							<div className="muted">Record payments; a fully paid invoice also appears in Sales History and Reports</div>
						</div>
					</div>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Invoice</th>
									<th>Customer</th>
									<th>Package</th>
									<th>Total</th>
									<th>Paid</th>
									<th>Balance</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{jobs
									.filter((j) => j.invoiceNumber)
									.map((j) => {
										const bal = jobTotal(j) - jobPaid(j);
										return (
											<tr key={j.id}>
												<td>{j.invoiceNumber}</td>
												<td>{cname(j.customerId)}</td>
												<td>{j.packageName}</td>
												<td>{money(jobTotal(j))}</td>
												<td>{money(jobPaid(j))}</td>
												<td>{bal > 0.005 ? money(bal) : <span className="badge">Paid</span>}</td>
												<td>
													{bal > 0.005 && (
														<button className="btn gold" onClick={() => setModal({ kind: "pay", id: j.id })}>
															Record payment
														</button>
													)}
												</td>
											</tr>
										);
									})}
								{!jobs.some((j) => j.invoiceNumber) && (
									<tr>
										<td colSpan="7">No invoices yet. Complete a job, then create its invoice.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<DetailingModals modal={modal} onClose={() => setModal(null)} setModal={setModal} manager={manager} />
		</section>
	);
}

/** Payments received in the last 7 days, one bar per day. */
function WeekRevenue({ jobs }) {
	const days = Array.from({ length: 7 }, (_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
	});
	const totals = days.map((d) => jobs.reduce((a, j) => a + (j.payments || []).filter((p) => new Date(p.at).toLocaleDateString("en-CA") === d).reduce((s, p) => s + (Number(p.amount) || 0), 0), 0));
	const max = Math.max(1, ...totals);
	return (
		<div className="panel" style={{ marginTop: 16 }}>
			<div className="panel-head">
				<div>
					<div className="panel-title">Revenue overview</div>
					<div className="muted">Payments received, last 7 days</div>
				</div>
			</div>
			<div className="modal-body" role="img" aria-label={"Payments by day: " + totals.map((t, i) => `${days[i]} ${money(t)}`).join(", ")} style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 140 }}>
				{totals.map((t, i) => (
					<div key={days[i]} style={{ flex: 1, textAlign: "center", fontSize: 11 }}>
						<div title={money(t)} style={{ height: Math.max(3, (t / max) * 90), background: "var(--ui-accent, #c9a24b)", borderRadius: 3 }} />
						{days[i].slice(5)}
					</div>
				))}
			</div>
		</div>
	);
}

/** Canvas the customer signs on with a finger or mouse; reports a PNG data URL (empty string when cleared). */
function SignaturePad({ value, onChange }) {
	const ref = useRef(null);
	const drawing = useRef(false);
	const point = (e) => {
		const r = ref.current.getBoundingClientRect();
		return [((e.clientX - r.left) * ref.current.width) / r.width, ((e.clientY - r.top) * ref.current.height) / r.height];
	};
	const down = (e) => {
		drawing.current = true;
		ref.current.setPointerCapture?.(e.pointerId);
		const c = ref.current.getContext("2d");
		c.lineWidth = 2.5;
		c.lineCap = "round";
		c.strokeStyle = "#111";
		c.beginPath();
		c.moveTo(...point(e));
	};
	const move = (e) => {
		if (!drawing.current) return;
		const c = ref.current.getContext("2d");
		c.lineTo(...point(e));
		c.stroke();
	};
	const up = () => {
		if (!drawing.current) return;
		drawing.current = false;
		onChange(ref.current.toDataURL("image/png"));
	};
	const clear = () => {
		ref.current.getContext("2d").clearRect(0, 0, ref.current.width, ref.current.height);
		onChange("");
	};
	return (
		<div>
			<canvas ref={ref} width="600" height="180" aria-label="Customer signature" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} style={{ width: "100%", maxWidth: 600, height: 150, border: "1px dashed var(--ui-line, #bbb)", borderRadius: 6, background: "#fff", touchAction: "none" }} />
			<div className="tools" style={{ marginTop: 6 }}>
				<button type="button" className="btn out" onClick={clear}>
					Clear
				</button>
				<span className="muted">{value ? "Signature captured" : "Sign here"}</span>
			</div>
		</div>
	);
}

/** Revenue and job counts by package and by technician, from the paid and invoiced jobs. */
function DetailingReports({ data, tech }) {
	const done = data.detailJobs.filter((j) => ["Completed", "Invoiced"].includes(j.status));
	const group = (keyOf) => {
		const m = new Map();
		done.forEach((j) => {
			const k = keyOf(j);
			const r = m.get(k) || { jobs: 0, revenue: 0 };
			r.jobs += 1;
			r.revenue += jobPaid(j);
			m.set(k, r);
		});
		return [...m.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
	};
	const table = (title, rows) => (
		<div className="panel" style={{ marginTop: 16 }}>
			<div className="panel-head">
				<div className="panel-title">{title}</div>
			</div>
			<div className="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Jobs</th>
							<th>Payments received</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(([k, r]) => (
							<tr key={k}>
								<td>{k}</td>
								<td>{r.jobs}</td>
								<td>{money(r.revenue)}</td>
							</tr>
						))}
						{!rows.length && (
							<tr>
								<td colSpan="3">No completed jobs yet.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
	return (
		<>
			<div className="grid4">
				<Kpi label="Completed jobs" value={done.length} />
				<Kpi label="Payments received" value={money(done.reduce((a, j) => a + jobPaid(j), 0))} />
				<Kpi label="Invoiced" value={money(done.filter((j) => j.invoiceNumber).reduce((a, j) => a + jobTotal(j), 0))} />
				<Kpi label="Cancelled bookings" value={data.detailJobs.filter((j) => j.status === "Cancelled").length} />
			</div>
			{table("By package", group((j) => j.packageName))}
			{table("By technician", group((j) => tech(j.technicianId)))}
		</>
	);
}

/** One dialog component for the booking, vehicle, package, inspection and payment forms. */
function DetailingModals({ modal, onClose, setModal, manager }) {
	const data = useData();
	const { svc } = usePos();
	const kind = modal?.kind;
	const [f, setF] = useState({});
	const [seed, setSeed] = useState("");
	const key = kind ? kind + ":" + (modal.id || "") : "";
	// load the form once per opened dialog
	if (key !== seed) {
		setSeed(key);
		const old = modal?.id ? { job: data.detailJobs, vehicle: data.vehicles, package: data.detailPackages, inspect: data.detailJobs, pay: data.detailJobs }[kind]?.find((x) => x.id === modal.id) : null;
		const blank = {
			job: { customerId: modal?.customerId || "", vehicleId: "", packageId: "", scheduledAt: localNow(), address: "", technicianId: "", notes: "", discount: "" },
			vehicle: { customerId: modal?.customerId || "", registration: "", make: "", model: "", year: "", colour: "", category: "Sedan", notes: "" },
			package: { name: "", category: "Sedan", price: "", durationMin: 60, description: "", supplies: [], active: true },
			customer: { name: "", phone: "" },
			inspect: { inspection: "", signedBy: "" },
			pay: { method: "Cash", amount: "" },
		}[kind];
		if (blank) setF(old ? { ...blank, ...old, ...(kind === "pay" ? { method: "Cash", amount: String(jobTotal(old) - jobPaid(old)) } : {}) } : blank);
	}
	if (!kind) return null;
	if (kind === "history") {
		const v = data.vehicles.find((x) => x.id === modal.id);
		const past = data.detailJobs.filter((j) => j.vehicleId === modal.id).sort((a, b) => (b.scheduledAt || "").localeCompare(a.scheduledAt || ""));
		return (
			<Modal id="detailing-history-modal" open title="Vehicle service history" subtitle={v ? `${v.registration} · ${[v.make, v.model].filter(Boolean).join(" ")}` : ""} onClose={onClose}>
				<ModalBody>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>When</th>
									<th>Package</th>
									<th>Status</th>
									<th>Total</th>
								</tr>
							</thead>
							<tbody>
								{past.map((j) => (
									<tr key={j.id}>
										<td>{when(j.scheduledAt)}</td>
										<td>{j.packageName}</td>
										<td>{j.status}</td>
										<td>{money(jobTotal(j))}</td>
									</tr>
								))}
								{!past.length && (
									<tr>
										<td colSpan="4">No services recorded for this vehicle yet.</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</ModalBody>
			</Modal>
		);
	}
	const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
	const field = (label, node, full) => (
		<div className={"field" + (full ? " full" : "")}>
			<label>{label}</label>
			{node}
		</div>
	);
	const input = (k, type = "text", extra = {}) => <input className="input" type={type} value={f[k] ?? ""} onChange={set(k)} {...extra} />;
	const select = (k, options) => (
		<select className="input" value={f[k] || ""} onChange={set(k)}>
			{options}
		</select>
	);
	const opts = (rows, label) => rows.map((r) => <option key={r.id} value={r.id}>{label(r)}</option>);
	const run = (fn, after) => async () => {
		const r = await fn();
		if (r) after ? after(r) : onClose();
	};
	const TITLES = { job: "Booking", vehicle: "Vehicle", package: "Service package", customer: "New customer", inspect: "Inspection & sign-off", pay: "Record payment" };
	const SAVE = {
		job: run(() => svc.detailing.saveJob(f)),
		vehicle: run(() => svc.detailing.saveVehicle(f), (v) => (modal.customerId ? setModal({ kind: "job", customerId: v.customerId }) : onClose())),
		package: run(() => svc.detailing.savePackage(f)),
		customer: run(() => svc.customers.saveCustomer({ id: "", name: f.name || "", phone: f.phone || "", email: "", birthday: "", company: "", address: "", tags: "", notes: "", type: "regular" }), (c) => setModal({ kind: "job", customerId: c.id, id: "" })),
		inspect: run(() => svc.detailing.saveInspection(modal.id, f)),
		pay: run(() => svc.detailing.recordPayment(modal.id, f)),
	}[kind];
	const owned = data.vehicles.filter((v) => v.customerId === f.customerId);
	const packages = data.detailPackages.filter((p) => p.active !== false || p.id === f.packageId);
	const canDelete = modal.id && ["job", "vehicle", "package"].includes(kind) && manager;
	const del = async () => {
		if (await svc.detailing.removeRecord({ job: "detailJobs", vehicle: "vehicles", package: "detailPackages" }[kind], modal.id)) onClose();
	};
	const supplies = f.supplies || [];
	const setSupply = (i, patch) => setF((v) => ({ ...v, supplies: supplies.map((s, n) => (n === i ? { ...s, ...patch } : s)) }));
	return (
		<Modal
			id={"detailing-" + kind + "-modal"}
			open
			title={TITLES[kind]}
			onClose={onClose}
			footer={
				<>
					{canDelete && (
						<button className="btn danger" onClick={del}>
							Delete
						</button>
					)}
					<button className="btn gold" onClick={SAVE}>
						Save
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="form-grid">
					{kind === "job" && (
						<>
							{field(
								"Customer *",
								<>
									{select("customerId", <><option value="">Select customer</option>{opts(data.customers, (c) => c.name)}</>)}
									<button type="button" className="btn out" style={{ marginTop: 6 }} onClick={() => setModal({ kind: "customer" })}>
										+ New customer
									</button>
								</>,
							)}
							{field("Vehicle *", <>{select("vehicleId", <><option value="">Select vehicle</option>{opts(owned, (v) => v.registration + " " + [v.make, v.model].filter(Boolean).join(" "))}</>)}
								<button type="button" className="btn out" style={{ marginTop: 6 }} disabled={!f.customerId} onClick={() => setModal({ kind: "vehicle", customerId: f.customerId })}>+ New vehicle</button></>)}
							{field("Package *", select("packageId", <><option value="">Select package</option>{opts(packages, (p) => `${p.name} · ${money(p.price)}`)}</>))}
							{field("Date & time *", input("scheduledAt", "datetime-local"))}
							{field("Technician", select("technicianId", <><option value="">Unassigned</option>{opts(data.users.filter((u) => u.active !== false), (u) => u.name)}</>))}
							{field("Discount", input("discount", "number", { min: 0, step: "0.01" }))}
							{field("Service address", input("address"), true)}
							{field("Notes", <textarea className="input" rows="2" value={f.notes || ""} onChange={set("notes")} />, true)}
						</>
					)}
					{kind === "customer" && (
						<>
							{field("Name *", input("name"))}
							{field("Mobile / WhatsApp *", input("phone", "tel"))}
						</>
					)}
					{kind === "vehicle" && (
						<>
							{field("Owner *", select("customerId", <><option value="">Select customer</option>{opts(data.customers, (c) => c.name)}</>))}
							{field("Registration *", input("registration"))}
							{field("Make", input("make"))}
							{field("Model", input("model"))}
							{field("Year", input("year", "number", { min: 1950, max: 2100 }))}
							{field("Colour", input("colour"))}
							{field("Category", select("category", CATEGORIES.map((c) => <option key={c}>{c}</option>)))}
							{field("Notes", <textarea className="input" rows="2" value={f.notes || ""} onChange={set("notes")} />, true)}
						</>
					)}
					{kind === "package" && (
						<>
							{field("Name *", input("name"))}
							{field("Vehicle category", select("category", CATEGORIES.map((c) => <option key={c}>{c}</option>)))}
							{field("Price *", input("price", "number", { min: 0, step: "0.01" }))}
							{field("Duration (minutes)", input("durationMin", "number", { min: 15, step: 5 }))}
							{field(
								"Status",
								<select className="input" value={String(f.active !== false)} onChange={(e) => setF((v) => ({ ...v, active: e.target.value === "true" }))}>
									<option value="true">Active</option>
									<option value="false">Inactive</option>
								</select>,
							)}
							{field("Description", <textarea className="input" rows="2" value={f.description || ""} onChange={set("description")} />, true)}
							{field(
								"Supplies used per job (taken from Inventory when the job is completed)",
								<>
									{supplies.map((s, i) => (
										<div key={i} className="tools" style={{ marginBottom: 6 }}>
											<select className="input" aria-label="Supply" value={s.itemId} onChange={(e) => setSupply(i, { itemId: e.target.value })}>
												<option value="">Select item</option>
												{opts(data.inventory, (it) => it.name)}
											</select>
											<input className="input" type="number" min="0" step="any" aria-label="Quantity" style={{ maxWidth: 110 }} value={s.qty} onChange={(e) => setSupply(i, { qty: e.target.value })} />
											<button type="button" className="btn out" aria-label="Remove supply" onClick={() => setF((v) => ({ ...v, supplies: supplies.filter((_, n) => n !== i) }))}>×</button>
										</div>
									))}
									<button type="button" className="btn out" onClick={() => setF((v) => ({ ...v, supplies: [...supplies, { itemId: "", qty: 1 }] }))}>+ Add supply</button>
								</>,
								true,
							)}
						</>
					)}
					{kind === "inspect" && (
						<>
							{field("Inspection notes * (existing marks, scratches, condition)", <textarea className="input" rows="4" value={f.inspection || ""} onChange={set("inspection")} />, true)}
							{field("Customer signs off as *", input("signedBy"), true)}
							{field("Customer signature * (sign with a finger or mouse)", <SignaturePad value={f.signature} onChange={(s) => setF((v) => ({ ...v, signature: s }))} />, true)}
						</>
					)}
					{kind === "pay" && (
						<>
							{field("Method", select("method", PAY_METHODS.map((m) => <option key={m}>{m}</option>)))}
							{field("Amount *", input("amount", "number", { min: 0, step: "0.01" }))}
						</>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
}
