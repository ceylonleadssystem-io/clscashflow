import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const adminRoute = (req, _res, next) => {
	if (/^\/posv2\/admin\/?(\?.*)?$/.test(req.url || "")) req.url = "/admin.html";
	next();
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		base: env.VITE_BASE_PATH || "/posv2/", 
		// update here once we move to correct platform for testing purposes leave it like this 
		// base: env.VITE_BASE_PATH || "/"
		plugins: [
			react(),
			{
				// Serve the admin portal at /posv2/admin in dev and preview, like the Netlify redirect does in production.
				name: "admin-route",
				configureServer(server) {
					server.middlewares.use(adminRoute);
				},
				configurePreviewServer(server) {
					server.middlewares.use(adminRoute);
				},
			},
		],
		server: {
			port: 5173,
			// Netlify Functions (Appwrite document API, e-mail, onboarding...) are
			// proxied so the React dev server behaves like the deployed site.
			proxy: {
				"/.netlify/functions": {
					target: env.VITE_FUNCTIONS_PROXY || "http://localhost:8888",
					changeOrigin: true,
				},
			},
		},
		build: {
			rollupOptions: { input: { main: "index.html", admin: "admin.html" } },
			sourcemap: true,
			chunkSizeWarningLimit: 1200,
		},
		test: {
			environment: "node",
			include: ["src/tests/**/*.test.js"],
			setupFiles: ["src/tests/setup.js"],
		},
	};
});
