import { Hono } from "hono";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import { getMcrmPool, query } from "../lib/db";

const CreateTicketSchema = z.object({
	type: z.enum(["R", "M", "T"]),
	transactionId: z.number().int().positive().optional(),
	productName: z.string().min(1, "اسم المنتج مطلوب"),
	description: z.string().min(1, "وصف المشكلة مطلوب"),
});

interface TicketRow extends RowDataPacket {
	id: number;
	ticket_code: string;
	type: string;
	status: string;
	contact_id: number;
	transaction_id: number | null;
	product_name: string;
	description: string;
	created_at: string;
	updated_at: string;
}

interface HistoryRow extends RowDataPacket {
	id: number;
	status: string;
	notes: string | null;
	created_at: string;
}

interface SequenceRow extends RowDataPacket {
	next_val: number;
}

const route = new Hono();

route.get("/", async (c) => {
	const user = c.get("user");
	const env = loadEnv();

	const rows = await query<TicketRow[]>(
		getMcrmPool(env),
		`SELECT id, ticket_code, type, status, product_name, description, created_at, updated_at
		 FROM service_tickets
		 WHERE contact_id = ?
		 ORDER BY id DESC`,
		[user.contactId],
	);

	return c.json({
		items: rows.map((r) => ({
			id: r.id,
			ticketCode: r.ticket_code,
			type: r.type,
			status: r.status,
			productName: r.product_name,
			description: r.description,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		})),
	});
});

route.get("/:id", async (c) => {
	const user = c.get("user");
	const env = loadEnv();
	const ticketId = Number(c.req.param("id"));
	if (!Number.isFinite(ticketId)) return c.json({ error: "bad_request" }, 400);

	const tickets = await query<TicketRow[]>(
		getMcrmPool(env),
		"SELECT * FROM service_tickets WHERE id = ? AND contact_id = ? LIMIT 1",
		[ticketId, user.contactId],
	);
	if (tickets.length === 0) return c.json({ error: "not_found" }, 404);

	const t = tickets[0];

	const history = await query<HistoryRow[]>(
		getMcrmPool(env),
		"SELECT id, status, notes, created_at FROM service_ticket_history WHERE ticket_id = ? ORDER BY id ASC",
		[ticketId],
	);

	return c.json({
		id: t.id,
		ticketCode: t.ticket_code,
		type: t.type,
		status: t.status,
		contactId: t.contact_id,
		transactionId: t.transaction_id,
		productName: t.product_name,
		description: t.description,
		createdAt: t.created_at,
		updatedAt: t.updated_at,
		history: history.map((h) => ({
			id: h.id,
			status: h.status,
			notes: h.notes,
			createdAt: h.created_at,
		})),
	});
});

route.post("/", async (c) => {
	const user = c.get("user");
	const body = await c.req.json();
	const parsed = CreateTicketSchema.safeParse(body);
	if (!parsed.success) {
		return c.json(
			{ error: "validation", details: parsed.error.flatten().fieldErrors },
			400,
		);
	}

	const data = parsed.data;
	const env = loadEnv();
	const pool = getMcrmPool(env);

	const prefixMap: Record<string, string> = { M: "HVM", R: "HVR", T: "HVT" };
	const prefix = prefixMap[data.type];

	const conn = await pool.getConnection();
	try {
		await conn.beginTransaction();

		const [seqRows] = await conn.query<SequenceRow[]>(
			"SELECT next_val FROM ticket_sequences WHERE prefix = ? FOR UPDATE",
			[prefix],
		);

		let nextVal: number;
		if ((seqRows as SequenceRow[]).length === 0) {
			nextVal = 1;
			await conn.query(
				"INSERT INTO ticket_sequences (prefix, next_val) VALUES (?, 2)",
				[prefix],
			);
		} else {
			nextVal = (seqRows as SequenceRow[])[0].next_val;
			await conn.query(
				"UPDATE ticket_sequences SET next_val = next_val + 1 WHERE prefix = ?",
				[prefix],
			);
		}

		const ticketCode = `${prefix}-${String(nextVal).padStart(5, "0")}`;

		const [result] = await conn.query(
			`INSERT INTO service_tickets
			 (ticket_code, type, status, contact_id, transaction_id, product_name, description, created_at, updated_at)
			 VALUES (?, ?, 'PENDING', ?, ?, ?, ?, NOW(), NOW())`,
			[
				ticketCode,
				data.type,
				user.contactId,
				data.transactionId ?? null,
				data.productName,
				data.description,
			],
		);

		const ticketId = (result as { insertId: number }).insertId;

		await conn.query(
			"INSERT INTO service_ticket_history (ticket_id, status, notes, created_at) VALUES (?, 'PENDING', 'تم فتح الطلب من الموقع', NOW())",
			[ticketId],
		);

		await conn.commit();

		return c.json({ id: ticketId, ticketCode, status: "PENDING" }, 201);
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
});

export default route;
