# Product Catalog — Hvar

> Reference compass for anyone building product-related UI, content, or API contracts.
> Pricing and stock levels are ERP territory — this file covers structure, naming, specs, and taxonomy only.
> **Last synced from MCRM API:** 2026-06-07 (49 products, 344 spare parts)

---

## Item Type Taxonomy

The MCRM `/api/stock/items` endpoint returns two types:

| `type` | Count | Purpose |
|--------|-------|---------|
| `product` | 49 | Sellable to customers — shown on the store |
| `part` | 344 | Spare parts for repairs — NOT sold separately, internal use only |

**Never surface `type=part` items in the customer-facing store.** They are repair inventory. When a customer references a part (e.g., "I need a new سلاح for my 5070"), match it to the parent product and route through the service/support flow.

---

## Official Category Taxonomy

These are the slugs used in the DB (`categories` table) and in URLs (`/products?category=:slug`). The Arabic names are canonical — use exactly these in UI.

| Slug | Arabic Name | English Label |
|------|-------------|---------------|
| `chopper` | كبة | Chopper / Kibbeh Maker |
| `blender` | خلاط | Blender |
| `hand_blender` | هاند بلندر | Hand Blender |
| `stand_mixer` | عجان | Stand Mixer |
| `hand_beater` | مضرب | Hand Beater |
| `air_fryer` | قلاية هوائية | Air Fryer |
| `iron` | مكواه | Iron |
| `vacuum` | مكنسة | Vacuum Cleaner |
| `oven` | فرن | Oven |
| `spice_grinder` | مطحنة | Spice Grinder |
| `kettle` | كاتيل | Kettle |

The home page categories grid uses these Arabic names. Do not invent alternative translations.

---

## Complete Product Catalog

### Chopper / Kibbeh Maker (chopper)

The brand's hero category. كبة البلدوزر is the flagship. This line has more variants, higher margins, and more marketing investment than any other category.

#### كبة هفار البلدوزر — 6.5 لتر / 2000 وات — SKU family: 5070

The brand's most referenced product. Multiple color and feature variants share the same base motor and bowl. All are sold under the "البلدوزر" identity.

| SKU | Name | Price (EGP) | Notes |
|-----|------|-------------|-------|
| `5070` | كبه هفار 6.5 لتر 2000 وات اسود نيو | — | Original black new variant |
| `5070+1` | كبه هفار 6.5 لتر 2000 وات بينك / روز | — | Pink/rose color |
| `5070+3` | كبه هفار 6.5 لتر 2000 وات ليموني | — | Lemon yellow |
| `5070+4` | كبه هفار 6.5 لتر 2000 وات موف | — | Mauve/purple |
| `5070+5` | كبه هفار 6.5 لتر 2000 وات أحمر | — | Red |
| `5070+b` | كبه هفار 2000 وات اسود b | — | Black B variant |
| `5070+C` | كبه هفار 6.5 لتر 2000 وات c | — | C variant |
| `5070+04` | كبه هفار 6.5 لتر 2000 وات 4 سرعات | — | 4-speed model (1005 in stock) |
| `5073` | كبه هفار 6.5 لتر 2000 وات 3 سرعات | — | 3-speed model |
| `5073+1` | كبه 5073 روز | — | 3-speed rose |
| `5077` | كبه هفار 2000 وات 5077 بلاك | — | 5077 black line |
| `5070 PREMIUM` | كبه هفار 6.5 لتر 2000 وات 6 سلاح | **2000** | Premium 6-blade — **739 reserved**, heavy backorder |

**Core specs for all 5070-family variants:**
- **Wattage:** 2000W copper motor (ماتور نحاس)
- **Capacity:** 6.5L shatter-proof jug (ضد الكسر)
- **Jug warranty:** 20 years (stated explicitly in brand posts)
- **Product warranty:** 24 months
- **Standard accessories:** سلاح 4 شفرات استانلس, جوان تثبيت داخل الحلة, سباتولا بلاستيك (هدية), مريلة مطبخ (هدية)
- **Premium 6-blade extras:** 6 blades, upgraded attachment set
- **Brand promise:** "اقوى كبة في مصر بشهادة كل شيفات مصر"
- **One line:** كبة البلدوزر — أقوى كبة هفار بـ2000 وات ووعاء 6.5 لتر بضمان 20 سنة.

