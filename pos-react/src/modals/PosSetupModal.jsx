/**
 * "Set Up Your POS" dialog: choose a business preset and apply its categories and kitchen-ticket defaults.
 */
import { useEffect, useState } from "react";
import { BUSINESS_TYPE_OPTIONS, POS_TYPE_PRESETS } from "../config/presets";
import { Modal, ModalBody } from "../components/ui";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";

/** "Set Up Your POS": choose a business preset and apply categories/modifiers/KOT defaults. */
export function PosSetupModal() {
	const { setupOpen: wantsSetup, setSetupOpen, svc, welcomeUser } = usePos();
	const setupOpen = wantsSetup && !welcomeUser;
	const { settings } = useData();
	const [type, setType] = useState("restaurant");
	const [addCategories, setAddCategories] = useState(true);
	const [kot, setKot] = useState(false);
	const [dontAsk, setDontAsk] = useState(true);
	const preset = POS_TYPE_PRESETS[type] || POS_TYPE_PRESETS.other;
	useEffect(() => {
		if (!setupOpen) return;
		setType(settings.businessType || "restaurant");
		setDontAsk(true);
	}, [setupOpen, settings.businessType]);
	useEffect(() => {
		setKot(preset.kot);
		setAddCategories(!!preset.categories.length);
	}, [preset]);
	const dismiss = async () => {
		await svc.settings.dismissPosSetup(dontAsk);
		setSetupOpen(false);
	};
	const apply = async () => {
		await svc.settings.applyPosSetup({ type, addCategories, enableKot: kot });
		setSetupOpen(false);
	};
	return (
		<Modal
			id="pos-setup-modal"
			open={setupOpen}
			title="Set Up Your POS"
			subtitle="A quick setup tailored to your business"
			onClose={dismiss}
			footer={
				<>
					<button className="btn out" onClick={dismiss}>
						Do Later
					</button>
					<button className="btn gold" onClick={apply}>
						Apply Setup
					</button>
				</>
			}
		>
			<ModalBody>
				<div className="field">
					<label>What type of business is this?</label>
					<select className="input" id="setup-business-type" value={type} onChange={(e) => setType(e.target.value)}>
						{BUSINESS_TYPE_OPTIONS.map((t) => (
							<option key={t} value={t}>
								{t === "cafe" ? "Café / Bakery" : POS_TYPE_PRESETS[t].label}
							</option>
						))}
					</select>
				</div>
				<div className="plan-settings" id="setup-preview">
					<div className="label">Recommended for {preset.label}</div>
					<div style={{ marginTop: 8, fontWeight: 700 }}>{preset.kot ? "Kitchen tickets enabled" : "Standard receipt workflow"}</div>
					<div className="plan-settings-note" style={{ marginTop: 5 }}>
						{preset.note}
					</div>
					<div className="cats" style={{ padding: "10px 0 0", border: 0, background: "transparent" }}>
						{preset.categories.length ? (
							preset.categories.map((c) => (
								<span className="chip" key={c}>
									{c}
								</span>
							))
						) : (
							<span className="plan-settings-note">No categories will be added. Start with your own custom categories.</span>
						)}
					</div>
				</div>
				<label className="muted" style={{ display: "block", marginTop: 12 }}>
					<input type="checkbox" id="setup-add-categories" checked={addCategories} disabled={!preset.categories.length} onChange={(e) => setAddCategories(e.target.checked)} /> Add recommended categories without removing my existing categories
				</label>
				<label className="muted" style={{ display: "block", marginTop: 9 }}>
					<input type="checkbox" id="setup-enable-kot" checked={kot} disabled={!preset.kot} onChange={(e) => setKot(e.target.checked)} /> Enable automatic Kitchen Order Tickets
				</label>
				<label className="muted" style={{ display: "block", marginTop: 14, paddingTop: 12, borderTop: "1px solid #e5e1d9" }}>
					<input type="checkbox" id="setup-dont-ask" checked={dontAsk} onChange={(e) => setDontAsk(e.target.checked)} /> Don't ask me again — I can open this setup later from Settings
				</label>
			</ModalBody>
		</Modal>
	);
}
