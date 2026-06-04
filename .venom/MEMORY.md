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

Reason: Rejected Medusa/Vendure/ForkCart because they own products/orders — hvar_erp does. Rejected Next.js because 85% of storefront is static content where Astro's island architecture gives better perf. Rejected Flask/FastAPI for TypeScript end-to-end with shared Zod schemas.

### 2026-06-04 — Our own tables live in hvar_site DB (separate from hvar_erp)
Tables: orders, order_items, pending_payments, customer_addresses, customers (auth layer).
Keeps our data safe from ERP schema upgrades.
hvar_erp is read/write for shared tables (contacts, service_tickets) but our app tables are isolated.
