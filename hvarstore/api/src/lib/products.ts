import type { RowDataPacket } from "mysql2";
import type { Env } from "../env";
import { getErpPool, query } from "./db";
import { productSlug } from "./slug";

export interface ProductCardRow extends RowDataPacket {
	id: number;
	name: string;
	sku: string;
	type: "single" | "variable" | "modifier" | "combo";
	image: string | null;
	product_description: string | null;
	category_id: number | null;
	category_name: string | null;
	default_variation_id: number;
	default_sub_sku: string | null;
	price: string;
	compare_price: string | null;
	stock: string;
}

export interface ProductCard {
	id: number;
	slug: string;
	name: string;
	sku: string;
	type: ProductCardRow["type"];
	image: string | null;
	description: string | null;
	categoryId: number | null;
	categoryName: string | null;
	variationId: number;
	subSku: string | null;
	price: number;
	comparePrice: number | null;
	stock: number;
}

export interface VariationRow extends RowDataPacket {
	id: number;
	name: string;
	sub_sku: string | null;
	default_sell_price: string | null;
	sell_price_inc_tax: string | null;
	qty_available: string | null;
}

export interface ProductDetail extends ProductCard {
	weight: string | null;
	variations: Array<{
		id: number;
		name: string;
		subSku: string | null;
		price: number;
		stock: number;
	}>;
}

// ANY_VALUE: cards show default variation. Type='single' products have one variation,
// so it's deterministic. For type='variable' a min-id subquery would be needed.
const SELECT_CARD = `
	SELECT
		p.id, p.name, p.sku, p.type, p.image, p.product_description,
		p.category_id, ANY_VALUE(c.name) AS category_name,
		ANY_VALUE(v.id) AS default_variation_id,
		ANY_VALUE(v.sub_sku) AS default_sub_sku,
		ANY_VALUE(v.sell_price_inc_tax) AS price,
		ANY_VALUE(v.dpp_inc_tax) AS compare_price,
		COALESCE(SUM(vld.qty_available), 0) AS stock
	FROM products p
	LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
	LEFT JOIN variations v ON v.product_id = p.id AND v.deleted_at IS NULL
	LEFT JOIN variation_location_details vld ON vld.variation_id = v.id AND vld.location_id = ?
`;

export interface ListParams {
	categoryId?: number;
	q?: string;
	minPrice?: number;
	maxPrice?: number;
	inStock?: boolean;
	limit: number;
	offset: number;
}

export async function listProducts(
	env: Env,
	params: ListParams,
): Promise<ProductCard[]> {
	const where: string[] = ["p.business_id = ?"];
	const args: unknown[] = [env.ERP_LOCATION_ID, env.ERP_BUSINESS_ID];

	if (params.categoryId) {
		where.push("(p.category_id = ? OR p.sub_category_id = ?)");
		args.push(params.categoryId, params.categoryId);
	}
	if (params.q) {
		where.push("(p.name LIKE ? OR p.sku LIKE ?)");
		const like = `%${params.q}%`;
		args.push(like, like);
	}

	const sql = `
		${SELECT_CARD}
		WHERE ${where.join(" AND ")}
		GROUP BY p.id
		${params.minPrice !== undefined || params.maxPrice !== undefined || params.inStock ? "HAVING 1=1" : ""}
		${params.minPrice !== undefined ? "AND price >= ?" : ""}
		${params.maxPrice !== undefined ? "AND price <= ?" : ""}
		${params.inStock ? "AND stock > 0" : ""}
		ORDER BY p.id DESC
		LIMIT ? OFFSET ?
	`;
	if (params.minPrice !== undefined) args.push(params.minPrice);
	if (params.maxPrice !== undefined) args.push(params.maxPrice);
	args.push(params.limit, params.offset);

	const rows = await query<ProductCardRow[]>(getErpPool(env), sql, args);
	return rows.map((r) => toCard(env, r));
}