#### كبة هفار النينجا — 3 لتر / 800 وات — SKU: 5029

- **SKU:** `5029` (confirmed from TikTok caption "كود: 5029")
- **Nickname:** "الكبة النينجا" — coined by شيف نهى الفيشاوي, adopted by brand
- **Wattage:** 800W turbo, 2 speeds, metal gears
- **Capacity:** 3L stainless steel bowl
- **Functions (5x1):** سلاح فرم 4 شفرات, خافق بيض, قشارة ثوم, سلاح لخفق العجين الخفيف, سلاح لفصل صفار البيض
- **Warranty:** 24 months
- **TikTok views:** 26.5K — highest-performing video on the account
- **Price:** — (not set in API yet)
- **Stock:** 5 on hand, 27 reserved → needs restock
- **One line:** كبة النينجا 5x1 — 800 وات تربو، 3 لتر استيل، 5 وظائف وضمان سنتين.

#### كبة هفار الكبيرة تربو — 1000 وات — SKU: 5027

- **SKU:** `5027`
- **Price:** **1,850 EGP** (confirmed from API `price_customer`)
- **Wattage:** 1000W copper motor turbo (يعادل 1500 وات)
- **Capacity:** 2.5L shatter-proof jug
- **Features:** ماتور نحاس 1000 وات تربو, تروس معدن, سلاح فرم 6 شفرات, قشارة ثوم من السليكون الطبي, خافق بيض
- **Warranty:** 24 months
- **Stock:** 48 on hand, 0 reserved
- **One line:** كبة 1000 وات تربو بسعة 2.5 لتر وسلاح 6 شفرات وضمان عامين.

#### كبة هفار — 1200 وات — SKU: 5025

- **SKU:** `5025`
- **Wattage:** 1200W
- **Capacity:** 2L
- **Warranty:** 24 months
- **Stock:** 1 on hand, 0 reserved — low
- **One line:** كبة 1200 وات بوعاء 2 لتر.

#### كبة هفار — 1500 وات — SKU: 5022

- **SKU:** `5022`
- **Wattage:** 1500W copper motor, 2 speeds, metal gears
- **Capacity:** 2L shatter-proof jug
- **Features confirmed from TikTok:** سلاح 6 شفرات استانلس, سلاح سيليكون لتقشير الثوم, خافق بيض, جوانات في الغطاء لمنع التسرب, جوان أسفل الدورق للتثبيت
- **Use cases:** فرم اللحمة، عصائر، تقطيع خضار، قشر ثوم، فرم بصل، تقطيع ملوخية، تنظيف ممبار، كريمة لبان
- **Warranty:** 24 months
- **Stock:** 0 on hand
- **One line:** كبة 1500 وات بوعاء 2 لتر ضد الكسر وسلاح 6 شفرات وضمان عامين.

#### Variant lines: كبة بيت العز / كبه حور / كبه بيور / كبه اندلسيه

Third-party co-brand or white-label variants stocked by Hvar. Not Hvar's own design. All have zero stock in API.

| SKU | Name |
|-----|------|
| `hvar0226` | كبة بيت العز |
| `hvar0224` | كبه اندلسيه (أسود) |
| `hvar0222` | كبه اندلسيه (أحمر) |
| `hvar0221` | كبه اندلسيه (روز) |
| `hvar0223` | كبه اندلسيه (لبني) |
| `hvar0225` | كبه حور |
| `بيور` | كبه بيور |

All currently out of stock. Do not display if stock = 0 unless explicitly in a "coming soon" state.

---

### Blender (blender)

All Hvar blenders are **8000 وات**. This is the key differentiator the brand emphasizes. Three capacity families exist:

| SKU | Name | Price (EGP) | On Hand | Reserved |
|-----|------|-------------|---------|----------|
| `5069` | خلاط هفار 8000 وات 7*1 | — | 152 | **178 — deficit** |
| `5062` | خلاط هفار 8000 وات 2*1 | **2,000** | 1000 | 2 |
| `5060` | خلاط هفار 8000 وات 2*1 | — | 0 | 0 |
| `5066` | خلاط هفار 8000 وات 3*1 | — | 0 | 0 |

