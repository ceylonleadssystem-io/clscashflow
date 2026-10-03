/**
 * Administrator session storage. The token lives in sessionStorage only (cleared when the tab closes)
 * and is kept separate from the business/staff session of the POS.
 */
/**
 * Administrator session for /posv2/admin.
 * The token is issued by the pos-admin-login Netlify function (separate admin database) and kept
 * in sessionStorage only: closing the tab signs the administrator out. It is never shared with
 * the business/staff session of the POS.
 */
const KEY = "ceylonry-pos-admin-session";

export const adminSession = {
	get() {
		try {
			const s = JSON.parse(sessionStorage.getItem(KEY) || "null");
			return s && s.token && Date.parse(s.expiresAt) > Date.now() ? s : null;
		} catch {
			return null;
		}
	},
	set: (s) => sessionStorage.setItem(KEY, JSON.stringify(s)),
	clear: () => sessionStorage.removeItem(KEY),
};
