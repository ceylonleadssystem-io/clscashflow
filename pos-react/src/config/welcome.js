/** First-login welcome message (editable in the Admin Dashboard, stored in settings.welcome). */
export const DEFAULT_WELCOME = {
	enabled: true,
	title: "Welcome to Ceylonry POS",
	message:
		"Thank you for choosing Ceylonry POS. Your register is ready — sign in with your PIN, open your cash register and start selling. Our team is here to help whenever you need us.",
	/** Bump to show the message again to every user. */
	version: 1,
};

export const resolveWelcome = (settings) => ({ ...DEFAULT_WELCOME, ...(settings?.welcome || {}) });
