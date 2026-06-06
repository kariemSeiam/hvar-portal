import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import type { Env } from "../env";
import { getSitePool } from "./db";

type EventType = "order_created" | "payment_confirmed";

export async function enqueueWebhook({
	env,
	eventType,
	orderId,
	payload,
	conn,
}: {
	env: Env;
	eventType: EventType;
	orderId: number;
	payload: Record<string, unknown>;
	conn: PoolConnection;
}): Promise<void> {
	if (!env.ERP_WEBHOOK_URL) return;

	await conn.query(
		`INSERT INTO webhook_outbox
		 (event_type, order_id, payload, target_url, attempts, max_attempts, next_attempt_at, created_at)
		 VALUES (?, ?, ?, ?, 0, 8, NOW(), NOW())`,
		[eventType, orderId, JSON.stringify(payload), env.ERP_WEBHOOK_URL],
	);
}

export async function processOutbox(env: Env): Promise<void> {
	const pool = getSitePool(env);
	const conn = await pool.getConnection();

	let rows: Array<{
		id: number;
		event_type: EventType;
		order_id: number;
		payload: unknown;
		target_url: string;
		attempts: number;
		max_attempts: number;
	}>;

	try {
		await conn.beginTransaction();
		interface OutboxRow extends RowDataPacket {
			id: number;
			event_type: EventType;
			order_id: number;
			payload: unknown;
			target_url: string;
			attempts: number;
			max_attempts: number;
		}
		const [result] = await conn.query<OutboxRow[]>(
			`SELECT id, event_type, order_id, payload, target_url, attempts, max_attempts
			 FROM webhook_outbox
			 WHERE delivered_at IS NULL AND dead_at IS NULL AND next_attempt_at <= NOW()
			 LIMIT 10 FOR UPDATE SKIP LOCKED`,
		);
		rows = result;
		await conn.commit();
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}

	for (const row of rows) {
		await processRow(env, row);
	}
}

async function processRow(
	env: Env,
	row: {
		id: number;
		event_type: EventType;
		order_id: number;
		payload: unknown;
		target_url: string;
		attempts: number;
		max_attempts: number;
	},
): Promise<void> {
	const pool = getSitePool(env);
	const conn = await pool.getConnection();
	try {
		await conn.beginTransaction();

		let delivered = false;
		let errorMsg: string | null = null;

		try {
			const res = await fetch(row.target_url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Idempotency-Key": `${row.event_type}:${row.order_id}`,
				},
				body: JSON.stringify(row.payload),
			});
			if (res.ok) {
				delivered = true;
			} else {
				errorMsg = `HTTP ${res.status}`;
			}
		} catch (err) {
			errorMsg = String(err).slice(0, 500);
		}

		if (delivered) {
			await conn.query(
				"UPDATE webhook_outbox SET delivered_at = NOW() WHERE id = ?",
				[row.id],
			);
			await conn.query(
				"UPDATE orders SET erp_webhook_sent = 1 WHERE id = ?",
				[row.order_id],
			);
		} else {
			const newAttempts = row.attempts + 1;
			const delaySec = Math.min(60 * 2 ** row.attempts, 3600);
			const isDead = newAttempts >= row.max_attempts;

			await conn.query(
				`UPDATE webhook_outbox
				 SET attempts = ?,
				     next_attempt_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
				     last_error = ?,
				     dead_at = IF(?, NOW(), NULL)
				 WHERE id = ?`,
				[newAttempts, delaySec, errorMsg, isDead ? 1 : 0, row.id],
			);
		}

		await conn.commit();
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
}

export function startOutboxWorker(env: Env): ReturnType<typeof setInterval> {
	console.log("[outbox] worker started, interval=15s");
	return setInterval(() => {
		processOutbox(env).catch((err) => console.error("[outbox]", err));
	}, 15_000);
}
