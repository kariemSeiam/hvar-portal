/**
 * seed-erp.ts — minimal realistic fixtures for local hvar_erp dev DB.
 *
 * Idempotent: re-runs are safe. Wipes only the rows it owns (sku prefix `HVR-DEMO-`).
 * Targets `business_id = 1`, `location_id = 1` (already exist from Ultimate POS install).
 *
 * Run: bun --cwd migrations seed
 */

import mysql from "mysql2/promise";

const env = Bun.env;
const ENV = {
	host: env.ERP_DB_HOST ?? "127.0.0.1",
	port: Number(env.ERP_DB_PORT ?? 3306),
	user: env.ERP_DB_USER ?? "root",
	password: env.ERP_DB_PASSWORD ?? "devpass123",
	database: env.ERP_DB_NAME ?? "hvar_erp",
	multipleStatements: false,
};
const BUSINESS_ID = Number(env.ERP_BUSINESS_ID ?? 1);
const LOCATION_ID = Number(env.ERP_LOCATION_ID ?? 1);
const SKU_PREFIX = "HVR-DEMO-";

const CATEGORIES = [
	{ name: "أجهزة المطبخ الصغيرة", slug: "small-kitchen" },
	{ name: "الأجهزة الكبرى", slug: "large-appliances" },
	{ name: "الإكسسوارات", slug: "accessories" },
];

const PRODUCTS = [
	{
		cat: 0,
		name: "خلاط كهربائي هـفار",
		sku: "BLD-01",
		price: 1199,
		compare: 1499,
		stock: 25,
		weight: "2.4",
		desc: "خلاط بقوة 600 وات مع 3 سرعات ودورق زجاجي 1.5 لتر.",
	},
	{
		cat: 0,
		name: "محضرة طعام هـفار 8 في 1",
		sku: "FP-01",
		price: 1899,
		compare: 2299,
		stock: 12,
		weight: "3.8",
		desc: "محضرة طعام متعددة الاستخدامات مع 8 ملحقات للقطع والفرم والخفق.",
	},
	{
		cat: 0,
		name: "غلاية كهربائية هـفار 1.7L",
		sku: "KTL-01",
		price: 599,
		compare: null,
		stock: 40,
		weight: "1.0",
		desc: "غلاية إستانلس ستيل بسعة 1.7 لتر مع إيقاف تلقائي.",
	},
	{
		cat: 0,
		name: "محمصة خبز هـفار",
		sku: "TST-01",
		price: 749,
		compare: 899,
		stock: 18,
		weight: "1.6",
		desc: "محمصة خبز شريحتين بـ 6 مستويات تحميص.",
	},
	{
		cat: 1,
		name: "قلاية هوائية هـفار 5.5L",
		sku: "AF-01",
		price: 2799,
		compare: 3299,
		stock: 8,
		weight: "5.5",
		desc: "قلاية هوائية بسعة كبيرة ولوحة تحكم رقمية بـ 8 برامج.",
	},
	{
		cat: 1,
		name: "فرن كهربائي هـفار 45L",
		sku: "OV-01",
		price: 3499,
		compare: null,
		stock: 6,
		weight: "12.0",
		desc: "فرن كهربائي بسعة 45 لتر مع شواية ومروحة.",
	},
	{
		cat: 2,
		name: "طقم سكاكين مطبخ هـفار",
		sku: "KN-01",
		price: 449,
		compare: 599,
		stock: 50,
		weight: "1.2",
		desc: "طقم 6 سكاكين إستانلس ستيل مع حامل خشبي.",
	},
	{
		cat: 2,
		name: "ميزان مطبخ رقمي هـفار",
		sku: "SC-01",
		price: 199,
		compare: null,
		stock: 35,
		weight: "0.3",
		desc: "ميزان مطبخ رقمي حتى 5 كجم بدقة 1 جرام.",
	},
];

const GOVERNORATES = [
	{ id: 1, code: "CAI", name: "Cairo", nameAr: "القاهرة" },
	{ id: 2, code: "GIZ", name: "Giza", nameAr: "الجيزة" },
	{ id: 3, code: "ALX", name: "Alexandria", nameAr: "الإسكندرية" },
	{ id: 4, code: "DKL", name: "Dakahlia", nameAr: "الدقهلية" },
	{ id: 5, code: "SHR", name: "Sharqia", nameAr: "الشرقية" },
];

const DISTRICTS: Record<number, Array<[string, string]>> = {
	1: [
		["Nasr City", "مدينة نصر"],
		["Heliopolis", "مصر الجديدة"],
		["Maadi", "المعادي"],
		["Shubra", "شبرا"],
		["New Cairo", "القاهرة الجديدة"],
	],
	2: [
		["Dokki", "الدقي"],
		["Mohandessin", "المهندسين"],
		["6th of October", "السادس من أكتوبر"],
		["Sheikh Zayed", "الشيخ زايد"],
	],
	3: [
		["Smouha", "سموحة"],
		["Miami", "ميامي"],
		["Sidi Gaber", "سيدي جابر"],
	],
	4: [
		["Mansoura", "المنصورة"],
		["Mit Ghamr", "ميت غمر"],
	],
	5: [
		["Zagazig", "الزقازيق"],
		["10th of Ramadan", "العاشر من رمضان"],
	],
};

type Pool = mysql.Pool;

