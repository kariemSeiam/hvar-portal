import { Hono } from "hono";
import { loadEnv } from "../env";
import { getProductById, listFeatured, listProducts } from "../lib/products";
import { parseProductSlug } from "../lib/slug";

const route = new Hono();

route.get("/", async (c) => {
	const env = loadEnv();
	const url = new URL(c.req.url);
	const q = url.searchParams.get("q") ?? undefined;
	const categoryId = numParam(url.searchParams.get("category"));
	const minPrice = numParam(url.searchParams.get("min_price"));
	const maxPrice = numParam(url.searchParams.get("max_price"));
	const inStock = url.searchParams.get("in_stock") === "1";
	const limit = Math.min(numParam(url.searchParams.get("limit")) ?? 24, 100);
	const offset = numParam(url.searchParams.get("offset")) ?? 0;

	const items = await listProducts(env, {
		q,
		categoryId,
		minPrice,
		maxPrice,
		inStock,
		limit,
		offset,
	});
	return c.json({ items, limit, offset });
});

route.get("/featured", async (c) => {
	const env = loadEnv();
	const limit = Math.min(
		numParam(new URL(c.req.url).searchParams.get("limit")) ?? 8,
		24,
	);
	const items = await listFeatured(env, limit);
	return c.json({ items });
});

route.get("/:slug", async (c) => {
	const env = loadEnv();
	const id = parseProductSlug(c.req.param("slug"));
	if (id === null) return c.json({ error: "not_found" }, 404);
	const product = await getProductById(env, id);
	if (!product) return c.json({ error: "not_found" }, 404);
	return c.json(product);
});

function numParam(v: string | null | undefined): number | undefined {
	if (v == null || v === "") return undefined;
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

export default route;
