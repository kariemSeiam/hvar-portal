const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;
const NON_SLUG = /[^a-z0-9\u0600-\u06FF]+/g;

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFKD")
		.replace(ARABIC_DIACRITICS, "")
		.replace(NON_SLUG, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

export function productSlug(name: string, id: number): string {
	const base = slugify(name);
	return base ? `${base}-${id}` : String(id);
}

export function parseProductSlug(slug: string): number | null {
	const m = slug.match(/-(\d+)$/);
	if (m) return Number(m[1]);
	if (/^\d+$/.test(slug)) return Number(slug);
	return null;
}
