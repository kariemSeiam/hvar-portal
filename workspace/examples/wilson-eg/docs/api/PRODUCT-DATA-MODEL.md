# Product data model — JSON, DB, and admin

## 1. Scraped JSON (wilson-complete-data.json)

**Structure: flat, one row per product.**

- `id`, `name_ar`, `name_en`, `price`, `status`, `category`
- Optional: `sale_price`, `regular_price`
- `specs`: `model`, `capacity`, `dimensions`, `features[]`, `warranty`, etc.

**No variants, no colors, no sizes in the scrape.** Each item is one product, one price. Typical for appliances (one model = one SKU).

---

## 2. DB model (app.py)

**Product** → many **ProductVariant** → each variant has many **VariantSize**.

| Layer      | Meaning in DB | Example (appliances)     | Example (fashion)   |
|-----------|----------------|---------------------------|---------------------|
| **Variant** | Color / option | One variant "افتراضي"    | Red, Blue, White    |
| **Size**    | Size label + stock | "واحد", "240L", "60x90" | S, M, L             |
| **Quantity**| Stock for that size | 10                      | 5, 3, 0             |

- **ProductVariant**: `color_name`, `color_code`, `images[]`
- **VariantSize**: `size` (string), `quantity` (int), `in_stock` (bool)

Cart/orders reference **variant_id + size** to know which line to fulfill.

---

## 3. How the seed maps scrape → DB

From `scripts/seed_wilson_products.py`:

- **One scraped product** → one **Product**
- **One variant per product**: `color_name="افتراضي"`, `color_code="#6B7280"`
- **One size per variant**: `size="واحد"`, `quantity=10` (or 0 if out_of_stock)

So the scrape has no real “color” or “size”; the seed invents a single variant and a single size to fit the DB.

---

## 4. What to showcase in admin

- **Variant** = “option” (color, finish, or “Default” for single-option products).
- **Size** = any label that has its own stock: `"واحد"`, `"240L"`, `"340L"`, `"60x90"`, `"S"`/`"M"`/`"L"`, etc.
- **Quantity** = stock count for that variant + size.

For Wilson appliances today:

- Most products: **1 variant** (e.g. “افتراضي”) and **1 size** (e.g. “واحد” or capacity like “240L”).
- Products with real options (e.g. same model in two colors): **2+ variants**, each with its own sizes and quantities.

---

## 5. Wilson one-size behavior

Wilson products use **one variant and one size** per product in practice. The frontend and API reflect this:

- **Frontend:** The product adapter sets a **default variant and size** on each product (`variantId`, `size`) from the first variant and first (or first in-stock) size. These are used for add-to-cart and checkout; an item must have both set to be orderable.
- **Order API:** `POST /api/orders` accepts `items[].size` as **optional**. When omitted, the backend infers the size when the variant has exactly one size. When the variant has 0 or more than one size, `size` is required and missing it returns 400.

---

## 6. Admin UI alignment

- Add/Edit product: “Variants & sizes” = **variant (color/option) + per-size quantity**.
- Validation: at least one variant, each variant at least one size with a non-empty `size` string.
- Inventory modal: edit quantity per variant per size; matches DB.

No change to API or DB required; the model already supports both “one size” appliances and multi-variant/multi-size products.
