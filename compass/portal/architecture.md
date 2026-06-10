# Portal Architecture — hvarstore.com

> System map, stack, data flows, auth strategy, security rules, and deployment constraints. When a trade-off surfaces, start here.

---

## The Mental Model That Changes Everything

`mcrm.hvarstore.com` is the **staff portal** — agents manage orders, tickets, and customers.

`hvarstore.com` is the **customer portal** — customers browse, buy, track, and open service requests.

**They are two windows onto the same database.** When a customer places an order on hvarstore.com, the MCRM call center sees it in their queue. When an MCRM agent advances a ticket, the customer sees the updated state. Build everything with this in mind — the portal does not own data, it is a read/write lens over a shared database.

---

## System Map

```
CUSTOMERS
    │
    ▼
hvarstore.com (THIS PROJECT)
Flask backend + React SPA
    │
    ├── Direct MySQL reads ──────────────────────────┐
    │   (products, stock, contacts, tickets)         │
    │                                                ▼
    ├── Webhook ──── POST /websiteintegration/ ──► ┌──────────────────────────────────────┐
    │               webHooksyncOrdersGet/Delete     │         hvar_erp  (MySQL 8)          │
    │                                              │         SINGLE SHARED DATABASE       │
    └── Direct MySQL writes ──────────────────────►│                                      │
        (service_tickets INSERT,                   │  transactions / contacts / products  │
         contacts INSERT on first order)           │  variations / variation_location_     │
                                                   │  details / service_tickets /          │
                                                   │  cities / districts / categories /   │
                                                   │  brands / service_ticket_history     │
                                                   └──────────────┬───────────────────────┘
                                                                  │
                                              ┌───────────────────┴──────────────────────┐
                                              ▼                                           ▼
                                       Hvar-ERP (Laravel 10)                     MCRM (Flask 3 + React 18)
                                       Inventory, accounting,                    Call center, hub tickets,
                                       order management                          customer 360° view
                                       ← NOT TOUCHED IN THIS PROJECT →
```

---

## What Is Live vs What Is Being Built

| System | Status | URL | Notes |
|--------|--------|-----|-------|
| **New hvarstore.com** | **BUILDING** | hvarstore.com | Customer portal — this project |
| MCRM | Live | mcrm.hvarstore.com | Flask 3 + React 18. Read patterns, do not modify. |
| Hvar-ERP | Live | erp.hvarstore.com (internal) | Laravel 10. Fire webhooks to it. Read DB directly. Do not modify. |
| Old hvarstore.com | Replaced | hvarstore.com | Active eCommerce / Dukan storefront — gone |

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | Flask (Python) | Matches MCRM pattern — copy its structure, reuse its patterns |
| Frontend | React 18 SPA | Single-page app served from Flask's `dist/` folder |
| ERP reads | Raw parameterized SQL via mysql2 / PyMySQL | Never ORM over a schema we don't own |
| Our tables | SQLAlchemy or raw SQL on `hvar_site` | Tables we own: orders, pending_payments, customer auth |
| Cart state | React context + localStorage | Client-side only until checkout; persists page refresh |
| Form validation | React state + server-side validation | Zod or Pydantic on the API side |
| Styling | Tailwind + CSS variables (design system) | Design tokens in CSS vars, Tailwind as utility layer |
| Fonts | Cairo (Arabic), Inter (prices/numbers) | Self-hosted via @fontsource |
| Deployment | Docker Compose or direct process | Flask port 5000, Nginx proxy, MySQL 8 |
| Payment | Kashier HPP | Card, installments, wallets — see `03-KASHIER.md` |
| Shipping | Bosta (read-only) | We read `bill_code` from ERP DB; we do not call Bosta API |

**What is not in the stack:**
- No Next.js, Remix, Astro (this is a Flask + React SPA, matching MCRM)
- No admin panel (ERP + MCRM handle that)
- No POS terminal (separate project)
- No multi-currency (EGP only)
- No multi-language at launch (Arabic RTL; English is future scope)

---

## The Two-Database Pattern

### `hvar_erp` — The Shared ERP Database (Read + Targeted Write)

