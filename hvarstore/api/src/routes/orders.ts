import { Hono } from "hono";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import { getErpPool, getSitePool, query } from "../lib/db";
import { normalizePhone } from "../lib/phone";

const CreateOrderSchema = z.object({
	items: z
		.array(
			z.object({
				productId: z.number().int().positive(),
				variationId: z.number().int().positive(),
				name: z.string(),
				sku: z.string().optional(),
				quantity: z.number().int().positive(),
			}),
		)
		.min(1, "السلة فارغة"),
	paymentMethod: z.enum(["cod", "kashier_card", "kashier_installments"]),
	governorateId: z.number().int().positive(),
	districtId: z.number().int().positive(),
	street: z.string().min(1),
	building: z.string().min(1),
	apartment: z.string().optional(),
	shippingPhone: z.string().min(1),
	notes: z.string().optional(),
});

interface StockRow extends RowDataPacket {
	variation_id: number;
	qty_available: string;
}

interface VariationPriceRow extends RowDataPacket {
	id: number;
	sell_price_inc_tax: string | null;
	default_sell_price: string | null;
}

interface OrderRow extends RowDataPacket {
	id: number;
	customer_id: number;
	contact_id: number;
	payment_method: string;
	status: string;
	subtotal: string;
	shipping_fee: string;
	total: string;
	governorate_id: number;
	district_id: number;
	street: string;
	building: string;
	apartment: string | null;
	shipping_phone: string;
	notes: string | null;
	erp_transaction_id: number | null;
	bill_code: string | null;
	cancelled_at: string | null;
	created_at: string;
}

interface OrderItemRow extends RowDataPacket {
	id: number;
	product_id: number;
	variation_id: number;
	name: string;
	sku: string | null;
	quantity: number;
	unit_price: string;
	subtotal: string;
}

interface GovRow extends RowDataPacket {
	nameAr: string;
}
interface DistRow extends RowDataPacket {
	district_name_ar: string;
}

const route = new Hono();

route.get("/", async (c) => {
	const user = c.get("user");
	const env = loadEnv();

	const rows = await query<OrderRow[]>(
		getSitePool(env),
		`SELECT id, payment_method, status, total, bill_code, cancelled_at, created_at
		 FROM orders WHERE contact_id = ? ORDER BY id DESC`,
		[user.contactId],
	);

	return c.json({
		items: rows.map((r) => ({
			id: r.id,
			paymentMethod: r.payment_method,
			status: r.status,
			total: Number(r.total),
			billCode: r.bill_code,
			cancelledAt: r.cancelled_at,
			createdAt: r.created_at,
		})),
	});
});

route.get("/:id", async (c) => {
	const user = c.get("user");
	const env = loadEnv();
	const orderId = Number(c.req.param("id"));
	if (!Number.isFinite(orderId)) return c.json({ error: "bad_request" }, 400);

	const orders = await query<OrderRow[]>(
		getSitePool(env),
		"SELECT * FROM orders WHERE id = ? AND contact_id = ? LIMIT 1",
		[orderId, user.contactId],
	);
	if (orders.length === 0) return c.json({ error: "not_found" }, 404);
	const o = orders[0];

	const items = await query<OrderItemRow[]>(
		getSitePool(env),
		"SELECT * FROM order_items WHERE order_id = ?",
		[orderId],
	);

	const govs = await query<GovRow[]>(
		getErpPool(env),
		"SELECT nameAr FROM cities WHERE id = ? LIMIT 1",
		[o.governorate_id],
	);
	const dists = await query<DistRow[]>(
		getErpPool(env),
		"SELECT district_name_ar FROM districts WHERE id = ? LIMIT 1",
		[o.district_id],
	);

	return c.json({
		id: o.id,
		paymentMethod: o.payment_method,
		status: o.status,
		subtotal: Number(o.subtotal),
		shippingFee: Number(o.shipping_fee),
		total: Number(o.total),
		billCode: o.bill_code,
		erpTransactionId: o.erp_transaction_id,
		cancelledAt: o.cancelled_at,
		createdAt: o.created_at,
		address: {
			governorate: govs[0]?.nameAr ?? "",
			district: dists[0]?.district_name_ar ?? "",
			street: o.street,
			building: o.building,
			apartment: o.apartment,
			phone: o.shipping_phone,
			notes: o.notes,
		},
		items: items.map((i) => ({
			productId: i.product_id,
			variationId: i.variation_id,
			name: i.name,
			sku: i.sku,
			quantity: i.quantity,
			unitPrice: Number(i.unit_price),
			subtotal: Number(i.subtotal),
		})),
	});
});

route.post("/:id/cancel", async (c) => {
	const user = c.get("user");
	const orderId = Number(c.req.param("id"));
	if (!Number.isFinite(orderId)) return c.json({ error: "bad_request" }, 400);

	const env = loadEnv();
	const sitePool = getSitePool(env);

	const rows = await query<OrderRow[]>(
		sitePool,
		"SELECT id, status, payment_method, erp_webhook_sent FROM orders WHERE id = ? AND contact_id = ? LIMIT 1",
		[orderId, user.contactId],
	);
	if (rows.length === 0) return c.json({ error: "not_found" }, 404);

	const o = rows[0];
	if (o.status !== "pending") {
		return c.json({ error: "لا يمكن إلغاء الطلب في هذه المرحلة" }, 409);
	}
	if (o.payment_method !== "cod") {
		return c.json(
			{ error: "إلغاء الطلبات المدفوعة إلكترونياً يتم عبر خدمة العملاء" },
			409,
		);
	}

	await sitePool.query(
		"UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = ?",
		[orderId],
	);

	return c.json({ status: "cancelled" });
});

