/**
 * Settings > System Options > Online Store: connect a Shopify store so its orders arrive in the POS (Online Orders page).
 * Shopify sends each order to the webhook address shown here; the signing secret proves it came from Shopify. The secret is sent once,
 * stored encrypted and never shown again.
 */
import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "../../components/settings/kit/rows";
import { isAppwrite } from "../../config/env";
import { kitchenMode } from "../../services/pos/common";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useUi } from "../../store/UiProvider";

export function OnlineStorePage() {
	const { svc, locationId } = usePos();
	const ui = useUi();
	const cloud = isAppwrite();
	const { locations: allLocations, settings } = useData();
	const locations = allLocations.filter((l) => l.active !== false);
	const kitchen = kitchenMode(settings);
	const autoKitchen = !!settings.onlineStore?.autoKitchen;
	const [info, setInfo] = useState(null); // { shops, webhookUrl }
	const [shop, setShop] = useState("");
	const [secret, setSecret] = useState("");
	const [currency, setCurrency] = useState("LKR");
	const [rate, setRate] = useState("");
	const [notifyEmail, setNotifyEmail] = useState("");
	const [where, setWhere] = useState(() => (locations.some((l) => l.id === locationId) ? locationId : locations[0]?.id || ""));
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	useEffect(() => {
		if (cloud) svc.onlineOrders.load().then(setInfo, (e) => setError(e.message));
	}, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps
	const nameOf = (id) => locations.find((l) => l.id === id)?.name || "Removed location";
	const run = async (fn) => {
		setBusy(true);
		setError("");
		try {
			return await fn();
		} catch (e) {
			setError(e.message);
		} finally {
			setBusy(false);
		}
	};
	const connect = (e) => {
		e.preventDefault();
		run(async () => {
			setInfo(await svc.onlineOrders.save({ shop: shop.trim(), secret: secret.trim(), locationId: where, currency: currency.trim().toUpperCase(), rate: currency.trim().toUpperCase() === "LKR" ? 1 : Number(rate), notifyEmail: notifyEmail.trim() }));
			setShop("");
			setSecret("");
		});
	};
	const remove = (s) =>
		run(async () => {
			if (await ui.confirm(`Disconnect ${s.shop}? Its orders will stop arriving in the POS.`)) setInfo(await svc.onlineOrders.remove(s.shop));
		});
	const check = () =>
		run(async () => {
			const n = await svc.onlineOrders.pull();
			if (!n) ui.notice("No new online orders.");
		});
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(info.webhookUrl);
			ui.notice("Webhook address copied.");
		} catch {
			/* the address below can still be selected by hand */
		}
	};
	return (
		<>
			<PageHeader title="Online Store" description="Connect your Shopify store so its orders arrive in the POS." note="Orders appear under Online Orders (the cart button at the top) at the location you choose. A Shopify payment type is added for them." />
			{cloud && kitchen && (
				<SectionCard title="Kitchen">
					<label style={{ display: "flex", gap: 10, alignItems: "center" }}>
						<input type="checkbox" id="online-auto-kitchen" checked={autoKitchen} onChange={(e) => svc.onlineOrders.options({ autoKitchen: e.target.checked })} />
						<span>Send each new online order to the kitchen as soon as it arrives</span>
					</label>
					<p className="muted">Off: orders wait under Online Orders until staff open them and send them.</p>
				</SectionCard>
			)}
			{!cloud ? (
				<SectionCard>
					<p className="muted">Online orders need the cloud version of the POS.</p>
				</SectionCard>
			) : !locations.length ? (
				<SectionCard>
					<p className="muted">Add a location first.</p>
				</SectionCard>
			) : (
				<>
					<SectionCard title="Connected stores">
						{info === null ? (
							<p className="muted">Checking…</p>
						) : info.shops.length ? (
							<ul className="plan-bullets" id="online-store-list">
								{info.shops.map((s) => (
									<li key={s.shop} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
										<b>{s.shop}</b>
										<span>orders go to {nameOf(s.locationId)}</span>
										<span className="muted">{s.currency && s.currency !== "LKR" ? `${s.currency} at ${s.rate} LKR` : "LKR"}</span>
										<span className="muted">secret ••{s.last4}</span>
										<span className="muted">{s.lastOrderAt ? "last order " + new Date(s.lastOrderAt).toLocaleString() : "no orders yet"}</span>
										<button type="button" className="btn danger" style={{ marginLeft: "auto" }} disabled={busy} onClick={() => remove(s)}>
											Disconnect
										</button>
									</li>
								))}
							</ul>
						) : (
							<p className="muted">No store connected yet.</p>
						)}
						{info?.shops.length > 0 && (
							<button type="button" className="btn out" disabled={busy} onClick={check}>
								Check for orders now
							</button>
						)}
					</SectionCard>
					<SectionCard title="Connect a store">
						<ol className="qr-steps">
							<li>
								In Shopify admin open <b>Settings &gt; Notifications &gt; Webhooks</b> and create a webhook for <b>Order creation</b>, format JSON, with this address. Add a second one for <b>Order cancellation</b>.
							</li>
							<li>Copy the <b>signing secret</b> Shopify shows on that page and paste it below, with your store address.</li>
							<li>Press Connect. New orders show up within about half a minute while the POS is open.</li>
						</ol>
						{info?.webhookUrl && (
							<div className="field">
								<label htmlFor="online-webhook-url">Webhook address</label>
								<div style={{ display: "flex", gap: 8 }}>
									<input className="input" id="online-webhook-url" readOnly value={info.webhookUrl} onFocus={(e) => e.target.select()} />
									<button type="button" className="btn out" onClick={copy}>
										Copy
									</button>
								</div>
							</div>
						)}
						<form className="form-grid" onSubmit={connect} autoComplete="off">
							<div className="field">
								<label htmlFor="online-shop">Store address</label>
								<input className="input" id="online-shop" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="my-store.myshopify.com" required maxLength={200} />
							</div>
							<div className="field">
								<label htmlFor="online-where">Location that prepares these orders</label>
								<select className="input" id="online-where" value={where} onChange={(e) => setWhere(e.target.value)}>
									{locations.map((l) => (
										<option key={l.id} value={l.id}>
											{l.name || l.code || l.id}
										</option>
									))}
								</select>
							</div>
							<div className="field">
								<label htmlFor="online-currency">Store currency</label>
								<input className="input" id="online-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="LKR" maxLength={3} required />
								<small className="muted">The POS counts in LKR. Another currency is converted with the rate below.</small>
							</div>
							{currency.trim().toUpperCase() !== "LKR" && (
								<div className="field">
									<label htmlFor="online-rate">LKR for 1 {currency.trim().toUpperCase() || "unit"}</label>
									<input className="input" id="online-rate" type="number" min="0" step="any" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="for example 300" required />
									<small className="muted">Change it by connecting the store again.</small>
								</div>
							)}
							<div className="field">
								<label htmlFor="online-notify">E-mail me about orders that arrive while no POS is open (optional)</label>
								<input className="input" id="online-notify" type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="owner@example.com" maxLength={200} />
							</div>
							<div className="field" style={{ gridColumn: "1 / -1" }}>
								<label htmlFor="online-secret">Webhook signing secret</label>
								<input className="input" id="online-secret" type="password" autoComplete="new-password" spellCheck={false} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Paste the secret from Shopify" required maxLength={200} />
								<small className="muted">It is stored encrypted and never shown again. Connecting the same store again replaces it.</small>
							</div>
							{error && (
								<div role="alert" className="ceylo-error" style={{ gridColumn: "1 / -1" }}>
									{error}
								</div>
							)}
							<div style={{ gridColumn: "1 / -1" }}>
								<button className="btn gold" type="submit" id="online-store-connect" disabled={busy || !shop.trim() || !secret.trim()}>
									{busy ? "Connecting…" : "Connect store"}
								</button>
							</div>
						</form>
					</SectionCard>
				</>
			)}
		</>
	);
}
