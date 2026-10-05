/**
 * Maps the active view id to its page component and renders it.
 */
import { Dashboard } from "./Dashboard";
import { Checkout } from "./Checkout";
import { Orders } from "./Orders";
import { Tables } from "./Tables";
import { Products } from "./Products";
import { Modifiers } from "./Modifiers";
import { Customers } from "./Customers";
import { CRM } from "./CRM";
import { Sales } from "./Sales";
import { Reports } from "./Reports";
import { Inventory } from "./Inventory";
import { Industry } from "./Industry";
import { Staff } from "./Staff";
import { Settings } from "./Settings";

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
	reports: Reports,
	inventory: Inventory,
	industry: Industry,
	staff: Staff,
	settings: Settings,
};

/** Renders the screen chosen in the sidebar. */
export function ViewRouter({ view }) {
	const View = VIEWS[view] || Dashboard;
	return <View />;
}
