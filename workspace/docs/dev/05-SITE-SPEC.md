# New Hvar Site — Full Specification

> hvarstore.com — customer portal. Every page, every route, every API call.

---

## Pages & Routes

### Public (no auth required)

| Route | Page | What it does |
|-------|------|-------------|
| `/` | Home | Hero, featured products, categories, trust strip |
| `/products` | Catalog | Full product grid, category + price filters, search |
| `/products/:slug` | Product Detail | Gallery, specs, add to cart, WhatsApp CTA |
| `/cart` | Cart | Cart items, summary, checkout CTA |
| `/checkout` | Checkout | Address form, payment selection, order confirm |
| `/contact` | Contact | Phone, WhatsApp, email, FAQ |

### Authenticated (phone + JWT)

| Route | Page | What it does |
|-------|------|-------------|
| `/account` | Account | Phone, name, saved addresses |
| `/orders` | My Orders | Order list with status + tracking |
| `/orders/:id` | Order Detail | Line items, payment, Bosta tracking link |
| `/service/new` | New Service Request | Maintenance / replacement / return form |
| `/service` | My Tickets | Ticket list with state badges |
| `/service/:id` | Ticket Detail | State machine display, notes, timeline |
| `/login` | Login | Phone entry → OTP or password |

---

## Page Specifications

### Home Page

```
┌─────────────────────────────────────────────────────┐
│ HEADER: Logo | nav | cart icon | account | theme    │
├─────────────────────────────────────────────────────┤
│ HERO SECTION                                        │
│ Headline + subline (Arabic)                         │
│ [تسوق الآن] [تتبع طلبك]                            │
│ Product image carousel (3 featured)                 │
├─────────────────────────────────────────────────────┤
│ TRUST STRIP                                         │
│ ✓ شحن سريع  ✓ ضمان سنة  ✓ خدمة عملاء             │
├─────────────────────────────────────────────────────┤
│ CATEGORIES GRID                                     │
│ مكواه | مكنسة | قلاية | خلاط | فرن | عجانة       │
├─────────────────────────────────────────────────────┤
│ FEATURED PRODUCTS                                   │
│ 4-col responsive grid, product cards               │
├─────────────────────────────────────────────────────┤
│ SERVICE SECTION                                     │
│ ضمان | صيانة | استبدال | مرتجع — 4 CTAs           │
├─────────────────────────────────────────────────────┤
│ FOOTER: links | social | contact | rights           │
└─────────────────────────────────────────────────────┘
```

**Data:** Products from API `/api/products?featured=true&limit=8`

---

### Product Catalog

**URL:** `/products?category=:slug&q=:search&min=:price&max=:price&page=:n`

```
┌───────────────────────────────────────────────────────┐
│ FILTER BAR (collapsible on mobile)                    │
│ [category chips] [price range] [search bar]           │
├───────────────────────────────────────────────────────┤
│ RESULTS: "١٢ منتج في مكاوي"                           │
│                                                       │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│ │ img │ │ img │ │ img │ │ img │  (4-col desktop)      │
│ │name │ │name │ │name │ │name │  (2-col mobile)       │
│ │price│ │price│ │price│ │price│                       │
│ │[+] │ │[+] │ │[+] │ │[+] │                         │
│ └─────┘ └─────┘ └─────┘ └─────┘                      │
│                                                       │
│ [تحميل المزيد] or pagination                         │
└───────────────────────────────────────────────────────┘
```

**Product Card contains:**
- Product image (primary variant)
- Name (Arabic)
- Price in EGP (tabular-nums, Inter font)
- Old price + discount badge (if applicable)
- "شحن مجاني" badge (if applicable)
- Quick add to cart button
- Stock indicator (only shown if low: "٢ قطع متبقية")

**API:** `GET /api/products?category=:slug&q=:search&page=:n&limit=20`

---

### Product Detail Page

**URL:** `/products/:slug`

```
┌─────────────────────────────────────────────────────────┐
│  IMAGE GALLERY                │  PRODUCT INFO            │
│  [main image]                 │  اسم المنتج              │
│  [thumb] [thumb] [thumb]      │  ████ ج.م               │
│                               │  ~~١٥٠٠ ج.م~~ (old)     │
│                               │                         │
│                               │  المواصفات:              │
│                               │  • الطاقة: ٢٠٠٠ واط      │
│                               │  • السعة: ٢ لتر          │
│                               │  • الوزن: ١.٥ كجم        │
│                               │                         │
│                               │  اللون / الحجم (if vars) │
│                               │  ○ أبيض  ○ أسود          │
│                               │                         │
│                               │  المتاح: ٥ قطع           │
│                               │  [أضف للسلة]             │
│                               │  [اطلب عبر واتساب]       │
├───────────────────────────────┴─────────────────────────┤
│  DESCRIPTION   |  SPECS TABLE  |  WARRANTY INFO         │
└─────────────────────────────────────────────────────────┘
```

