import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import type { Pool } from "mysql2/promise";
import type { Env } from "../env";
import { getErpPool, getSitePool, query } from "../lib/db";
import {
	signToken,
	signRefreshToken,
	signFbPending,
	verifyFbPending,
	type JwtPayload,
} from "../lib/auth";
import { verifyFacebookToken } from "../lib/facebook";
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

// Phone-only (passwordless): phone is identity, name optional for first-timers.
const PhoneSchema = z.object({
	phone: z.string().min(1, "رقم الموبايل مطلوب"),
	name: z.string().max(100).optional(),
});

const FacebookSchema = z.object({
	accessToken: z.string().min(1, "Facebook access token مطلوب"),
});

const FacebookCompleteSchema = z.object({
	fbToken: z.string().min(1),
	phone: z.string().min(1, "رقم الموبايل مطلوب"),
	name: z.string().max(100).optional(),
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
	email: string | null;
	facebook_id: string | null;
	avatar_url: string | null;
	password_hash: string | null;
}

/** Find a customer's ERP contact by phone, or create one. Returns contact_id. */
async function findOrCreateContact(
	erpPool: Pool,
	env: Env,
	name: string,
	phone: string,
): Promise<number> {
	const contacts = await query<ContactRow[]>(
		erpPool,
		"SELECT id FROM contacts WHERE mobile = ? AND type = 'customer' AND business_id = ? LIMIT 1",
		[phone, env.ERP_BUSINESS_ID],
	);
	if (contacts.length > 0) return contacts[0].id;

	const [result] = await erpPool.query(
		`INSERT INTO contacts (business_id, type, name, mobile, created_by, created_at, updated_at)
		 VALUES (?, 'customer', ?, ?, 1, NOW(), NOW())`,
		[env.ERP_BUSINESS_ID, name, phone],
	);
	return (result as { insertId: number }).insertId;
}

/** Mint access + refresh tokens for a customer and shape the response body. */
async function issueAuth(
	user: JwtPayload & { email?: string | null; avatar?: string | null },
) {
	const payload: JwtPayload = {
		contactId: user.contactId,
		phone: user.phone,
		name: user.name,
	};
	const token = await signToken(payload);
	const refreshToken = await signRefreshToken(payload);
	return { token, refreshToken, user };
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
	// Passwordless / Facebook accounts have no password — point them at phone login.
	if (!customer.password_hash) {
		return c.json(
			{ error: "الحساب ده بيدخل برقم الموبايل — استخدم الدخول بالموبايل" },
			401,
		);
	}
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

// ── Phone-only login/signup (passwordless) ──
// Phone IS the identity: known phone → log in; new phone → create account.
// No password, no code. Rate-limited so a known number can't be bulk-scraped.
route.post("/phone", async (c) => {
	const ip =
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (!rateLimit(`phone:${ip}`, 12)) {
		return c.json({ error: "محاولات كتيرة — استنى دقيقة وجرب تاني" }, 429);
	}

	const body = await c.req.json();
	const parsed = PhoneSchema.safeParse(body);
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

	const existing = await query<CustomerRow[]>(
		sitePool,
		"SELECT id, contact_id, phone, name, email, avatar_url FROM customers WHERE phone = ? LIMIT 1",
		[phone],
	);

	// Returning customer — log straight in.
	if (existing.length > 0) {
		const customer = existing[0];
		return c.json(
			await issueAuth({
				contactId: customer.contact_id,
				phone: customer.phone,
				name: customer.name,
				email: customer.email,
				avatar: customer.avatar_url,
			}),
		);
	}

	// New customer — create. Name falls back to the phone if not provided.
	const name = parsed.data.name?.trim() || phone;
	const erpPool = getErpPool(env);
	const contactId = await findOrCreateContact(erpPool, env, name, phone);

	await sitePool.query(
		"INSERT INTO customers (contact_id, phone, name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
		[contactId, phone, name],
	);

	return c.json(await issueAuth({ contactId, phone, name }));
});

// ── Phone lookup (read-only): does this phone already have an account? ──
// Lets the storefront branch new-vs-returning BEFORE asking for a name, so a
// new customer is guided to "introduce yourself" instead of silently creating
// a phone-named ghost account. No side effects; rate-limited against scraping.
route.post("/phone/check", async (c) => {
	const ip =
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (!rateLimit(`check:${ip}`, 20)) {
		return c.json({ error: "محاولات كتيرة — استنى دقيقة وجرب تاني" }, 429);
	}

	const body = await c.req.json();
	const parsed = PhoneSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "رقم الموبايل مطلوب" }, 400);
	}

	const phone = normalizePhone(parsed.data.phone);
	if (!phone) {
		return c.json({ error: "رقم موبايل مصري غير صحيح" }, 400);
	}

	const env = loadEnv();
	const existing = await query<CustomerRow[]>(
		getSitePool(env),
		"SELECT id FROM customers WHERE phone = ? LIMIT 1",
		[phone],
	);

	return c.json({ exists: existing.length > 0 });
});

