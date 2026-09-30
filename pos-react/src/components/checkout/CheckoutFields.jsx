import { useEffect, useMemo, useState } from "react";
import { PAYMENT_ICONS, PAYMENT_METHODS, PLATFORM_CHANNELS } from "../../config/constants";
import { birthdayInfo, customerInsights, customerSegment } from "../../domain/analytics";
import { money, today } from "../../domain/format";
import { NumberInput } from "../ui";
import { FieldError } from "../ui/FieldError";
import { cleanPhoneInput, emailError } from "../../domain/validators";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { useCheckout } from "../../store/CheckoutProvider";
import { usePos } from "../../store/PosProvider";

/** Customer, discount, order reference/channel, payment, cash tender, split, receipt options. */
export function CheckoutFields() {
	return (
		<div className="checkout-fields">
			<CustomerSection />
			<DiscountSection />
			<ReferenceSection />
			<PaymentSection />
			<ReceiptOptions />
		</div>
	);
}

function CustomerSection() {
	const data = useData();
	const c = useCheckout();
	const enabled = useFeature("checkout.customerLookup");
	const smart = useFeature("crm.smartCustomer");
	const industry = useFeature("industry.tools");
	const customer = data.customers.find((x) => x.id === c.customerId);
	const insights = useMemo(() => (customer && smart ? customerInsights(customer, data.sales) : null), [customer, smart, data.sales]);
	const birthday = customer ? birthdayInfo(customer) : null;
	const membership = useMemo(() => {
		if (!customer || !industry) return null;
		const t = today();
		return data.memberships.find((m) => m.customerId === customer.id && m.status === "Active" && (!m.start || m.start <= t) && (!m.end || m.end >= t));
	}, [customer, industry, data.memberships]);
	const discountsOn = useFeature("customers.discounts");
	const customerDiscount = !!(discountsOn && customer?.discountEligible && Number(customer.discountValue) > 0 && (!customer.discountExpiry || customer.discountExpiry >= today()));
	if (!enabled) return null;
	return (
		<>
			<div className="label">Customer (optional)</div>
			<div className="customer-lookup">
				<input
					className="input"
					id="customer-phone-search"
					inputMode="tel"
					placeholder="Find by mobile number"
					value={c.phoneSearch}
					onChange={(e) => c.setPhoneSearch(cleanPhoneInput(e.target.value))}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							c.findCustomerByPhone();
						}
					}}
				/>
				<button className="btn out" type="button" onClick={c.findCustomerByPhone}>
					Find
				</button>
				<button className="btn" type="button" onClick={() => c.setCustomerModal({ id: "", phone: "", source: "checkout" })}>
					+ New Customer
				</button>
			</div>
			<div className={"customer-find-note" + (c.findNote.error ? " not-found" : "")} id="customer-find-note">
				{c.findNote.text}
				{c.findNote.addPhone && (
					<span className="customer-find-actions">
						<button className="btn out" type="button" onClick={() => c.setCustomerModal({ id: "", phone: c.findNote.addPhone, source: "checkout" })}>
							+ Add with this number
						</button>
					</span>
				)}
			</div>
			<div className={"customer-tab" + (customer ? " show" : "")} id="customer-tab">
				<div>
					<strong id="customer-tab-name">{customer?.name}</strong>
					<span id="customer-tab-detail">{customer ? customer.phone + (customer.email ? " · " + customer.email : "") : ""}</span>
				</div>
				<button className="btn out" type="button" onClick={c.clearCustomer}>
					Use walk-in
				</button>
			</div>
			{customer && customerDiscount && (
				<div className="print-note" id="customer-next-visit-discount" style={{ margin: "6px 0" }}>
					<strong>Next-visit discount:</strong> {customer.discountType === "fixed" ? money(customer.discountValue) : customer.discountValue + "%"}
					{customer.discountNote ? " · " + customer.discountNote : ""}{" "}
					<button className="btn out" type="button" style={{ marginLeft: 8 }} onClick={() => c.prefillDiscount(customer.discountType || "percent", Number(customer.discountValue))}>
						Apply
					</button>
				</div>
			)}
			{customer && (insights || membership) && (
				<div id="smart-customer-checkout" className="plan-settings">
					{insights && (
						<>
							<div className="label">Smart Customer</div>
							<div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 7 }}>
								<strong>
									{customerSegment(insights)} · {insights.visits} visit{insights.visits === 1 ? "" : "s"}
								</strong>
								<strong>{money(insights.spent)} lifetime</strong>
							</div>
							<div className="plan-settings-note" style={{ marginTop: 5 }}>
								Average {money(insights.average)} · Last visit {insights.last || "none"} · Favourite: {insights.favorite}
								{birthday.upcoming ? " · 🎂 Birthday in " + birthday.days + " days" : ""}
							</div>
							{birthday.upcoming && (
								<button className="btn gold" style={{ marginTop: 9, width: "100%" }} onClick={() => c.prefillDiscount("percent", 10)}>
									Apply 10% Birthday Reward
								</button>
							)}
						</>
					)}
					{membership && (
						<div className="print-note" style={{ marginTop: 8 }}>
							<strong>{membership.name}</strong> · {Number(membership.discount)}% discount{" "}
							<button className="btn out" style={{ marginLeft: 8 }} onClick={() => c.prefillDiscount("percent", Number(membership.discount || 0))}>
								Apply
							</button>
						</div>
					)}
				</div>
			)}
		</>
	);
}