**Key detail:** If product has variations, selecting a variant re-fetches `qty_available` for that specific variation+location.

---

### Cart

Client-side state (React). Nothing in DB until checkout.

```
┌────────────────────────────────────────────────────┐
│  سلتك (٣ منتجات)                                   │
│  ──────────────────────────────────────────────    │
│  [img] مكواة برافيا     ١× ١٢٠٠ج = ١٢٠٠ج  [✕]   │
│  [img] خلاط كينود       ٢× ٨٠٠ج  = ١٦٠٠ج  [✕]   │
│  ──────────────────────────────────────────────    │
│  المجموع الفرعي:                    ٢٨٠٠ج          │
│  الشحن:                     محسوب عند الشحن        │
│  ──────────────────────────────────────────────    │
│  [متابعة للدفع]                                    │
└────────────────────────────────────────────────────┘
```

Cart persisted in `localStorage` (survives page refresh, anonymous). Cleared on order completion.

---

### Checkout

**3-step flow** (React state machine, NOT multiple pages):

```
Step 1 — CONTACT
  Phone number (validate + normalize)
  If new: name field appears
  OTP or password to authenticate

Step 2 — DELIVERY
  Governorate (dropdown from /api/locations/governorates)
  District (dropdown from /api/locations/districts/:govId)
  Street address (free text)
  Building / apartment (optional)
  Delivery date note: "التسليم خلال ١-٣ أيام عمل"

Step 3 — PAYMENT
  ○ الدفع عند الاستلام (COD) — default
  ○ بطاقة / محافظ / تقسيط (Kashier)

  [تأكيد الطلب]
```

**On "تأكيد الطلب":**
- Stock re-check (server-side, `FOR UPDATE`)
- Create order in our DB
- COD → redirect to order confirmation
- Kashier → generate HPP URL → redirect → callback → confirm → redirect

**Address dropdowns feed from:**
```
GET /api/locations/governorates → cities table (id, name Arabic)
GET /api/locations/districts?governorate_id=:id → districts table
```

---

### Order Confirmation + Tracking

**URL:** `/orders/:id`

```
┌──────────────────────────────────────────────────┐
│  ✓ تم استلام طلبك                                │
│  رقم الطلب: HVAR-20240601-0042                   │
│                                                  │
│  ITEMS                                           │
│  مكواة برافيا × ١ .... ١٢٠٠ج                     │
│                                                  │
│  DELIVERY ADDRESS                                │
│  القاهرة، مدينة نصر، شارع ١٥                     │
│                                                  │
│  PAYMENT                                         │
│  الدفع عند الاستلام                               │
│                                                  │
│  TRACKING (appears after MCRM confirms)         │
│  ┌──────────────────────────────────┐            │
│  │ تتبع شحنتك → [رابط Bosta]        │            │
│  │ رقم التتبع: 28473647              │            │
│  └──────────────────────────────────┘            │
└──────────────────────────────────────────────────┘
```

**Tracking section** appears after `transactions.bill_code` is populated (by MCRM/ERP). Shows polling status while null.

---

### New Service Request

**URL:** `/service/new`

```
Step 1 — TYPE
  ○ صيانة (Maintenance)
  ○ استبدال (Replacement)
  ○ مرتجع (Return)

Step 2 — PRODUCT
  Search by name or attach to a previous order
  Describe the issue (Arabic text, min 20 chars)
  Photos (optional, upload to server)

Step 3 — CONTACT & PICKUP
  Phone (pre-filled if logged in)
  Pickup address (re-use from saved addresses or enter new)
  Preferred date (optional)

[إرسال الطلب]
```

**On submit:** `POST /api/tickets` → creates `service_tickets` row:
```json
{
  "type": "HVM",
  "status": "PENDING",
  "contact_id": 123,
  "notes": "يصدر صوت غريب عند التشغيل",
  "product_id": 45,
  "transaction_id": null
}
```
MCRM hub sees this ticket immediately in their queue.

---

### Ticket Status Page

**URL:** `/service/:id`

