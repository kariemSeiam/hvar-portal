# Component Reference

> All React components with their props, states, and behavior.

---

## Layout Components

### AppShell

**File:** `src/components/layout/AppShell.jsx`

Root layout wrapper. Provides `<Header>`, `<Footer>`, and injects `dir` and
`lang="ar"` on the container.

```jsx
<AppShell>
  {children}   // rendered inside <main>
</AppShell>
```

### Header

**File:** `src/components/layout/Header.jsx`

Sticky header with:

| Feature | Details |
|---------|---------|
| **Logo** | HVAR diamond + "VAR" wordmark + ® |
| **Nav** | 5 links: مميز, أقسام المنتجات (dropdown), مراجعات البلوجرز, الدعم الفني, اتصل بنا |
| **Search** | Desktop inline search bar (expands on focus) |
| **Mobile** | Hamburger → full menu with search + categories + contact |
| **Scroll** | Adds shadow + blur on scroll > 20px |
| **Dropdown** | Categories grid (2×4) with icons, colors, product counts |
| **Accessibility** | ARIA labels, keyboard nav, focus management |

**State:**
- `isScrolled` — toggles glass effect on scroll
- `isMobileMenuOpen` — mobile menu toggle
- `isSearchExpanded` — search bar animation
- `activeDropdown` — which dropdown is open (null = none)
- `searchQuery` — search input value

### Footer

**File:** `src/components/layout/Footer.jsx`

Dark footer (`bg-gray-900`) with:
- Company info + contact (phone, email)
- Quick links (same as nav)
- Social icons: Facebook, Instagram, YouTube
- Copyright line: `© {year} هفار للأجهزة المنزلية. جميع الحقوق محفوظة.`

---

## Page Components

### LandingPage

**File:** `src/components/pages/LandingPage.jsx`

Composes all 5 sections into the single page:

```
HeroSection
Featured Section  (id=featured)     → CategorySection(products.featured)
All Products      (id=categories)   → CategorySection(products.all)
Reviews           (id=reviews)      → Coming soon card
Support           (id=support)      → Service cards grid (3)
Contact           (id=contact)      → Contact info + working hours
```

Each section has a consistent header pattern:
```jsx
<div className="inline-flex items-center ... rounded-full ... mb-4">
  <Icon />  {/* section-specific icon + color */}
  <span>{section title}</span>
</div>
<h2 className="bg-gradient-to-r ... bg-clip-text text-transparent">
  {section heading}
</h2>
```

---

## Content Components

### HeroSection

**File:** `src/components/content/HeroSection.jsx`

Full-viewport hero with a product carousel.

**Features:**
- 3 products loaded from `useMemo` (hardcoded data — NOT from `useProducts`)
- Left-to-right layout: text → product card
- Market gap badge ("فجوة سوقية فريدة: 2000W + 6.5L")
- Gradient headline text
- CTA button → WhatsApp
- Dealer stats (3 stat cards: فجوة سوقية, قطع غيار محلية, سعر تنافسي)
- Product card carousel with prev/next buttons and dot indicators
- Dealer advantage section inside product card

**Key variation from other components:**
- Uses **hardcoded product data**, not `useProducts` hook
- This is intentional — the hero showcases specific marketing products

---

## Product Components

### ProductCard

**File:** `src/components/product/ProductCard.jsx`

The core product display component.

