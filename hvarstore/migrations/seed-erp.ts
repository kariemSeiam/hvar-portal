/**
 * seed-erp.ts — the REAL Hvar catalog as local hvar_erp dev fixtures.
 *
 * Products, SKUs, names, categories, confirmed prices, and stock states mirror
 * compass/products/catalog.md (synced from MCRM API). SKUs are the real ones
 * (5070, 5029, 5019…) so the storefront enrichment layer (chefs,
 * FAQs, accessories, comparisons) keyed by SKU lights up in dev.
 *
 * Prices marked `dev` are placeholders — compass has no confirmed price yet.
 * Stock follows compass merchandising reality: deficits seeded as 0,
 * low-stock items kept low so the كمية محدودة / غير متاح states render.
 *
 * Idempotent: re-runs are safe. Wipes only the SKUs it owns (see DEMO_SKUS).
 * Targets `business_id = 1`, `location_id = 1`.
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
const SKU_PREFIX = ""; // real SKUs — no prefix; ownership tracked via DEMO_SKUS

// Canonical category taxonomy — compass/products/catalog.md. Arabic names are canonical.
const CATEGORIES = [
	{ name: "كبة", slug: "chopper" },
	{ name: "خلاط", slug: "blender" },
	{ name: "هاند بلندر", slug: "hand_blender" },
	{ name: "عجان", slug: "stand_mixer" },
	{ name: "مضرب", slug: "hand_beater" },
	{ name: "قلاية هوائية", slug: "air_fryer" },
	{ name: "مكواه", slug: "iron" },
	{ name: "مكنسة", slug: "vacuum" },
	{ name: "فرن", slug: "oven" },
	{ name: "مطحنة", slug: "spice_grinder" },
	{ name: "كاتيل", slug: "kettle" },
];

// Real Hvar catalog. price: compass-confirmed unless marked dev.
// stock: compass on-hand reality (deficit → 0, low kept low).
const PRODUCTS = [
	// ── كبة — the hero category ──────────────────────────────────────────────────
	// Stock = ERP في المخزن (physical on-hand). 5070 merged from its black dup SKU 5070+b.
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات اسود نيو", sku: "5070", price: 1750 /* dev */, compare: null, stock: 1043 /* physical — merged from black dup SKU 5070+b */, weight: "4.2",
		desc: "كبة هفار 2000 وات — ماتور نحاس، وعاء 6.5 لتر ضد الكسر بضمان 20 سنة." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات بينك / روز", sku: "5070+1", price: 1450 /* live */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار 2000 وات باللون الروز — ماتور نحاس ووعاء 6.5 لتر بضمان 20 سنة." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات موف", sku: "5070+4", price: 1850 /* live */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار 2000 وات باللون الموف — ماتور نحاس ووعاء 6.5 لتر ضد الكسر." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات أحمر", sku: "5070+5", price: 1850 /* live */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار 2000 وات باللون الأحمر — ماتور نحاس ووعاء 6.5 لتر ضد الكسر." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات ليموني", sku: "5070+3", price: 1850 /* live */, compare: null, stock: 5, weight: "4.2",
		desc: "كبة هفار 2000 وات باللون الليموني — ماتور نحاس ووعاء 6.5 لتر ضد الكسر." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات 4 سرعات", sku: "5070+04", price: 1850 /* dev */, compare: null, stock: 1005, weight: "4.3",
		desc: "كبة هفار 2000 وات بـ4 سرعات — تحكم أدق ووعاء 6.5 لتر." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات 6 سلاح", sku: "5070 PREMIUM", price: 2000, compare: null, stock: 32, weight: "4.4",
		desc: "كبة هفار PREMIUM بسلاح 6 شفرات استانلس — أقوى كبة في مصر بشهادة كل شيفات مصر." },
	{ cat: 0, name: "كبه هفار 2000 وات بلاك", sku: "5077", price: 1750 /* dev */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار 2000 وات باللون الأسود — ماتور نحاس ووعاء 6.5 لتر ضد الكسر." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات 3 سرعات", sku: "5073", price: 1700 /* dev */, compare: null, stock: 12, weight: "4.3",
		desc: "كبة هفار 2000 وات بـ3 سرعات ووعاء 6.5 لتر ضد الكسر." },
	{ cat: 0, name: "كبه هفار 6.5 لتر 2000 وات 3 سرعات روز", sku: "5073+1", price: 1700 /* dev */, compare: null, stock: 3, weight: "4.3",
		desc: "كبة هفار 2000 وات بـ3 سرعات ووعاء 6.5 لتر باللون الروز." },
	{ cat: 0, name: "كبه هفار النينجا 3 لتر 800 وات", sku: "5029", price: 1600 /* live */, compare: null, stock: 8, weight: "2.6",
		desc: "كبة هفار 5x1 — 800 وات تربو، 3 لتر استيل، 5 وظائف وضمان سنتين." },
	{ cat: 0, name: "كبه هفار الكبيرة تربو 1000 وات", sku: "5027", price: 1850, compare: null, stock: 48, weight: "3.1",
		desc: "كبة 1000 وات تربو بسعة 2.5 لتر وسلاح 6 شفرات وضمان عامين." },
	{ cat: 0, name: "كبه هفار 1200 وات", sku: "5025", price: 1350 /* live */, compare: null, stock: 1, weight: "2.8",
		desc: "كبة 1200 وات بوعاء 2 لتر." },
	{ cat: 0, name: "كبه هفار 1500 وات", sku: "5022", price: 1850 /* live */, compare: null, stock: 0, weight: "2.9",
		desc: "كبة 1500 وات بوعاء 2 لتر ضد الكسر وسلاح 6 شفرات وضمان عامين." },
	{ cat: 0, name: "كبه هفار الأندلسية روز", sku: "hvar0221", price: 1850 /* dev */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار الأندلسية باللون الروز — تصميم مميز بنفس قوة هفار ووعاء ضد الكسر." },
	{ cat: 0, name: "كبه هفار الأندلسية أحمر", sku: "hvar0222", price: 1850 /* dev */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار الأندلسية باللون الأحمر — تصميم مميز بنفس قوة هفار ووعاء ضد الكسر." },
	{ cat: 0, name: "كبه هفار الأندلسية لبني", sku: "hvar0223", price: 1850 /* dev */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار الأندلسية باللون اللبني — تصميم مميز بنفس قوة هفار ووعاء ضد الكسر." },
	{ cat: 0, name: "كبه هفار الأندلسية أسود", sku: "hvar0224", price: 1850 /* dev */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار الأندلسية باللون الأسود — تصميم مميز بنفس قوة هفار ووعاء ضد الكسر." },
	{ cat: 0, name: "كبه هفار حور", sku: "hvar0225", price: 1850 /* dev */, compare: null, stock: 0, weight: "4.2",
		desc: "كبة هفار حور — موديل مميز بوعاء ضد الكسر وماتور نحاس قوي." },
	{ cat: 0, name: "كبة هفار بيت العز", sku: "hvar0226", price: 1950 /* dev */, compare: null, stock: 0, weight: "4.3",
		desc: "كبة هفار بيت العز — الموديل الفاخر بتشطيب مميز وأداء قوي." },

	// ── خلاط — all Hvar blenders are 8000 وات ─────────────────────────────────
	{ cat: 1, name: "خلاط هفار 8000 وات 7*1", sku: "5069", price: 3250 /* live */, compare: null, stock: 225, weight: "5.0",
		desc: "خلاط 7×1 — المجموعة الكاملة: خلاط، كبة، عصارة، مبشرة، قطاعة، مضرب، مطحنة. 8000 وات." },
	{ cat: 1, name: "خلاط هفار 8000 وات 2*1", sku: "5062", price: 2000, compare: null, stock: 1000, weight: "3.8",
		desc: "خلاط هفار 8000 وات 2×1 للخلط الأساسي — قوة لا تتوقف." },
	{ cat: 1, name: "خلاط هفار 8000 وات 3*1", sku: "5066", price: 2250 /* live */, compare: null, stock: 0, weight: "4.1",
		desc: "خلاط هفار 8000 وات 3×1 مع ملحقات إضافية." },
	// live-store only — published on hvarstore.com, absent from ERP export (placeholder SKU)
	{ cat: 1, name: "خلاط هفار 2.5 لتر", sku: "5040", price: 2250 /* live */, compare: null, stock: 0, weight: "2.5",
		desc: "خلاط هفار 2.5 لتر — للاستخدام اليومي بقوة وكفاءة." },

	// ── هاند بلندر ─────────────────────────────────────────────────────────────
	{ cat: 2, name: "هاند بلندر هفار 1500 وات 4*1", sku: "5057", price: 2250, compare: null, stock: 172, weight: "1.8",
		desc: "هاند بلندر 4x1 بنحاس 1500 وات، 15 سرعة + تربو، تروس معدن وضمان سنتين." },
	{ cat: 2, name: "هاند بلندر هفار 3*1", sku: "5053", price: 1750 /* live */, compare: null, stock: 21, weight: "1.6",
		desc: "هاند بلندر هفار 3×1 — ملحقات إضافية بنفس قوة الـ1500 وات." },
	{ cat: 2, name: "هاند بلندر هفار 2*1", sku: "5052", price: 1400 /* live */, compare: null, stock: 0, weight: "1.5",
		desc: "هاند بلندر هفار 2×1 — خلط وفرم بماتور قوي وتصميم خفيف." },
	// live-store only — published on hvarstore.com, absent from ERP export (placeholder SKUs)
	{ cat: 2, name: "هاند بلندر هفار 1500 وات", sku: "5050", price: 1200 /* live */, compare: null, stock: 0, weight: "1.5",
		desc: "هاند بلندر هفار 1500 وات — الموديل الأساسي بماتور قوي." },
	{ cat: 2, name: "هاند بلندر هفار التركي 1500 وات نبيتي", sku: "5058+N", price: 1950 /* live */, compare: null, stock: 0, weight: "1.6",
		desc: "هاند بلندر هفار التركي 1500 وات باللون النبيتي — تصميم تركي أنيق." },
	{ cat: 2, name: "هاند بلندر هفار التركي 1500 وات تركواز", sku: "5058+T", price: 1950 /* live */, compare: null, stock: 0, weight: "1.6",
		desc: "هاند بلندر هفار التركي 1500 وات باللون التركواز — تصميم تركي أنيق." },
	{ cat: 2, name: "هاند بلندر هفار التركي 1500 وات بينك", sku: "5058+P", price: 1950 /* live */, compare: null, stock: 0, weight: "1.6",
		desc: "هاند بلندر هفار التركي 1500 وات باللون الوردي — تصميم تركي أنيق." },

	// ── عجان ───────────────────────────────────────────────────────────────────
	{ cat: 3, name: "عجان هفار 11 لتر", sku: "10011", price: 7500 /* live */, compare: null, stock: 1000, weight: "9.5",
		desc: "عجان هفار 11 لتر بـ2200 وات نحاس وتروس معدن — الأقوى في الفئة." },
	{ cat: 3, name: "عجان هفار 7 لتر", sku: "10007", price: 5750 /* live */, compare: null, stock: 1000, weight: "7.8",
		desc: "عجان هفار 7 لتر — المرحلة بين المنزلي والاحترافي." },

	// ── مضرب ───────────────────────────────────────────────────────────────────
	{ cat: 4, name: "مضرب بيض 500 وات", sku: "1101", price: 1000, compare: null, stock: 19, weight: "1.1",
		desc: "مضرب هفار 500 وات بماتور نحاس و5 سرعات + تربو." },
	{ cat: 4, name: "مضرب بيض 500 وات بالحلة", sku: "1104", price: 1850, compare: null, stock: 998, weight: "2.4",
		desc: "مضرب هفار 500 وات مع حلة استيل 4 لتر — 5 سرعات + تربو." },

	// ── قلاية هوائية ───────────────────────────────────────────────────────────
	{ cat: 5, name: "قلاية هوائية 6.5 لتر ديجيتال", sku: "5016", price: 4250, compare: null, stock: 51, weight: "5.2",
		desc: "قلاية هوائية ديجيتال 6.5 لتر — الحجم المتوسط للأسرة." },
	{ cat: 5, name: "قلاية هوائية 8.5 لتر 2500 وات", sku: "5011", price: 4950 /* live */, compare: null, stock: 50, weight: "5.8",
		desc: "قلاية هوائية 2500 وات بسعة 8.5 لتر — الحجم العائلي الكبير، زيت أقل 90%." },
	{ cat: 5, name: "قلاية هوائية 9 لتر ديجيتال 2 هيتر", sku: "5019", price: 5850 /* live */, compare: null, stock: 50, weight: "6.8",
		desc: "قلاية الجامبو 9 لتر بـ2400 وات ودبل هيتر وشاشة لمس و12 برنامج — زيت أقل 90%." },

	// ── مكواه ──────────────────────────────────────────────────────────────────
	{ cat: 6, name: "مكواه 2800 هفار New", sku: "1115", price: 1250 /* live */, compare: null, stock: 1001, weight: "1.4",
		desc: "مكواة بخار 2800 وات بخزان 450 مل وقاعدة سيراميك وضمان سنة." },
	{ cat: 6, name: "مكواه بخار 3200 وات هفار", sku: "1117", price: 1150 /* live */, compare: null, stock: 2, weight: "1.5",
		desc: "مكواة بخار 3200 وات — المستوى المتقدم." },

	// ── مكنسة ──────────────────────────────────────────────────────────────────
	{ cat: 7, name: "مكنسة هفار 2000 وات تربو", sku: "7720", price: 3750 /* live */, compare: null, stock: 1003, weight: "5.6",
		desc: "مكنسة هفار 2000 وات تربو بكامل الملحقات وضمان سنتين." },
	{ cat: 7, name: "مكنسة هفار بطة 2800 وات", sku: "228", price: 2850 /* live */, compare: null, stock: 2, weight: "4.8",
		desc: "مكنسة هفار بطة 2800 وات — شفط قوي بكامل الملحقات." },
	{ cat: 7, name: "مكنسة هفار برميل 30 لتر", sku: "hvar0010", price: 2950 /* live */, compare: null, stock: 1, weight: "7.5",
		desc: "مكنسة هفار برميل 30 لتر — للتنظيف الجاف والمبلل بسعة كبيرة." },

	// ── فرن ────────────────────────────────────────────────────────────────────
	{ cat: 8, name: "فرن هفار 46 لتر 2200 وات", sku: "10046", price: 2450, compare: null, stock: 0, weight: "12.5",
		desc: "فرن هفار 46 لتر 2200 وات." },

	// ── مطحنة ──────────────────────────────────────────────────────────────────
	{ cat: 9, name: "مطحنة توابل هفار", sku: "5030", price: 825 /* live */, compare: null, stock: 13, weight: "0.9",
		desc: "مطحنة توابل هفار." },

	// ── كاتيل ──────────────────────────────────────────────────────────────────
	{ cat: 10, name: "كاتيل بيركس هفار 2 لتر", sku: "10002", price: 550 /* live */, compare: null, stock: 4, weight: "1.2",
		desc: "كاتيل بيركس هفار 2 لتر." },
];

// Every SKU this seed owns — wipe() targets exactly these.
const DEMO_SKUS = PRODUCTS.map((p) => p.sku);

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

	const placeholders = DEMO_SKUS.map(() => "?").join(",");
	const [countRows] = await pool.query<mysql.RowDataPacket[]>(
		`SELECT
			(SELECT COUNT(*) FROM categories WHERE business_id = ? AND short_code LIKE 'HVR-%') AS c,
			(SELECT COUNT(*) FROM products WHERE business_id = ? AND sku IN (${placeholders})) AS p,
			(SELECT COUNT(*) FROM variation_location_details vld
				JOIN variations v ON v.id = vld.variation_id
				JOIN products pr ON pr.id = v.product_id
				WHERE pr.sku IN (${placeholders})) AS s,
			(SELECT COUNT(*) FROM cities) AS g,
			(SELECT COUNT(*) FROM districts) AS d`,
		[BUSINESS_ID, BUSINESS_ID, ...DEMO_SKUS, ...DEMO_SKUS],
	);
	const counts = countRows[0];

	console.log("✓ Seeded:", counts);
	await pool.end();
}

async function wipe(pool: Pool): Promise<void> {
	const placeholders = DEMO_SKUS.map(() => "?").join(",");
	// Also wipe rows from older seed iterations (HVR-DEMO- prefix)
	const legacyPattern = "HVR-DEMO-%";
	await pool.execute(
		`DELETE vld FROM variation_location_details vld
		 JOIN variations v ON v.id = vld.variation_id
		 JOIN products p ON p.id = v.product_id
		 WHERE p.sku IN (${placeholders}) OR p.sku LIKE ?`,
		[...DEMO_SKUS, legacyPattern],
	);
	await pool.execute(
		`DELETE v FROM variations v JOIN products p ON p.id = v.product_id
		 WHERE p.sku IN (${placeholders}) OR p.sku LIKE ?`,
		[...DEMO_SKUS, legacyPattern],
	);
	await pool.execute(
		`DELETE pv FROM product_variations pv JOIN products p ON p.id = pv.product_id
		 WHERE p.sku IN (${placeholders}) OR p.sku LIKE ?`,
		[...DEMO_SKUS, legacyPattern],
	);
	await pool.execute(
		`DELETE FROM products WHERE sku IN (${placeholders}) OR sku LIKE ?`,
		[...DEMO_SKUS, legacyPattern],
	);
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
