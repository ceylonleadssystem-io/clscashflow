/**
 * The business admin portal at /admin: the sections shown as boxes (and as the left navigation) once an owner, manager or accountant
 * signs in with the business login and their PIN. No POS features (checkout, tables, orders) are part of it.
 * `view` is the id kept in PosProvider while the section is open; `needs` lists the POS pages whose role access it follows.
 */
export const PORTAL_SECTIONS = [
	{ key: "location", view: "location", title: "Location Info", icon: "⌂", blurb: "Business name, address, logo, contact details and locations.", needs: ["settings"], roles: ["owner", "admin", "manager"] },
	{ key: "reports", view: "reports", title: "Reports", icon: "▤", blurb: "Sales, menu, payroll, kitchen, transactions and more.", needs: ["reports"] },
	{
		key: "menu",
		view: "products",
		title: "Menu Admin",
		icon: "□",
		blurb: "Manage items, prices, categories and modifiers.",
		needs: ["products"],
		subs: [
			{ view: "products", title: "Products & Services" },
			{ view: "modifiers", title: "Modifiers" },
		],
	},
	{ key: "users", view: "users", title: "User Admin", icon: "♙", blurb: "Add and manage users, roles and access.", needs: ["staff"], roles: ["owner", "admin", "manager"] },
	{ key: "timesheets", view: "timesheets", title: "Timesheets", icon: "◷", blurb: "Employee clock-in, clock-out and break hours.", needs: ["staff"], roles: ["owner", "admin", "manager", "accountant"] },
	{ key: "shop", view: "shop", title: "Shop", icon: "✦", blurb: "One stop to buy POS hardware: printers, scanners, drawers and screens.", needs: [] },
];

/** True when the page was opened at /admin (and not the Ceylonry staff portal at /posv2/admin). */
export const isPortalPath = (pathname = typeof location === "undefined" ? "" : location.pathname) => /^\/admin\/?$/.test(pathname);

/** Sections this user may open. `canView` is the POS role check; `role` is the signed-in user's role. */
export function visiblePortalSections({ role = "", canView = () => true } = {}) {
	return PORTAL_SECTIONS.filter((s) => (!s.roles || s.roles.includes(role)) && s.needs.every((v) => canView(v)));
}

/** The section a view id belongs to (the Menu Admin section also owns Modifiers). */
export const sectionOfView = (view) => PORTAL_SECTIONS.find((s) => s.view === view || s.subs?.some((x) => x.view === view)) || null;