```jsx
<ProductCard
  product={productObj}
  className=""
  priority={false}
  compact={false}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `product` | Object | required | Product data (see below) |
| `className` | String | `''` | Additional CSS classes |
| `priority` | Boolean | `false` | Eager-load image if true |
| `compact` | Boolean | `false` | Reduced padding/sizing |

**Product object structure:**
```js
{
  id: number,
  sku: string,
  slug: string,
  brand: string,
  name_ar: string,
  category_slug: string,
  category_name_ar: string,
  images: string[],            // URLs
  price_current_egp: number,   // EGP
  price_original_egp: number,  // EGP (shown strikethrough if higher)
  free_shipping: boolean,
  featured: boolean,
  badges: string[],            // e.g. ["شحن مجاني", "جديد"]
  warranty_months: number,
  description_ar: string,
  specs: { [key: string]: string }
}
```

**Rendered sections:**
```
┌──────────────────────────┐
│ Badges (new/hot/discount)│  ← absolute positioned top-right
├──────────────────────────┤
│ Product Image            │  ← square aspect, lazy-loaded
│                          │     hover scale 1.1
├──────────────────────────┤
│ Brand tag / SKU          │  ← left/right pair
│ Product Name             │  ← line-clamp-2
│ Price (current + orig)   │  ← discount red, original strikethrough
│ Price per watt (if spec) │  ← e.g., "X ج.م/وات"
│ Spec chips (inline)      │  ← free_shipping, warranty, featured
│ Spec table (top 3)       │  ← key-value pairs
│ Description              │  ← line-clamp-2
└──────────────────────────┘
```

**Accessibility features:**
- `<article>` with `role="article"` and `aria-labelledby`
- Image has `alt` text in Arabic
- Keyboard focusable (`tabIndex={0}`)
- `group-focus-within:ring-red-500` for keyboard navigation
- Reduced motion respected
- High contrast mode supported

**States:**
| State | Behavior |
|-------|----------|
| Image loading | Skeleton shimmer, `opacity-0 scale-105` → transition in |
| Image error | Fallback SVG icon (broken image placeholder) |
| No images | SVG placeholder |
| No description | Section hidden |
| No specs | Section hidden |
| No discount | Original price hidden |
| `compact=true` | Smaller padding, smaller text, denser layout |

### ProductGrid

**File:** `src/components/product/ProductGrid.jsx`

Renders products in responsive grid or horizontal scroll layout.

```jsx
<ProductGrid
  products={[]}
  loading={false}
  error={null}
  className=""
  gridCols="auto-fit"           // "auto-fit" | "auto-fill" | "2" | "3" | "4" | "horizontal-scroll"
  priorityProducts={[]}
  compact={false}
  showCategoryHeaders={true}
  enableHorizontalScroll={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `products` | Array | `[]` | Product objects |
| `loading` | Boolean | `false` | Shows skeleton grid |
| `error` | String|null | `null` | Shows error state |
| `gridCols` | String | `"auto-fit"` | Grid column configuration |
| `priorityProducts` | Array | `[]` | SKUs to load eagerly |
| `compact` | Boolean | `false` | Passed to ProductCard |
| `showCategoryHeaders` | Boolean | `true` | Show category headers in horizontal scroll |
| `enableHorizontalScroll` | Boolean | `true` | Enable horizontal scroll mode |

**States:**

| State | Visual |
|-------|--------|
| **Loading** | 8 skeleton cards with shimmer + spinner |
| **Error** | Red gradient circle icon + message + retry button |
| **Empty** | Gray circle icon + "لا توجد منتجات" message |
| **Normal (grid)** | 4-col responsive grid (`1→2→3→4`) |
| **Normal (scroll)** | Horizontal scroll rows with gradient fade edges |

**Grid column behavior:**
| `gridCols` | Mobile | Tablet | Desktop | Wide |
|------------|--------|--------|---------|------|
| `auto-fit` | 1 | 2 | 3 | 4 |
| `2` | 1 | 2 | 2 | 2 |
| `3` | 1 | 2 | 3 | 3 |
| `4` | 1 | 2 | 3 | 4 |
| `horizontal-scroll` | Scroll with 5 items max |

### CategorySection

**File:** `src/components/product/CategorySection.jsx`

Groups products by category, renders ProductGrid per category.

```jsx
<CategorySection
  products={[]}
  loading={false}
  error={null}
  className=""
  compact={false}
/>
```

**Logic:**
1. Reads `PRODUCT_CATEGORIES` from `constants/categories.js`
2. Groups products by `category_slug`
3. Calculates merchant metrics: total value, avg price, featured count
4. Sorts products: featured first, then price descending
5. Renders a `<ProductGrid>` per category

**Category header pattern:**
```jsx
<div className="flex items-center ...">
  <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full" />
  <h2>{category.name_ar}</h2>
  <span className="bg-gray-100 rounded-full">{n} منتج</span>
</div>
<p>{category.description_ar}</p>
```

### ProductShowcase

**File:** `src/components/product/ProductShowcase.jsx`

Higher-level wrapper combining ProductGrid with QuickView modal.

```jsx
<ProductShowcase className="" />
```

**Props:** `className` (optional)

Manages QuickView state (`selectedProduct`, `showQuickView`) and passes
`onQuickView` / `onAddToCart` callbacks to `ProductGrid`. The modal is
rendered as a fixed overlay when active.

**QuickView modal contains:**
- Product image (full width)
- Brand + SKU
- Product name + description
- Price (current + original if discounted)
- Features (free shipping, warranty)
- Specifications table
- "إضافة للسلة" + "إغلاق" buttons

---

## UI Components

### LoadingSpinner

**File:** `src/components/ui/LoadingSpinner.jsx`

```jsx
<LoadingSpinner
  size="md"         // "sm" | "md" | "lg" | "xl"
  text="جاري التحميل..."
  className=""
  variant="default"  // "default" | "primary" | "secondary" | "white"
/>
```

Renders a border-spinner with optional text and `role="status"`.
