/**
 * The register chrome: left sidebar, top bar, notice area and the active view, plus the global
 * modals (customers, products, cash, split bill, locations, setup, shift start, welcome).
 */
import { useState } from "react";
import { usePos } from "../../store/PosProvider";
import { useNotice } from "../../store/UiProvider";
import { endSupportSession } from "../../services/support";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CloudBanner } from "./CloudBanner";
import { ViewRouter } from "../../views/ViewRouter";
import { LocationSwitcherModal } from "../../modals/LocationSwitcherModal";
import { PosSetupModal } from "../../modals/PosSetupModal";
import { ShiftStartModal } from "../../modals/ShiftStartModal";
import { WelcomeModal } from "../../modals/WelcomeModal";
import { CheckoutModeGate } from "../../gates/CheckoutModeGate";
import { CustomerModalHost } from "../../modals/CustomerModal";
import { ModifierPickerModal } from "../../modals/ModifierPickerModal";
import { useApplyDisplayPrefs } from "../../hooks/useDisplayPrefs";
import { useBarcodeScanning } from "../../hooks/useBarcodeScanning";
import { ProductModalHost } from "../../modals/ProductModal";
import { CashModal } from "../../modals/CashModal";
import { SplitBillModal } from "../../modals/SplitBillModal";
import { BarcodeModalHost } from "../../modals/BarcodeModal";
import { LocationSwitcherOpenProvider } from "../../hooks/useLocationSwitcher";

/** The register chrome: sidebar, top bar, notice area and the active view. */
export function Shell() {
	const { view, support, chooserOpen } = usePos();
	const notice = useNotice();
	const [locationsOpen, setLocationsOpen] = useState(false);
	useBarcodeScanning();
	useApplyDisplayPrefs();
	return (
		<LocationSwitcherOpenProvider open={() => setLocationsOpen(true)}>
			<div className="app">
				<Sidebar />
				<main className="main">
					<Topbar onOpenLocations={() => setLocationsOpen(true)} />
					<div className="content">
						{support && (
							<div id="support-session-banner" className="support-session-banner">
								<span>Support session · Read-only access · Every action is audited</span>
								<button className="btn out" onClick={endSupportSession}>
									Exit Support Session
								</button>
							</div>
						)}
						<CloudBanner />
						<div className={"notice" + (notice.show ? " show" : "")} id="notice">
							{notice.text}
						</div>
						<ViewRouter view={view} />
					</div>
				</main>
			</div>
			<CustomerModalHost />
			<ProductModalHost />
			<CashModal />
			<SplitBillModal />
			<BarcodeModalHost />
			<ModifierPickerModal />
			<LocationSwitcherModal open={locationsOpen} onClose={() => setLocationsOpen(false)} />
			<PosSetupModal />
			<ShiftStartModal />
			<WelcomeModal />
			{chooserOpen && <CheckoutModeGate />}
		</LocationSwitcherOpenProvider>
	);
}
