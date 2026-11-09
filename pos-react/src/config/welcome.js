/**
 * Default first-login welcome message (editable by admins, stored in settings.welcome) and the
 * resolver that merges saved values over the defaults.
 */
export const DEFAULT_WELCOME = {
	enabled: true,
	title: "Welcome to Ceylonry POS",
	message:
		"Thank you for choosing Ceylonry POS. Your register is ready — sign in with your PIN, clock in to open your cash register and start selling. Our team is here to help whenever you need us.",
	/** Bump to show the message again to every user. */
	version: 1,
};

export const resolveWelcome = (settings) => ({ ...DEFAULT_WELCOME, ...(settings?.welcome || {}) });
