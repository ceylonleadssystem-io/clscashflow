/**
 * Settings > Device Manager > KDS (pair kitchen screens and set how they behave) and Health (network and POS health at a glance).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { hasCapability } from "../../config/capabilities";
import { KDS_DEFAULTS, cleanKds, kdsError, kdsSettingsOf } from "../../domain/kdsSettings";
import { formatBytes, healthIssues, rateLatency } from "../../domain/health";
import { devicesOf } from "../../domain/devices";
import { kitchenStations } from "../../domain/kitchenStations";
import { NumberRow, PageHeader, SectionCard, SettingRow, ToggleRow } from "../../components/settings/kit/rows";
import { EmptyState, StatusBadge } from "../../components/settings/kit/entities";
import { KdsPairing } from "../../KDS/KdsPairing";
import { kdsLink } from "../../KDS/link";
import { labelPrinter } from "../../services/printing/labelPrinter";
import { receiptPrinter } from "../../services/printing/receiptPrinter";
import { barcodeScanner } from "../../services/printing/scanner";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";

export function KdsPage() {
	const { settings } = useData();
	const { svc, go, canView } = usePos();
	const kdsOn = useFeature("checkout.kds");
	const saved = kdsSettingsOf(settings);
	const [v, setV] = useState(saved);
	const [, tick] = useState(0);
	useEffect(() => setV(saved), [JSON.stringify(saved)]); // eslint-disable-line react-hooks/exhaustive-deps
	useEffect(() => kdsLink.subscribe(() => tick((n) => n + 1)), []);
	const screens = kitchenStations(settings, kdsOn).filter((s) => s.type === "kds");
	const error = kdsError(cleanKds(v));
	const dirty = JSON.stringify(cleanKds(v)) !== JSON.stringify(saved);
	const save = async () => {
		if (error) return;
		await svc.settings.patchSettings({ kdsSettings: cleanKds(v) });
		kdsLink.refresh(); // connected screens pick the new settings up now
	};
	if (!hasCapability(settings.businessType, "kitchen")) return <><PageHeader title="Kitchen Display (KDS)" /><SectionCard><EmptyState title="Not for this type of business">Kitchen screens are for restaurants and cafés.</EmptyState></SectionCard></>;
	if (!kdsOn)
		return (
			<>
				<PageHeader title="Kitchen Display (KDS)" />
				<SectionCard>
					<EmptyState title="Kitchen Display is not switched on">It is a feature of your plan. Contact Ceylonry support to switch it on for this business.</EmptyState>
				</SectionCard>
			</>
		);
	return (
		<>
			<PageHeader
				title="Kitchen Display (KDS)"
				description="Kitchen screens show the tickets for their station. Pair each screen once; it reconnects on its own."
				actions={
					<a className="btn out" href="/KDS" target="_blank" rel="noreferrer" id="open-kds">
						Open the kitchen screen
					</a>
				}
			/>
			<SectionCard title="Screens" description="Open /KDS on each kitchen screen, on the same Wi-Fi as this device, and enter the code it shows.">
				{screens.map((s) => (
					<div className="kds-screen" key={s.id} style={{ padding: "10px 0", borderTop: "1px solid var(--ui-line,#e4e8eb)" }}>
						<div className="sk-list-line">
							<strong>{s.name}</strong>
							<button type="button" className="btn out" onClick={() => svc.printing.testStation(s)}>
								Send a test ticket
							</button>
						</div>
						<KdsPairing stationId={s.id} name={s.name} />
					</div>
				))}
				{!screens.length && (
					<EmptyState title="No kitchen screen yet" action={canView("stations") && <button type="button" className="btn gold" onClick={() => go("stations")}>Add one in Stations</button>}>
						Add a station of type Kitchen Display, then pair a screen to it here.
					</EmptyState>
				)}
				{screens.length > 0 && canView("stations") && (
					<button type="button" className="btn out" onClick={() => go("stations")}>
						Manage stations
					</button>
				)}
			</SectionCard>
			<SectionCard title="Screen settings" description="Sent to every connected screen when you save.">
				<NumberRow id="kds-warn" label="Turn amber after" help="A ticket waiting this long turns amber." value={v.warnMinutes} min={1} max={120} suffix="minutes" onChange={(x) => setV((s) => ({ ...s, warnMinutes: x }))} />
				<NumberRow id="kds-late" label="Turn red after" help="A ticket waiting this long is late." value={v.lateMinutes} min={2} max={240} suffix="minutes" onChange={(x) => setV((s) => ({ ...s, lateMinutes: x }))} error={error && error.startsWith("Late") ? error : ""} />
				<ToggleRow id="kds-sound" label="Beep for a new ticket" help="The kitchen can still switch the sound off on the screen." value={v.sound} onChange={(x) => setV((s) => ({ ...s, sound: x }))} />
				<NumberRow id="kds-recall" label="Recall list" help="How many finished tickets Recall done shows." value={v.recallCount} min={1} max={50} suffix="tickets" onChange={(x) => setV((s) => ({ ...s, recallCount: x }))} error={error && error.startsWith("Recall") ? error : ""} />
				<div className="sk-list-line" style={{ padding: "10px 0 2px" }}>
					<button type="button" className="btn gold" id="save-kds" disabled={!dirty || !!error} onClick={save}>
						Save screen settings
					</button>
					<button type="button" className="btn out" disabled={!dirty && JSON.stringify(saved) === JSON.stringify(KDS_DEFAULTS)} onClick={() => setV(KDS_DEFAULTS)}>
						Reset to standard
					</button>
				</div>
				{error && error.startsWith("Warn") && <p className="sk-error" role="alert">{error}</p>}
			</SectionCard>
		</>
	);
}

const Row = ({ label, children, tone }) => (
	<SettingRow label={label} wide>
		<span className={tone ? "health-" + tone : ""}>{children}</span>
	</SettingRow>
);

export function HealthPage() {
	const data = useData();
	const { settings } = data;
	const { deviceId } = usePos();
	const { cloudStatus, authKind, retrySync } = useSession();
	const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
	const [latency, setLatency] = useState(null);
	const [storage, setStorage] = useState(null);
	const [battery, setBattery] = useState(null);
	const [checkedAt, setCheckedAt] = useState(null);
	const [, tick] = useState(0);
	const conn = typeof navigator !== "undefined" ? navigator.connection || null : null;

	const probe = useCallback(async () => {
		setOnline(navigator.onLine);
		const t0 = performance.now();
		try {
			await fetch(location.origin + "/posv2/?health=" + Date.now(), { method: "HEAD", cache: "no-store" });
			setLatency(performance.now() - t0);
		} catch {
			setLatency(null);
		}
		try {
			const est = await navigator.storage?.estimate?.();
			if (est) setStorage({ usage: est.usage || 0, quota: est.quota || 0, persisted: await navigator.storage.persisted?.() });
		} catch {
			/* not available */
		}
		try {
			const b = await navigator.getBattery?.();
			if (b) setBattery({ level: b.level, charging: b.charging });
		} catch {
			/* not available */
		}
		setCheckedAt(new Date());
	}, []);
	useEffect(() => {
		probe();
		const id = setInterval(probe, 15000);
		const on = () => (setOnline(true), probe());
		const off = () => setOnline(false);
		window.addEventListener("online", on);
		window.addEventListener("offline", off);
		const subs = [receiptPrinter.subscribe(() => tick((n) => n + 1)), labelPrinter.subscribe(() => tick((n) => n + 1)), barcodeScanner.subscribe(() => tick((n) => n + 1)), kdsLink.subscribe(() => tick((n) => n + 1))];
		return () => {
			clearInterval(id);
			window.removeEventListener("online", on);
			window.removeEventListener("offline", off);
			subs.forEach((u) => u());
		};
	}, [probe]);

	const me = devicesOf(settings).find((d) => d.id === deviceId);
	const kds = kdsLink.state();
	const kdsStations = kitchenStations(settings, useFeature("checkout.kds")).filter((s) => s.type === "kds");
	const usbReceipt = !!settings.usbPrinter?.vendorId;
	const usbLabel = !!settings.barcodePrinter?.vendorId;
	const usbScanner = !!settings.usbScanner?.vendorId;
	const kitchenTickets = data.kitchenTickets || [];
	const failedTickets = kitchenTickets.filter((t) => t.status === "printer-unavailable").length;
	const cloud = authKind === "appwrite";
	const printers = [
		{ name: "USB receipt printer", expected: usbReceipt, connected: receiptPrinter.connected },
		{ name: "USB label printer", expected: usbLabel, connected: labelPrinter.status.connected },
		{ name: "USB barcode scanner", expected: usbScanner, connected: barcodeScanner.status.connected },
	];
	const issues = useMemo(
		() => healthIssues({ online, latencyMs: latency, cloud, sync: cloudStatus, storage, battery, printers, kds: { paired: kds.paired, connected: kds.connected, pending: kdsStations[0] ? kdsLink.station(kdsStations[0].id).pending() : 0 }, failedTickets }),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[online, latency, cloud, cloudStatus, storage, battery, kds.paired, kds.connected, failedTickets, receiptPrinter.connected, labelPrinter.status.connected, barcodeScanner.status.connected],
	);
	const dot = (ok) => (ok ? "● " : "○ ");
	return (
		<>
			<PageHeader
				title="Health"
				description="How this device and the POS are doing right now. Checked every 15 seconds."
				actions={
					<button type="button" className="btn out" id="check-health" onClick={probe}>
						Check now
					</button>
				}
				note={checkedAt ? "Last checked " + checkedAt.toLocaleTimeString() : "Checking…"}
			/>
			<SectionCard title="Overall">
				<div className="sk-list-line" style={{ padding: "10px 0" }}>
					<StatusBadge status={issues.length ? "offline" : "online"} />
					<strong>{issues.length ? `${issues.length} thing${issues.length === 1 ? "" : "s"} need attention` : "Everything looks fine"}</strong>
				</div>
				{issues.length > 0 && (
					<ul className="health-issues">
						{issues.map((i) => (
							<li key={i}>{i}</li>
						))}
					</ul>
				)}
			</SectionCard>
			<SectionCard title="Network">
				<Row label="Internet" tone={online ? "ok" : "bad"}>{dot(online) + (online ? "Online" : "Offline")}</Row>
				<Row label="Server response" tone={rateLatency(latency)}>{latency == null ? (online ? "No answer" : "—") : Math.round(latency) + " ms · " + rateLatency(latency)}</Row>
				<Row label="Connection type">{conn ? [conn.effectiveType, conn.downlink ? conn.downlink + " Mbit/s" : "", conn.saveData ? "data saver on" : ""].filter(Boolean).join(" · ") || "Unknown" : "Not reported by this browser"}</Row>
				<Row label="Cloud sync" tone={!cloud ? "" : cloudStatus.state === "retry" || cloudStatus.state === "offline" ? "bad" : "ok"}>
					{cloud ? cloudStatus.message || cloudStatus.state : "This business runs on this device only, so there is no cloud sync."}
					{cloud && cloudStatus.state === "retry" && (
						<button type="button" className="btn out" style={{ marginLeft: 10 }} onClick={retrySync}>
							Retry now
						</button>
					)}
				</Row>
			</SectionCard>
			<SectionCard title="This device">
				<Row label="Name">{me ? me.name + " (" + (me.kind === "orderpad" ? "order pad" : "register") + ")" : "Not registered yet"}</Row>
				<Row label="Browser">{navigator.userAgentData?.platform ? navigator.userAgentData.platform + " · " : ""}{(navigator.userAgent.match(/(Edg|Chrome|Firefox|Safari)\/[\d.]+/g) || []).slice(-1)[0] || navigator.userAgent.slice(0, 60)}</Row>
				<Row label="Screen">{window.screen.width} × {window.screen.height}{"ontouchstart" in window ? " · touch" : ""}</Row>
				<Row label="Storage" tone={storage?.quota && storage.usage / storage.quota > 0.8 ? "bad" : ""}>
					{storage ? `${formatBytes(storage.usage)} of ${formatBytes(storage.quota)} used${storage.persisted ? " · protected from clean-up" : ""}` : "Not reported by this browser"}
				</Row>
				<Row label="Battery" tone={battery && battery.level < 0.2 && !battery.charging ? "bad" : ""}>{battery ? Math.round(battery.level * 100) + "%" + (battery.charging ? " · charging" : "") : "Not reported by this browser"}</Row>
				<Row label="Time zone">{Intl.DateTimeFormat().resolvedOptions().timeZone} · {new Date().toLocaleString()}</Row>
			</SectionCard>
			<SectionCard title="Printers and screens">
				{printers.map((p) => (
					<Row key={p.name} label={p.name} tone={p.expected ? (p.connected ? "ok" : "bad") : ""}>
						{p.expected ? dot(p.connected) + (p.connected ? "Connected" : "Not connected") : "Not set up on this device"}
					</Row>
				))}
				<Row label="Kitchen screens" tone={kds.paired ? (kds.connected ? "ok" : "bad") : ""}>
					{kds.paired ? dot(kds.connected) + (kds.connected ? `${kds.pairedCount} connected` : "Paired, not connected") : "None paired"}
				</Row>
				<Row label="Kitchen tickets not printed" tone={failedTickets ? "bad" : ""}>{failedTickets ? failedTickets + " waiting in the Order Queue" : "None"}</Row>
			</SectionCard>
			<SectionCard title="Data on this device">
				<Row label="Items">{data.products.length.toLocaleString()}</Row>
				<Row label="Sales">{data.sales.length.toLocaleString()}</Row>
				<Row label="Open orders">{(data.openOrders || []).filter((o) => o.status === "open").length}</Row>
				<Row label="Users">{data.users.filter((u) => u.active !== false).length} active</Row>
				<Row label="Last sale">{data.sales[0]?.createdAt ? new Date(data.sales.reduce((a, s) => (s.createdAt > a ? s.createdAt : a), "")).toLocaleString() : "No sales yet"}</Row>
			</SectionCard>
		</>
	);
}
