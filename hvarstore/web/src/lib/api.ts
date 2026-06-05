export interface ProductCard {
	id: number;
	slug: string;
	name: string;
	sku: string;
	type: "single" | "variable" | "modifier" | "combo";
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

export interface Category {
	id: number;
	name: string;
	slug: string;
	parentId: number | null;
	productCount: number;
}

export interface Governorate {
	id: number;
	code: string;
	name: string;
	nameAr: string;
}

export interface District {
	id: number;
	governorateId: number;
	name: string;
	nameAr: string;
}

function apiBase(): string {
	if (import.meta.env.SSR)
		return import.meta.env.API_BASE ?? "http://localhost:5000";
	return import.meta.env.PUBLIC_API_URL ?? "http://localhost:5000";
}

async function get<T>(
	path: string,
	params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
	const url = new URL(`${apiBase()}/api${path}`);
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== false) url.searchParams.set(k, String(v));
		}
	}
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
	return res.json() as Promise<T>;
}

export const api = {
	products: {
		list: (params?: {
			category?: number;
			q?: string;
			min_price?: number;
			max_price?: number;
			in_stock?: boolean;
			limit?: number;
			offset?: number;
		}) =>
			get<{ items: ProductCard[]; limit: number; offset: number }>(
				"/products",
				{
					...params,
					in_stock: params?.in_stock ? "1" : undefined,
				},
			),

		featured: (limit = 8) =>
			get<{ items: ProductCard[] }>("/products/featured", { limit }),

		get: (slug: string) => get<ProductDetail>(`/products/${slug}`),
	},

	categories: () => get<{ items: Category[] }>("/categories"),

	locations: {
		governorates: () =>
			get<{ items: Governorate[] }>("/locations/governorates"),
		districts: (govId: number) =>
			get<{ items: District[] }>(`/locations/districts/${govId}`),
	},
};
