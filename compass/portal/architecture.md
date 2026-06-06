# Portal Architecture Direction — hvarstore.com

> Principles that guide architectural decisions for the customer portal. This is not a technical spec — it is the rationale and the rules. When a new feature request arrives or an architectural trade-off surfaces, this document is where you look first.

---

## The Stack (Locked)

These choices were made after evaluating the landscape of production patterns in 2025–2026. They are not revisited without a compass update.

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Astro 5 + React 19 islands | Zero-JS static HTML for SEO-critical pages; React where interactivity demands it |
| API | Hono v4 on Bun | Fastest TypeScript backend, native JWT/HMAC support, Zod shared with frontend |
| ORM (our tables) | Drizzle ORM on `hvar_site` | Type-safe schema management for tables we own |
| ERP reads | Raw parameterized SQL via mysql2 | Never ORM over a schema we don't own |
| Cart state | Nanostores | 1KB, framework-agnostic, persists to localStorage |
| Form + validation | react-hook-form + Zod | Shared schemas between API and frontend — one source of truth for validation rules |
| Data fetching | TanStack Query | Caching, refetch strategies, and server state management for React islands |
| Styling | Tailwind v4 + `@theme` CSS vars | Design token system lives in CSS; Tailwind is the utility layer |
| Deployment | Docker Compose | Bun API + Astro SSR + Caddy + MySQL, environment-isolated |
| Fonts | @fontsource (Cairo, Inter, JetBrains Mono) | Self-hosted, no Google Fonts dependency, privacy-compliant |

**What is not in the stack:**
- Next.js (server-heavy for what is primarily a static catalog)
- Remix (well-suited for data-heavy apps, overkill for this use case)
- GraphQL (unnecessary complexity for a single-seller catalog with defined read patterns)
- Redux (Nanostores is sufficient; Redux weight is not earned)
- Prisma (Drizzle for our tables; raw SQL for ERP — Prisma does not help the ERP case)

---

## The Island Architecture Principle

**Zero JavaScript by default.** Every page that does not require user interaction is statically rendered Astro HTML. No hydration cost. No JavaScript bundle. Just HTML, CSS, fonts, and images.

**Hydrate as React islands ONLY where user interaction demands it:**

| Component | Hydrated? | Why |
|-----------|----------|-----|
| Catalog page (grid) | No | Static list, no interaction |
| Product card | No | Link + image, no state |
| PDP product info | No | Static copy, no state |
| PDP image gallery | Yes (`client:load`) | Swipe, zoom, slide interaction |
| CtaActionBar | Yes (`client:load`) | Quantity stepper, variant selector, add-to-cart |
| StickyMobileCta | Yes (`client:load`) | Bottom-sheet behavior, mirrors CtaActionBar |
| CartFAB | Yes (`client:load`) | Badge count from Nanostores, drawer open/close |
| CartDrawer | Yes (`client:load`) | Full cart state, quantity updates, remove |
| Checkout form | Yes (`client:load`) | Complex form state, validation, payment selection |
| Auth forms (login/register) | Yes (`client:load`) | Form state, validation, JWT |
| Account/orders/tickets | Yes (`client:idle`) | Authenticated data fetch, not time-critical |
| NavBar links | No | Pure HTML links |
| Footer | No | Static content |
| ThemeToggle | Yes (`client:load`) | CSS class mutation on `<html>` |

The discipline: before adding `client:load` to anything, justify the JavaScript cost. Static pages are fast by default. Every island has a cost.

**`client:load` vs `client:idle` vs `client:visible`:**
- `client:load` — hydrate immediately. Use for above-fold interactive elements that users need right away.
- `client:idle` — hydrate when browser is idle. Use for below-fold interactions or account pages where 100ms delay is acceptable.
- `client:visible` — hydrate when the component enters viewport. Use for below-fold components on long pages.

---

## The Two-Database Pattern

hvarstore.com reads from and writes to two MySQL databases:

### `hvar_site` — Our Database

Contains tables we own and manage:

| Table | Purpose |
|-------|---------|
| `customers` | Auth layer — phone, hashed password, customer_id link to ERP contact |
| `customer_addresses` | Saved shipping addresses (gov + district + detail + label) |
| `orders` | Our order records — the customer's view of their order history |
| `order_items` | Line items for each order |
| `pending_payments` | Bridge table for Kashier HPP flow — created before redirect, consumed on callback |