// ── Facebook login (step 1): verify token → log in, or ask for phone ──
// FB never returns a phone, but every order keys on one. So: if we can match
// this FB profile to an existing customer (by fb id, then email) we log in;
// otherwise we hand back a short-lived ticket and ask for the phone (step 2).
route.post("/facebook", async (c) => {
	const env = loadEnv();
	if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
		return c.json({ error: "تسجيل الدخول بفيسبوك غير مفعّل" }, 503);
	}

	const body = await c.req.json();
	const parsed = FacebookSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Facebook access token مطلوب" }, 400);
	}

	const profile = await verifyFacebookToken(parsed.data.accessToken, env);
	if (!profile) {
		return c.json({ error: "تعذّر التحقق من حساب فيسبوك" }, 401);
	}

	const sitePool = getSitePool(env);

	// 1) Already linked by Facebook id → log in.
	const byFb = await query<CustomerRow[]>(
		sitePool,
		"SELECT id, contact_id, phone, name, email, avatar_url FROM customers WHERE facebook_id = ? LIMIT 1",
		[profile.id],
	);
	if (byFb.length > 0) {
		const customer = byFb[0];
		// Refresh avatar/name on each login — keeps the captured info current.
		await sitePool.query(
			"UPDATE customers SET name = ?, avatar_url = ?, email = COALESCE(?, email), updated_at = NOW() WHERE id = ?",
			[customer.name, profile.avatar, profile.email, customer.id],
		);
		return c.json(
			await issueAuth({
				contactId: customer.contact_id,
				phone: customer.phone,
				name: customer.name,
				email: customer.email ?? profile.email,
				avatar: profile.avatar,
			}),
		);
	}

	// 2) Same email as an existing customer → link Facebook to it, log in.
	if (profile.email) {
		const byEmail = await query<CustomerRow[]>(
			sitePool,
			"SELECT id, contact_id, phone, name, email, avatar_url FROM customers WHERE email = ? AND facebook_id IS NULL LIMIT 1",
			[profile.email],
		);
		if (byEmail.length > 0) {
			const customer = byEmail[0];
			await sitePool.query(
				"UPDATE customers SET facebook_id = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?",
				[profile.id, profile.avatar, customer.id],
			);
			return c.json(
				await issueAuth({
					contactId: customer.contact_id,
					phone: customer.phone,
					name: customer.name,
					email: customer.email,
					avatar: profile.avatar,
				}),
			);
		}
	}

	// 3) Brand-new — need a phone to finish. Hand back a signed ticket.
	const fbToken = await signFbPending({
		facebookId: profile.id,
		name: profile.name,
		email: profile.email,
		avatar: profile.avatar,
	});
	return c.json({
		needsPhone: true,
		fbToken,
		name: profile.name,
		email: profile.email,
	});
});

// ── Facebook login (step 2): phone + ticket → create or link, then log in ──
route.post("/facebook/complete", async (c) => {
	const ip =
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (!rateLimit(`fbc:${ip}`, 12)) {
		return c.json({ error: "محاولات كتيرة — استنى دقيقة وجرب تاني" }, 429);
	}

	const body = await c.req.json();
	const parsed = FacebookCompleteSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "بيانات غير مكتملة" }, 400);
	}

	const pending = await verifyFbPending(parsed.data.fbToken);
	if (!pending) {
		return c.json({ error: "انتهت صلاحية الجلسة — ابدأ من جديد" }, 401);
	}

	const phone = normalizePhone(parsed.data.phone);
	if (!phone) {
		return c.json({ error: "رقم موبايل مصري غير صحيح" }, 400);
	}

	const env = loadEnv();
	const sitePool = getSitePool(env);

	// Phone already has an account → attach Facebook to it.
	const existing = await query<CustomerRow[]>(
		sitePool,
		"SELECT id, contact_id, phone, name, email FROM customers WHERE phone = ? LIMIT 1",
		[phone],
	);
	if (existing.length > 0) {
		const customer = existing[0];
		await sitePool.query(
			"UPDATE customers SET facebook_id = ?, avatar_url = ?, email = COALESCE(email, ?), updated_at = NOW() WHERE id = ?",
			[pending.facebookId, pending.avatar, pending.email, customer.id],
		);
		return c.json(
			await issueAuth({
				contactId: customer.contact_id,
				phone: customer.phone,
				name: customer.name,
				email: customer.email ?? pending.email,
				avatar: pending.avatar,
			}),
		);
	}

	// New customer from Facebook profile + the phone they just gave us.
	const name = parsed.data.name?.trim() || pending.name || phone;
	const erpPool = getErpPool(env);
	const contactId = await findOrCreateContact(erpPool, env, name, phone);

	await sitePool.query(
		"INSERT INTO customers (contact_id, phone, name, email, facebook_id, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
		[contactId, phone, name, pending.email, pending.facebookId, pending.avatar],
	);

	return c.json(
		await issueAuth({
			contactId,
			phone,
			name,
			email: pending.email,
			avatar: pending.avatar,
		}),
	);
});

route.get("/me", authMiddleware, async (c) => {
	const user = c.get("user");
	return c.json({ user });
});

export default route;