route.post("/", async (c) => {
	const user = c.get("user");
	const body = await c.req.json();
	const parsed = CreateOrderSchema.safeParse(body);
	if (!parsed.success) {
		return c.json(
			{ error: "validation", details: parsed.error.flatten().fieldErrors },
			400,
		);
	}

	const data = parsed.data;
	const phone = normalizePhone(data.shippingPhone);
	if (!phone) return c.json({ error: "رقم الشحن غير صحيح" }, 400);

	const env = loadEnv();
	const erpPool = getErpPool(env);
	const sitePool = getSitePool(env);

	const variationIds = data.items.map((i) => i.variationId);
	const stockRows = await query<StockRow[]>(
		erpPool,
		`SELECT variation_id, qty_available
		 FROM variation_location_details
		 WHERE variation_id IN (${variationIds.map(() => "?").join(",")})
		 AND location_id = ?
		 FOR UPDATE`,
		[...variationIds, env.ERP_LOCATION_ID],
	);

	const stockMap = new Map(
		stockRows.map((r) => [r.variation_id, Number(r.qty_available)]),
	);
	for (const item of data.items) {
		const available = stockMap.get(item.variationId) ?? 0;
		if (available < item.quantity) {
			return c.json(
				{
					error: "stock",
					message: `الكمية غير متاحة لـ ${item.name}`,
					variationId: item.variationId,
					available,
				},
				409,
			);
		}
	}

	// Fetch authoritative prices from ERP — client-sent prices are not trusted
	const priceRows = await query<VariationPriceRow[]>(
		erpPool,
		`SELECT id, sell_price_inc_tax, default_sell_price FROM variations WHERE id IN (${variationIds.map(() => "?").join(",")}) AND deleted_at IS NULL`,
		variationIds,
	);
	const priceMap = new Map(
		priceRows.map((r) => [
			r.id,
			Number(r.sell_price_inc_tax ?? r.default_sell_price ?? 0),
		]),
	);
	for (const item of data.items) {
		if (!priceMap.has(item.variationId)) {
			return c.json(
				{ error: "product_not_found", variationId: item.variationId },
				404,
			);
		}
	}

	const subtotal = data.items.reduce(
		(s, i) => s + (priceMap.get(i.variationId) ?? 0) * i.quantity,
		0,
	);
	const shippingFee = 0;
	const total = subtotal + shippingFee;

	const conn = await sitePool.getConnection();
	try {
		await conn.beginTransaction();

		const [orderResult] = await conn.query(
			`INSERT INTO orders
			 (customer_id, contact_id, payment_method, status, subtotal, shipping_fee, total,
			  governorate_id, district_id, street, building, apartment, shipping_phone, notes,
			  created_at, updated_at)
			 VALUES (
			  (SELECT id FROM customers WHERE contact_id = ? LIMIT 1),
			  ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
			 )`,
			[
				user.contactId,
				user.contactId,
				data.paymentMethod,
				subtotal.toFixed(2),
				shippingFee.toFixed(2),
				total.toFixed(2),
				data.governorateId,
				data.districtId,
				data.street,
				data.building,
				data.apartment ?? null,
				phone,
				data.notes ?? null,
			],
		);

		const orderId = (orderResult as { insertId: number }).insertId;

		for (const item of data.items) {
			const unitPrice = priceMap.get(item.variationId) ?? 0;
			const lineSubtotal = unitPrice * item.quantity;
			await conn.query(
				`INSERT INTO order_items
				 (order_id, product_id, variation_id, name, sku, quantity, unit_price, subtotal)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					orderId,
					item.productId,
					item.variationId,
					item.name,
					item.sku ?? null,
					item.quantity,
					unitPrice.toFixed(2),
					lineSubtotal.toFixed(2),
				],
			);
		}

		await conn.commit();

		if (data.paymentMethod === "cod") {
			fireErpWebhook(env, orderId, user, data, priceMap, total).catch(() => {});
		}

		return c.json({ orderId, total, status: "pending" }, 201);
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
});

async function fireErpWebhook(
	env: ReturnType<typeof loadEnv>,
	orderId: number,
	user: { contactId: number; phone: string; name: string },
	data: z.infer<typeof CreateOrderSchema>,
	priceMap: Map<number, number>,
	total: number,
) {
	if (!env.ERP_WEBHOOK_URL) return;

	const govs = await query<GovRow[]>(
		getErpPool(env),
		"SELECT nameAr FROM cities WHERE id = ? LIMIT 1",
		[data.governorateId],
	);
	const dists = await query<DistRow[]>(
		getErpPool(env),
		"SELECT district_name_ar FROM districts WHERE id = ? LIMIT 1",
		[data.districtId],
	);

	const payload = {
		order_id: orderId,
		contact_id: user.contactId,
		shipping_address: {
			state: govs[0]?.nameAr ?? "",
			city: dists[0]?.district_name_ar ?? "",
			address_line_1: `${data.building}, ${data.street}`,
			zip_code: "",
		},
		order_details: data.items.map((i) => ({
			product_id: i.productId,
			variation_id: i.variationId,
			quantity: i.quantity,
			unit_price: priceMap.get(i.variationId) ?? 0,
		})),
		total,
		payment_method: data.paymentMethod,
	};

	try {
		await fetch(env.ERP_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		await getSitePool(env).query(
			"UPDATE orders SET erp_webhook_sent = 1 WHERE id = ?",
			[orderId],
		);
	} catch {
		// webhook failure is non-blocking
	}
}

export default route;
