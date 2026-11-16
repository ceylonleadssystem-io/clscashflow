/**
 * Settings > System Options > QR Menu: one fixed QR code per location that opens the digital menu on a customer's phone.
 * The menu behind the code updates by itself when items, prices or categories change (see hooks/usePublicMenuSync.js).
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PageHeader, SectionCard, SelectRow } from "../../components/settings/kit/rows";
import { StatusBadge } from "../../components/settings/kit/entities";
import { linkKey, linkOf } from "../../domain/publicMenu";
import { usePos } from "../../store/PosProvider";
import { useData } from "../../store/DataProvider";

export function QrMenuPage() {
	const { settings, locations } = useData();
	const { svc, locationId } = usePos();
	const places = (locations || []).filter((l) => l.active !== false);
	const [key, setKey] = useState(linkKey(locationId));
	const [busy, setBusy] = useState(false);
	const [img, setImg] = useState("");
	const link = linkOf(settings, key);
	const on = !!link?.enabled;
	const url = on ? link.url : "";
	const place = key === "all" ? "all locations" : places.find((l) => String(l.id) === key)?.name || "this location";
	useEffect(() => {
		let live = true;
		if (!url) return setImg("");
		QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M" }).then((d) => live && setImg(d)).catch(() => live && setImg(""));
		return () => {
			live = false;
		};
	}, [url]);
	const run = async (fn) => {
		setBusy(true);
		try {
			await fn();
		} finally {
			setBusy(false);
		}
	};
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			/* the link box below can still be selected by hand */
		}
	};
	return (
		<>
			<PageHeader
				title="QR Menu"
				description="Let customers scan a code to see your menu on their phone."
				note="The code never changes. When you edit items, prices or categories the menu behind it updates by itself, so a printed code stays valid."
			/>
			<SectionCard title="QR code">
				{places.length > 1 && (
					<SelectRow
						id="qr-menu-location"
						label="Location"
						help="Each location has its own code that shows only the items sold there."
						value={key}
						onChange={setKey}
						options={[{ value: "all", label: "All locations (every item)" }, ...places.map((l) => ({ value: String(l.id), label: l.name }))]}
					/>
				)}
				<div className="qr-box" data-qr-menu={key}>
					<p>
						QR menu for {place}: <StatusBadge status={on ? "active" : "inactive"} />
					</p>
					{on ? (
						<>
							{img ? <img src={img} alt={"QR code that opens the menu of " + place} width="280" height="280" /> : <div className="muted">Generating QR code…</div>}
							<input className="input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Menu link" />
							<div className="sk-page-actions">
								{img && (
									<a className="btn gold" href={img} download={"menu-qr-" + key + ".png"}>
										Download QR code
									</a>
								)}
								<button type="button" className="btn out" onClick={copy}>
									Copy link
								</button>
								<a className="btn out" href={url} target="_blank" rel="noreferrer">
									Open menu
								</a>
								<button type="button" className="btn out" disabled={busy} onClick={() => run(() => svc.publicMenu.refresh())}>
									Send latest menu now
								</button>
								<button type="button" className="btn danger" disabled={busy} onClick={() => run(() => svc.publicMenu.disable(key))}>
									Turn off
								</button>
							</div>
						</>
					) : (
						<button type="button" className="btn gold" id="qr-menu-on" disabled={busy} onClick={() => run(() => svc.publicMenu.enable(key))}>
							{link ? "Turn QR menu back on" : "Create QR menu"}
						</button>
					)}
					<ol className="qr-steps">
						<li>Create the QR menu, then download the code and print it for tables, the counter or the door.</li>
						<li>Customers scan it with the phone camera and the menu opens: categories, items, descriptions, prices and photos.</li>
						<li>Change the menu as usual. The same code shows the new menu within a few seconds, while this POS is open.</li>
					</ol>
				</div>
			</SectionCard>
		</>
	);
}
