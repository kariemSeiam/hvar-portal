import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

export default defineConfig({
	site: "https://hvarstore.com",
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
	},
	i18n: {
		defaultLocale: "ar",
		locales: ["ar", "en"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