**7*1 means 7 accessories in one** — blender + food grinder + citrus juicer + grater + vegetable slicer + whisk + ice crusher. The "كبة" attachment is included.

**⚠️ خلاط 7*1 (5069) has 152 on hand but 178 reserved — it's in deficit.** Do not show "in stock" without live check.

The `1000 وات — 6001` product referenced in older compass files does not exist in the MCRM API. It was placeholder data. Delete any references.

---

### Hand Blender (hand_blender)

| SKU | Name | Price (EGP) | On Hand | Reserved |
|-----|------|-------------|---------|----------|
| `5057` | هاند بلندر هفار 1500 وات 4*1 | **2,250** | 2 | **125 — severe deficit** |
| `5053` | هاند بلندر هفار 3*1 | — | 21 | 0 |
| `5052` | هاند بلندر هفار 2*1 | — | 0 | 0 |
| `hvar0010` → `55` | هاند بلندر هفار 5055 | — | 0 | 0 |

#### هاند بلندر هفار 4x1 — 1500 وات — 5057

- **Price:** **2,250 EGP** customer / 1,800 EGP merchant (both confirmed from API)
- **Wattage:** 1500W copper motor (ماتور نحاس)
- **Speeds:** 15 speeds + turbo
- **Motor body:** Full metal
- **Gears:** Metal gears
- **Accessories confirmed from Instagram:** كبة 600 مللي سكينة 4 شفرات, سكينة الهراسة 4 شفرات, وعاء مدرج 800 مللي
- **Safety:** لووك أمان + سوتش حماية الماتور + إضاءة LED
- **Warranty:** 24 months (Instagram says "ضمان سنتين" — overrides any 12-month ERP record)
- **Badges:** شحن مجاني، جديد
- **Chef endorsements:** ساره صقر
- **Stock:** 2 on hand, 125 reserved — CRITICAL. Do not show as "available" without live API check.
- **One line:** هاند بلندر 4x1 بنحاس 1500 وات، 15 سرعة، وضمان سنتين.

---

### Stand Mixer (stand_mixer)

| SKU | Name | On Hand |
|-----|------|---------|
| `10011` | عجان هفار 11 لتر | 1000 (likely placeholder) |
| `10007` | عجان هفار 7 لتر | 1000 (likely placeholder) |

**The 1000 on_hand figures are almost certainly ERP placeholders.** Treat as unknown stock until a real inventory count is confirmed.

#### عجان هفار "المدفع / الإعصار" — 11 لتر — SKU: 10011

- **SKU:** `10011`
- **Nickname:** "المدفع" (Instagram) / "الإعصار" (TikTok) — same product, two nicknames across platforms
- **Wattage:** 2200W copper motor
- **Capacity:** 11L
- **Features:** ماتور نحاس 2200 وات, تروس معدن, 6 سرعات + زرار تربو, ذراع عجن + ذراع خفق + ذراع شبك, قواعد تثبيت لمنع الاهتزاز, قطع غيار متاحة
- **Warranty:** 12 months
- **Instagram hook:** "أقوى عجان في مصر بأفضل مواصفات وأعلى خامات في السوق"
- **One line:** عجان "المدفع" 11 لتر بـ2200 وات ونحاس وتروس معدن — الأقوى في الفئة.

#### عجان هفار 7 لتر — SKU: 10007

- **SKU:** `10007`
- **Capacity:** 7L
- **Chef:** شيف ميادة محمد (فانيلا ومستكة)
- **One line:** عجان هفار 7 لتر — المرحلة بين المنزلي والاحترافي.

---

### Hand Beater (hand_beater)

| SKU | Name | Price (EGP) | On Hand | Reserved |
|-----|------|-------------|---------|----------|
| `1101` | مضرب بيض 500 وات | **1,000** | 19 | 8 |
| `1104` | مضرب بيض 500 وات بالحلة | **1,850** | 998 | 7 |

#### مضرب هفار 500 وات — SKU: 1101 / 1104

- **SKU:** `1101` (standalone) / `1104` (with bowl)
- **Price:** 1,000 EGP standalone / 1,850 EGP with bowl
- **Wattage:** 500W copper motor
- **Speeds:** 5 + turbo
- **Bowl (1104):** 4L stainless steel
- **Attachments:** 2× for egg beating, 2× for cake/desserts
- **Warranty:** 12 months
- **Chef:** شيف ميادة محمد (فانيلا ومستكة)
- **One line:** مضرب هفار 500 وات بنحاس و5 سرعات — متاح مع الحلة (1850) أو بدونها (1000).

