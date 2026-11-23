/**
 * Settings > System Options > Online Store: connect a Shopify store so its orders arrive in the POS (Online Orders page).
 * A merchant enters the store address and the location that prepares its orders, then approves the POS app in Shopify; the app subscribes to the
 * store's order webhooks itself and the POS can accept, decline and fulfil orders there. Past orders can be pulled in too. The webhook signing
 * secret is only for a store whose webhooks were made by hand (Advanced); it is sent once, stored encrypted and never shown again.
 */
import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "../../components/settings/kit/rows";
import { isAppwrite } from "../../config/env";
import { kitchenMode } from "../../services/pos/common";
import { useData } from "../../store/DataProvider";
import { usePos } from "../../store/PosProvider";
import { useUi } from "../../store/UiProvider";

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

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
	const [since, setSince] = useState(() => daysAgo(60));
	const [importShop, setImportShop] = useState("");
	const [progress, setProgress] = useState(null); // { imported, skipped, saved, done }
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
	// Shopify's approval page opens in a new tab (opened first so the browser allows it); the POS stays as it is
	const openApproval = async (shopAddress, tab) => {
		try {
			const url = await svc.onlineOrders.accessUrl(shopAddress);
			if (tab) tab.location.href = url;
			else window.location.assign(url);
		} catch (e) {
			tab?.close();
			throw e;
		}
	};
	const connect = (e) => {
		e.preventDefault();
		const tab = window.open("about:blank", "_blank");
		const address = shop.trim();
		run(async () => {
			try {
				setInfo(await svc.onlineOrders.save({ shop: address, secret: secret.trim() || undefined, locationId: where, currency: currency.trim().toUpperCase(), rate: currency.trim().toUpperCase() === "LKR" ? 1 : Number(rate), notifyEmail: notifyEmail.trim() }));
			} catch (err) {
				tab?.close();
				throw err;
			}
			setShop("");
			setSecret("");
			await openApproval(address, tab);
		});
	};
	const connectAccess = (s) => {
		const tab = window.open("about:blank", "_blank");
		run(() => openApproval(s.shop, tab));
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
	const withAccess = (info?.shops || []).filter((s) => s.access);
	const chosen = withAccess.find((s) => s.shop === importShop) || withAccess[0];
	const importPast = () =>
		run(async () => {
			if (chosen.locationId !== locationId) throw new Error(`Past orders of ${chosen.shop} are kept at ${nameOf(chosen.locationId)}. Choose that location in the top bar first, then import.`);
			setProgress({ imported: 0, skipped: 0, saved: 0, done: false });
			const out = await svc.onlineOrders.importPast({ shop: chosen.shop, since, onProgress: (p) => setProgress({ ...p, done: false }) });
			setProgress({ ...out, done: true });
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
						<span>Send an online order to the kitchen when I accept it</span>
					</label>
					<p className="muted">Off: accepting an order does not send it to the kitchen.</p>
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
										<span className={s.access ? "badge" : "muted"} data-access={s.access ? "yes" : "no"}>
											{s.access ? "Shopify connected" : "Shopify approval needed"}
										</span>
										{s.access && s.webhooksError && <span className="muted" title={s.webhooksError}>New orders will not arrive yet: {s.webhooksError}</span>}
										<span className="muted">{s.lastOrderAt ? "last order " + new Date(s.lastOrderAt).toLocaleString() : "no orders yet"}</span>
										<button type="button" className="btn out" disabled={busy} onClick={() => connectAccess(s)}>
											{s.access ? "Reconnect Shopify" : "Approve in Shopify"}
										</button>
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
							<li>Enter your store address and the location that prepares its orders, then press <b>Connect store</b>.</li>
							<li>A Shopify tab opens: approve the Ceylonry POS app (install it first if Shopify asks). That is all: new orders arrive by themselves and accepting, declining and fulfilling them updates Shopify too.</li>
						</ol>
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
							<details style={{ gridColumn: "1 / -1" }}>
								<summary>Advanced: I made the webhooks in Shopify myself</summary>
								<div style={{ display: "grid", gap: 10, marginTop: 8 }}>
									<p className="muted">Only for a store whose order webhooks were created by hand in Shopify (Settings &gt; Notifications &gt; Webhooks). Give Shopify this address for Order creation and Order cancellation (JSON), and paste the signing secret it shows.</p>
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
									<div className="field">
										<label htmlFor="online-secret">Webhook signing secret</label>
										<input className="input" id="online-secret" type="password" autoComplete="new-password" spellCheck={false} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Leave empty when you approve the app in Shopify" maxLength={200} />
										<small className="muted">It is stored encrypted and never shown again.</small>
									</div>
								</div>
							</details>
							{error && (
								<div role="alert" className="ceylo-error" style={{ gridColumn: "1 / -1" }}>
									{error}
								</div>
							)}
							<div style={{ gridColumn: "1 / -1" }}>
								<button className="btn gold" type="submit" id="online-store-connect" disabled={busy || !shop.trim()}>
									{busy ? "Connecting…" : "Connect store"}
								</button>
							</div>
						</form>
					</SectionCard>
					{withAccess.length > 0 && (
						<SectionCard title="Past orders">
							<p className="muted">
								Pull in the orders the store already has, not only new ones. Orders still waiting arrive as New; fulfilled and cancelled ones are kept as history. Nothing is taken out of stock, no sale is recorded and nothing goes to the kitchen. Customers are added to the CRM. Shopify normally shares the last 60 days; older orders need the app to be approved for "Read all orders" in the Shopify Dev Dashboard.
							</p>
							<div className="form-grid">
								{withAccess.length > 1 && (
									<div className="field">
										<label htmlFor="import-shop">Store</label>
										<select className="input" id="import-shop" value={chosen.shop} onChange={(e) => setImportShop(e.target.value)}>
											{withAccess.map((s) => (
												<option key={s.shop} value={s.shop}>
													{s.shop}
												</option>
											))}
										</select>
									</div>
								)}
								<div className="field">
									<label htmlFor="import-since">Orders since</label>
									<input className="input" id="import-since" type="date" value={since} max={daysAgo(0)} onChange={(e) => setSince(e.target.value)} />
								</div>
							</div>
							<div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
								<button type="button" className="btn gold" id="import-past-orders" disabled={busy || !since} onClick={importPast}>
									{busy && progress && !progress.done ? "Importing…" : "Import past orders"}
								</button>
								{progress && (
									<span role="status" className="muted" id="import-progress">
										{progress.done ? "Done: " : ""}
										{progress.imported} found{progress.skipped ? `, ${progress.skipped} already here` : ""}, {progress.saved} added to the POS
									</span>
								)}
							</div>
						</SectionCard>
					)}
				</>
			)}
		</>
	);
}
