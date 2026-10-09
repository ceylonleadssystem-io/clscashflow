/**
 * Single place for every environment-driven value (Vite env vars with defaults): auth provider,
 * Appwrite endpoint/project, Netlify function URLs, admin and EmailJS settings, sync intervals and base path.
 */
/** Central place for every environment-driven value (see .env.example). */
const e = import.meta.env;

export const env = {
	authProvider: e.VITE_AUTH_PROVIDER || "appwrite",
	appwriteEndpoint:
		e.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1",
	appwriteProjectId: e.VITE_APPWRITE_PROJECT_ID || "6a947d6e0012c551dfde",
	docsFunctionUrl:
		e.VITE_DOCS_FUNCTION_URL || "/.netlify/functions/appwrite-docs",
	imagesFunctionUrl:
		e.VITE_IMAGES_FUNCTION_URL || "/.netlify/functions/appwrite-files",
	onboardingEmailUrl:
		e.VITE_ONBOARDING_EMAIL_URL || "/.netlify/functions/pos-onboarding-email",
	platformScriptUrl: e.VITE_PLATFORM_SCRIPT_URL || "/assets/platform.js",
	developerEmail: (
		e.VITE_DEVELOPER_EMAIL || "devteam@ceylonrylabs.io"
	).toLowerCase(),
	supportPortalUrl: e.VITE_SUPPORT_PORTAL_URL || "/posv2/admin",
	homeUrl: e.VITE_HOME_URL || "/index.html",
	onboardingUrl: e.VITE_ONBOARDING_URL || "/pos-onboarding.html",
	adminLoginUrl: e.VITE_ADMIN_LOGIN_URL || "/.netlify/functions/pos-admin-login",
	adminFunctionUrl: e.VITE_ADMIN_FUNCTION_URL || "/.netlify/functions/pos-admin-data",
	sendInvoiceUrl: e.VITE_SEND_INVOICE_URL || "/.netlify/functions/send-invoice",
	adminEmails: (e.VITE_ADMIN_EMAILS || e.VITE_DEVELOPER_EMAIL || "devteam@ceylonrylabs.io").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean),
	ejsKey: e.VITE_EJS_KEY || "gCD6W70FKqiN2ATlp",
	ejsService: e.VITE_EJS_SERVICE || "service_uneb8lv",
	ejsReceiptTemplate: e.VITE_EJS_RECEIPT_TEMPLATE || "template_avm444n",
	ejsOrderTemplate: e.VITE_EJS_ORDER_TEMPLATE || "",
	catalogueImagesUrl: e.VITE_CATALOGUE_IMAGES_URL || "",
	// sales history in monthly cloud documents instead of the main business document (VITE_SALES_SPLIT=on)
	salesSplit: e.VITE_SALES_SPLIT === "on",
	syncPullMs: Number(e.VITE_SYNC_PULL_MS) || 3000, // each check is only a tiny stamp request (the document is downloaded when it changed)
	syncPushMs: Number(e.VITE_SYNC_PUSH_MS) || 2500,
	xlsxCdn: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
	basePath: e.BASE_URL || "/",
};

export const isAppwrite = () => env.authProvider === "appwrite";