---

### Air Fryer (air_fryer)

| SKU | Name | Price (EGP) | On Hand | Reserved |
|-----|------|-------------|---------|----------|
| `5016` | قلاية هوائية 6.5 لتر ديجيتال | **4,250** | 51 | 7 |
| `5019` | قلاية هوائية 9 لتر ديجيتال 2 هيتر | — | 50 | 32 |
| `5011` | قلاية 2500 وات 8.5 لتر | 1 (placeholder) | 50 | 0 |

#### قلاية هوائية هفار الجامبو 9 لتر — SKU: 5019

- **SKU:** `5019` (confirmed from TikTok)
- **Capacity:** 9L
- **Wattage:** 2400W dual heater (دبل هيتر سخان علوي وسفلي)
- **Controls:** LED touch screen, 12 programs
- **Temp:** 80–200°C | Timer: up to 60 min
- **Features:** زيت أقل 90%, خاصية فك التجميد, إيقاف مؤقت, تدفق هواء دائري, وعاء ورف مطلي غير قابل للالتصاق
- **Warranty:** 12 months
- **Chef endorsements:** ياسمين صالح، نهلة، عزة (عزة في المطبخ)
- **Stock:** 50 on hand, 32 reserved — healthy
- **One line:** قلاية هوائية جامبو 9 لتر بـ2400 وات ودبل هيتر وشاشة لمس.

#### قلاية هوائية هفار 6.5 لتر ديجيتال — SKU: 5016

- **SKU:** `5016`
- **Price:** **4,250 EGP**
- **Capacity:** 6.5L
- **Controls:** Digital
- **Warranty:** TBD
- **Stock:** 51 on hand, 7 reserved — healthy
- **One line:** قلاية هوائية ديجيتال 6.5 لتر — الحجم المتوسط.

---

### Iron (iron)

| SKU | Name | Price (EGP) | On Hand |
|-----|------|-------------|---------|
| `1115` | مكواه 2800 هفار New | **1,350** | 1001 |
| `1117` | مكواه بخار 3200 وات هفار | — | 2 |

#### مكواه هفار 2800 وات New — SKU: 1115

- **SKU:** `1115`
- **Price:** **1,350 EGP**
- **Wattage:** 2800W
- **Water tank:** 450ml
- **Soleplate:** Ceramic, non-stick
- **Features:** حماية من الحرارة الزائدة، مضاد للتكلس، مانع تنقيط البخار، سلك 360°، طول السلك 1.8م
- **Voltage:** 220-240V / 50-60Hz
- **Warranty:** 12 months
- **Stock:** 1001 on hand — well stocked (the 1000+ figure may be a placeholder; verify before display)
- **Reviews on site:** 710 reviews — highest on entire site. Rating displays ~2/5 but text is positive ("ممتازة", "تحفة") — broken star-rating UX (customers submit without selecting stars, defaults to low)
- **One line:** مكواة بخار 2800 وات بخزان 450مل وقاعدة سيراميك وضمان سنة.

#### مكواه بخار 3200 وات — SKU: 1117

- **SKU:** `1117`
- **Wattage:** 3200W
- **Stock:** 2 on hand — very low
- **One line:** مكواة بخار 3200 وات — المستوى المتقدم.

---

### Vacuum (vacuum)

| SKU | Name | Price (EGP) | On Hand |
|-----|------|-------------|---------|
| `7720` | مكنسة هفار 2000 وات تربو | **3,250** | 1003 |
| `hvar0010` | مكنسة هفار برميل 30 لتر | — | 1 |
| `228` | مكنسة هفار بطه 2800 وات | — | 2 |

#### مكنسة هفار 2000 وات تربو — SKU: 7720

- **SKU:** `7720`
- **Price:** **3,250 EGP**
- **Wattage:** 2000W
- **Accessories confirmed from API parts:** خرطوم, ماسورة معدنية, فرشة أرضية, فرشة ستاير, فرشة تنظيف زوايا, فرشة تنظيف أثاث, موصل خرطوم
- **Warranty:** 24 months
- **Stock:** 1003 on hand — likely placeholder; confirm before display
- **One line:** مكنسة هفار 2000 وات تربو بكامل الملحقات وضمان سنتين.

