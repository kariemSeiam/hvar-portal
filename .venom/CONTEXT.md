# hvarstore.com — Context

> **Last absorbed:** 2026-06-07 (compass knowledge base + current site enrichment layer)
> **Source:** `compass/` (canonical brand/UX/product/architecture) + live source tree (`hvarstore/` monorepo) + git history + 7 dev spec files + design system CSS + schema files
>
> **Canonical source = `compass/`** (absorbed 2026-06-07). Brand/visual/tone/UX/product/ERP decisions live there and override assumptions — read the relevant `compass/**.md` before designing or building. Locks: red `#d43533`, brass `#C8893B`, ivory `#FBF7F1`, Wilson curve `cubic-bezier(0.22,1,0.36,1)` (no bounce), Cairo+Inter+JetBrains, **feminine Egyptian Arabic tone** (`أضيفي`), no emojis, 44px targets, 10% brand rule, red never flat without ambient glow.

---

## Mission

Build **hvarstore.com** — the customer portal. MCRM is the staff portal. Same `hvar_erp` MySQL DB. Two windows, one system.

**Full scope:**
- Browse products (catalog + detail)
- Buy (COD + Kashier card/installments)
- Track orders (Bosta tracking link from `transactions.bill_code`)
- Open service tickets (maintenance/replacement/return)
- Track ticket state machine

**Not in scope:** Admin panel, POS terminal, multi-seller, modifying MCRM or ERP.

---

## Stack (locked)

**API:** `api/` — Hono v4 on Bun
- TypeScript end-to-end with shared Zod schemas
- mysql2 pools (site + erp), JWT via jose, bcrypt hashing
- Hono JWT middleware, HMAC for Kashier validation
- Utilities from MCRM ported to TS: `phone.ts`, `bosta.ts`, `db.ts`
- Port 5000

**Frontend:** `web/` — Astro 5 + React 19 islands + Tailwind v4
- Zero-JS static HTML for catalog/PDP pages (SEO-critical)
- Cart, checkout, auth hydrate as React islands via `@astrojs/react`
- Nanostores (cart state, 1KB), react-hook-form + zod, TanStack Query
- @tailwindcss/vite + `@theme` CSS vars for Hvar design tokens
- RTL-first: `dir="rtl"`, logical props, Cairo + Inter + JetBrains Mono via @fontsource
- Dark + light: CSS class strategy, `hsl()` tokens

**Database:** Drizzle ORM (hvar_site) + raw SQL (hvar_erp reads)
- Drizzle for our 5 tables (customers, addresses, orders, items, pending_payments)
- Raw parameterized SQL for ERP reads — never ORM over shared schema
- MySQL 8, `127.0.0.1` never `localhost` (socket trap)

---

## The Five Absolutes (never break)

1. **ERP is authority** — stock, orders, contacts, tickets live in `hvar_erp`. We display + feed, don't own.
2. **Phone is identity** — Egyptian mobile only. Normalize to `01XXXXXXXXX` before any DB write or lookup.
3. **Kashier orderId** = `HVAR-{uuid4[:12].upper()}` — never `last_id+1`. Store in `pending_payments` before HPP redirect.
4. **Stock** = `variation_location_details.qty_available` only — never `product_stocks.qty`. Re-check at order creation with `FOR UPDATE`.
5. **Never hard-delete** — soft-delete orders (`cancelled_at`), fire ERP delete webhook first.

---

## Customer Journey (full flow)

```
BROWSE   products + variations (join variation_location_details for stock qty > 0)
SEARCH   by name, category, price range
BUY      cart (localStorage) → checkout → COD or Kashier
AUTH     phone → auto-create/load contact from hvar_erp.contacts
         OTP (future) or password (launch MVP)
ORDER    create our order → POST /websiteintegration/webHooksyncOrdersGet → ERP
         ERP creates transaction (status='draft', website_order_id=our_id)
         MCRM agent confirms → status='final' → stock deducted → Bosta created
TRACK    read transactions.bill_code → show Bosta tracking link
SERVICE  open ticket (HVM/HVR/HVT) → service_tickets row (status=PENDING)
FOLLOW   ticket state timeline until CLOSED
```