async function main(): Promise<void> {
	const pool = mysql.createPool(ENV);
	console.log(`→ Connected to ${ENV.database} @ ${ENV.host}:${ENV.port}`);

	await wipe(pool);
	await seedCategories(pool);
	await seedProducts(pool);
	await seedLocations(pool);

	const pattern = `${SKU_PREFIX}%`;
	const [countRows] = await pool.query<mysql.RowDataPacket[]>(
		`SELECT
			(SELECT COUNT(*) FROM categories WHERE business_id = ? AND short_code LIKE 'HVR-%') AS c,
			(SELECT COUNT(*) FROM products WHERE business_id = ? AND sku LIKE ?) AS p,
			(SELECT COUNT(*) FROM variation_location_details vld
				JOIN variations v ON v.id = vld.variation_id
				JOIN products pr ON pr.id = v.product_id
				WHERE pr.sku LIKE ?) AS s,
			(SELECT COUNT(*) FROM cities) AS g,
			(SELECT COUNT(*) FROM districts) AS d`,
		[BUSINESS_ID, BUSINESS_ID, pattern, pattern],
	);
	const counts = countRows[0];

	console.log("✓ Seeded:", counts);
	await pool.end();
}

async function wipe(pool: Pool): Promise<void> {
	const pattern = `${SKU_PREFIX}%`;
	await pool.execute(
		`DELETE vld FROM variation_location_details vld
		 JOIN variations v ON v.id = vld.variation_id
		 JOIN products p ON p.id = v.product_id
		 WHERE p.sku LIKE ?`,
		[pattern],
	);
	await pool.execute(
		`DELETE v FROM variations v JOIN products p ON p.id = v.product_id WHERE p.sku LIKE ?`,
		[pattern],
	);
	await pool.execute(
		`DELETE pv FROM product_variations pv JOIN products p ON p.id = pv.product_id WHERE p.sku LIKE ?`,
		[pattern],
	);
	await pool.execute(`DELETE FROM products WHERE sku LIKE ?`, [pattern]);
	await pool.execute(
		`DELETE FROM categories WHERE short_code LIKE 'HVR-%' AND business_id = ?`,
		[BUSINESS_ID],
	);
	await pool.execute("DELETE FROM districts");
	await pool.execute("DELETE FROM cities");
}

const catIds: number[] = [];

async function seedCategories(pool: Pool): Promise<void> {
	for (const c of CATEGORIES) {
		const [r] = await pool.query<mysql.ResultSetHeader>(
			`INSERT INTO categories (name, business_id, short_code, parent_id, created_by, category_type, slug, created_at, updated_at)
			 VALUES (?, ?, ?, 0, 1, 'product', ?, NOW(), NOW())`,
			[c.name, BUSINESS_ID, `HVR-${c.slug.toUpperCase()}`, c.slug],
		);
		catIds.push(r.insertId);
	}
}

async function seedProducts(pool: Pool): Promise<void> {
	for (const p of PRODUCTS) {
		const sku = `${SKU_PREFIX}${p.sku}`;
		const [pr] = await pool.query<mysql.ResultSetHeader>(
			`INSERT INTO products
			 (name, business_id, type, category_id, sku, barcode_type, tax_type, enable_stock,
			  alert_quantity, weight, image, product_description, created_by, created_at, updated_at)
			 VALUES (?, ?, 'single', ?, ?, 'C128', 'inclusive', 1, 5, ?, NULL, ?, 1, NOW(), NOW())`,
			[p.name, BUSINESS_ID, catIds[p.cat], sku, p.weight, p.desc],
		);
		const productId = pr.insertId;

		const [pvRes] = await pool.query<mysql.ResultSetHeader>(
			`INSERT INTO product_variations (variation_template_id, name, product_id, is_dummy, created_at, updated_at)
			 VALUES (0, 'DUMMY', ?, 1, NOW(), NOW())`,
			[productId],
		);
		const productVariationId = pvRes.insertId;

		const purchase = +(p.price * 0.7).toFixed(2);
		const [vRes] = await pool.query<mysql.ResultSetHeader>(
			`INSERT INTO variations
			 (name, product_id, sub_sku, product_variation_id, default_purchase_price, dpp_inc_tax,
			  profit_percent, default_sell_price, sell_price_inc_tax, created_at, updated_at)
			 VALUES ('DUMMY', ?, ?, ?, ?, ?, 30, ?, ?, NOW(), NOW())`,
			[
				productId,
				sku,
				productVariationId,
				purchase,
				p.compare ?? purchase,
				p.price,
				p.price,
			],
		);
		const variationId = vRes.insertId;

		await pool.execute(
			`INSERT INTO variation_location_details
			 (product_id, product_variation_id, variation_id, location_id, qty_available, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
			[productId, productVariationId, variationId, LOCATION_ID, p.stock],
		);
	}
}

async function seedLocations(pool: Pool): Promise<void> {
	for (const g of GOVERNORATES) {
		await pool.execute(
			`INSERT INTO cities (id, city_id, name, nameAr, code, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
			[g.id, String(g.id), g.name, g.nameAr, g.code],
		);
		for (const [name, nameAr] of DISTRICTS[g.id] ?? []) {
			await pool.execute(
				`INSERT INTO districts (district_id, district_name, district_name_ar, city_id, created_at, updated_at)
				 VALUES (?, ?, ?, ?, NOW(), NOW())`,
				[
					`${g.code}-${name.toLowerCase().replace(/\s+/g, "-")}`,
					name,
					nameAr,
					g.id,
				],
			);
		}
	}
}

main().catch((err: unknown) => {
	console.error("✗ Seed failed:", err);
	process.exit(1);
});
