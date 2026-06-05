import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import { getErpPool, getSitePool, query } from "../lib/db";
import { signToken, signRefreshToken } from "../lib/auth";
import { normalizePhone } from "../lib/phone";
import { authMiddleware } from "../middleware/auth";

// In-memory rate limiter — resets per IP every 60 seconds
const _rl = new Map<string, { n: number; until: number }>();
function rateLimit(ip: string, max: number): boolean {
	const now = Date.now();
	const e = _rl.get(ip);
	if (!e || e.until < now) {
		_rl.set(ip, { n: 1, until: now + 60_000 });
		return true;
	}
	if (e.n >= max) return false;
	e.n++;
	return true;
}

const RegisterSchema = z.object({
	phone: z.string().min(1, "رقم الموبايل مطلوب"),
	name: z.string().min(2, "الاسم مطلوب").max(100),
	password: z.string().min(6, "كلمة المرور يجب أن تكون ٦ أحرف على الأقل"),
});

const LoginSchema = z.object({
	phone: z.string().min(1, "رقم الموبايل مطلوب"),
	password: z.string().min(1, "كلمة المرور مطلوبة"),
});

interface ContactRow extends RowDataPacket {
	id: number;
	name: string;
	mobile: string;
}

interface CustomerRow extends RowDataPacket {
	id: number;
	contact_id: number;
	phone: string;
	name: string;
	password_hash: string;
}

const route = new Hono();

route.post("/register", async (c) => {
	const body = await c.req.json();
	const parsed = RegisterSchema.safeParse(body);
	if (!parsed.success) {
		return c.json(
			{ error: "validation", details: parsed.error.flatten().fieldErrors },
			400,
		);
	}

	const phone = normalizePhone(parsed.data.phone);
	if (!phone) {
		return c.json({ error: "رقم موبايل مصري غير صحيح" }, 400);
	}

	const env = loadEnv();
	const sitePool = getSitePool(env);
	const erpPool = getErpPool(env);

	const existing = await query<CustomerRow[]>(
		sitePool,
		"SELECT id FROM customers WHERE phone = ? LIMIT 1",
		[phone],
	);
	if (existing.length > 0) {
		return c.json({ error: "الرقم مسجل بالفعل" }, 409);
	}

	let contactId: number;
	const contacts = await query<ContactRow[]>(
		erpPool,
		"SELECT id, name, mobile FROM contacts WHERE mobile = ? AND type = 'customer' AND business_id = ? LIMIT 1",
		[phone, env.ERP_BUSINESS_ID],
	);

	if (contacts.length > 0) {
		contactId = contacts[0].id;
	} else {
		const [result] = await erpPool.query(
			`INSERT INTO contacts (business_id, type, name, mobile, created_by, created_at, updated_at)
			 VALUES (?, 'customer', ?, ?, 1, NOW(), NOW())`,
			[env.ERP_BUSINESS_ID, parsed.data.name, phone],
		);
		contactId = (result as { insertId: number }).insertId;
	}

	const passwordHash = await bcrypt.hash(parsed.data.password, 10);
	await sitePool.query(
		"INSERT INTO customers (contact_id, phone, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
		[contactId, phone, parsed.data.name, passwordHash],
	);

	const token = await signToken({
		contactId,
		phone,
		name: parsed.data.name,
	});
	const refreshToken = await signRefreshToken({
		contactId,
		phone,
		name: parsed.data.name,
	});

	return c.json({
		token,
		refreshToken,
		user: { contactId, phone, name: parsed.data.name },
	});
});

route.post("/login", async (c) => {
	const body = await c.req.json();
	const parsed = LoginSchema.safeParse(body);
	if (!parsed.success) {
		return c.json(
			{ error: "validation", details: parsed.error.flatten().fieldErrors },
			400,
		);
	}

	const phone = normalizePhone(parsed.data.phone);
	if (!phone) {
		return c.json({ error: "رقم موبايل مصري غير صحيح" }, 400);
	}

	const env = loadEnv();
	const customers = await query<CustomerRow[]>(
		getSitePool(env),
		"SELECT id, contact_id, phone, name, password_hash FROM customers WHERE phone = ? LIMIT 1",
		[phone],
	);

	if (customers.length === 0) {
		return c.json({ error: "رقم الموبايل أو كلمة المرور غير صحيحة" }, 401);
	}

	const customer = customers[0];
	const valid = await bcrypt.compare(
		parsed.data.password,
		customer.password_hash,
	);
	if (!valid) {
		return c.json({ error: "رقم الموبايل أو كلمة المرور غير صحيحة" }, 401);
	}

	const payload = {
		contactId: customer.contact_id,
		phone: customer.phone,
		name: customer.name,
	};

	const token = await signToken(payload);
	const refreshToken = await signRefreshToken(payload);

	return c.json({ token, refreshToken, user: payload });
});

route.get("/me", authMiddleware, async (c) => {
	const user = c.get("user");
	return c.json({ user });
});

export default route;
