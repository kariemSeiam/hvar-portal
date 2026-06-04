export interface Env {
	SITE_DB_HOST: string;
	SITE_DB_PORT: string;
	SITE_DB_USER: string;
	SITE_DB_PASSWORD: string;
	SITE_DB_NAME: string;
	ERP_DB_HOST: string;
	ERP_DB_PORT: string;
	ERP_DB_USER: string;
	ERP_DB_PASSWORD: string;
	ERP_DB_NAME: string;
	JWT_SECRET: string;
	JWT_ACCESS_EXPIRY: string;
	JWT_REFRESH_EXPIRY: string;
	KASHIER_MID: string;
	KASHIER_SECRET_KEY: string;
	KASHIER_MODE: string;
	BOSTA_API_KEY: string;
	BOSTA_BASE_URL: string;
	ERP_WEBHOOK_URL: string;
	ERP_WEBHOOK_DELETE_URL: string;
	API_PORT: string;
}

export function loadEnv(): Env {
	return {
		SITE_DB_HOST: Bun.env.SITE_DB_HOST ?? "127.0.0.1",
		SITE_DB_PORT: Bun.env.SITE_DB_PORT ?? "3306",
		SITE_DB_USER: Bun.env.SITE_DB_USER ?? "root",
		SITE_DB_PASSWORD: Bun.env.SITE_DB_PASSWORD ?? "",
		SITE_DB_NAME: Bun.env.SITE_DB_NAME ?? "hvar_site",
		ERP_DB_HOST: Bun.env.ERP_DB_HOST ?? "127.0.0.1",
		ERP_DB_PORT: Bun.env.ERP_DB_PORT ?? "3306",
		ERP_DB_USER: Bun.env.ERP_DB_USER ?? "root",
		ERP_DB_PASSWORD: Bun.env.ERP_DB_PASSWORD ?? "",
		ERP_DB_NAME: Bun.env.ERP_DB_NAME ?? "hvar_erp",
		JWT_SECRET: Bun.env.JWT_SECRET ?? "dev-secret-do-not-use-in-production",
		JWT_ACCESS_EXPIRY: Bun.env.JWT_ACCESS_EXPIRY ?? "24h",
		JWT_REFRESH_EXPIRY: Bun.env.JWT_REFRESH_EXPIRY ?? "7d",
		KASHIER_MID: Bun.env.KASHIER_MID ?? "",
		KASHIER_SECRET_KEY: Bun.env.KASHIER_SECRET_KEY ?? "",
		KASHIER_MODE: Bun.env.KASHIER_MODE ?? "test",
		BOSTA_API_KEY: Bun.env.BOSTA_API_KEY ?? "",
		BOSTA_BASE_URL: Bun.env.BOSTA_BASE_URL ?? "https://app.bosta.co",
		ERP_WEBHOOK_URL: Bun.env.ERP_WEBHOOK_URL ?? "",
		ERP_WEBHOOK_DELETE_URL: Bun.env.ERP_WEBHOOK_DELETE_URL ?? "",
		API_PORT: Bun.env.API_PORT ?? "5000",
	};
}
