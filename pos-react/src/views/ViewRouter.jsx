/**
 * Maps the active view id to its page component and renders it.
 */
import { Suspense, lazy } from "react";
import { Dashboard } from "./Dashboard";
import { Checkout } from "./Checkout";

// The first screens (dashboard, checkout) load with the app; every other page is fetched the first time it is opened, which keeps
// the first download and start-up smaller. The service worker caches these files after the first visit.
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const Orders = page(() => import("./Orders"), "Orders");
const Tables = page(() => import("./Tables"), "Tables");
const Products = page(() => import("./Products"), "Products");
const Modifiers = page(() => import("./Modifiers"), "Modifiers");
const Customers = page(() => import("./Customers"), "Customers");
const CRM = page(() => import("./CRM"), "CRM");
const Sales = page(() => import("./Sales"), "Sales");
const Receipts = page(() => import("./Receipts"), "Receipts");
const Reports = page(() => import("./Reports"), "Reports");
const Inventory = page(() => import("./Inventory"), "Inventory");
const Industry = page(() => import("./Industry"), "Industry");
const Staff = page(() => import("./Staff"), "Staff");
const Settings = page(() => import("./Settings"), "Settings");

const VIEWS = {
	dashboard: Dashboard,
	checkout: Checkout,
	orders: Orders,
	tables: Tables,
	products: Products,
	modifiers: Modifiers,
	customers: Customers,
	crm: CRM,
	sales: Sales,
	receipts: Receipts,
	reports: Reports,
	inventory: Inventory,
	industry: Industry,
	staff: Staff,
	settings: Settings,
};

/** Renders the screen chosen in the sidebar. */
export function ViewRouter({ view }) {
	const View = VIEWS[view] || Dashboard;
	return (
		<Suspense fallback={<div className="empty" role="status" style={{ padding: 20 }}>Loading…</div>}>
			<View />
		</Suspense>
	);
}