export async function getProductById(
	env: Env,
	id: number,
): Promise<ProductDetail | null> {
	const sql = `
		${SELECT_CARD}
		WHERE p.id = ? AND p.business_id = ?
		GROUP BY p.id
		LIMIT 1
	`;
	const rows = await query<ProductCardRow[]>(getErpPool(env), sql, [
		env.ERP_LOCATION_ID,
		id,
		env.ERP_BUSINESS_ID,
	]);
	if (rows.length === 0) return null;
	const card = toCard(env, rows[0]);

	const variations = await query<VariationRow[]>(
		getErpPool(env),
		`
		SELECT v.id, v.name, v.sub_sku, v.default_sell_price, v.sell_price_inc_tax,
			COALESCE(SUM(vld.qty_available), 0) AS qty_available
		FROM variations v
		LEFT JOIN variation_location_details vld
			ON vld.variation_id = v.id AND vld.location_id = ?
		WHERE v.product_id = ? AND v.deleted_at IS NULL
		GROUP BY v.id
		ORDER BY v.id ASC
		`,
		[env.ERP_LOCATION_ID, id],
	);

	const weight = await query<RowDataPacket[]>(
		getErpPool(env),
		"SELECT weight FROM products WHERE id = ?",
		[id],
	);

	return {
		...card,
		weight: (weight[0]?.weight as string | null) ?? null,
		variations: variations.map((v) => ({
			id: v.id,
			name: v.name,
			subSku: v.sub_sku,
			price: Number(v.sell_price_inc_tax ?? v.default_sell_price ?? 0),
			stock: Number(v.qty_available ?? 0),
		})),
	};
}

/**
 * Curated bestseller order — compass/products/catalog.md merchandising reality:
 * كبة 2000 وات (flagship) → كبة 800 وات (top TikTok) → الجامبو → هاند بلندر 4×1 →
 * المكواة (most-reviewed on site) → then the rest of the lineup.
 * SKUs not in this list fall back after it, newest first.
 */
const FEATURED_SKU_ORDER = [
	"5070",
	"5029",
	"5019",
	"5057",
	"1115",
	"5070+04",
	"5027",
	"1104",
	"7720",
	"5062",
] as const;

export async function listFeatured(
	env: Env,
	limit: number,
): Promise<ProductCard[]> {
	const fieldArgs = FEATURED_SKU_ORDER.map(() => "?").join(",");
	const sql = `
		${SELECT_CARD}
		WHERE p.business_id = ?
		GROUP BY p.id
		HAVING stock > 0
		ORDER BY (FIELD(p.sku, ${fieldArgs}) = 0) ASC, FIELD(p.sku, ${fieldArgs}) ASC, p.id DESC
		LIMIT ?
	`;
	const rows = await query<ProductCardRow[]>(getErpPool(env), sql, [
		env.ERP_LOCATION_ID,
		env.ERP_BUSINESS_ID,
		...FEATURED_SKU_ORDER,
		...FEATURED_SKU_ORDER,
		limit,
	]);
	return rows.map((r) => toCard(env, r));
}

function toCard(env: Env, r: ProductCardRow): ProductCard {
	const price = Number(r.price ?? 0);
	const comparePrice = r.compare_price ? Number(r.compare_price) : null;
	return {
		id: r.id,
		slug: productSlug(r.name, r.id),
		name: r.name,
		sku: r.sku,
		type: r.type,
		image: imageUrl(env, r.image),
		description: r.product_description,
		categoryId: r.category_id,
		categoryName: r.category_name,
		variationId: r.default_variation_id,
		subSku: r.default_sub_sku,
		price,
		comparePrice: comparePrice && comparePrice > price ? comparePrice : null,
		stock: Number(r.stock ?? 0),
	};
}

function imageUrl(env: Env, file: string | null): string | null {
	if (!file) return null;
	if (file.startsWith("http")) return file;
	return `${env.PUBLIC_MEDIA_BASE}/${file.replace(/^\/+/, "")}`;
}
