import { useState } from "react";
import { BUSINESS_TYPE_OPTIONS, POS_TYPE_PRESETS, KITCHEN_TYPES } from "../../config/presets";
import { ORDER_CHANNELS, UI_THEMES, POS_BASE_PRICE, POS_INCLUDED_USERS, POS_EXTRA_USER_PRICE } from "../../config/constants";
import { env } from "../../config/env";
import { money, posMonthlyPrice } from "../../domain/format";
import { Panel, Field } from "../ui";
import { FieldError } from "../ui/FieldError";
import { emailError } from "../../domain/validators";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { openBankTransfer } from "../../services/platform.service";
import { LocationEditorModal } from "../../modals/LocationEditorModal";
import { HardwarePanel } from "./HardwarePanel";

/** Individual Settings panels. Each takes the shared `form` state from Settings.jsx. */

export function BusinessProfilePanel({ form, set }) {
	const { svc } = usePos();
	const logoOn = useFeature("settings.businessLogo");
	const logo = useData().settings.logo;
	return (
		<Panel title="Business Profile" subtitle="Shown on customer receipts and internal printouts">
			<div className="modal-body">
				<div className="form-grid">
					<Field label="Business Name">
						<input className="input" id="set-business" value={form.business} onChange={set("business")} />
					</Field>
					<Field label="Business Email">
						<input className={"input" + (emailError(form.email) ? " invalid" : "")} id="set-email" type="email" value={form.email} onChange={set("email")} />
						<FieldError message={emailError(form.email)} />
					</Field>
					<Field label="Business Address" full>
						<textarea className="input" id="set-address" rows={2} value={form.address} onChange={set("address")} />
					</Field>
					{logoOn && (
						<Field label="Business Logo" full>
							<div className="image-preview" id="set-logo-preview" role="img" aria-label="Business logo preview">
								{logo ? <img src={logo} alt="Business logo" /> : "No logo selected"}
							</div>
							<div className="business-logo-actions">
								<label className="btn business-logo-choose" htmlFor="business-logo-file">
									Choose Logo
								</label>
								<button className="btn out business-logo-remove" type="button" onClick={svc.settings.removeBusinessLogo}>
									Remove
								</button>
							</div>
							<input
								className="input business-logo-file"
								id="business-logo-file"
								type="file"
								accept="image/*"
								onChange={(e) => {
									svc.settings.uploadBusinessLogo(e.target.files?.[0]);
									e.target.value = "";
								}}
							/>
							<span className="business-logo-help">PNG, JPG or WebP · transparent background recommended</span>
						</Field>
					)}
				</div>
			</div>
		</Panel>
	);
}

