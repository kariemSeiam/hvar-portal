import { Hono } from "hono";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import { getSitePool, query } from "../lib/db";

const route = new Hono();

route.use("/*", async (c, next) => {
	const env = loadEnv();
	const user = c.get("user");
	const allowed = env.ADMIN_PHONES.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
	if (!allowed.includes(user.phone)) {
		return c.json({ error: "forbidden" }, 403);
	}
	await next();
});

interface OutboxRow extends RowDataPacket {
	id: number;
	event_type: string;
	order_id: number;
	target_url: string;
	attempts: number;
	max_attempts: number;
	next_attempt_at: string;
	last_error: string | null;
	delivered_at: string | null;
	dead_at: string | null;
	created_at: string;
}

interface CountRow extends RowDataPacket {
	total: number;
}

const OUTBOX_QUERIES: Record<
	string,
	{ rows: string; count: string }
> = {
	dead: {
		rows: `SELECT id, event_type, order_id, target_url, attempts, max_attempts,
		              next_attempt_at, last_error, delivered_at, dead_at, created_at
		       FROM webhook_outbox WHERE dead_at IS NOT NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
		count: "SELECT COUNT(*) AS total FROM webhook_outbox WHERE dead_at IS NOT NULL",
	},
	delivered: {
		rows: `SELECT id, event_type, order_id, target_url, attempts, max_attempts,
		              next_attempt_at, last_error, delivered_at, dead_at, created_at
		       FROM webhook_outbox WHERE delivered_at IS NOT NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
		count: "SELECT COUNT(*) AS total FROM webhook_outbox WHERE delivered_at IS NOT NULL",
	},
	pending: {
		rows: `SELECT id, event_type, order_id, target_url, attempts, max_attempts,
		              next_attempt_at, last_error, delivered_at, dead_at, created_at
		       FROM webhook_outbox WHERE delivered_at IS NULL AND dead_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
		count: "SELECT COUNT(*) AS total FROM webhook_outbox WHERE delivered_at IS NULL AND dead_at IS NULL",
	},
};

route.get("/outbox", async (c) => {
	const env = loadEnv();
	const statusParam = c.req.query("status") ?? "pending";
	const status = statusParam in OUTBOX_QUERIES ? statusParam : "pending";
	const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
	const offset = Number(c.req.query("offset") ?? 0);

	const sql = OUTBOX_QUERIES[status];
	const pool = getSitePool(env);

	const [rows, counts] = await Promise.all([
		query<OutboxRow[]>(pool, sql.rows, [limit, offset]),
		query<CountRow[]>(pool, sql.count),
	]);

	return c.json({ rows, total: counts[0]?.total ?? 0 });
});

export default route;
