import { useMemo, useState } from "react";
import { crmRows } from "../domain/analytics";
import { money } from "../domain/format";
import { Kpi } from "../components/ui";
import { useData } from "../store/DataProvider";
import { useFeature } from "../store/FeatureProvider";
import { useCheckout } from "../store/CheckoutProvider";
import { usePos } from "../store/PosProvider";
import { CustomerMessageModal } from "../modals/CustomerMessageModal";

/** CRM & Feedback: segments, birthdays, WhatsApp, feedback requests, rewards. */
export function CRM() {
	const data = useData();
	const { svc } = usePos();
	const { setCustomerModal } = useCheckout();
	const whatsapp = useFeature("crm.whatsapp");
	const feedback = useFeature("crm.feedback");
	const [filter, setFilter] = useState("all");
	const [q, setQ] = useState("");
	const [message, setMessage] = useState(null);
	const rows = useMemo(() => crmRows(data.customers, data.sales, data.settings), [data.customers, data.sales, data.settings]);
	const list = rows.filter((x) => {
		const search = q.trim().toLowerCase();
		return (
			(!search || (x.c.name + " " + x.c.phone + " " + x.c.email).toLowerCase().includes(search)) &&
			(filter === "all" ||
				(filter === "birthday" && x.b.upcoming) ||
				(filter === "vip" && x.segment === "VIP") ||
				(filter === "frequent" && x.s.visits >= 4) ||
				(filter === "inactive" && x.s.daysSince >= 60) ||
				(filter === "due" && x.due))
		);
	});
	const totalValue = rows.reduce((a, x) => a + x.s.spent, 0);
	return (
		<section className="view active" id="view-crm">
			<div className="grid4" id="crm-kpis" style={{ marginBottom: 16 }}>
				<Kpi label="Customers" value={rows.length} />
				<Kpi label="Birthdays · 30 Days" value={rows.filter((x) => x.b.upcoming).length} />
				<Kpi label="VIP Customers" value={rows.filter((x) => x.segment === "VIP").length} />
				<Kpi label="Customer Value" value={money(totalValue)} />
			</div>
			<div className="panel-head" style={{ padding: "0 0 15px", border: 0 }}>
				<div>
					<div className="panel-title">Customer CRM & Feedback</div>
					<div className="muted">Identify loyal customers and request feedback after purchases</div>
				</div>
				<select className="input" id="crm-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
					<option value="all">All customers</option>
					<option value="birthday">Upcoming birthdays</option>
					<option value="vip">VIP customers</option>
					<option value="frequent">Frequent visitors</option>
					<option value="inactive">Needs a return visit</option>
					<option value="due">Feedback due</option>
				</select>
				<input className="input" id="crm-search" placeholder="Search name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
			</div>
			<div className="crm-grid" id="crm-grid">
				{list.map(({ c, s, b, segment, due }) => (
					<article className="panel customer" key={c.id}>
						<div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
							<div>
								<h3>{c.name}</h3>
								<div className="customer-meta">
									{c.phone || "No phone"} · {c.email || "No email"}
								</div>
							</div>
							<span className="badge">{segment}</span>
						</div>
						{b.upcoming ? (
							<div className="print-note" style={{ marginTop: 12, background: "#fff2d7", color: "#8c5b08" }}>
								<strong>🎂 Birthday in {b.days === 0 ? "today" : b.days + " days"}</strong> · {b.label}
							</div>
						) : (
							<div className="customer-meta" style={{ marginTop: 10 }}>
								Birthday: {b.label}
							</div>
						)}
						<div className="customer-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
							<div className="mini">
								Visits<strong>{s.visits}</strong>
							</div>
							<div className="mini">
								Lifetime value<strong>{money(s.spent)}</strong>
							</div>
							<div className="mini">
								Average spend<strong>{money(s.average)}</strong>
							</div>
						</div>
						<div className="customer-meta">
							Last visit: {s.last || "No purchases"} {s.daysSince != null ? "· " + s.daysSince + " days ago" : ""}
							<br />
							Favourite item: {s.favorite}
							{c.notes && (
								<>
									<br />
									Notes: {c.notes}
								</>
							)}
						</div>
						{c.discountEligible && c.discountValue > 0 && (
							<div className="discount-badge">
								Next visit: {c.discountType === "fixed" ? money(c.discountValue) : c.discountValue + "%"} discount{c.discountExpiry ? " · until " + c.discountExpiry : ""}
							</div>
						)}
						<div className="tools" style={{ marginTop: 14 }}>
							{whatsapp && (
								<button className="btn gold" onClick={() => setMessage({ id: c.id, kind: b.upcoming ? "birthday" : "special" })} disabled={!c.phone}>
									{b.upcoming ? "Birthday WhatsApp" : "WhatsApp Message"}
								</button>
							)}
							<button className="btn out" onClick={() => setCustomerModal({ id: c.id, phone: "", source: "directory" })}>
								Edit Profile
							</button>
							{feedback && (
								<button className="btn out" onClick={() => svc.customers.requestFeedback(c.id)} disabled={!c.email}>
									{due ? "Request Feedback" : "Send Feedback Link"}
								</button>
							)}
						</div>
					</article>
				))}
				{!list.length && <div className="empty">No customers match this CRM filter.</div>}
			</div>
			<CustomerMessageModal target={message} onClose={() => setMessage(null)} />
		</section>
	);
}
