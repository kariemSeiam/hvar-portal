import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./schema/index.ts",
	out: "./drizzle",
	dialect: "mysql",
	dbCredentials: {
		host: process.env.SITE_DB_HOST ?? "127.0.0.1",
		port: Number(process.env.SITE_DB_PORT ?? 3306),
		user: process.env.SITE_DB_USER ?? "root",
		password: process.env.SITE_DB_PASSWORD ?? "",
		database: process.env.SITE_DB_NAME ?? "hvar_site",
	},
});
