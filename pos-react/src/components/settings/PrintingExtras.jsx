/**
 * Business-wide printing settings that used to share one "Receipt Printing" page with the device connections. Each card saves as soon as it is
 * changed (or with its own Save button): When to print (Printers page), Socials on the receipt (System Options > Receipts) and Order types
 * (System Options > Order Entry). Connections to printers stay per device on the Printers page.
 */
import { useEffect, useState } from "react";
import { hasCapability } from "../../config/capabilities";
import { ORDER_CHANNELS } from "../../config/constants";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { SectionCard, TextRow, ToggleRow } from "./kit/rows";

/** Print the customer receipt / the kitchen ticket automatically after a sale. */
export function PrintWhenCard() {
	const { settings } = useData();
	const { svc, kitchen } = usePos();
	const tickets = useFeature("checkout.kitchenTickets");
	return (
		<SectionCard title="When to print" description="For every device. Which printer prints is set per device below.">
			<ToggleRow id="pw-auto-print" label="Print the customer receipt after each sale" help="Off prints a receipt only when someone asks for it." value={!!settings.autoPrint} onChange={(v) => svc.settings.patchSettings({ autoPrint: v })} />
			{kitchen && tickets && <ToggleRow id="pw-auto-kot" label="Print the kitchen ticket after each sale" value={!!settings.autoPrintKot} onChange={(v) => svc.settings.patchSettings({ autoPrintKot: v })} />}
		</SectionCard>
	);
}

/** Social handles and the QR picture printed at the bottom of every receipt. */
export function SocialsCard() {
	const { settings } = useData();
	const { svc } = usePos();
	const on = useFeature("settings.receiptSocials");
	const saved = { instagram: "", facebook: "", tiktok: "", website: "", ...(settings.receiptSocials || {}) };
	const [socials, setSocials] = useState(saved);
	useEffect(() => setSocials({ instagram: "", facebook: "", tiktok: "", website: "", ...(settings.receiptSocials || {}) }), [settings.receiptSocials]);
	if (!on) return null;
	const dirty = JSON.stringify(saved) !== JSON.stringify(socials);
	const qr = settings.receiptSocialQr;
	const set = (k) => (v) => setSocials((s) => ({ ...s, [k]: v }));
	return (
		<SectionCard title="Socials on the receipt" description="Printed under the footer. The QR picture is printed below every receipt.">
			<TextRow id="so-instagram" label="Instagram" value={socials.instagram} max={80} placeholder="@your_business" onChange={set("instagram")} />
			<TextRow id="so-facebook" label="Facebook" value={socials.facebook} max={80} placeholder="facebook.com/yourbusiness" onChange={set("facebook")} />
			<TextRow id="so-tiktok" label="TikTok" value={socials.tiktok} max={80} placeholder="@your_business" onChange={set("tiktok")} />
			<TextRow id="so-website" label="Website" value={socials.website} max={80} placeholder="https://yourbusiness.com" onChange={set("website")} />
			<div className="sk-row sk-wide">
				<div className="sk-row-text">
					<label htmlFor="so-qr-file">QR picture</label>
					<p className="muted">A PNG, JPG or WebP of your social QR code.</p>
				</div>
				<div className="sk-row-control">
					<input id="so-qr-file" className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => (svc.settings.uploadSocialQr(e.target.files?.[0]), (e.target.value = ""))} />
					{qr && (
						<>
							<img src={qr} alt="Social QR preview" style={{ width: 96, height: 96, objectFit: "contain" }} />
							<button type="button" className="btn out" onClick={() => svc.settings.patchSettings({ receiptSocialQr: "" })}>
								Remove picture
							</button>
						</>
					)}
				</div>
			</div>
			<div className="sk-list-line" style={{ padding: "10px 0 2px" }}>
				<button type="button" className="btn gold" id="save-socials" disabled={!dirty} onClick={() => svc.settings.patchSettings({ receiptSocials: socials })}>
					Save socials
				</button>
				<button type="button" className="btn out" disabled={!dirty} onClick={() => setSocials(saved)}>
					Discard
				</button>
			</div>
		</SectionCard>
	);
}

/** The order types offered at checkout (kitchen businesses). At least one stays on. */
export function OrderTypesCard() {
	const { settings } = useData();
	const { svc } = usePos();
	const on = useFeature("checkout.orderChannels") && hasCapability(settings.businessType, "kitchen");
	if (!on) return null;
	const saved = Array.isArray(settings.orderChannels) && settings.orderChannels.length ? settings.orderChannels.filter((c) => ORDER_CHANNELS.includes(c)) : ORDER_CHANNELS;
	const toggle = (c) => {
		const next = saved.includes(c) ? saved.filter((x) => x !== c) : ORDER_CHANNELS.filter((x) => x === c || saved.includes(x));
		if (next.length) svc.settings.patchSettings({ orderChannels: next });
	};
	return (
		<SectionCard title="Order types offered" description="Only the ticked types appear on the checkout. At least one stays on. Saved as you tick.">
			<div className="sk-checks" style={{ padding: "8px 0" }}>
				{ORDER_CHANNELS.map((c) => (
					<label key={c}>
						<input type="checkbox" data-order-channel={c} checked={saved.includes(c)} disabled={saved.length === 1 && saved.includes(c)} onChange={() => toggle(c)} />
						<span>{c}</span>
					</label>
				))}
			</div>
		</SectionCard>
	);
}