---

### Oven (oven)

| SKU | Name | Price (EGP) | On Hand |
|-----|------|-------------|---------|
| `10046` | فرن هفار 46 لتر 2200 وات | **2,450** | 0 |

- **SKU:** `10046`
- **Price:** **2,450 EGP**
- **Capacity:** 46L
- **Wattage:** 2200W
- **Stock:** 0 on hand — out of stock
- **One line:** فرن هفار 46 لتر 2200 وات.

---

### Spice Grinder (spice_grinder)

| SKU | Name | On Hand |
|-----|------|---------|
| `5030` | مطحنة توابل هفار | 13 |

- **SKU:** `5030`
- **Stock:** 13 on hand
- **One line:** مطحنة توابل هفار.

---

### Kettle (kettle)

| SKU | Name | On Hand |
|-----|------|---------|
| `10002` | كاتيل بيركس هفار 2 لتر | 4 |

- **SKU:** `10002`
- **Capacity:** 2L Pyrex
- **Stock:** 4 on hand
- **One line:** كاتيل بيركس هفار 2 لتر.

---

## Confirmed Prices (from MCRM API)

Prices that come from `price_customer` in the API. These are real. Treat all others as unknown until filled.

| SKU | Product | Price (EGP) |
|-----|---------|-------------|
| `5057` | هاند بلندر 1500 وات 4*1 | 2,250 |
| `5062` | خلاط 8000 وات 2*1 | 2,000 |
| `5070 PREMIUM` | كبة 2000 وات 6 سلاح PREMIUM | 2,000 |
| `5027` | كبة 1000 وات تربو | 1,850 |
| `1104` | مضرب 500 وات بالحلة | 1,850 |
| `1101` | مضرب 500 وات | 1,000 |
| `1115` | مكواه 2800 وات | 1,350 |
| `7720` | مكنسة 2000 وات تربو | 3,250 |
| `5016` | قلاية 6.5 لتر ديجيتال | 4,250 |
| `10046` | فرن 46 لتر | 2,450 |

The `price_merchant` field is set only for `5057` (1,800 EGP) and `5070 PREMIUM` (1,600 EGP) — these are the wholesale/reseller prices for these two SKUs.

---

## Stock Health — Live Signals (2026-06-07 snapshot)

These are observed from the API. Stock changes daily — this is directional, not operational.

| Status | Products |
|--------|---------|
| **Severe deficit** (reserved > on_hand) | خلاط 7*1 5069 (152 vs 178), هاند بلندر 5057 (2 vs 125), كبة PREMIUM (33 vs 739), كبة النينجا 5029 (5 vs 27) |
| **Well stocked** | مكواه 1115 (~1001), مكنسة 7720 (~1003), عجان 11L (~1000), عجان 7L (~1000), مضرب بالحلة 1104 (~998) — **note: 1000-range figures are likely ERP placeholders, not real counts** |
| **Healthy** | قلاية 9L 5019 (50/32), قلاية 6.5L 5016 (51/7), خلاط 2*1 5062 (1000/2) |
| **Out of stock** | فرن 10046 (0/0), كبة 1500W 5022 (0/0), خلاط 3*1 5066 (0/0) |

Never hardcode stock. Always read from API. The `quantity_on_hand - quantity_reserved` is the available quantity.

---

## Spare Parts Taxonomy

Parts are organized by SKU prefix, mapping to their parent product family:

