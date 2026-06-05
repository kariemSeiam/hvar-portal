import mysql from "mysql2/promise";
import { type Env, loadEnv } from "../env";

let sitePool: mysql.Pool | null = null;
let erpPool: mysql.Pool | null = null;
let mcrmPool: mysql.Pool | null = null;

export function getSitePool(env?: Env): mysql.Pool {
	if (sitePool) return sitePool;
	const e = env ?? loadEnv();
	sitePool = mysql.createPool({
		host: e.SITE_DB_HOST,
		port: Number(e.SITE_DB_PORT),
		user: e.SITE_DB_USER,
		password: e.SITE_DB_PASSWORD,
		database: e.SITE_DB_NAME,
		waitForConnections: true,
		connectionLimit: 10,
		charset: "utf8mb4",
	});
	return sitePool;
}

export function getErpPool(env?: Env): mysql.Pool {
	if (erpPool) return erpPool;
	const e = env ?? loadEnv();
	erpPool = mysql.createPool({
		host: e.ERP_DB_HOST,
		port: Number(e.ERP_DB_PORT),
		user: e.ERP_DB_USER,
		password: e.ERP_DB_PASSWORD,
		database: e.ERP_DB_NAME,
		waitForConnections: true,
		connectionLimit: 10,
		charset: "utf8mb4",
	});
	return erpPool;
}

export function getMcrmPool(env?: Env): mysql.Pool {
	if (mcrmPool) return mcrmPool;
	const e = env ?? loadEnv();
	mcrmPool = mysql.createPool({
		host: e.MCRM_DB_HOST,
		port: Number(e.MCRM_DB_PORT),
		user: e.MCRM_DB_USER,
		password: e.MCRM_DB_PASSWORD,
		database: e.MCRM_DB_NAME,
		waitForConnections: true,
		connectionLimit: 5,
		charset: "utf8mb4",
	});
	return mcrmPool;
}

// query() over execute(): mysql2's prepared-statement (execute) path rejects `?`
// placeholders for LIMIT/OFFSET on some MySQL builds (ER_WRONG_ARGUMENTS).
// query() still parameterizes via server-side escaping — SQL-injection-safe.
export async function query<T extends mysql.RowDataPacket[]>(
	pool: mysql.Pool,
	sql: string,
	params?: unknown[],
): Promise<T> {
	const [rows] = await pool.query<T>(sql, params);
	return rows;
}

export async function closeAll(): Promise<void> {
	if (sitePool) {
		await sitePool.end();
		sitePool = null;
	}
	if (erpPool) {
		await erpPool.end();
		erpPool = null;
	}
	if (mcrmPool) {
		await mcrmPool.end();
		mcrmPool = null;
	}
}