```
┌────────────────────────────────────────────────────┐
│  طلب صيانة #HVM-2024-0087                          │
│  مكواة برافيا                                      │
│                                                    │
│  TIMELINE (Arabic RTL)                             │
│  ● تم استلام الطلب     Jun 1, 09:00  ✓             │
│  ● تم استلام المنتج    Jun 2, 11:30  ✓             │
│  ● قيد الإصلاح         Jun 3, 14:00  ← CURRENT    │
│  ○ جاهز للاستلام       —                           │
│  ○ تم الإغلاق          —                           │
│                                                    │
│  الوقت المتوقع: ٢-٤ أيام عمل                       │
│                                                    │
│  [تواصل معنا] [عودة لطلباتي]                       │
└────────────────────────────────────────────────────┘
```

**API:** `GET /api/tickets/:id` → reads `service_tickets` + `service_ticket_history`

State machine displayed as a vertical timeline. Completed steps = filled. Current = highlighted. Future = gray.

---

## Backend API Routes

All routes under `/api/`. JWT required except marked (public).

### Auth
```
POST  /api/auth/request-otp      → Send OTP to phone (public)
POST  /api/auth/verify-otp       → Verify OTP → JWT
POST  /api/auth/login            → Phone + password → JWT
GET   /api/auth/me               → Current customer profile
```

### Products (public)
```
GET   /api/products              → Paginated catalog, filters: category, q, min_price, max_price
GET   /api/products/:slug        → Single product with all variations + stock
GET   /api/products/featured     → Featured products (limit 8)
GET   /api/categories            → Category list with counts
```

### Locations (public)
```
GET   /api/locations/governorates           → cities table (id, name)
GET   /api/locations/districts/:govId       → districts by governorate
```

### Orders
```
POST  /api/orders                → Create order (validates stock, fires ERP webhook)
GET   /api/orders                → Customer's order history
GET   /api/orders/:id            → Order detail + tracking info
```

### Payments
```
POST  /api/payments/kashier/initiate   → Generate HPP URL + store pending_payment
POST  /api/payments/kashier/callback   → Kashier callback (public — validates HMAC)
```

### Service Tickets
```
POST  /api/tickets               → Open new maintenance/replacement/return ticket
GET   /api/tickets               → Customer's ticket list
GET   /api/tickets/:id           → Ticket detail + state timeline
```

### Account
```
GET   /api/account               → Profile + addresses
PUT   /api/account               → Update name
POST  /api/account/addresses     → Add address
PUT   /api/account/addresses/:id → Update address
```

---

## Frontend Provider Hierarchy

```jsx
<ThemeProvider>
  <AuthProvider>
    <CartProvider>
      <Router>
        <Layout>
          <Header />
          <Suspense fallback={<PageLoading />}>
            <Routes>
              {/* Public routes */}
              {/* Auth routes */}
              {/* Protected routes */}
            </Routes>
          </Suspense>
          <Footer />
          <CartDrawer />          {/* Slide-out cart, always mounted */}
          <WhatsAppFAB />         {/* Floating WhatsApp button */}
        </Layout>
      </Router>
    </CartProvider>
  </AuthProvider>
</ThemeProvider>
```

---

## Core Components

| Component | Description |
|-----------|-------------|
| `ProductCard` | Image, name, price, discount badge, add-to-cart |
| `ProductGrid` | 4-col responsive grid with skeleton loading |
| `CartDrawer` | Slide-over drawer from right, cart contents |
| `CheckoutSteps` | 3-step progress indicator |
| `GovernorateSelect` | Searchable governorate dropdown (from cities table) |
| `DistrictSelect` | Dependent district dropdown |
| `PhoneInput` | Egyptian phone with +20 prefix, normalize on blur |
| `OrderCard` | Order summary with status badge + tracking link |
| `TicketTimeline` | Vertical state machine display |
| `KashierRedirect` | Handles HPP URL generation + redirect |
| `PaymentMethodSelector` | COD vs Kashier toggle |
| `ServiceRequestForm` | 3-step ticket creation form |
| `StatusBadge` | Arabic status pill (PENDING, RECEIVED, etc.) |
| `TrackingLink` | Bosta tracking number + external link |

---

## What This Site Does NOT Do

- No admin panel (use ERP + MCRM for that)
- No seller management
- No POS terminal (separate project if needed)
- No product management (products come from ERP)
- No stock adjustment (ERP handles stock)
- No multi-currency (EGP only)
- No multi-language at launch (Arabic RTL, English is future)