---

## Key Tables (`hvar_erp`, shared with Ultimate POS + MCRM)

| Table | Purpose | Critical columns |
|-------|---------|------------------|
| `products` / `variations` | Catalog, pricing | `variations.default_sell_price`, `sell_price_inc_tax`, `sub_sku` |
| `variation_location_details` | **Stock truth** | `qty_available` (location_id=1) |
| `contacts` | Customers by phone | `mobile`, `name`, `type='customer'` |
| `transactions` | Orders (`type='sell'`) | `status`, `website_order_id`, `bill_code`, `final_total` |
| `transaction_sell_lines` | Order line items | `product_id`, `variation_id`, `quantity`, `unit_price` |
| `transaction_payments` | Payments | `amount`, `method`, `paid_on` |
| `categories` | Catalog nav | `website_category_id`, `parent_id` |
| `service_tickets` | Tickets | `type` (R/M/T/S), `status`, `contact_id`, `transaction_id` |
| `cities` / `districts` | Address dropdowns | Arabic names, gov → district hierarchy |

**Our own tables** in `hvar_site` DB: `customers`, `customer_addresses`, `orders`, `order_items`, `pending_payments`
Decided: separate `hvar_site` DB (safe from ERP schema upgrades). Drizzle schema in `migrations/schema/`. No OTP — `auth_otps` table removed.

---

## Routes (from `05-SITE-SPEC.md`)

**Public:** `/` `/products` `/products/:slug` `/cart` `/checkout` `/contact`
**Auth:** `/account` `/orders` `/orders/:id` `/service/new` `/service` `/service/:id` `/login`

**API (`/api/`, JWT except public):**
- Auth: `register` (phone+name+password), `login` (phone+password), `me` — NO OTP, no SMS
- Products (public): `/products` (filters: category,q,min_price,max_price), `/products/:slug`, `/products/featured`, `/categories`
- Locations (public): `/locations/governorates`, `/locations/districts/:govId`
- Orders: `POST/GET /orders`, `GET /orders/:id`
- Payments: `POST /payments/kashier/initiate`, `POST /payments/kashier/callback` (public, validates HMAC first)
- Tickets: `POST/GET /tickets`, `GET /tickets/:id`
- Account: `GET/PUT /account`, `POST/PUT /account/addresses[/:id]`

---

## Service Tickets (state machines)

| Type | Arabic | States |
|------|--------|--------|
| HVM Maintenance | صيانة | PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED |
| HVR Replacement | استبدال | PENDING → HUB_RECEIVED → DISPATCHED → READY → CLOSED |
| HVT Return | مرتجع | PENDING → HUB_RECEIVED → INSPECTED → REFUNDED → CLOSED |

All can branch to CANCELLED (from PENDING) or FAILED (from any terminal-adjacent state).
State-to-color: PENDING=slate, HUB_RECEIVED=blue, IN_WORKSHOP=amber, DISPATCHED=purple,
INSPECTED=blue, READY=green, REFUNDED=green, CLOSED=emerald, CANCELLED=red, FAILED=red.

---

## Kashier (from `03-KASHIER.md`)

- HPP hash: `HMAC-SHA256("/?payment={mid}.{orderId}.{amount}.EGP", secret_key)`
- **Validate `x-kashier-signature` on callback** (disabled in old system — MUST enable)
- Idempotency via `pending_payments.processed_at` — create order *before* redirect, complete in callback
- NEVER session state — use `pending_payments` table as durable bridge
- Test creds in `03-KASHIER.md`. Live secret must move to `.env` (never commit).

---

## Bosta