The database every system shares. We read from it constantly. We write to it only through defined channels:

| Write Channel | When | How |
|--------------|------|-----|
| `contacts` INSERT | First checkout with unknown phone | Direct SQL — ERP contact creation |
| `service_tickets` INSERT | Customer submits service request | Direct SQL — we own this creation |
| ERP webhook | On every order placement | `POST /websiteintegration/webHooksyncOrdersGet` |
| ERP webhook | On order cancellation | `POST /websiteintegration/webHooksyncOrdersDelete` |

**Tables we read from `hvar_erp`:**

| Table | What We Read |
|-------|-------------|
| `products` | Name, slug, description, images, category_id, brand_id |
| `variations` | SKU, variant label, price, product_id |
| `variation_location_details` | `qty_available` — the only stock source of truth |
| `categories` | Category tree for catalog filters |
| `brands` | Brand name and image |
| `cities` | Egyptian governorates (27) — used in address dropdowns |
| `districts` | Districts per governorate — used in address dropdowns |
| `contacts` | Customer lookup by mobile phone |
| `transactions` | Customer's order history + `bill_code` for Bosta tracking |
| `service_tickets` | Ticket status for the customer portal |
| `service_ticket_history` | State timeline for ticket detail page |

**Tables we never write directly:**

| Table | Owner | Reason |
|-------|-------|--------|
| `transactions` | ERP | ERP creates these via webhook |
| `transaction_sell_lines` | ERP | Created alongside transaction |
| `transaction_payments` | ERP | Created by ERP on order sync |
| `variation_location_details` | ERP | Stock is ERP territory |
| `account_transactions` | ERP | Accounting auto-created by ERP |

### `hvar_site` — Our Tables

Tables we own, manage, and migrate:

| Table | Purpose |
|-------|---------|
| `customers` | Auth layer — phone, hashed password, link to ERP `contacts.id` |
| `customer_addresses` | Saved shipping addresses (gov + district + detail + label) |
| `orders` | Our order records — source of `website_order_id` sent to ERP |
| `order_items` | Line items for each order |
| `pending_payments` | Kashier HPP bridge — created before redirect, consumed on callback |

---

## Stock Authority

**Single source of truth:**

```
variation_location_details.qty_available
```

`product_stocks.qty` belongs to the old Active eCommerce system. It drifts. The daily sync from ERP skips Friday. On any weekend, `product_stocks.qty` can be 48 hours stale. Treat it as if it does not exist.

**Re-check stock at checkout, not just at add-to-cart:**

```sql
-- Inside a DB transaction, with FOR UPDATE:
SELECT qty_available
FROM variation_location_details
WHERE variation_id = :var_id AND location_id = :loc_id
FOR UPDATE;
-- Abort if qty_available < quantity ordered
```

The stock shown during browsing may be stale by the time checkout fires. Always re-validate inside the same DB transaction.

---

## Auth Strategy

**Phone is identity.** No email accounts. No username. Every customer is identified by their Egyptian mobile number.

**Flow:**

```
Customer enters phone at checkout or login
  → Backend: normalize phone to 01XXXXXXXXX
  → Query: SELECT * FROM customers WHERE phone = :normalized_phone
    → Exists: present OTP or password prompt
    → Not exists: name field appears, create contact + customer record on order confirmation

OTP or password verified
  → Issue JWT (access token, 24h expiry)
  → Store in httpOnly cookie (not localStorage — prevents XSS token theft)
  → Refresh token (7d) also in httpOnly cookie
  → Token rotation: silent refresh on 401 + valid refresh token pattern
```

**Phone normalization is mandatory before any lookup or storage:**

```python
import re

def normalize_egypt_phone(phone: str) -> str | None:
    if not phone:
        return None
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('20'):
        digits = digits[2:]
    if len(digits) == 9 and digits.startswith('1'):
        digits = '0' + digits
    if re.match(r'^01[0125]\d{8}$', digits):
        return digits
    return None  # Invalid — reject at the boundary
```

Valid Egyptian operators: `010` (Vodafone), `011` (Etisalat/e&), `012` (Orange), `015` (WE).