Managed via Drizzle ORM. Schema migrations are code. Schema changes are deliberate, versioned, and applied through the migration runner.

### `hvar_erp` — The ERP Database (Read/Feed Only)

Contains everything Ultimate POS owns. We read from it for product catalog, stock, orders (as transactions), and contacts. We write to it only through the defined webhook endpoints — never via direct SQL INSERT/UPDATE on ERP tables.

**The isolation is deliberate:** when Ultimate POS is upgraded, our `hvar_site` schema is unaffected. We update our read queries if ERP schema changes — but our data is safe.

**Third database: `mcrm_hvar_hub`**

Service tickets (`service_tickets`, `service_ticket_history`, `service_items`, `ticket_sequences`) are in this database. Requires a third connection pool. See `MCRM_DB_*` in `.env`. This is a common source of confusion — refer to `products/erp.md` Absolute 5.

---

## The Scope Boundary

hvarstore.com is a customer portal. Everything outside this boundary is out of scope.

**In scope:**
- Browse and search the product catalog
- View product details, pricing, stock
- Add to cart
- Checkout (COD or Kashier)
- Register and login (phone + password)
- View order history and order detail
- Track shipment via Bosta link
- Open service tickets (maintenance, replacement, return)
- View and follow ticket status
- Manage saved addresses
- Toggle theme (هفار الأحمر / هفار الليل)

**Out of scope — goes to mCRM or ERP:**
- Admin panel or product management
- Order confirmation workflow (agent function — mCRM)
- Inventory management
- Financial reporting
- Multi-seller
- Any feature that modifies ERP data outside of defined webhook patterns

**The test:** if a feature request requires owning data that the ERP should own, or requires building admin functionality, it belongs elsewhere. The portal's job is the customer's journey — from discovery to after-sale service.

---

## API Design Principles

### Route Structure (Hono)

```
/api/auth/register
/api/auth/login
/api/auth/me
/api/products               (public: ?category, ?q, ?min_price, ?max_price, ?page)
/api/products/featured      (public)
/api/products/:slug         (public)
/api/categories             (public)
/api/locations/governorates (public)
/api/locations/districts/:govId (public)
/api/orders                 (JWT: GET list, POST create)
/api/orders/:id             (JWT: GET detail)
/api/payments/kashier/initiate (JWT: POST)
/api/payments/kashier/callback (public: POST — validates HMAC, no JWT)
/api/tickets                (JWT: GET list, POST create)
/api/tickets/:id            (JWT: GET detail)
/api/account                (JWT: GET me, PUT update)
/api/account/addresses      (JWT: GET list, POST create)
/api/account/addresses/:id  (JWT: PUT update, DELETE remove)
```

**The HMAC exception:** Kashier callback is public (no JWT) because Kashier POSTs to it from their servers. It MUST validate the `x-kashier-signature` header before doing anything else. Validation failure = return 400, log the request, do nothing.

### Zod Schema Sharing

Request body schemas are defined once in `shared/` and imported by both the API handler (for validation) and the frontend form (for client-side validation). Changes to a schema propagate to both layers automatically. This is the primary guard against "the API changed but the form didn't."

### Error Response Format

Every API error follows the same shape:
```typescript
{
  error: string;         // human-readable message in Arabic (for user-facing) or English (for developer-facing)
  code: string;          // machine-readable error code: "STOCK_INSUFFICIENT", "PHONE_INVALID", etc.
  field?: string;        // which field caused the error, for form validation
}
```

HTTP status codes: 400 for validation errors, 401 for auth failures, 403 for authorization failures, 404 for not found, 409 for conflicts (duplicate phone, stock conflict), 500 for unexpected server errors.

**Never:** 200 with an error body. HTTP status codes must carry meaning.

### JWT Strategy

- Access token: 24-hour expiry, stored in `httpOnly` cookie (not localStorage — prevents XSS token theft)
- Refresh token: 7-day expiry, stored in `httpOnly` cookie
- Token rotation: access token refreshed transparently on the 401 + valid refresh token pattern
- Never store JWTs in `localStorage` or `sessionStorage` in the browser

### Kashier HMAC Validation

The HMAC key is the `x-kashier-signature` on the callback. The validation:

```
HMAC-SHA256("/?payment={mid}.{orderId}.{amount}.EGP", secret_key)
```