export function LocationsPanel() {
	const data = useData();
	const [editing, setEditing] = useState(null);
	return (
		<>
			<div className="panel" id="business-locations-panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Business Locations</div>
						<div className="muted">Branches are available for every business and POS type</div>
					</div>
					<button className="btn" type="button" onClick={() => setEditing("")}>
						+ Add Location
					</button>
				</div>
				<div className="modal-body">
					<div className="location-grid" id="business-location-list">
						{data.locations.map((loc) => (
							<div className={"location-card " + (loc.active === false ? "inactive" : "")} key={loc.id}>
								<div>
									<strong>{loc.name}</strong> <span className="badge">{loc.code || ""}</span>
									<div className="location-meta">
										{loc.address || "No address"}
										{loc.phone ? " · " + loc.phone : ""} · {loc.active === false ? "Inactive" : "Active"}
									</div>
								</div>
								<div className="tools">
									<button className="btn out" type="button" onClick={() => setEditing(loc.id)}>
										Edit
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
			<LocationEditorModal id={editing} open={editing !== null} onClose={() => setEditing(null)} />
		</>
	);
}

export function PosTypePanel({ form, set, onApplyPreset }) {
	const preset = POS_TYPE_PRESETS[form.businessType] || POS_TYPE_PRESETS.other;
	const wizard = useFeature("settings.posSetupWizard");
	return (
		<Panel
			title="POS Type"
			subtitle="Choose the preset that best matches this business"
			actions={
				wizard && (
					<button className="btn out" onClick={onApplyPreset}>
						Apply Preset Defaults
					</button>
				)
			}
		>
			<div className="modal-body">
				<div className="category-feature-note">
					<strong>Category scope</strong>
					<br />
					Only POS type, category and catalogue behavior belong here. Business identity, printing, feedback, billing and support stay in their own settings sections so each category remains focused.
				</div>
				<div className="field">
					<label>Business / POS Type</label>
					<select className="input" id="set-business-type" value={form.businessType} onChange={set("businessType")}>
						{BUSINESS_TYPE_OPTIONS.map((t) => (
							<option key={t} value={t}>
								{t === "cafe" ? "Café / Bakery" : POS_TYPE_PRESETS[t].label}
							</option>
						))}
					</select>
				</div>
				<div className="plan-settings-note" id="business-type-note" style={{ marginTop: 8 }}>
					{preset.note}
				</div>
			</div>
		</Panel>
	);
}

export function ServiceChargePanel({ form, set }) {
	return (
		<div className="panel service-charge-settings" id="service-charge-settings">
			<div className="panel-head">
				<div>
					<div className="panel-title">Service Charge</div>
					<div className="muted">Optional percentage added to every bill for any business type</div>
				</div>
			</div>
			<div className="modal-body">
				<label className="service-charge-toggle">
					<input type="checkbox" id="set-service-charge-enabled" checked={form.serviceChargeEnabled} onChange={set("serviceChargeEnabled")} /> Add a service charge to bills
				</label>
				<div className="field" id="service-charge-rate-field" style={{ marginTop: 14, maxWidth: 280 }}>
					<label>Service charge percentage per bill</label>
					<div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }}>
						<input
							className="input"
							id="set-service-charge-rate"
							type="number"
							min="0"
							max="100"
							step="0.1"
							value={form.serviceChargeRate}
							disabled={!form.serviceChargeEnabled}
							onChange={set("serviceChargeRate")}
						/>
						<strong>%</strong>
					</div>
				</div>
				<div className="plan-settings-note" style={{ marginTop: 9 }}>
					The charge is calculated after any order discount and appears separately in the checkout total and receipt.
				</div>
			</div>
		</div>
	);
}

export function AppearancePanel() {
	const { svc } = usePos();
	const theme = useData().settings.uiTheme || "ceylonry";
	return (
		<div className="panel" id="pos-theme-settings">
			<div className="panel-head">
				<div>
					<div className="panel-title">Appearance</div>
					<div className="muted">Choose the colour theme used on this device and account.</div>
				</div>
			</div>
			<div className="modal-body">
				<div className="settings-theme-picker" role="group" aria-label="POS colour theme">
					{UI_THEMES.map((t) => (
						<button
							key={t.id}
							type="button"
							className={"settings-theme-option" + (theme === t.id ? " active" : "")}
							data-theme={t.id}
							aria-pressed={theme === t.id}
							style={{ "--swatch": t.color }}
							onClick={() => svc.settings.setTheme(t.id, t.label)}
						>
							<span className="theme-option-swatch" />
							<span>
								<strong>{t.label}</strong>
								<small>{t.note}</small>
							</span>
							<span className="theme-option-check">✓</span>
						</button>
					))}
				</div>
				<div className="plan-settings-note" style={{ marginTop: 10 }}>
					Your selection is saved automatically and restored when you return.
				</div>
			</div>
		</div>
	);
}

export function PrintingPanel({ form, set, setForm }) {
	const { svc, kitchen, currentUser } = usePos();
	const data = useData();
	const socialsOn = useFeature("settings.receiptSocials");
	const channelsOn = useFeature("checkout.orderChannels");
	const tickets = useFeature("checkout.kitchenTickets");
	const fullSettings = ["owner", "manager", "admin"].includes(currentUser?.role);
	const foodService = KITCHEN_TYPES.includes(form.businessType);
	const qr = data.settings.receiptSocialQr;
	const preview = ["instagram", "facebook", "tiktok", "website"].map((k) => form.socials[k]?.trim()).filter(Boolean).join(" · ");
	const toggleChannel = (name) =>
		setForm((f) => ({ ...f, orderChannels: f.orderChannels.includes(name) ? f.orderChannels.filter((c) => c !== name) : [...f.orderChannels, name] }));
	const setSocial = (key) => (e) => setForm((f) => ({ ...f, socials: { ...f.socials, [key]: e.target.value } }));
	return (
		<Panel title="Receipts & Printing" subtitle="Customer receipt and kitchen ticket settings">
			<div className="modal-body">
				{!fullSettings && (
					<div className="print-note">Printer connection settings are available to every staff user so checkout can recover quickly if a USB printer disconnects.</div>
				)}
				<div className="form-grid">
					<Field label="Receipt Printer">
						<select className="input" id="set-printer-type" value={form.printerType} onChange={set("printerType")}>
							<option value="system">System / Bluetooth paired printer</option>
							<option value="epson-network">Epson network printer</option>
							<option value="usb-direct">Direct USB ESC/POS printer (80 mm)</option>
						</select>
					</Field>
					<Field label="Epson Printer Address">
						<input className="input" id="set-printer-address" placeholder="IP address (optional)" value={form.printerAddress} onChange={set("printerAddress")} />
					</Field>
					<Field>
						<label>
							<input type="checkbox" id="set-auto-print" checked={form.autoPrint} onChange={set("autoPrint")} /> Print customer receipt after sale
						</label>
					</Field>
					{kitchen && tickets && (
						<>
							<Field>
								<label>
									<input type="checkbox" id="set-auto-kot" checked={form.autoPrintKot} onChange={set("autoPrintKot")} /> Print KOT after sale
								</label>
							</Field>
							<Field label="KOT / Kitchen Printer Name">
								<input className="input" id="set-kot-printer" placeholder="Kitchen, Bar, Epson TM-T20..." value={form.kotPrinter} onChange={set("kotPrinter")} />
							</Field>
						</>
					)}
					<Field label="Receipt Footer">
						<input className="input" id="set-receipt-footer" placeholder="Thank you for your purchase" value={form.receiptFooter} onChange={set("receiptFooter")} />
					</Field>
				</div>
				<div className="tools" style={{ marginTop: 12 }}>
					<button className="btn out" type="button" onClick={svc.printing.printTestReceipt}>
						Print Test Receipt
					</button>
					{kitchen && tickets && (
						<button className="btn out" type="button" onClick={svc.printing.printTestKot}>
							Print Test KOT
						</button>
					)}
				</div>
				<div className="print-note">
					{foodService
						? "Bluetooth/USB printers must first be paired with the device. KOTs exclude prices and clearly show quantities and modifiers for preparation staff."
						: "Bluetooth/USB printers must first be paired with the device before printing customer receipts."}
				</div>
				{foodService && channelsOn && (
					<div id="order-channel-settings" className="plan-settings">
						<div className="label">Available checkout order types</div>
						<div className="channel-setting-grid">
							{ORDER_CHANNELS.map((c) => (
								<label key={c}>
									<input type="checkbox" data-order-channel={c} checked={form.orderChannels.includes(c)} onChange={() => toggleChannel(c)} /> {c}
								</label>
							))}
						</div>
						<div className="plan-settings-note">Only selected order types appear during checkout. Keep at least one enabled.</div>
					</div>
				)}
				{socialsOn && (
					<section id="receipt-social-settings" className="receipt-social-settings">
						<div className="label">Socials on receipt</div>
						<div className="plan-settings-note">Add any social handles or links. Upload the business social QR artwork to print it below every receipt.</div>
						<div className="form-grid" style={{ marginTop: 12 }}>
							<Field label="Instagram">
								<input className="input" id="set-social-instagram" placeholder="@your_business" value={form.socials.instagram} onChange={setSocial("instagram")} />
							</Field>
							<Field label="Facebook">
								<input className="input" id="set-social-facebook" placeholder="facebook.com/yourbusiness" value={form.socials.facebook} onChange={setSocial("facebook")} />
							</Field>
							<Field label="TikTok">
								<input className="input" id="set-social-tiktok" placeholder="@your_business" value={form.socials.tiktok} onChange={setSocial("tiktok")} />
							</Field>
							<Field label="Website">
								<input className="input" id="set-social-website" placeholder="https://yourbusiness.com" value={form.socials.website} onChange={setSocial("website")} />
							</Field>
							<Field label="Social QR artwork" full>
								<input
									className="input"
									id="set-social-qr-file"
									type="file"
									accept="image/png,image/jpeg,image/webp"
									onChange={(e) => {
										svc.settings.uploadSocialQr(e.target.files?.[0]);
										e.target.value = "";
									}}
								/>
								<button className="btn out" id="remove-social-qr" type="button" onClick={() => svc.settings.patchSettings({ receiptSocialQr: "" })}>
									Remove QR artwork
								</button>
							</Field>
						</div>
						<div className="receipt-social-preview">
							{qr && <img id="social-qr-preview" alt="Social QR preview" src={qr} />}
							<div>
								<strong>Receipt preview</strong>
								<div className="plan-settings-note" id="social-receipt-preview">
									{preview || "No social details added yet."}
								</div>
							</div>
						</div>
					</section>
				)}
				<HardwarePanel />
			</div>
		</Panel>
	);
}

export function FeedbackPanel({ form, set }) {
	return (
		<Panel title="Customer Feedback">
			<div className="modal-body">
				<div className="form-grid">
					<Field label="Feedback Link">
						<input className="input" id="set-feedback" placeholder="Google review or feedback form URL" value={form.feedbackLink} onChange={set("feedbackLink")} />
					</Field>
					<Field label="Feedback Delay (days)">
						<input className="input" id="set-delay" type="number" min="0" value={form.feedbackDelay} onChange={set("feedbackDelay")} />
					</Field>
				</div>
			</div>
		</Panel>
	);
}

export function BillingPanel() {
	const { billing, authKind } = useSession();
	if (authKind !== "appwrite" || !billing.profile) return null;
	const p = billing.profile;
	const paid = p.paid === true || ["active", "manual-paid", "receipt-submitted", "payment-submitted"].includes(String(p.subscriptionStatus || "").toLowerCase());
	const due = paid ? p.nextPaymentDue : p.trialEnd;
	return (
		<div id="settings-billing-widgets">
			<div id="cls-billing-widget" className="react-billing-widget panel">
				<div className="panel-head">
					<div>
						<div className="panel-title">Billing</div>
						<div className="muted">
							{paid ? "Your paid subscription is active." : "Your first payment becomes due when the 15-day trial ends."}
							{due ? " " + (paid ? "Next payment due: " : "Trial ends: ") + new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + "." : ""}
						</div>
					</div>
					<button className="btn gold" type="button" onClick={() => openBankTransfer(p)}>
						Pay by bank transfer
					</button>
				</div>
				<div className="modal-body">
					<div className="plan-settings-note billing-settings-note">
						Monthly renewals show the next monthly due date. Annual renewals show the next yearly due date. Warnings begin three days before payment is due; the due date has a one-day grace period before access pauses.
					</div>
				</div>
			</div>
		</div>
	);
}

export function PlanSupportPanel({ form, set, onRegenerate }) {
	const { svc, currentUser, setWelcomeUser } = usePos();
	const data = useData();
	const supportOn = useFeature("settings.supportAccess");
	const s = data.settings;
	const [enabled, setEnabled] = [form.supportEnabled, (v) => set("supportEnabled")({ target: { type: "checkbox", checked: v } })];
	const total = posMonthlyPrice(form.posUsers);
	const expires = s.supportCodeExpiresAt;
	return (
		<Panel title="Plan & Support">
			<div className="modal-body">
				<div className="plan-settings">
					<div className="plan-settings-head">
						<div>
							<div className="label">POS subscription</div>
							<div className="plan-settings-price">LKR {POS_BASE_PRICE.toLocaleString()} / month</div>
						</div>
						<div className="plan-settings-note">
							Includes up to {POS_INCLUDED_USERS} users.
							<br />
							Each additional user: LKR {POS_EXTRA_USER_PRICE}/month.
						</div>
					</div>
					<div className="field">
						<label>Number of POS users</label>
						<input className="input" id="set-pos-users" type="number" min="1" step="1" value={form.posUsers} onChange={set("posUsers")} />
					</div>
					<div className="plan-total">
						<span>Estimated monthly price</span>
						<span id="pos-plan-total">{money(total)}</span>
					</div>
					<button className="btn out" type="button" style={{ marginTop: 10 }} onClick={() => setWelcomeUser({ id: currentUser?.id, name: currentUser?.name, firstTime: false })}>
						View plans & pricing
					</button>
				</div>
				{supportOn && (
					<div className="support-box">
						<div className="label">Authorized support access</div>
						<div className="plan-settings-note">Owner-controlled diagnostic access. Every support action is recorded.</div>
						<label className="muted">
							<input
								type="checkbox"
								id="set-support-enabled"
								checked={enabled}
								onChange={(e) => {
									setEnabled(e.target.checked);
									if (e.target.checked && !s.supportCode) onRegenerate();
								}}
							/>{" "}
							Enable Ceylonry support portal
						</label>
						{enabled && (
							<div id="support-code-wrap">
								<div className="support-code" id="support-code">
									{s.supportCode || "------"}
								</div>
								<div className="plan-settings-note" id="support-expiry-note" style={{ margin: "8px 0" }}>
									{expires ? "Code expires " + new Date(expires).toLocaleString() : "Generate a new code to create a 24-hour support window."}
								</div>
								<button className="btn out" type="button" onClick={() => onRegenerate()}>
									Generate New Code
								</button>
								<a className="btn out" href={env.supportPortalUrl} target="_blank" rel="noreferrer">
									Open Admin Portal
								</a>
							</div>
						)}
					</div>
				)}
			</div>
		</Panel>
	);
}