---

## API Boundary

All routes under `/api/`. JWT required unless marked public.

### Auth
```
POST  /api/auth/request-otp       (public) Send OTP to phone
POST  /api/auth/verify-otp        (public) Verify OTP → JWT
POST  /api/auth/login             (public) Phone + password → JWT
GET   /api/auth/me                (JWT)    Current customer profile
```

### Products — public
```
GET   /api/products               Paginated catalog: ?category, ?q, ?min_price, ?max_price, ?page
GET   /api/products/featured      Featured products, limit 8
GET   /api/products/:slug         Single product with all variations + stock
GET   /api/categories             Category list with product counts
```

### Locations — public
```
GET   /api/locations/governorates           cities table (id, name Arabic)
GET   /api/locations/districts/:govId       districts by governorate
```

### Orders
```
POST  /api/orders                 (JWT) Create order: validates stock FOR UPDATE, fires ERP webhook
GET   /api/orders                 (JWT) Customer's order history
GET   /api/orders/:id             (JWT) Order detail + Bosta tracking info
```

### Payments
```
POST  /api/payments/kashier/initiate   (JWT)    Generate HPP URL + store pending_payment
POST  /api/payments/kashier/callback   (public) Kashier callback — validates HMAC first, no JWT
```

### Service Tickets
```
POST  /api/tickets               (JWT) Open maintenance/replacement/return ticket
GET   /api/tickets               (JWT) Customer's ticket list
GET   /api/tickets/:id           (JWT) Ticket detail + state timeline
```

### Account
```
GET   /api/account               (JWT) Profile + addresses
PUT   /api/account               (JWT) Update name
POST  /api/account/addresses     (JWT) Add address
PUT   /api/account/addresses/:id (JWT) Update address
```

**The Kashier callback exception:** it is public because Kashier POSTs from their servers, not from the customer's browser. No JWT is possible. It MUST validate `x-kashier-signature` as the first act. Any validation failure = return 400, log, do nothing.

---

## Order Lifecycle

### Storefront Order (customer buys online)

```
1. INTAKE
   Customer builds cart (React state only, no DB)
   Enters phone + address (governorate + district from dropdowns)
   Selects payment method

2. PAYMENT — KASHIER PATH
   Backend generates UUID orderId: HVAR-{uuid4[:12]}
   Stores order + pending_payment record in DB
   Redirects customer to Kashier HPP
   Kashier redirects back → backend validates x-kashier-signature (HMAC-SHA256)
   On SUCCESS: payment confirmed, order status = paid

2. PAYMENT — COD PATH
   Order created immediately, payment_status = 'due'

3. ERP SYNC (same request or background job)
   POST /websiteintegration/webHooksyncOrdersGet → ERP
   ERP creates transaction: type='sell', status='draft', website_order_id=our_id
   Contact matched by normalized phone

4. CALL CENTER (MCRM)
   MCRM agent sees draft transaction in queue
   Agent confirms with customer → transaction.status = 'final'
   Stock deducted from variation_location_details
   Bosta shipment auto-created (if auto_bosta_for_website_orders = true)

5. TRACKING
   Customer reads transactions.bill_code via GET /api/orders/:id
   If NULL → "طلبك قيد التأكيد"
   If populated → Bosta tracking link
```

### Order Cancellation

**Before MCRM confirmation (draft):**
```
1. soft-delete our order: status='cancelled', cancelled_at=NOW() (NEVER hard-delete)
2. POST /websiteintegration/webHooksyncOrdersDelete { order_id: our_id }
3. ERP removes draft transaction
4. No stock impact (stock never deducted at draft stage)
5. If Kashier payment taken: initiate Kashier refund
```

**After MCRM confirmation (final):** requires human intervention via MCRM. Do not automate.

**Rule:** fire the ERP webhook before soft-deleting our record. If the webhook fails, do not soft-delete — retry or escalate. The two systems must agree on cancellation state. If our record disappears before ERP is notified, the audit trail is gone.

---

## Kashier Integration Rules

