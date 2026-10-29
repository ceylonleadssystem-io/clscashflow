/**
 * Business Tools page: shows the modules (views/businessTools/) that the business type's capabilities allow, e.g. appointments,
 * memberships and commissions for Salon / Services, prescriptions, medicine batches and commissions for Pharmacy.
 */
import { useState } from "react";
import { hasCapability } from "../config/capabilities";
import { useData } from "../store/DataProvider";
import { usePos } from "../store/PosProvider";
import { IndustryModals } from "../modals/IndustryModals";
import { INDUSTRY_MODULES } from "./businessTools";

/** Business Tools (Salon / Services / Pharmacy): one section per enabled module. */
export function Industry() {
	const data = useData();
	const { currentUser } = usePos();
	const type = data.settings.businessType;
	const canManage = ["owner", "manager"].includes(currentUser?.role);
	const [modal, setModal] = useState(null); // {kind, id}
	const modules = INDUSTRY_MODULES.filter((m) => hasCapability(type, m.capability));
	const note = hasCapability(type, "appointments")
		? "Service tools are enabled. Existing checkout, customers and receipts remain unchanged."
		: hasCapability(type, "prescriptions")
			? "Pharmacy records and expiry tools are enabled. Existing inventory and checkout remain unchanged."
			: "Choose Salon / Spa, Services or Pharmacy in Settings to use industry tools.";
	return (
		<section className="view active" id="view-industry">
			<div id="industry-context-note" className="print-note" style={{ marginBottom: 14 }}>
				{note}
			</div>
			{modules.map(({ key, Component }) => (
				<Component key={key} canManage={canManage} setModal={setModal} />
			))}
			<IndustryModals modal={modal} onClose={() => setModal(null)} />
		</section>
	);
}
