## Heartbeat — 2026-04-04

**Entry point:** `project/backend/app.py` — Flask app created at line 25, auto-initialized at line 3432-3446

**Hot path:**
Request → CORS preflight handler (line 51) → Route matching → Auth decorator (token_required/admin_required, lines 542-574) → Business logic → JSON response

Most critical: `GET /api/products` (line 1067) — product listing with caching, filtering, pagination. Runs on every storefront visit. Uses LRUCache (60s TTL) for anonymous users. Eager-loads variants, sizes, features via joinedload.

Second critical: `POST /api/orders` (line 2349) — checkout flow. Locks inventory with `with_for_update()`, validates stock, calculates shipping/coupons, creates order + tracking in single transaction.

**Performance-critical code:**
- `project/backend/app.py:1067-1204` — `get_products()` — every storefront page load
- `project/backend/app.py:1206-1230` — `get_product()` — product detail page (increments view count)
- `project/backend/app.py:577-720` — `get_admin_products()` — admin dashboard product list
- `project/backend/app.py:166-219` — `LRUCache` — in-memory caching for products (60s) and slides (300s)
- `project/backend/app.py:237-245` — `optimize_product_query()` — joinedload optimization

**Background jobs:**
None. No cron, no Celery, no async workers. All synchronous request-response. Database auto-initializes on first request (line 3432). Schema migrations happen inline via `_ensure_offer_slide_placement_column()` pattern.
