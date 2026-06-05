import { Hono } from "hono";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import { getErpPool, query } from "../lib/db";
import { slugify } from "../lib/slug";

interface CategoryRow extends RowDataPacket {
	id: number;
	name: string;
	parent_id: number;
	slug: string | null;
	product_count: number;
}

const route = new Hono();

route.get("/", async (c) => {
	const env = loadEnv();
	const rows = await query<CategoryRow[]>(
		getErpPool(env),
		`
		SELECT c.id, c.name, c.parent_id, c.slug,
			COUNT(DISTINCT p.id) AS product_count
		FROM categories c
		LEFT JOIN products p
			ON (p.category_id = c.id OR p.sub_category_id = c.id)
			AND p.business_id = ?
		WHERE c.business_id = ?
			AND c.deleted_at IS NULL
			AND (c.category_type = 'product' OR c.category_type IS NULL)
		GROUP BY c.id
		ORDER BY c.parent_id ASC, c.name ASC
		`,
		[env.ERP_BUSINESS_ID, env.ERP_BUSINESS_ID],
	);

	const items = rows.map((r) => ({
		id: r.id,
		name: r.name,
		slug: r.slug ?? slugify(r.name),
		parentId: r.parent_id || null,
		productCount: Number(r.product_count ?? 0),
	}));
	return c.json({ items });
});

export default route;
