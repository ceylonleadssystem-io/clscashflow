/**
 * The business admin portal at /admin: the sections shown as boxes (and as the left navigation) once an owner, manager or accountant
 * signs in with the business login and their PIN. No POS features (checkout, tables, orders) are part of it.
 * `view` is the id kept in PosProvider while the section is open; `needs` lists the POS pages whose role access it follows.
 */
export const PORTAL_SECTIONS = [
	{ key: "location", view: "location", title: "Location Info", icon: "location", blurb: "Business name, address, logo, contact details and locations.", needs: ["settings"], permission: "settings.system.edit" },
	{ key: "reports", view: "reports", title: "Reports", icon: "reports", blurb: "Sales, menu, payroll, kitchen, transactions and more.", needs: ["reports"] },
	{
		key: "menu",
		view: "items",
		title: "Menu Admin",
		icon: "menu",
		blurb: "Manage items, categories, modifiers, availability, taxes and sales categories.",
		needs: ["products"],
		// the same pages, in the same order, as Settings > Menu Admin
		subs: [
			{ view: "items", title: "Items" },
			{ view: "categories", title: "Categories" },
			{ view: "modifiers", title: "Modifiers" },
			{ view: "availability", title: "Availability" },
			{ view: "taxes", title: "Taxes" },
			{ view: "salesCategories", title: "Sales Categories" },
		],
	},
	{
		key: "users",
		view: "users",
		title: "User Admin",
		icon: "users",
		blurb: "Add and manage users, jobs, pay rates and access.",
		needs: ["staff"],
		permission: "users.view",
		subs: [
			{ view: "users", title: "Users" },
			{ view: "jobs", title: "Jobs" },
			{ view: "timesheets", title: "Timesheets" },
		],
	},
	{
		key: "devices",
		view: "printers",
		title: "Device Manager",
		icon: "devices",
		blurb: "Printers, kitchen screens, stations and the health of this device.",
		needs: ["settings"],
		permission: "settings.system.edit",
		subs: [
			{ view: "printers", title: "Printers" },
			{ view: "kds", title: "KDS" },
			{ view: "stations", title: "Stations" },
			{ view: "health", title: "Health" },
		],
	},
	{ key: "timesheets", view: "timesheets", title: "Timesheets", icon: "timesheets", blurb: "Employee clock-in, clock-out and break hours.", needs: ["staff"], permission: ["users.view", "reports.pos"], hideWhen: "users.view" },
	{ key: "shop", view: "shop", title: "Shop", icon: "shop", blurb: "One stop to buy POS hardware: printers, scanners, drawers and screens.", needs: [] },
];

/** True when the page was opened at /admin (and not the Ceylonry staff portal at /posv2/admin). */
export const isPortalPath = (pathname = typeof location === "undefined" ? "" : location.pathname) => /^\/admin\/?$/.test(pathname);

/** Sections this user may open. `canView` is the POS page check, `can` the permission check; a section with several permissions needs any one. */
export function visiblePortalSections({ canView = () => true, can = () => true } = {}) {
	return PORTAL_SECTIONS.filter((s) => !(s.hideWhen && can(s.hideWhen)) && (!s.permission || [].concat(s.permission).some((k) => can(k))) && s.needs.every((v) => canView(v)));
}

/** The section a view id belongs to (the Menu Admin section owns every one of its pages). */
export const sectionOfView = (view) => PORTAL_SECTIONS.find((s) => s.view === view || s.subs?.some((x) => x.view === view)) || null;
