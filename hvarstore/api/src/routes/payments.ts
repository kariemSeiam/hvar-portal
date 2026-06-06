import { Hono } from "hono";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import { getSitePool, query } from "../lib/db";
import { authMiddleware } from "../middleware/auth";
import { enqueueWebhook } from "../lib/webhook-outbox";

const InitiateSchema = z.object({
	orderId: z.number().int().positive(),
	paymentMethod: z.enum(["kashier_card", "kashier_installments"]),
});

interface PendingRow extends RowDataPacket {
	id: number;
	order_id: number;
	kashier_order_id: string;
	amount: string;
	processed_at: string | null;
	expires_at: string | null;
}

interface OrderRow extends RowDataPacket {
	id: number;
	contact_id: number;
	total: string;
	status: string;
	payment_method: string;
}

const route = new Hono();

route.post("/kashier/initiate", authMiddleware, async (c) => {
	const user = c.get("user");
	const body = await c.req.json();
	const parsed = InitiateSchema.safeParse(body);
	if (!parsed.success) {
		return c.json(
			{ error: "validation", details: parsed.error.flatten().fieldErrors },
			400,
		);
	}

	const env = loadEnv();
	const sitePool = getSitePool(env);

	const orders = await query<OrderRow[]>(
		sitePool,
		"SELECT id, contact_id, total, status, payment_method FROM orders WHERE id = ? AND contact_id = ? LIMIT 1",
		[parsed.data.orderId, user.contactId],
	);
	if (orders.length === 0) return c.json({ error: "not_found" }, 404);

	const order = orders[0];
	if (order.status !== "pending") {
		return c.json({ error: "الطلب ليس في حالة انتظار" }, 400);
	}

	const existing = await query<PendingRow[]>(
		sitePool,
		"SELECT id, kashier_order_id, expires_at FROM pending_payments WHERE order_id = ? AND processed_at IS NULL AND expires_at > NOW() LIMIT 1",
		[order.id],
	);

	let kashierOrderId: string;
	if (existing.length > 0) {
		kashierOrderId = existing[0].kashier_order_id;
	} else {
		kashierOrderId = `HVAR-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
		await sitePool.query(
			`INSERT INTO pending_payments (order_id, kashier_order_id, amount, currency, payment_method, created_at, expires_at)
			 VALUES (?, ?, ?, 'EGP', ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
			[
				order.id,
				kashierOrderId,
				order.total,
				parsed.data.paymentMethod === "kashier_card" ? "card" : "installments",
			],
		);
	}

	const amount = Number(order.total).toFixed(2);
	const mid = env.KASHIER_MID;
	const secret = env.KASHIER_SECRET_KEY;
	const mode = env.KASHIER_MODE;

	const path = `/?payment=${mid}.${kashierOrderId}.${amount}.EGP`;
	const hash = createHmac("sha256", secret).update(path).digest("hex");

	const baseUrl =
		mode === "live"
			? "https://checkout.kashier.io"
			: "https://test-checkout.kashier.io";

	const redirectUrl = new URL(baseUrl);
	redirectUrl.searchParams.set("merchantId", mid);
	redirectUrl.searchParams.set("orderId", kashierOrderId);
	redirectUrl.searchParams.set("amount", amount);
	redirectUrl.searchParams.set("currency", "EGP");
	redirectUrl.searchParams.set("hash", hash);
	redirectUrl.searchParams.set("mode", mode);
	redirectUrl.searchParams.set(
		"metaData",
		JSON.stringify({
			siteOrderId: order.id,
			contactId: user.contactId,
		}),
	);
	redirectUrl.searchParams.set(
		"merchantRedirect",
		`${env.PUBLIC_API_URL}/api/payments/kashier/callback?ref=${kashierOrderId}`,
	);
	redirectUrl.searchParams.set(
		"allowedMethods",
		parsed.data.paymentMethod === "kashier_installments"
			? "installments"
			: "card",
	);
	redirectUrl.searchParams.set("display", "ar");

	await sitePool.query(
		"UPDATE pending_payments SET redirect_url = ? WHERE kashier_order_id = ?",
		[redirectUrl.toString(), kashierOrderId],
	);

	return c.json({ redirectUrl: redirectUrl.toString(), kashierOrderId });
});

