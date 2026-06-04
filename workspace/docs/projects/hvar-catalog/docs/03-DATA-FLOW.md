# Data Flow

> How products are loaded, normalized, and consumed.

---

## Data Source

**File:** `public/data/products.json`

Current state: **8 products** across categories (hand blenders, choppers, irons,
vacuum cleaners, fryers, mixers, ovens, grinders).

JSON structure:
```json
[
  {
    "id": 1,
    "sku": "hvar5057",
    "slug": "hand-blender-1500w-5057",
    "brand": "Hvar",
    "name_ar": "هاند بلندر هفار 1500 وات 5057",
    "category_slug": "hand_blender",
    "images": ["https://hvarstore.com/public/uploads/all/..."],
    "price_current_egp": 1991.26,
    "price_original_egp": 2250,
    "free_shipping": true,
    "featured": true,
    "badges": ["شحن مجاني", "جديد"],
    "warranty_months": 12,
    "description_ar": "...",
    "specs": {
      "الموتور": "1500 وات",
      "السعة": "1.5 لتر"
    }
  }
]
```

**Additional data files (future use):**
- `public/data/comparison.json` — product vs competitor comparisons
- `public/data/parts.json` — spare parts catalog

---

## Hook: useProducts

**File:** `src/hooks/useProducts.js`

The central data layer. One hook manages the entire product catalog.

```js
const { products, loading, error, retry, filterByCategory, searchProducts } = useProducts();
```

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `products` | Array | Normalized, deduplicated product list |
| `loading` | Boolean | True during fetch |
| `error` | String \| null | Error message or null |
| `retry` | Function | Re-fetches data |
| `filterByCategory(slug)` | Function | Returns filtered products |
| `searchProducts(query)` | Function | Arabic-aware text search |

### Pipeline

```
Mount
  │
  ▼
fetchProducts() triggered by useEffect
  │
  ▼
fetch('/data/products.json')
  │
  ├── Loading state → sets loading=true
  │
  ▼
Response received
  │
  ▼
  ├── Not OK → throw Error('فشل في تحميل البيانات')
  │
  ▼
Normalize each product:
  ├── brand defaults to 'Hvar'
  ├── free_shipping from badges if not boolean
  ├── featured coerced to Boolean
  ├── images defaults to []
  ├── specs defaults to {}
  │
  ▼
Deduplicate by SKU:
  ├── Map<sku, product>
  ├── For duplicates, keep the record with highest score
  │
  ▼
Sort:
  ├── Featured products first
  ├── Then by price descending (hero-first merchandising)
  │
  ▼
setProducts(deduped)
  ├── Error → setError(message), setProducts([])
  └── Finally → setLoading(false)
```

### Arabic Search Support

```js
const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
// Strips diacritics for accent-insensitive matching

products.filter(product => {
    const normalizedName = product.name_ar
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return normalizedName.includes(normalizedQuery)
        || description.includes(normalizedQuery)
        || sku.toLowerCase().includes(query.toLowerCase());
});
```

---

## Category Constants

**File:** `src/constants/categories.js`

```js
PRODUCT_CATEGORIES = [
  { slug: 'all',          name_ar: 'الكل',              description_ar: 'جميع المنتجات' },
  { slug: 'hand_blender', name_ar: 'هاند بلندر',         description_ar: 'خلاطات يدوية قوية ومتعددة الاستخدامات' },
  { slug: 'blender_juicer', name_ar: 'خلاط وعصارة',      description_ar: 'خلاطات وعصارات احترافية' },
  { slug: 'chopper',      name_ar: 'كبه',                 description_ar: 'كبات كهربائية للفرم والتقطيع' },
  { slug: 'iron',         name_ar: 'مكواه',               description_ar: 'مكاوي كهربائية عالية الجودة' },
  { slug: 'vacuum',       name_ar: 'مكنسة كهربائية',      description_ar: 'مكنسات كهربائية قوية وفعالة' },
  { slug: 'air_fryer',    name_ar: 'قلاية كهربائية',      description_ar: 'قلايات هوائية صحية' },
  { slug: 'stand_mixer',  name_ar: 'عجان',               description_ar: 'عجانات كهربائية احترافية' },
  { slug: 'oven',         name_ar: 'فرن',                 description_ar: 'أفران كهربائية متعددة الوظائف' },
  { slug: 'grinder',      name_ar: 'مطحنة',               description_ar: 'مطاحن كهربائية للقهوة والتوابل' },
]
```

Helper functions:
- `getCategoryBySlug(slug)` → category object or null
- `getCategoryName(slug)` → Arabic name or "غير محدد"

---

## Price Formatting

**File:** `src/utils/formatPrice.js`

```js
formatPriceEGP(1991.26, showCurrency=true)
// → "١٬٩٩١٫٢٦ ج.م"  (Arabic-Indic digits, EGP currency)

calculateDiscountPercentage(2250, 1991.26)
// → 12

formatDiscount(12)
// → "خصم 12%"
```

Uses `Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' })`
with fallback to `price.toFixed(2) + ' ج.م'`.

---

## Data Flow by Section

| Section | Data Source | Filtering |
|---------|-------------|-----------|
| Hero | Hardcoded `hvarProducts` array | N/A — 3 specific products |
| Featured | `useProducts().products.filter(p => p.featured)` | Featured = true |
| Categories | `useProducts().products` (unfiltered) | Grouped by `category_slug` |
| Reviews | N/A (coming soon) | — |
| Support | Static array (hardcoded in JSX) | — |
| Contact | Static data (hardcoded) | — |
