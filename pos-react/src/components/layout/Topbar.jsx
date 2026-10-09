/**
 * Top bar: page title, location switcher, the "more" menu (page links on small screens, Lock POS,
 * Sign Out, Switch Checkout, printer status, full screen), the page menu that replaces the hidden sidebar while in
 * full screen, and the mobile "View Order" button (checkout page only).
 */
import { useEffect, useState } from "react";
import { usePos } from "../../store/PosProvider";
import { NAV_ITEMS } from "../../config/roles";
import { useSession } from "../../store/SessionProvider";
import { useData } from "../../store/DataProvider";
import { useFeature } from "../../store/FeatureProvider";
import { useCheckout } from "../../store/CheckoutProvider";
import { useFullscreen } from "../../hooks/useFullscreen";
import { receiptPrinter } from "../../services/printing/receiptPrinter";
import { useUi } from "../../store/UiProvider";
import { locationLabel } from "../../services/pos/locations";
import { money } from "../../domain/format";

export function Topbar({ onOpenLocations }) {
	const { title, view, go, canView, staffLogout, layout, setLayout, setChooserOpen, locationId, currentUser, svc } = usePos();
	const { signOut } = useSession();
	const data = useData();
	const { full, toggle } = useFullscreen();
	const { cart, totals } = useCheckout();
	const ui = useUi();
	const fullscreenOn = useFeature("shell.fullscreen");
	const locations = useFeature("business.locations");
	const modeChooser = useFeature("checkout.modeChooser");
	const headerPrinter = useFeature("hardware.headerPrinterButton");
	const [printer, setPrinter] = useState(receiptPrinter.status);
	const [menuOpen, setMenuOpen] = useState(false);
	const [navOpen, setNavOpen] = useState(false);
	useEffect(() => receiptPrinter.subscribe(setPrinter), []);
	// the full-screen page menu closes on Escape or a tap outside it, and when full screen ends
	useEffect(() => {
		if (!navOpen) return;
		const close = (e) => {
			if (e.type === "keydown" ? e.key === "Escape" : !e.target.closest?.(".full-nav")) setNavOpen(false);
		};
		document.addEventListener("keydown", close);
		document.addEventListener("pointerdown", close);
		return () => {
			document.removeEventListener("keydown", close);
			document.removeEventListener("pointerdown", close);
		};
	}, [navOpen]);
	useEffect(() => {
		if (!layout.full) setNavOpen(false);
	}, [layout.full]);
	useEffect(() => {
		if (!menuOpen) return;
		const close = (e) => {
			if (e.type === "keydown" ? e.key === "Escape" : !e.target.closest?.(".top-right")) setMenuOpen(false);
		};
		document.addEventListener("keydown", close);
		document.addEventListener("pointerdown", close);
		return () => {
			document.removeEventListener("keydown", close);
			document.removeEventListener("pointerdown", close);
		};
	}, [menuOpen]);
	const count = cart.reduce((a, l) => a + (+l.qty || 0), 0);
	const total = totals?.total || 0;
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
		<>
			<header className="top">
				{layout.full && currentUser && (
					<div className="full-nav">
						<button id="full-nav-toggle" type="button" className="btn out" aria-haspopup="true" aria-expanded={navOpen} aria-label="Go to another page" onClick={() => setNavOpen((o) => !o)}>
							<span aria-hidden="true">☰</span> <span className="full-nav-label">Menu</span>
						</button>
						{navOpen && (
							<nav className="full-nav-menu" aria-label="Go to">
								{NAV_ITEMS.filter((item) => canView(item.view)).map((item) => (
									<button
										key={item.view}
										type="button"
										className={"btn out" + (view === item.view ? " active" : "")}
										aria-current={view === item.view ? "page" : undefined}
										onClick={() => {
											go(item.view);
											setNavOpen(false);
										}}
									>
										{item.label}
									</button>
								))}
							</nav>
						)}
					</div>
				)}
				<div className="top-title">
					<h1 id="title">{title[0]}</h1>
					<p id="subtitle">{title[1]}</p>
				</div>
				<div className="top-right">
					{locations && currentUser && (
						<button id="location-switcher" className="location-switcher" onClick={onOpenLocations}>
							<span>
								<small>POS Location</small>
								{all ? "All Locations" : loc ? loc.name : locationId ? locationLabel(data, locationId) : "Select Location"}
							</span>
							<b>⌄</b>
						</button>
					)}
					<button
						id="top-more"
						type="button"
						className="btn out top-more"
						aria-haspopup="true"
						aria-expanded={menuOpen}
						aria-label="More actions"
						onClick={() => setMenuOpen((o) => !o)}
					>
						<span aria-hidden="true">⋯</span>
					</button>
					<div className={"top-actions" + (menuOpen ? " open" : "")} onClick={(e) => e.target.closest("button") && setMenuOpen(false)}>
						<div className="top-nav" role="group" aria-label="Go to">
							{NAV_ITEMS.filter((item) => canView(item.view)).map((item) => (
								<button key={item.view} type="button" className={"btn out" + (view === item.view ? " active" : "")} aria-current={view === item.view ? "page" : undefined} onClick={() => go(item.view)}>
									{item.label}
								</button>
							))}
						</div>
						<button className="btn out session-action" type="button" onClick={staffLogout}>
							Lock POS
						</button>
						<button className="btn out session-action" type="button" onClick={signOut}>
							Sign Out Business
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
				</div>
			</header>
			{view === "checkout" && (
				<button id="mobile-cart-toggle" className="btn gold" type="button" onClick={() => setLayout((l) => ({ ...l, mobileCartOpen: !l.mobileCartOpen }))}>
					{layout.mobileCartOpen ? (
						<span>← Back to Products</span>
					) : (
						<>
							<span>View Order ({count})</span>
							<strong>{money(total)}</strong>
						</>
					)}
				</button>
			)}
		</>
	);
}
