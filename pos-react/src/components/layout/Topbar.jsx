import { useEffect, useState } from "react";
import { usePos } from "../../store/PosProvider";
import { useSession } from "../../store/SessionProvider";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { useCheckout } from "../../store/CheckoutProvider";
import { useFullscreen } from "../../hooks/useFullscreen";
import { receiptPrinter } from "../../services/printing/receiptPrinter";
import { useUi } from "../../store/UiProvider";
import { locationLabel } from "../../services/pos/locations";

export function Topbar({ onOpenLocations }) {
	const { title, staffLogout, layout, setLayout, setChooserOpen, locationId, currentUser, svc } = usePos();
	const { signOut } = useSession();
	const data = useData();
	const { full, toggle } = useFullscreen();
	const { cart } = useCheckout();
	const ui = useUi();
	const fullscreenOn = useFeature("shell.fullscreen");
	const sidebarToggle = useFeature("shell.sidebarToggle");
	const locations = useFeature("business.locations");
	const modeChooser = useFeature("checkout.modeChooser");
	const headerPrinter = useFeature("hardware.headerPrinterButton");
	const [printer, setPrinter] = useState(receiptPrinter.status);
	useEffect(() => receiptPrinter.subscribe(setPrinter), []);
	const count = cart.reduce((a, l) => a + (+l.qty || 0), 0);
	const all = locationId === "all";
	const loc = data.locations.find((l) => l.id === locationId);

	const printerClick = async () => {
		if (data.settings.printerType === "usb-direct" && receiptPrinter.connected) return svc.printing.printTestReceipt();
		try {
			await receiptPrinter.connect();
		} catch (e) {
			await ui.alert("Could not connect the USB printer. " + (e.message || "Check the cable and Android USB permission."));
		}
	};

	return (
		<header className="top">
			<div>
				<h1 id="title">{title[0]}</h1>
				<p id="subtitle">{title[1]}</p>
			</div>
			<div className="top-actions">
				{locations && currentUser && (
					<button id="location-switcher" className="location-switcher" onClick={onOpenLocations}>
						<span>
							<small>POS Location</small>
							{all ? "All Locations" : loc ? loc.name : locationId ? locationLabel(data, locationId) : "Select Location"}
						</span>
						<b>⌄</b>
					</button>
				)}
				<button className="btn out session-action" type="button" onClick={staffLogout}>
					Lock POS
				</button>
				<button className="btn out session-action" type="button" onClick={signOut}>
					Sign Out Business
				</button>
				{sidebarToggle && (
					<button
						id="sidebar-toggle"
						type="button"
						className="btn out"
						aria-pressed={layout.sidebarCollapsed}
						onClick={() => setLayout((l) => ({ ...l, sidebarCollapsed: !l.sidebarCollapsed }))}
					>
						{layout.sidebarCollapsed ? "Show Menu" : "Hide Menu"}
					</button>
				)}
				<button id="mobile-cart-toggle" className="btn gold" type="button" onClick={() => setLayout((l) => ({ ...l, mobileCartOpen: !l.mobileCartOpen }))}>
					{layout.mobileCartOpen ? "Back to Products" : `View Order (${count})`}
				</button>
				{modeChooser && (
					<button id="switch-checkout-top" type="button" className="btn out" onClick={() => setChooserOpen(true)}>
						Switch Checkout
					</button>
				)}
				{headerPrinter && (
					<button
						type="button"
						id="header-printer-button"
						className={"btn out header-printer-button" + (printer.connected ? " connected" : "")}
						onClick={printerClick}
						title={printer.message}
						aria-label={(printer.connected ? "Printer connected. " : "Printer not connected. ") + printer.message}
					>
						<b aria-hidden="true">▣</b>
						<span>Printer</span>
					</button>
				)}
				{fullscreenOn && (
					<button className="btn out" onClick={toggle} id="full-btn">
						{full ? "Exit Full Screen" : "Full Screen"}
					</button>
				)}
			</div>
		</header>
	);
}
