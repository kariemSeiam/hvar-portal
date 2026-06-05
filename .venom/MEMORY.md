# Hvar New POS — Memory

> Cross-session decisions, architectural choices, and learned patterns.
> Written by VENOM on explicit "remember" or architectural decision.

---

## Decisions

### 2026-06-01 — Scope confirmed
We are building **hvarstore.com** — the full customer portal, not just a POS terminal.
Customers browse, buy (COD + Kashier), track orders, and open service tickets (صيانة/استبدال/مرتجع).
MCRM is the staff portal. New site is the customer portal. Same DB. Same tickets. Two windows.
Dev docs live in `workspace/docs/dev/` (7 files, complete architecture coverage).

### Stock table to use
Always use `variation_location_details.qty_available` — never `product_stocks.qty`.
The latter drifts and is legacy from the old POS.

### Kashier must be fixed
The existing system has HMAC validation commented out. New POS must validate it.
Generate orderId with UUID before redirect, not last_id+1.

### Bosta copy from MCRM
Do not re-implement Bosta integration. Copy `bosta_service.py` from MCRM source.
The naming trap (`city`=governorate, `zone`=city) is already handled there.

### Single-seller
Hvar is a single seller. All multi-seller complexity from the old POS is irrelevant.
Do not design for sellers, commissions, or multi-shop scenarios.

### No soft-delete in old POS
The old POS hard-deletes cancelled orders. The new POS must soft-delete (status update).
This is a deliberate design improvement, not a port.

### 2026-06-04 — Auth: phone + password only, no OTP
OTP wiped from planning entirely. No SMS provider. No `auth_otps` table. No `request-otp`/`verify-otp` routes.
Auth flow: register (phone + name + password) → JWT. Login (phone + password) → JWT.
Forgot password = contact support via WhatsApp (no self-serve reset at launch).
bcrypt for password hashing. JWT 24h access + 7d refresh.

### 2026-06-04 — Smart address: reverse geocode on checkout
Checkout address input uses 3 paths:
  A. Browser geolocation → POST /api/geo/reverse → auto-fill governorate + district dropdowns
  B. Google Places Autocomplete → geocode → same resolution
  C. Manual dropdowns (fallback)
Backend matches Google Arabic names against hvar_erp cities/districts tables via fuzzy match.
Show map pin after resolution so customer confirms location before ordering.

### 2026-06-04 — Stack: Hono + Bun (API), Astro 5 + React 19 (frontend)
Researched current 2026 production patterns. Final stack:
- **API:** Hono v4 on Bun — fastest TypeScript backend, native JWT/HMAC, shares Zod schemas with frontend
- **Frontend:** Astro 5 with React 19 islands — zero-JS static product pages (SEO), cart/checkout/auth hydrate as React islands only where needed
- **Database:** Drizzle ORM (our `hvar_site` tables) + raw SQL (ERP reads)
- **Styling:** Tailwind v4 with `@theme` CSS vars for Hvar design tokens
- **State:** Nanostores (cart) + react-hook-form + zod + @tanstack/react-query
- **RTL:** `dir="rtl"`, Cairo + Inter + JetBrains Mono fonts
- **Deploy:** Docker Compose: Bun API + Astro SSR + Caddy + MySQL

### 2026-06-04 — Our own tables live in hvar_site DB (separate from hvar_erp)
Tables: orders, order_items, pending_payments, customer_addresses, customers (auth layer).
Keeps our data safe from ERP schema upgrades.
hvar_erp is read/write for shared tables (contacts, service_tickets) but our app tables are isolated.

### 2026-06-05 — Vertical slice (read-side) is alive
First end-to-end products → categories → locations slice working against real hvar_erp schema.
Stack working: Hono+Bun API on :5000, mysql2 (`.query()` not `.execute()` — see db.ts comment),
ANY_VALUE() for ONLY_FULL_GROUP_BY mode, slug = slugify(name)+'-'+id (no slug column in products).
Seed script idempotent — re-runnable: `bun --cwd hvarstore/migrations run seed`.
8 Hvar kitchen products + 3 categories + 5 governorates + 16 districts.
DB credentials for local dev: root / devpass123 → pigo-mysql Docker container.

### Schema corrections (2026-06-05 recon)
- `service_tickets` is in `mcrm_hvar_hub`, NOT `hvar_erp` (only `types_of_services` lookup there).
- `products` has no slug column; has `image`, `product_description`, requires `created_by` NOT NULL.
- `cities` = governorates (Arabic naming trap matches Bosta); `districts.city_id` → cities.id.
- Every product/transaction query MUST filter by `business_id` AND `location_id` (Ultimate POS multi-tenant).

### 2026-06-05 — api/.env required (Bun env loading)
Bun loads `.env` from the project root of the CWD. Since `api/` has its own `package.json`,
it is its own project root. The shared `hvarstore/.env` is NOT loaded when running from `api/`.
Fix: `cp hvarstore/.env hvarstore/api/.env`. Do the same for any sub-package that needs env vars.

### 2026-06-05 — UI standard: NO emojis anywhere
This is a real company product targeting Egyptian homemakers. Emojis are unprofessional,
render inconsistently across Android/iOS/desktop, and destroy brand perception.
All icons must be proper inline SVGs or lucide-react components. No exceptions — not even
in placeholder states, fallback content, trust icons, category chips, or service cards.
