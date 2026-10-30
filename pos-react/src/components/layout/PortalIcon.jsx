/**
 * Stroke icons for the /admin portal (24px grid, same style as NavIcon): one per section plus Home, Back and All reports.
 * `size` is the drawn size in px; the left rail uses 24, the home boxes 56.
 */
const PATHS = {
	home: <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></>,
	back: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
	all: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
	location: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
	reports: <><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></>,
	menu: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
	users: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 4a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6" /></>,
	system: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
	devices: <><path d="M7 9V3h10v6M7 17H4v-8h16v8h-3" /><rect x="7" y="14" width="10" height="7" rx="1" /></>,
	timesheets: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
	shop: <><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5" /></>,
};

export function PortalIcon({ name, size = 24 }) {
	return (
		<svg className="nav-icon portal-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
			{PATHS[name] || PATHS.all}
		</svg>
	);
}