- Tracking URL: `https://bosta.co/ar-eg/tracking-shipments?shipment-number={bill_code}`
- Copy `bosta_converter.py` from MCRM — don't re-implement
- **Naming trap:** Bosta `city` = governorate, `zone` = city/district (not intuitive)
- Type 25 (CUSTOMER_RETURN_PICKUP) has a completely different payload structure from Type 10/15

---

## Phone Normalization

Accept `+201…`, `00201…`, `01…`, `1…` → strip non-digits, drop leading `20`, prefix `0` to 9-digit `1…`, validate `^01[0125]\d{8}$`.
Copy `phone_normalizer.py` from MCRM. Normalize before every DB write, lookup, Bosta payload, Kashier callback.

---

## ERP Contract (key rules)

- Order webhook: `POST /websiteintegration/webHooksyncOrdersGet` — fires after payment confirmed
- Payload: `shipping_address.state` = Arabic governorate name, `.city` = Arabic district name
- `product_id` in order_details maps to ERP's `products.id` (or `website_product_id`)
- ERP creates transaction as `status='draft'` — MCRM confirms → `status='final'` → stock deducted
- Cancel webhook: `POST /websiteintegration/webHooksyncOrdersDelete { order_id: N }` — fire BEFORE soft-deleting

---

## Design (locked in `.venom/DESIGN_DIRECTIONS.md`)

**Direction chosen:** "المطبخ الدافئ × هفار لوكس" (Warm Kitchen × Hvar Luxe)

**Named themes:**
- **"هفار الأحمر"** (light) — warm ivory canvas `#FBF7F1`, brand red `#d43533`, brass accent `#C8893B`
- **"هفار الليل"** (dark) — charcoal `hsl(20 10% 7%)`, glowing red `hsl(2 75% 58%)`, ivory text

**Typography:** Cairo 400/600/700/900 (Arabic UI/display) + Inter `tabular-nums` (prices) + JetBrains Mono (order codes)

**Design motion:** Wilson curve `cubic-bezier(0.22,1,0.36,1)` everywhere — card hover, menu drawer, reveals, transitions.

**CSS tokens:** Build-ready in `DESIGN_DIRECTIONS.md` — `--hvar-red-600`, `--brass-500`, `--trust-green`, `--bg`, `--surface`, `--ink`, `--radius`, `--grain`, `--curve`, `--shadow-card`

---

## Wilson Pattern Library (13 CSS-first patterns → reuse for Hvar)

Source: `workspace/docs/design/patterns/wilson-innovation-catalog.md`

| # | Pattern | Implementation | Hvar use |
|---|---------|---------------|---------|
| P1 | Appliance doodle BG | SVG paths, 0.22 opacity, pointer-events-none | Hero, footer, menu drawer — replace Wilson appliances with Hvar motifs |
| P2 | Grain texture overlay | `::before` SVG noise, `opacity:0.04/.06`, `mix-blend-mode:overlay` | Hero sections, cards |
| P3 | Grid system | CSS `radial-gradient` dots/lines/mesh/hex/cross via `--grid-*` vars | Catalog pages, product grids |
| P4 | Red mesh hero | `radial-gradient` 8% opacity at top of hero | Hero sections — use Hvar red not gold |
| P5 | 3D door-swing menu | CSS `rotateY(12deg)` keyframes, RTL-aware | Mobile nav drawer |
| P6 | Card shine | `::after` diagonal gradient sweep on hover, 105deg | Product cards, ticket cards |
| P7 | Scroll reveals | IntersectionObserver + `.reveal-section`/`.reveal-child`/`.reveal-scale` | Page sections, product grid |
| P8 | Product viewport | Auto-cycle carousel, 20s breath animation, vision filter | PDP gallery, hero banner |
| P9 | Trust line | `.cta-trust-line` under CTAs: ضمان · شحن مجاني · افحص قبل الدفع | Under every "أضف للسلة" |
| P10 | Service stepper | `::before` gradient line connecting circle dots, RTL-aware | Ticket state timeline (HVM/HVR/HVT) |
| P11 | CTA action bar | Horizontal: [qty −/+] [أضف للسلة] [WhatsApp] [remove] | PDP, cart |
| P12 | Cart FAB | Fixed bottom circle, badge count, `safe-area-inset` aware, RTL-aware | Mobile cart |
| P13 | Staggered menu | `animation-delay` per nth-child, doodle overlay on drawer BG | Mobile nav |