route.post("/kashier/callback", async (c) => {
	const env = loadEnv();
	const body = await c.req.json();

	const signature = c.req.header("x-kashier-signature");
	if (!signature) {
		return c.json({ error: "missing signature" }, 400);
	}

	const REQUIRED_SIG_KEYS = [
		"paymentStatus",
		"merchantOrderId",
		"transactionId",
		"amount",
		"currency",
	] as const;

	const data = (body?.data ?? body) as Record<string, unknown>;
	const signatureKeys = Array.isArray(data.signatureKeys)
		? (data.signatureKeys as string[])
		: [];
	if (signatureKeys.length === 0) {
		return c.json({ error: "missing signatureKeys" }, 400);
	}

	const missingKey = REQUIRED_SIG_KEYS.find(
		(k) => !signatureKeys.includes(k) || !(k in data),
	);
	if (missingKey) {
		return c.json({ error: "unauthorized" }, 401);
	}

	const payload = signatureKeys
		.map((k) => `${k}=${String(data[k] ?? "")}`)
		.join("&");

	const expectedSig = createHmac("sha256", env.KASHIER_SECRET_KEY)
		.update(payload)
		.digest("hex");

	const sigBuf = Buffer.from(signature, "hex");
	const expBuf = Buffer.from(expectedSig, "hex");
	if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
		return c.json({ error: "invalid signature" }, 403);
	}

	const kashierOrderId =
		c.req.query("ref") ??
		(data.merchantOrderId as string | undefined) ??
		(data.orderId as string | undefined);
	if (!kashierOrderId) {
		return c.json({ error: "missing orderId" }, 400);
	}

	const sitePool = getSitePool(env);

	const kashierRef =
		(data.transactionId as string | undefined) ??
		(data.kashierOrderId as string | undefined) ??
		null;

	const status = data.paymentStatus === "SUCCESS" ? "confirmed" : "failed";

	let pending!: PendingRow;
	const conn = await sitePool.getConnection();
	try {
		await conn.beginTransaction();

		const [pendingRows] = await conn.query<PendingRow[]>(
			"SELECT id, order_id, processed_at, expires_at FROM pending_payments WHERE kashier_order_id = ? LIMIT 1 FOR UPDATE",
			[kashierOrderId],
		);

		if (pendingRows.length === 0) {
			await conn.rollback();
			return c.json({ error: "unknown order" }, 404);
		}

		pending = pendingRows[0];

		if (pending.processed_at) {
			await conn.rollback();
			return c.json({ status: "already_processed" });
		}

		if (
			pending.expires_at &&
			new Date(pending.expires_at).getTime() < Date.now()
		) {
			await conn.query(
				"UPDATE pending_payments SET processed_at = NOW() WHERE id = ?",
				[pending.id],
			);
			await conn.commit();
			return c.json({ error: "payment_expired" }, 409);
		}

		await conn.query(
			"UPDATE pending_payments SET processed_at = NOW() WHERE id = ?",
			[pending.id],
		);

		if (kashierRef) {
			await conn.query(
				"UPDATE pending_payments SET kashier_reference = ? WHERE id = ?",
				[kashierRef, pending.id],
			);
		}

		if (status === "confirmed") {
			await conn.query(
				"UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = ?",
				[pending.order_id],
			);

			const [orderRows] = await conn.query<RowDataPacket[]>(
				"SELECT * FROM orders WHERE id = ? LIMIT 1",
				[pending.order_id],
			);
			const [itemRows] = await conn.query<RowDataPacket[]>(
				"SELECT * FROM order_items WHERE order_id = ?",
				[pending.order_id],
			);

			if (orderRows.length > 0) {
				const o = orderRows[0];
				const erpPayload = {
					order_id: o.id,
					contact_id: o.contact_id,
					shipping_address: {
						state: "",
						city: "",
						address_line_1: `${o.building as string}, ${o.street as string}`,
						zip_code: "",
					},
					order_details: itemRows.map((i) => ({
						product_id: i.product_id,
						variation_id: i.variation_id,
						quantity: i.quantity,
						unit_price: Number(i.unit_price),
					})),
					total: Number(o.total),
					payment_method: o.payment_method,
				};
				await enqueueWebhook({
					env,
					eventType: "payment_confirmed",
					orderId: pending.order_id,
					payload: erpPayload,
					conn,
				});
			}
		} else {
			await conn.query(
				"UPDATE orders SET status = 'payment_failed', updated_at = NOW() WHERE id = ?",
				[pending.order_id],
			);
		}

		await conn.commit();
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}

	const redirectBase = env.PUBLIC_SITE_URL;
	const confirmPath =
		status === "confirmed"
			? `/orders/${pending.order_id}?paid=1`
			: `/orders/${pending.order_id}?paid=0`;
	return c.json({ status, redirectUrl: `${redirectBase}${confirmPath}` });
});

export default route;