1. `orderId` is always a UUID: `HVAR-{uuid4[:12]}`. Never `last_id + 1`. Never sequential.
2. Store the `orderId` in `pending_payments` before redirecting to Kashier HPP.
3. On callback: validate `x-kashier-signature` FIRST. Any failure = 400, log, stop.

**HMAC validation:**
```
HMAC-SHA256("/?payment={mid}.{orderId}.{amount}.EGP", kashier_secret_key)
```

The previous system had this validation disabled — this is a documented security hole. It must be enabled in this system. No exceptions.

---

## Bosta Integration Rules

**We do not call the Bosta API.** MCRM handles Bosta. We read `transactions.bill_code` from the ERP DB and link the customer to Bosta's public tracking page:

```
https://bosta.co/ar-eg/tracking-shipments?shipment-number={bill_code}
```

**The naming trap** (has bitten every developer who touched this codebase):

| Bosta API field | What it actually means |
|----------------|----------------------|
| `city` | Egyptian governorate (e.g., Cairo, Giza) |
| `zone` | Egyptian city/district (e.g., Nasr City, Dokki) |

If MCRM Bosta work is ever required: `city` = governorate, `zone` = district. Always verify against this table.

**Phone for Bosta:** must be `01XXXXXXXXX` format (10 digits, no country code). Normalize before building any payload.

---

## Security Rules — Cannot Be Broken

### 1. Parameterized Queries Always
All DB interactions use parameterized queries. No string concatenation. No f-strings in SQL. Any query that bypasses this is a security failure, not a style issue.

### 2. Kashier HMAC Always On
Validate `x-kashier-signature` before any callback processing. Return 400 on failure. Log. Do nothing else.

### 3. Phone Normalization at the Boundary
Normalize before: storing to DB, querying contacts, building Kashier payloads, building Bosta payloads. No raw user-entered phone string reaches the database.

### 4. JWT in httpOnly Cookies
Never store JWT in `localStorage` or `sessionStorage`. Both are accessible to JavaScript and vulnerable to XSS. `httpOnly` cookies are not.

### 5. No ERP Internal IDs in Customer URLs
ERP transaction IDs are sequential integers — they reveal order volume. Use our `orders.id` (UUID-derived) in customer-facing URLs. Map to ERP transaction ID internally.

### 6. Secrets in `.env` Only
Kashier live secret, DB credentials, JWT secret — never in code, never committed. `.env.example` documents what is needed. `.env` is gitignored.

### 7. Soft-Delete Only
Orders get `cancelled_at` timestamps. Never delete order rows. The ERP needs to know an order is cancelled before we stop tracking it. Hard-deleting breaks the audit trail and creates webhook sequencing bugs.

### 8. Stock Lock at Checkout
Re-check `qty_available >= quantity` inside a DB transaction with `FOR UPDATE` at the moment of order creation. Never trust the stock displayed during browsing.

---

## Address Resolution (Storefront → ERP)

When an order goes to the ERP, it resolves Arabic address text to DB IDs:

```
shipping_address.state (Arabic governorate name)
  → SELECT id FROM cities WHERE name LIKE '%{state}%'
  → If found: transaction.shipping_state = cities.id

shipping_address.city (Arabic district name)
  → SELECT id FROM districts WHERE district_name LIKE '%{city}%'
  → If found: transaction.shipping_city = districts.id
```

**Best practice:** use dropdowns backed by the actual `cities` and `districts` tables. Send `cities.name` and `districts.district_name` exactly as they appear in the DB — maximizes the chance of a successful ERP match.

**The 27 Egyptian governorates** (Arabic, as stored in `cities.name`):

```
القاهرة، الجيزة، الإسكندرية، الشرقية، الدقهلية، القليوبية، المنوفية،
الغربية، كفر الشيخ، الإسماعيلية، بورسعيد، السويس، شمال سيناء، جنوب سيناء،
مطروح، الوادي الجديد، البحر الأحمر، الفيوم، بني سويف، المنيا، أسيوط،
سوهاج، قنا، الأقصر، أسوان، دمياط، البحيرة
```

---

## Frontend Structure

React SPA served from Flask's built `dist/` folder. No separate frontend server in production.