All patterns: `prefers-reduced-motion` respected. All CSS variables — no hardcoded colors.

---

## Gotchas (from prod experience + code review + 2026-06-05 schema recon)

1. **Service tickets live in `mcrm_hvar_hub`, NOT `hvar_erp`.** Tables: `service_tickets`, `service_ticket_history`, `service_items`, `ticket_sequences`. `hvar_erp` only has `types_of_services` lookup. **3rd DB pool required** — see `MCRM_DB_*` in `.env` and `env.ts`.
2. **`products` has no `slug` column.** API derives slug as `${slugify(name)}-${id}`; lookup parses trailing `-{id}`. See `api/src/lib/slug.ts`.
3. **`products` real columns:** `image` (varchar(191), filename only — prepend `PUBLIC_MEDIA_BASE`), `product_description` (NOT `description`), NOT NULL on `created_by`, `tax_type`, `sku`.
4. **`variations` defaults:** even `type='single'` products require a `product_variations` parent row (`is_dummy=1`, name='DUMMY') AND a `variations` child row. Pricing lives on `variations.sell_price_inc_tax` (final) and `dpp_inc_tax` (compare/strike-through).
5. **`cities` = governorates** (Arabic `nameAr`, English `name`, `code`); **`districts.city_id` → cities.id**. Governorate dropdown queries `cities`; district dropdown queries `districts WHERE city_id = ?`. Same naming trap as Bosta.
6. **ONLY_FULL_GROUP_BY is ON.** Aggregations must use `ANY_VALUE()` or be in `GROUP BY`. Affects every product card query.
7. **mysql2 `execute()` rejects `?` on LIMIT/OFFSET** (ER_WRONG_ARGUMENTS on this build). `db.query` helper uses `.query()` not `.execute()` — still parameterized, still safe.
8. **Two stock tables** — only `variation_location_details.qty_available` is correct. `product_stocks.qty` drifts 48h on weekends.
9. **Live Kashier secret in plaintext** in `03-KASHIER.md` — move to `.env`, rotate, use test creds for dev.
10. `localhost` DB trap → always `127.0.0.1`.
11. Arabic addresses: governorate+district dropdowns (from `cities`/`districts`), never free text.
12. **Single-seller** — ignore all multi-seller complexity from legacy POS.
13. CORS must include `mcrm.hvarstore.com` + `hvarstore.com` + `localhost:4321` (Astro dev).
14. Stock drift window — always re-validate `qty_available` at order creation inside DB transaction, not at add-to-cart.
15. Old POS hard-deletes cancelled orders. New system must soft-delete. This is intentional.
16. **Ultimate POS multi-tenancy:** every product/transaction/category query filters by `business_id` AND `location_id` (see `ERP_BUSINESS_ID=1`, `ERP_LOCATION_ID=1` in `.env`). Forgetting this returns rows from other businesses on a shared install.

---

## Open Questions (ask Kariem before building)

1. **POS terminal in scope?** Dir name is `pos/`, but spec says "customer portal only." If terminal needed, order/stock/payment model changes.
2. Product images — where? `variations` has no image URL. Old `products.photos` is Active eCommerce legacy.
3. ~~OTP/SMS provider?~~ Resolved: password-only at launch. No OTP. No SMS provider.
4. ERP webhook auth for `webHooksyncOrdersGet` (token/IP/signature)?
5. How "featured" products are flagged in `hvar_erp` (category? field? manual list?).

---

## Build Status — ALL PHASES COMPLETE (as of 2026-06-06)

