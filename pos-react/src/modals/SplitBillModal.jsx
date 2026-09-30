import { useEffect } from "react";
import { SPLIT_PAYMENT_METHODS } from "../config/constants";
import { equalSplit } from "../domain/cart";
import { money } from "../domain/format";
import { Modal, ModalBody } from "../components/ui";
import { useCheckout } from "../store/CheckoutProvider";
import { useUi } from "../store/UiProvider";
import { usePos } from "../store/PosProvider";
import { useData } from "../store/DataProvider";
import { currentCashShift } from "../domain/sales";

const num = (v) => {
	const n = Number(String(v ?? "").replace(/,/g, ""));
	return Number.isFinite(n) ? n : 0;
};

/** Split bill: equal shares or custom amounts; each share is taken (paid) separately. */
export function SplitBillModal() {
	const c = useCheckout();
	const ui = useUi();
	const data = useData();
	const { currentUser } = usePos();
	const total = c.totals.total;
	const open = c.splitOpen;
	useEffect(() => {
		if (open && !c.splitPayments.length)
			c.setSplitPayments([
				{ method: "Cash", amount: total / 2, paid: false },
				{ method: "Card", amount: total - total / 2, paid: false },
			]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);
	if (!open) return null;
	const shares = c.splitPayments;
	const allocated = shares.reduce((a, p) => a + (+p.amount || 0), 0);
	const balance = total - allocated;
	const patch = (i, p) => c.setSplitPayments(shares.map((s, j) => (j === i ? { ...s, ...p } : s)));
	const close = () => c.setSplitOpen(false);

	const take = async (i) => {
		const p = shares[i];
		if (p.paid) {
			const { received, change, paidAt, ...rest } = p; // eslint-disable-line no-unused-vars
			return patch(i, { paid: false, received: undefined, change: undefined, paidAt: undefined });
		}
		const amount = num(p.amount);
		if (amount <= 0) return ui.alert("Enter the amount for this share first.");
		if (p.method === "Cash") {
			if (!currentCashShift(data.cashShifts, currentUser?.id)) return ui.alert("Open the cash register before taking this cash payment.");
			const entry = await ui.prompt(`Cash received for Share ${i + 1}\nAmount due: ${money(amount)}`, amount.toFixed(2));
			if (entry === null) return;
			const received = num(entry);
			if (received < amount) return ui.alert("Cash received is less than " + money(amount) + ".");
			patch(i, { amount, paid: true, paidAt: new Date().toISOString(), received, change: Math.max(0, received - amount) });
			return ui.notice(`Share ${i + 1} paid by Cash${received > amount ? " · Change: " + money(received - amount) : ""}`);
		}
		if (!(await ui.confirm(`Confirm ${p.method} payment of ${money(amount)} for Share ${i + 1} was approved.`))) return;
		patch(i, { amount, paid: true, paidAt: new Date().toISOString() });
		ui.notice(`Share ${i + 1} paid by ${p.method}`);
	};

	const apply = async () => {
		if (shares.length < 2) return ui.alert("Add at least two shares.");
		if (shares.some((p) => p.amount <= 0)) return ui.alert("Every share must have an amount greater than zero.");
		if (Math.abs(total - allocated) > 0.01) return ui.alert("The split amounts must equal the order total.");
		close();
		const unpaid = shares.filter((p) => !p.paid).length;
		ui.notice(unpaid ? `${unpaid} split payment${unpaid === 1 ? "" : "s"} still need to be taken.` : "All split payments received. Complete the sale.");
	};

	return (
		<Modal
			id="split-bill-modal"
			open
			title="Split Bill"
			subtitle="Split equally or enter custom amounts and payment methods"
			onClose={close}
			boxStyle={{ width: "min(760px,100%)" }}
			footer={
				<>
					<button
						className="btn out"
						onClick={() => {
							c.setSplitPayments([]);
							close();
						}}
					>
						Use Single Payment
					</button>
					<button className="btn gold" onClick={apply}>
						Continue to Checkout
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="plan-settings">
					<div className="label">Order Total</div>
					<div className="plan-settings-price" id="split-order-total">
						{money(total)}
					</div>
				</div>
				<div className="tools" style={{ margin: "14px 0" }}>
					{[2, 3, 4].map((n) => (
						<button key={n} className="btn out" onClick={() => c.setSplitPayments(equalSplit(total, n))}>
							{n} People
						</button>
					))}
					<button className="btn out" onClick={() => c.setSplitPayments([...shares, { method: "Card", amount: 0, paid: false }])}>
						+ Add Share
					</button>
				</div>
				<div id="split-payment-rows" style={{ display: "grid", gap: 9 }}>
					{shares.map((p, i) => (
						<div className={"split-payment-row " + (p.paid ? "is-paid" : "")} key={i}>
							<div className="split-share-title">
								<strong>Share {i + 1}</strong>
								<span>{p.paid ? "Paid" : "Awaiting payment"}</span>
							</div>
							<select className="input" disabled={p.paid} value={p.method} onChange={(e) => patch(i, { method: e.target.value, paid: false })}>
								{SPLIT_PAYMENT_METHODS.map((m) => (
									<option key={m}>{m}</option>
								))}
							</select>
							<input
								className="input split-share-amount"
								inputMode="decimal"
								disabled={p.paid}
								defaultValue={Number(p.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								key={p.amount + ":" + p.paid}
								onBlur={(e) => patch(i, { amount: num(e.target.value), paid: false })}
								aria-label={"Share " + (i + 1) + " amount"}
							/>
							<button className={"btn " + (p.paid ? "out" : "gold")} type="button" onClick={() => take(i)}>
								{p.paid ? "Undo" : "Take Payment"}
							</button>
							<button className="btn danger" disabled={p.paid} onClick={() => c.setSplitPayments(shares.filter((_, j) => j !== i))}>
								×
							</button>
						</div>
					))}
				</div>
				<div className="plan-total">
					<span>Allocated</span>
					<span id="split-allocated">{money(allocated)}</span>
				</div>
				<div className="plan-settings-note" id="split-balance-note" style={{ color: Math.abs(balance) < 0.01 ? "#168653" : "#a5362b" }}>
					{Math.abs(balance) < 0.01 ? "Fully allocated" : balance > 0 ? money(balance) + " still to allocate" : money(-balance) + " over-allocated"}
				</div>
			</ModalBody>
		</Modal>
	);
}