### Provider Hierarchy

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
              {/* Authenticated routes */}
            </Routes>
          </Suspense>
          <Footer />
          <CartDrawer />      {/* Slide-out cart, always mounted */}
          <WhatsAppFAB />     {/* Floating WhatsApp button */}
        </Layout>
      </Router>
    </CartProvider>
  </AuthProvider>
</ThemeProvider>
```

### Pages and Routes

**Public (no auth required):**

| Route | Page |
|-------|------|
| `/` | Home: hero, featured products, categories, trust strip |
| `/products` | Catalog: grid, category/price filters, search |
| `/products/:slug` | Product detail: gallery, specs, add to cart, WhatsApp CTA |
| `/cart` | Cart: items, summary, checkout CTA |
| `/checkout` | 3-step: contact → delivery → payment |
| `/contact` | Phone, WhatsApp, email, FAQ |

**Authenticated (phone + JWT):**

| Route | Page |
|-------|------|
| `/account` | Phone, name, saved addresses |
| `/orders` | Order list with status + tracking |
| `/orders/:id` | Line items, payment, Bosta tracking link |
| `/service/new` | Maintenance / replacement / return form |
| `/service` | Ticket list with state badges |
| `/service/:id` | State machine timeline, notes |
| `/login` | Phone entry → OTP or password |

### Cart State

Client-side only (React context). Nothing written to DB during browsing. Persisted in `localStorage` — survives page refresh. Cleared on order completion.

### Core Components

| Component | Purpose |
|-----------|---------|
| `ProductCard` | Image, badges, name, price, add-to-cart |
| `ProductGrid` | 4-col responsive with skeleton loading |
| `CartDrawer` | Slide-over from right, cart contents |
| `CheckoutSteps` | 3-step progress indicator |
| `GovernorateSelect` | Searchable dropdown from cities table |
| `DistrictSelect` | Dependent dropdown from districts table |
| `PhoneInput` | Egyptian phone with +20, normalize on blur |
| `OrderCard` | Order summary with status badge + tracking link |
| `TicketTimeline` | Vertical state machine display |
| `KashierRedirect` | HPP URL generation + redirect handling |
| `PaymentMethodSelector` | COD vs Kashier toggle |
| `ServiceRequestForm` | 3-step ticket creation |
| `StatusBadge` | Arabic status pill |
| `TrackingLink` | Bosta number + external link |

---

## Deployment

| Service | Port | Notes |
|---------|------|-------|
| Flask (API + SPA) | 5000 | Serves React `dist/` as static + `/api/*` routes |
| MCRM | 5050 | Already deployed, do not touch |
| ERP (Laravel) | 80/443 | Internal, Nginx proxy |
| MySQL | 3306 | Always `127.0.0.1`, never `localhost` |

**The `127.0.0.1` rule:** on many Linux configurations, `localhost` resolves to a Unix socket rather than TCP loopback. `127.0.0.1` forces TCP and always works with mysql2 / PyMySQL.

### CORS Policy

```python
CORS_ORIGINS = [
    "https://hvarstore.com",
    "https://mcrm.hvarstore.com",  # Inter-system calls
    "http://localhost:5173",        # Dev frontend
]
```

### Environment Variables

All secrets live in `.env` — never in code, never committed:
- DB credentials (`hvar_erp` + `hvar_site`)
- JWT secret
- Kashier live secret key + mid
- ERP webhook credentials

`.env.example` documents all required variables.

---

## Error Response Contract

Every API error returns the same shape:

```json
{
  "error": "string (Arabic for user-facing, English for developer-facing)",
  "code": "STOCK_INSUFFICIENT | PHONE_INVALID | AUTH_FAILED | ...",
  "field": "which field caused the error (optional, for form validation)"
}
```

HTTP status codes carry meaning: 400 validation, 401 auth failure, 403 authorization, 404 not found, 409 conflict (duplicate phone, stock conflict), 500 unexpected. Never 200 with an error body.

---

## Scale Reality

**~250,000 orders. ~120,000 customers.** These are not projections — this is the current state of `hvar_erp` before the new portal ships.

This changes every query design decision:

### What this means concretely

**Contacts table (~120k rows):**
- Phone lookup (`WHERE mobile = ?`) must be indexed. It already is in the ERP schema — verify before assuming.
- Full-text search on customer name is a table scan at this size. Never do it without a LIKE on an indexed column or a dedicated search index.
- "Check if customer exists before creating" must use the same normalized phone format. A mismatch creates a duplicate — and 120k records means duplicates are hard to find after the fact.

**Transactions table (~250k rows):**
- `WHERE contact_id = :id` for order history — indexed on `contact_id`, confirmed.
- `WHERE website_order_id IS NOT NULL` for storefront orders — add this index if it doesn't exist. A full table scan on 250k rows for every order list page load is unacceptable.
- Never load all orders for a customer at once. Paginate from the first query. Assume power users with 20+ orders exist.

**Order history page:** default 10 per page. Not 25 (too many round trips to ERP on mobile). Not 50 (too slow on first load).

**Product catalog:**
- Product table is small (tens to low hundreds of SKUs). Safe to cache aggressively — 5 minute TTL on the full catalog list is fine.
- `variation_location_details` stock levels: never cache. Always live. 120k customers means concurrent checkouts are real.

**Service tickets:**
- Tickets are relatively sparse — not every customer opens one. But `WHERE contact_id = :id` must still be indexed.
- Status + date range queries in MCRM queue: these need composite indexes on `(status, created_at)` and `(status, next_action_at)`.

### Pagination Contract

Every endpoint that returns a list uses this envelope. No exceptions.

```json
{
  "data": [...],
  "pagination": {
    "total": 250000,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

Default page sizes by context:
| Context | Default limit | Max allowed |
|---------|--------------|-------------|
| Product grid (portal) | 20 | 40 |
| Order history (customer) | 10 | 20 |
| MCRM order queue | 25 | 50 |
| MCRM ticket list | 25 | 50 |
| Admin customer list | 20 | 100 |

**Never accept `limit=0` or `limit=-1` as "return all".** At 250k rows that is a production incident.

### Search Performance Rules

- Customer search by phone: indexed lookup, not LIKE. Phone must be normalized first.
- Customer search by name: only if the user has typed 3+ characters. Apply a 300ms debounce. Still a LIKE scan — acceptable only because it's staff-facing (MCRM) not customer-facing.
- Product search: full catalog is small enough (~100 SKUs) to filter client-side after a single fetch. Do not build a server-side product search endpoint — it would be over-engineering for this catalog size.
- Order search by ticket number or Bosta tracking: exact match, indexed.

---

## Five Rules That Cannot Be Forgotten

1. **ERP is the authority.** Stock, orders, contacts, tickets — all in `hvar_erp`. We display and feed data; we don't own it.

2. **Phone is identity.** Normalize every phone to `01XXXXXXXXX` before any operation. Return `None` on invalid phones and reject at the boundary.

3. **Kashier orderId is a UUID.** `HVAR-{uuid4[:12]}`. Never sequential. Generate before redirect, store in `pending_payments`, match on callback.

4. **Stock is `variation_location_details.qty_available`.** Not `product_stocks.qty`. Re-check at order creation inside a DB transaction with `FOR UPDATE`.

5. **Never hard-delete.** Orders get `cancelled_at` timestamps. Fire the ERP cancellation webhook before soft-deleting. The ERP needs to know before we stop tracking.

---

## Documents in This Dev Guide

| File | What It Covers |
|------|---------------|
| `00-START-HERE.md` | Entry point, mental model, reading order |
| `01-ECOSYSTEM.md` | All systems, integration points, shared DB |
| `02-ERP-CONTRACT.md` | Exact payload formats the ERP expects |
| `03-KASHIER.md` | Payment integration — the correct implementation |
| `04-DATA-FLOWS.md` | Stock authority, order lifecycle, Bosta, phone normalization |
| `05-SITE-SPEC.md` | Full site spec: pages, routes, components, API |
| `06-SERVICE-PORTAL.md` | Service ticket portal: forms, state display, customer flow |
| `architecture.md` | This file |
