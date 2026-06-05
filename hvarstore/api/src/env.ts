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
	MCRM_DB_HOST: string;
	MCRM_DB_PORT: string;
	MCRM_DB_USER: string;
	MCRM_DB_PASSWORD: string;
	MCRM_DB_NAME: string;
	ERP_BUSINESS_ID: number;
	ERP_LOCATION_ID: number;
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
	PUBLIC_MEDIA_BASE: string;
	PUBLIC_API_URL: string;
	PUBLIC_SITE_URL: string;
	API_PORT: string;
}

export function loadEnv(): Env {
	const e = Bun.env;
	return {
		SITE_DB_HOST: e.SITE_DB_HOST ?? "127.0.0.1",
		SITE_DB_PORT: e.SITE_DB_PORT ?? "3306",
		SITE_DB_USER: e.SITE_DB_USER ?? "root",
		SITE_DB_PASSWORD: e.SITE_DB_PASSWORD ?? "",
		SITE_DB_NAME: e.SITE_DB_NAME ?? "hvar_site",
		ERP_DB_HOST: e.ERP_DB_HOST ?? "127.0.0.1",
		ERP_DB_PORT: e.ERP_DB_PORT ?? "3306",
		ERP_DB_USER: e.ERP_DB_USER ?? "root",
		ERP_DB_PASSWORD: e.ERP_DB_PASSWORD ?? "",
		ERP_DB_NAME: e.ERP_DB_NAME ?? "hvar_erp",
		MCRM_DB_HOST: e.MCRM_DB_HOST ?? "127.0.0.1",
		MCRM_DB_PORT: e.MCRM_DB_PORT ?? "3306",
		MCRM_DB_USER: e.MCRM_DB_USER ?? "root",
		MCRM_DB_PASSWORD: e.MCRM_DB_PASSWORD ?? "",
		MCRM_DB_NAME: e.MCRM_DB_NAME ?? "mcrm_hvar_hub",
		ERP_BUSINESS_ID: Number(e.ERP_BUSINESS_ID ?? 1),
		ERP_LOCATION_ID: Number(e.ERP_LOCATION_ID ?? 1),
		JWT_SECRET: e.JWT_SECRET ?? "dev-secret-do-not-use-in-production",
		JWT_ACCESS_EXPIRY: e.JWT_ACCESS_EXPIRY ?? "24h",
		JWT_REFRESH_EXPIRY: e.JWT_REFRESH_EXPIRY ?? "7d",
		KASHIER_MID: e.KASHIER_MID ?? "",
		KASHIER_SECRET_KEY: e.KASHIER_SECRET_KEY ?? "",
		KASHIER_MODE: e.KASHIER_MODE ?? "test",
		BOSTA_API_KEY: e.BOSTA_API_KEY ?? "",
		BOSTA_BASE_URL: e.BOSTA_BASE_URL ?? "https://app.bosta.co",
		ERP_WEBHOOK_URL: e.ERP_WEBHOOK_URL ?? "",
		ERP_WEBHOOK_DELETE_URL: e.ERP_WEBHOOK_DELETE_URL ?? "",
		PUBLIC_MEDIA_BASE: e.PUBLIC_MEDIA_BASE ?? "http://localhost:5000/media",
		PUBLIC_API_URL: e.PUBLIC_API_URL ?? "http://localhost:5000",
		PUBLIC_SITE_URL: e.PUBLIC_SITE_URL ?? "http://localhost:4321",
		API_PORT: e.API_PORT ?? "5000",
	};
}
