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

interface OutboxDetailRow extends OutboxRow {
	payload: string;
}

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

const OUTBOX_QUERIES: Record<string, { rows: string; count: string }> = {
	dead: {
		rows: `SELECT id, event_type, order_id, target_url, attempts, max_attempts,
		              next_attempt_at, last_error, delivered_at, dead_at, created_at
		       FROM webhook_outbox WHERE dead_at IS NOT NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
		count:
			"SELECT COUNT(*) AS total FROM webhook_outbox WHERE dead_at IS NOT NULL",
	},
	delivered: {
		rows: `SELECT id, event_type, order_id, target_url, attempts, max_attempts,
		              next_attempt_at, last_error, delivered_at, dead_at, created_at
		       FROM webhook_outbox WHERE delivered_at IS NOT NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
		count:
			"SELECT COUNT(*) AS total FROM webhook_outbox WHERE delivered_at IS NOT NULL",
	},
	pending: {
		rows: `SELECT id, event_type, order_id, target_url, attempts, max_attempts,
		              next_attempt_at, last_error, delivered_at, dead_at, created_at
		       FROM webhook_outbox WHERE delivered_at IS NULL AND dead_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?`,
		count:
			"SELECT COUNT(*) AS total FROM webhook_outbox WHERE delivered_at IS NULL AND dead_at IS NULL",
	},
};

route.get("/outbox/:id", async (c) => {
	const env = loadEnv();
	const id = Number(c.req.param("id"));
	const pool = getSitePool(env);

	const rows = await query<OutboxDetailRow[]>(
		pool,
		`SELECT id, event_type, order_id, payload, target_url, attempts, max_attempts,
		        next_attempt_at, last_error, delivered_at, dead_at, created_at
		 FROM webhook_outbox WHERE id = ?`,
		[id],
	);

	if (!rows.length) return c.json({ error: "not found" }, 404);
	return c.json(rows[0]);
});

route.post("/outbox/:id/requeue", async (c) => {
	const env = loadEnv();
	const id = Number(c.req.param("id"));
	const pool = getSitePool(env);

	const rows = await query<OutboxRow[]>(
		pool,
		`SELECT id, event_type, order_id, target_url, attempts, max_attempts,
		        next_attempt_at, last_error, delivered_at, dead_at, created_at
		 FROM webhook_outbox WHERE id = ?`,
		[id],
	);

	if (!rows.length) return c.json({ error: "not found" }, 404);
	const row = rows[0];
	if (row.delivered_at !== null)
		return c.json({ error: "already delivered — cannot requeue" }, 400);

	await query(
		pool,
		`UPDATE webhook_outbox SET attempts=0, last_error=NULL, dead_at=NULL, next_attempt_at=NOW() WHERE id=?`,
		[id],
	);

	return c.json({ id, status: "requeued", row });
});

route.post("/outbox/requeue-dead", async (c) => {
	const env = loadEnv();
	const pool = getSitePool(env);

	const result = await query<{ affectedRows: number } & RowDataPacket[]>(
		pool,
		`UPDATE webhook_outbox SET attempts=0, last_error=NULL, dead_at=NULL, next_attempt_at=NOW()
		 WHERE dead_at IS NOT NULL AND delivered_at IS NULL`,
	);

	// mysql2 returns OkPacket; cast through unknown for type safety
	const affected = (result as unknown as { affectedRows: number }).affectedRows ?? 0;
	return c.json({ requeued: affected });
});

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
