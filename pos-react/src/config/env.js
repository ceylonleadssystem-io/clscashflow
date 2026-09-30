/** Central place for every environment-driven value (see .env.example). */
const e = import.meta.env;

export const env = {
	authProvider: e.VITE_AUTH_PROVIDER || "appwrite",
	appwriteEndpoint:
		e.VITE_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1",
	appwriteProjectId: e.VITE_APPWRITE_PROJECT_ID || "6a947d6e0012c551dfde",
	docsFunctionUrl:
		e.VITE_DOCS_FUNCTION_URL || "/.netlify/functions/appwrite-docs",
	onboardingEmailUrl:
		e.VITE_ONBOARDING_EMAIL_URL || "/.netlify/functions/pos-onboarding-email",
	platformScriptUrl: e.VITE_PLATFORM_SCRIPT_URL || "/assets/platform.js",
	developerEmail: (
		e.VITE_DEVELOPER_EMAIL || "devteam@ceylonrylabs.io"
	).toLowerCase(),
	supportPortalUrl: e.VITE_SUPPORT_PORTAL_URL || "/pos-system/pos-admin.html",
	homeUrl: e.VITE_HOME_URL || "/index.html",
	onboardingUrl: e.VITE_ONBOARDING_URL || "/pos-onboarding.html",
	ejsKey: e.VITE_EJS_KEY || "gCD6W70FKqiN2ATlp",
	ejsService: e.VITE_EJS_SERVICE || "service_uneb8lv",
	ejsReceiptTemplate: e.VITE_EJS_RECEIPT_TEMPLATE || "template_avm444n",
	ejsOrderTemplate: e.VITE_EJS_ORDER_TEMPLATE || "",
	catalogueImagesUrl: e.VITE_CATALOGUE_IMAGES_URL || "",
	syncPullMs: Number(e.VITE_SYNC_PULL_MS) || 1500,
	syncPushMs: Number(e.VITE_SYNC_PUSH_MS) || 2500,
	xlsxCdn: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
	basePath: e.BASE_URL || "/",
};

export const isAppwrite = () => env.authProvider === "appwrite";