function DiscountSection() {
	const c = useCheckout();
	const enabled = useFeature("checkout.discounts");
	const [type, setType] = useDiscountDraft(c);
	if (!enabled) return null;
	const amount = c.totals.discount;
	return (
		<div id="discount-panel" className="plan-settings" style={{ margin: "6px 0" }}>
			<label className="discount-toggle">
				<input type="checkbox" id="use-order-discount" checked={c.discountOn} onChange={(e) => c.toggleDiscount(e.target.checked)} /> Add an order discount
			</label>
			{c.discountOn && (
				<div id="discount-fields">
					<div className="customer-lookup" style={{ marginTop: 8 }}>
						<select className="input" id="discount-type" aria-label="Discount type" value={type.type} onChange={(e) => setType.type(e.target.value)}>
							<option value="percent">Percentage %</option>
							<option value="fixed">Fixed LKR</option>
						</select>
						<NumberInput id="discount-value" value={type.value} onChange={setType.value} placeholder="Value" aria-label="Discount value" />
						<button className="btn out" type="button" onClick={() => c.applyDiscount(type.type, type.value)}>
							Apply
						</button>
					</div>
					<div className="plan-settings-note" id="discount-note" style={{ marginTop: 7 }}>
						{amount ? (
							<>
								Discount: <strong>-{money(amount)}</strong>{" "}
								<button className="line-edit" onClick={c.clearDiscount}>
									Remove
								</button>
							</>
						) : (
							"No discount applied."
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function useDiscountDraft(c) {
	const [type, setType] = useState(c.discount.type || "percent");
	const [value, setValue] = useState(c.discount.value ? String(c.discount.value) : "");
	useEffect(() => {
		setType(c.discount.type || "percent");
		setValue(c.discount.value ? String(c.discount.value) : "");
	}, [c.discount.type, c.discount.value]);
	return [{ type, value }, { type: setType, value: setValue }];
}

function ReferenceSection() {
	const c = useCheckout();
	const { kitchen } = usePos();
	const reference = useFeature("checkout.orderReference");
	const channels = useFeature("checkout.orderChannels");
	const platform = kitchen && channels && PLATFORM_CHANNELS.includes(c.orderChannel);
	return (
		<>
			{kitchen && channels && (
				<div id="order-channel-fields" className="order-channel-fields" aria-hidden="false">
					<select className="input" id="order-channel" aria-label="Order source" value={c.orderChannel} onChange={(e) => c.setOrderChannel(e.target.value)}>
						{c.channels.map((ch) => (
							<option key={ch} value={ch}>
								{ch}
							</option>
						))}
					</select>
					{platform && (
						<input
							className="input"
							id="platform-order-id"
							placeholder="Platform order number"
							aria-label="PickMe or Uber Eats order number"
							value={c.platformOrderId}
							onChange={(e) => c.setPlatformOrderId(e.target.value)}
						/>
					)}
				</div>
			)}
			{reference && (
				<input
					className="input"
					id="order-reference"
					placeholder={kitchen ? "Table / order reference (optional)" : "Sale reference (optional)"}
					aria-label={kitchen ? "Table or order reference" : "Sale reference"}
					style={{ display: "block" }}
					value={c.orderReference}
					onChange={(e) => c.setOrderReference(e.target.value)}
				/>
			)}
		</>
	);
}

function PaymentSection() {
	const c = useCheckout();
	const cashTender = useFeature("checkout.cashTender");
	const split = useFeature("checkout.splitBill");
	const locked = c.splitPayments.length > 0;
	const cashDue = useMemo(() => {
		const splitCash = c.splitPayments.filter((p) => p.method === "Cash").reduce((s, p) => s + (+p.amount || 0), 0);
		return splitCash || c.payment === "Cash" ? splitCash || c.totals.total : 0;
	}, [c.splitPayments, c.payment, c.totals.total]);
	const given = Number(String(c.cashTendered || "").replace(/,/g, "")) || 0;
	const difference = given - cashDue;
	return (
		<>
			<div id="payment-method-picker" className="payment-method-picker" role="group" aria-label="Payment method">
				{PAYMENT_METHODS.map((m) => (
					<button
						type="button"
						key={m}
						className={"payment-choice " + (m === c.payment ? "active" : "")}
						data-payment={m}
						aria-pressed={m === c.payment}
						disabled={locked}
						onClick={() => {
							c.setPayment(m);
							if (m !== "Cash") c.setCashTendered("");
						}}
					>
						<span aria-hidden="true">{PAYMENT_ICONS[m] || "•"}</span>
						{m}
					</button>
				))}
			</div>
			{cashTender && cashDue > 0 && (
				<div id="cash-tender-panel" className="cash-tender-panel">
					<div className="label">Cash received</div>
					<div className="cash-tender-entry">
						<NumberInput
							id="cash-tendered"
							value={c.cashTendered}
							onChange={c.setCashTendered}
							placeholder="Amount given by customer"
							aria-label="Cash amount given by customer"
						/>
						<button className="btn out" id="cash-exact" type="button" onClick={() => c.setCashTendered(cashDue.toFixed(2))}>
							Exact {money(cashDue)}
						</button>
					</div>
					<div className={"cash-change-row" + (difference < 0 ? " short" : "")} id="cash-change-row">
						<span id="cash-change-label">{difference < 0 ? "Still required" : "Change to give"}</span>
						<strong id="cash-change">{money(Math.abs(difference))}</strong>
					</div>
				</div>
			)}
			{split && (
				<>
					<button className="btn out" id="split-bill-button" type="button" onClick={() => (c.cart.length ? c.setSplitOpen(true) : null)}>
						Split Bill
					</button>
					<div id="split-payment-note" className="customer-find-note">
						{locked && (
							<>
								<strong>Split payment:</strong> {c.splitPayments.map((p) => p.method + " " + money(p.amount)).join(" · ")}{" "}
								<button className="line-edit" onClick={() => c.setSplitPayments([])}>
									Remove
								</button>
							</>
						)}
					</div>
				</>
			)}
		</>
	);
}

function ReceiptOptions() {
	const c = useCheckout();
	const email = useFeature("checkout.emailReceipt");
	const whatsapp = useFeature("checkout.whatsappReceipt");
	const print = useFeature("checkout.printReceipt");
	return (
		<>
			{email && (
				<>
					<label className="muted">
						<input type="checkbox" id="send-receipt" checked={c.wantsEmail} onChange={(e) => c.toggleEmail(e.target.checked)} /> Email receipt requested
					</label>
					{c.wantsEmail && (
						<>
							<input className={"input" + (emailError(c.receiptEmail) ? " invalid" : "")} id="receipt-email" type="email" placeholder="Customer email" value={c.receiptEmail} onChange={(e) => c.setReceiptEmail(e.target.value)} autoFocus />
							<FieldError message={emailError(c.receiptEmail)} />
						</>
					)}
				</>
			)}
			{whatsapp && (
				<label className="muted">
					<input type="checkbox" id="send-whatsapp" checked={c.wantsWhatsApp} onChange={(e) => c.setWantsWhatsApp(e.target.checked)} /> Prepare WhatsApp receipt after checkout
				</label>
			)}
			{print && (
				<label className="muted receipt-print-choice">
					<input type="checkbox" id="print-sale-receipt" checked={c.printAfter} onChange={(e) => c.setPrintAfter(e.target.checked)} /> Print receipt after checkout
				</label>
			)}
		</>
	);
}