| Prefix pattern | Parent product family |
|----------------|----------------------|
| `70xx`, `70A`, `70B`, `70C`, `70PR` | كبة 2000 وات 5070 family |
| `73xx` | كبة 2000 وات 3-speed 5073 family |
| `74xx` | كبة 2000 وات 4-speed family |
| `25xx` | كبة 1200 وات 5025 family |
| `27xx` | كبة 1000 وات 5027 family |
| `29xx` | كبة 800 وات 5029 family |
| `22xx` | كبة 1500 وات 5022 family |
| `55xx`, `5055` | هاند بلندر 5055 family |
| `57xx`, `5057` | هاند بلندر 5057 family |
| `53xx` | هاند بلندر 5053 family |
| `52xx` | هاند بلندر 5052 family |
| `69xx`, `69_` | خلاط 7*1 5069 family |
| `62xx` | خلاط 8000 وات 2*1 62 family |
| `60xx` | خلاط 8000 وات 2*1 60 family |
| `66xx` | خلاط 8000 وات 3*1 66 family |
| `11xx`, `04xx`, `0112`, `0115` | عجان family (7L and 11L) |
| `77xx`, `7720` | مكنسة 7720 family |
| `28xx` | مكنسة بطة 2800W family |
| `30xx`, `32xx` | مكنسة برميل 30L family |
| `46xx` | فرن 46L family |
| `11_PREMIUM` → `70PR` | كبة PREMIUM parts |

When a service ticket references a broken part, use this map to identify the parent product SKU.

---

## Spec Display Rules

### Prominent specs (shown on product card and above-the-fold on PDP)
1. **Wattage** — always first if the product has a motor. Format: `1500 وات` (no "W", no hyphen, Arabic numerals in RTL context, Western numerals in data attributes).
2. **Capacity / volume** — second if applicable. Format: `5 لتر` or `300 مل`.
3. **Key differentiating feature** — one line. For blenders: bowl count (7*1, 3*1, 2*1). For iron: steam/self-clean. For air fryer: digital display. For vacuum: filter type.

### Secondary specs (collapsible or below-the-fold on PDP)
- Full accessories list
- Number of speeds
- Material details
- Safety features

### Warranty display
Format: `ضمان {N} شهر` for 12/18, `ضمان {N} سنة` for 24. Always shown — never hidden. Position: below price, above add-to-cart.

### Spec table on PDP
Arabic key → Arabic value. Two-column table. Key column right-aligned, value column right-aligned. No English labels unless value is a proper noun (e.g., `HEPA`, `LED`).

### Badges
Rendered as pills above or overlaid on the product image.
- `شحن مجاني` — green pill
- `جديد` — blue pill
- `حار` — orange/red pill

Badge text is exactly as stored. Never translate or reword.

---

## Product Naming Conventions

The pattern is: **`[Product type in Arabic] هفار [Wattage OR Capacity] [Model number]`**

Examples:
- هاند بلندر هفار 1500 وات 5057
- خلاط هفار 8000 وات 7*1
- قلاية هوائية هفار 9 لتر 5019
- مكنسة هفار 2000 وات 7720

Rules:
- Brand name `هفار` always comes second, after the product type.
- Wattage products: `[X] وات` after brand.
- Capacity-primary products (air fryer): `[X] لتر` after brand.
- Blenders: capacity is `[N]*1` (number of accessories × 1), e.g., `7*1`, `3*1`, `2*1`.
- Model number suffix at the end, no dash.
- No English in the `name_ar` field. Model number is numeric.
- SKU format: raw ERP SKU as-is. Some have `hvar` prefix, most do not. Use ERP as source of truth.

---

## Featured Products

Products with `featured: true` appear on the home page featured grid (max 8):

1. كبة هفار البلدوزر 2000 وات 6 سلاح PREMIUM (`5070 PREMIUM`) — 2,000 EGP
2. هاند بلندر هفار 4x1 1500 وات (`5057`) — 2,250 EGP
3. قلاية هوائية هفار 6.5 لتر ديجيتال (`5016`) — 4,250 EGP
4. مكنسة هفار 2000 وات تربو (`7720`) — 3,250 EGP
5. مكواه هفار 2800 وات (`1115`) — 1,350 EGP

API: `GET /api/products?featured=true&limit=8`

---

## What This Catalog Does NOT Cover

| Topic | Owner | Where to look |
|-------|-------|--------------|
| Current prices | MCRM API `price_customer` | `/api/stock/items?type=product` |
| Stock levels | MCRM API `quantity_on_hand` / `quantity_reserved` | Never hardcode stock in UI |
| Adding / editing products | MCRM admin | Products are read-only from this site |
| Product images hosting | ERP / hvarstore.com/public/uploads | URLs come from ERP `products.image` |
| Spare parts ordering | Service flow | Match part → parent product → open service ticket |
| Promotions / campaigns | ERP | Badges array comes from ERP response |