This must be the first thing the callback handler does. If validation fails, return 400 immediately. Do not process the callback. Do not update any order status. Log the failed attempt.

The previous system had this validation disabled — this is documented in the memory as a known security hole. It must be on in this system.

---

## Performance Targets

**Target environment:** Mobile, Egyptian 4G network, Android device. Not a fiber connection. Not a MacBook Pro. Test performance in this context.

| Metric | Target | How |
|--------|--------|-----|
| LCP (Largest Contentful Paint) | < 2.5 seconds | Static HTML served from Caddy, no API call for catalog pages |
| Static page first byte | < 100ms | Caddy serving pre-built Astro HTML |
| Product image load | < 1.5 seconds on 4G | WebP format, lazy-load below fold, correct `sizes` attribute |
| API response (product list) | < 400ms | Indexed ERP queries, connection pool tuned |
| API response (checkout submit) | < 1 second | Stock lock + ERP webhook must complete inside this budget |
| React island hydration | < 300ms after HTML | Minimal island size, code-split |

**Image optimization:** Astro's `<Image>` component or equivalent for static images. Product images from the ERP (`products.image` + `PUBLIC_MEDIA_BASE`) need to be served as WebP if the server supports conversion, or pre-converted. Lazy-load all images below the fold. The `loading="lazy"` attribute is mandatory for everything below the hero.

**Static-first:** catalog pages, product detail pages, and category pages are built as static HTML at build time (or on-demand SSR cached aggressively). They do not make API calls for their primary content. This is the single biggest performance win available.

---

## Security Principles

### Kashier HMAC

Always on. Documented above. No exceptions.

### Parameterized Queries

All database interactions use parameterized queries. No string concatenation, no template literals in SQL strings. The `db.query()` helper enforces this for ERP queries. Drizzle enforces this for our tables. Any query that bypasses this is a security failure, not a style issue.

### No ERP Internal IDs in URLs

ERP transaction IDs (sequential integers) should not appear in customer-facing URLs. They reveal order volume. Use our `orders.id` (UUID-derived) in URLs. Map to ERP transaction ID internally.

### Phone Normalization Before Storage

Every phone number is normalized before any DB write, contact lookup, or Bosta payload. The normalization function is the gatekeeper. No raw user-entered phone string reaches the database.

### Environment Secrets

Every secret lives in `.env` files, never in code. The Kashier live secret, DB credentials, JWT secret — none of these are committed. `.env.example` documents what is needed; `.env` is gitignored. Sub-packages (`api/`) need their own `.env` because Bun loads from the package root's CWD, not from parent directories.

### Soft-Delete First, Webhook First

When cancelling an order: fire the ERP delete webhook (`/webHooksyncOrdersDelete`) first. If the ERP acknowledges, then soft-delete our record (`cancelled_at` timestamp). If the ERP call fails, do not soft-delete — retry or escalate. The ERP and our DB must agree on cancellation state.

---

## Deployment Principles

### Docker Compose Services

```
hvarstore-api    — Bun runtime, Hono API, port 5000
hvarstore-web    — Astro SSR, port 4321
caddy            — Reverse proxy, TLS, serves static assets
mysql            — MySQL 8 (dev/staging only — prod uses managed DB)
```

### Environment Separation

Each service has its own environment:
- `hvarstore/api/.env` — API secrets (DB credentials, JWT secret, Kashier secret, ERP credentials)
- `hvarstore/web/.env` — Frontend environment (API base URL, Kashier mid, public keys only — nothing secret)
- Caddy is configured via `Caddyfile`, not environment

**Never put secret values in the web service's environment** — Astro SSR builds can inadvertently expose server-side env to the client if variables are accessed incorrectly. Secret env vars go only to the API service.

### The `127.0.0.1` vs `localhost` Rule

Always use `127.0.0.1` for local MySQL connections, never `localhost`. On many Linux configurations, `localhost` resolves to a Unix socket rather than the TCP loopback, causing connection failures with mysql2 in environments where the socket is not where mysql2 expects. `127.0.0.1` forces TCP and always works.

### Health Checks and Readiness

Each service should have a health check endpoint:
- API: `GET /api/health` → `{ status: 'ok', db: 'connected' }` (checks both mysql2 pools)
- Caddy monitors API and web via health check before serving traffic

Docker Compose uses `healthcheck` to gate service start order: mysql → API (waiting for mysql healthy) → web → Caddy.