### ✅ Phase 1 — Shell
- Base layout (Navbar + Footer + RTL), Home (Hero P4+P2+P1 + categories strip + featured products + chef strip + trust block), Products listing, PDP `/products/[slug]`

### ✅ Phase 2 — Cart
- Nanostores atom (localStorage persistence) + CartFAB (fixed mobile, safe-area-inset aware) + CartView drawer

### ✅ Phase 3 — Auth
- Register + Login (phone+password), phone normalization, JWT httpOnly cookie, `/account` page, protected route middleware

### ✅ Phase 4 — Checkout + Orders
- Checkout (geo → dropdowns, COD/Kashier selector, order summary), COD order creation (stock re-check in DB transaction + ERP webhook), Orders list + detail, Bosta tracking link

### ✅ Phase 5 — Payments
- Kashier HPP flow: `POST /api/payments/kashier/initiate` (pending_payments row → HPP redirect URL), `POST /api/payments/kashier/callback` (HMAC signature validate → idempotent complete)

### ✅ Phase 6 — Service Portal
- NewTicketForm (type selector صيانة/استبدال/مرتجع + optional linked order), TicketsList, TicketDetail with ServiceStepper for all 3 machines

### ✅ Phase 7 — Polish (last commit 730b7a2)
- Semantic CSS vars (--c-* tokens, no hardcoded colors anywhere)
- Dark mode: CSS class strategy, ThemeToggle island
- Wilson patterns: P2 grain, P3 dot grid (catalog), P6 card shine, P7 scroll reveals, P5 3D door-swing RTL nav
- Structured data (JSON-LD: Organization + WebSite + Product), image lazy-load, OG tags
- CtaActionBar: variation selector, qty stepper, installment hint (≥1000 EGP), WhatsApp fallbacks
- StickyMobileCta: bottom sheet on mobile PDP, mirrors CtaActionBar logic
- CartFAB shows item count badge, no price shown (per design)

### 🔄 In-flight (uncommitted working tree)
- `web/src/components/ProductCard.astro` — **redesigned 2026-06-07**: circular FAB add-to-cart docked in image bottom-end corner (replaces full-width bar), `.hvar-card .card-shine`, bottom-aligned commercial block, feminine aria-label. See [[product-card-pattern]].
- `web/src/styles/global.css` — added missing `--c-ink-secondary` + `--c-hairline` tokens (were referenced but undefined by new PDP sections; broke heading color + FAQ dividers)
- New enrichment layer (committed earlier): `web/src/lib/enrichment.ts` (SKU-keyed content), `Doodles.astro`, `InnerHero.astro`, `category/*`, `pdp/{AccessoriesGrid,ChefSection,ComparisonNudge,FaqSection,SpecsSection,WarrantyCallout}.astro`
- `web/src/components/pdp/CtaActionBar.tsx` / `StickyMobileCta.tsx` — EDGE review fixes
- **Known site debt:** `products/index.astro` + `index.astro` still use hardcoded hex + Tailwind `dark:` variants (pre-token); CategoryFilters wattage/accessories/capacity params are inert (not read server-side); `getInstallmentText` unused; TODO telephone in `Base.astro` org JSON-LD.

---

## Repo Layout (git root = `pos/`, pushed to `hvar-portal`)

| Path | Contents |
|------|----------|
| `.venom/` | VENOM context + MEMORY + corrections + DESIGN_DIRECTIONS |
| `hvarstore/` | **Main app** — monorepo with api/ web/ shared/ migrations/ |
| `workspace/docs/dev/` | **Authoritative build spec** (7 files) |
| `workspace/docs/design/` | Design language analysis, Wilson patterns, studies |
| `workspace/docs/projects/` | Reference docs: MCRM, wilson-eg, hvar-pos, hvar-catalog |
| `workspace/examples/` | Template code: MCRM, wilson-eg, Hvar-Catalog, Hvar-OLD, Hvar-POS |
| `temp/` | (gitignored) Knowledge pack bundles |

---

*End of context. Build-ready.*
